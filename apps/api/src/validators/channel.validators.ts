
import { z } from "zod";

export const createChannelSchema = z.object({
    name: z.string().trim().min(2).max(60),
    handle: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9_]{3,30}$/),
    description: z.string().trim().max(1000).optional().default(""),
});

export const updateChannelSchema = z
    .object({
        name: z.string().trim().min(2).max(60).optional(),
        handle: z
            .string()
            .trim()
            .toLowerCase()
            .regex(/^[a-z0-9_]{3,30}$/)
            .optional(),
        description: z.string().trim().max(1000).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Provide at least one field to update",
    });
