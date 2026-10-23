import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import User from "../models/User";
import { registerSchema, loginSchema } from "../validators/auth.validators";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
}

const COOKIE_NAME = "ss_access";
const TOKEN_TTL_SECONDS = 60 * 60;

function setAuthCookie(res: Response, userId: string): void {
    const token = jwt.sign({}, JWT_SECRET!, {
        subject: userId,
        expiresIn: TOKEN_TTL_SECONDS,
        issuer: "streamsphere-api",
        audience: "streamsphere-web"
    });

    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: TOKEN_TTL_SECONDS * 1000
    });
}

function clearAuthCookie(res: Response): void {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
    });
}

function publicUser(user: {
    _id: unknown;
    username: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    role: string;
    emailVerified: boolean;
}) {
    return {
        id: String(user._id),
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? null,
        role: user.role,
        emailVerified: user.emailVerified
    };
}

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const input = registerSchema.parse(req.body);

        const existingUser = await User.findOne({
            $or: [
                { email: input.email },
                { username: input.username }
            ]
        }).lean();

        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "Email or username is already in use"
            });
            return;
        }

        const passwordHash = await bcrypt.hash(input.password, 12);

        const user = await User.create({
            username: input.username,
            email: input.email,
            displayName: input.displayName,
            passwordHash
        });

        setAuthCookie(res, String(user._id));

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: { user: publicUser(user) }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Invalid registration details",
                errors: error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message
                }))
            });
            return;
        }

        // Handles duplicate-key races between simultaneous registrations.
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            res.status(409).json({
                success: false,
                message: "Email or username is already in use"
            });
            return;
        }

        console.error("Registration failed:", error);
        res.status(500).json({
            success: false,
            message: "Unable to create account"
        });
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const input = loginSchema.parse(req.body);

        const user = await User.findOne({ email: input.email })
            .select("+passwordHash");

        if (
            !user ||
            !(await bcrypt.compare(input.password, user.passwordHash))
        ) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
            return;
        }

        if (user.status !== "active") {
            res.status(403).json({
                success: false,
                message: "This account is unavailable"
            });
            return;
        }

        setAuthCookie(res, String(user._id));

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: { user: publicUser(user) }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Invalid login details"
            });
            return;
        }

        console.error("Login failed:", error);
        res.status(500).json({
            success: false,
            message: "Unable to log in"
        });
    }
}

export async function getMe(
    _req: Request,
    res: Response
): Promise<void> {
    const userId = res.locals.userId as string;

    const user = await User.findById(userId);

    if (!user || user.status !== "active") {
        clearAuthCookie(res);
        res.status(401).json({
            success: false,
            message: "Authentication required"
        });
        return;
    }

    res.status(200).json({
        success: true,
        data: { user: publicUser(user) }
    });
}

export function logout(_req: Request, res: Response): void {
    clearAuthCookie(res);

    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
}