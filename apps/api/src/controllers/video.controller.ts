
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Channel from "../models/Channel";
import Video from "../models/Video";
import mux from "../config/mux";

export async function createVideoUpload(
  req: Request,
  res: Response,
) {
  const ownerId = res.locals.userId as string | undefined;

  if (!ownerId || !mongoose.isValidObjectId(ownerId)) {
    return res.status(401).json({ message: "Please sign in again." });
  }

  const title =
    typeof req.body?.title === "string" ? req.body.title.trim() : "";

  const description =
    typeof req.body?.description === "string"
      ? req.body.description.trim()
      : "";

  if (title.length < 1 || title.length > 100) {
    return res.status(400).json({
      message: "Title must be between 1 and 100 characters.",
    });
  }

  if (description.length > 5000) {
    return res.status(400).json({
      message: "Description cannot exceed 5000 characters.",
    });
  }

  const visibility = req.body?.visibility ?? "private";

  if (!["private", "public", "unlisted"].includes(visibility)) {
    return res.status(400).json({ message: "Invalid video visibility." });
  }

  let video: InstanceType<typeof Video> | null = null;

  try {
    const channel = await Channel.findOne({
      ownerId,
      status: "active",
    }).select("_id");

    if (!channel) {
      return res.status(403).json({
        message: "Create an active channel before uploading videos.",
      });
    }

    video = await Video.create({
      ownerId,
      channelId: channel._id,
      title,
      description,
      visibility,
      status: "waiting_for_upload",
    });

    const corsOrigin = process.env.MUX_CORS_ORIGIN;

    if (!corsOrigin) {
      throw new Error("MUX_CORS_ORIGIN is not configured.");
    }

    const upload = await mux.video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policies: ["public"],
        video_quality: "basic",
        passthrough: video._id.toString(),
      },
    });

    video.muxUploadId = upload.id;
    await video.save();

    return res.status(201).json({
      message: "Upload created successfully.",
      video: {
        id: video._id.toString(),
        title: video.title,
        description: video.description,
        visibility: video.visibility,
        status: video.status,
      },
      upload: {
        id: upload.id,
        url: upload.url,
      },
    });
  } catch (error) {
    if (video) {
      await Video.deleteOne({ _id: video._id }).catch(() => undefined);
    }

    console.error("Create video upload failed:", error);

    return res.status(500).json({
      message: "Unable to create a video upload. Please try again.",
    });
  }
}
