
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import Channel from "../models/Channel";
import {
    createChannelSchema,
    updateChannelSchema,
} from "../validators/channel.validators";

function handleError(error: unknown, res: Response) {
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.issues,
        });
        return;
    }

    if (
        error instanceof mongoose.mongo.MongoServerError &&
        error.code === 11000
    ) {
        res.status(409).json({
            success: false,
            message: "That channel handle is already taken",
        });
        return;
    }

    console.error("Channel API error:", error);

    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
}

export async function createChannel(req: Request, res: Response) {
    try {
        const ownerId = res.locals.userId as string;
        const input = createChannelSchema.parse(req.body);

        const existingChannel = await Channel.findOne({ ownerId });

        if (existingChannel) {
            res.status(409).json({
                success: false,
                message: "You already have a channel",
                channel: existingChannel,
            });
            return;
        }

        const channel = await Channel.create({
            ownerId,
            name: input.name,
            handle: input.handle,
            description: input.description,
        });

        res.status(201).json({
            success: true,
            message: "Channel created successfully",
            channel,
        });
    } catch (error) {
        handleError(error, res);
    }
}

export async function getMyChannel(_req: Request, res: Response) {
    try {
        const ownerId = res.locals.userId as string;
        const channel = await Channel.findOne({ ownerId });

        if (!channel) {
            res.status(404).json({
                success: false,
                message: "You have not created a channel yet",
            });
            return;
        }

        res.status(200).json({ success: true, channel });
    } catch (error) {
        handleError(error, res);
    }
}

export async function getChannelByHandle(
    req: Request,
    res: Response
) {
    try {
        const handleParam = req.params.handle;
        const handle = (Array.isArray(handleParam) ? handleParam[0] : handleParam)?.toLowerCase() ?? "";

        const channel = await Channel.findOne({
            handle,
            status: "active",
        }).populate("ownerId", "username displayName avatarUrl");

        if (!channel) {
            res.status(404).json({
                success: false,
                message: "Channel not found",
            });
            return;
        }

        res.status(200).json({ success: true, channel });
    } catch (error) {
        handleError(error, res);
    }
}

export async function updateMyChannel(
    req: Request,
    res: Response
) {
    try {
        const ownerId = res.locals.userId as string;
        const input = updateChannelSchema.parse(req.body);

        const channel = await Channel.findOneAndUpdate(
            { ownerId },
            { $set: input },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!channel) {
            res.status(404).json({
                success: false,
                message: "Create a channel before updating it",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Channel updated successfully",
            channel,
        });
    } catch (error) {
        handleError(error, res);
    }
}
