import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
};

const JWT_SECRET = runtime.process?.env?.JWT_SECRET!;

export function authenticate(
    _req: Request,
    res: Response,
    next: NextFunction
): void {
    const token = _req.cookies?.ss_access;

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Authentication required"
        });
        return;
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET, {
            issuer: "streamsphere-api",
            audience: "streamsphere-web"
        });

        if (typeof payload === "string" || !payload.sub) {
            res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
            return;
        }

        res.locals.userId = payload.sub;
        next();
    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
}