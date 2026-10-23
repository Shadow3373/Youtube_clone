import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .trim()
        .toLowerCase()
        .min(3)
        .max(30)
        .regex(/^[a-z0-9_]+$/),

    email: z
        .string()
        .trim()
        .toLowerCase()
        .email()
        .max(254),

    password: z
        .string()
        .min(8)
        .max(128),

    displayName: z
        .string()
        .trim()
        .min(2)
        .max(60)
});

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(1).max(128)
});