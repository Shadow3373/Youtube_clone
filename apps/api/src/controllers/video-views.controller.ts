
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Video from "../models/Video";

export async function recordVideoView(req: Request, res: Response) {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid video ID.",
    });
  }

 
  const viewerKey = req.body?.viewerKey;

  if (
    typeof viewerKey !== "string" ||
    viewerKey.length < 10 ||
    viewerKey.length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid viewer key is required.",
    });
  }

  try {
    const video = await Video.findOneAndUpdate(
      {
        _id: videoId,
        status: "ready",
        visibility: "public",
        playbackId: { $exists: true, $nin: [null, ""] },
      },
      {
        $inc: { views: 1 },
      },
      {
        new: true,
        projection: { views: 1 },
      },
    );

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Public video not found.",
      });
    }

    return res.status(200).json({
      success: true,
      views: video.views ?? 0,
    });
  } catch (error) {
    console.error("Record video view failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to record video view.",
    });
  }
}
