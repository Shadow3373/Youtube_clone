
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

export async function resumeVideoUpload(req: Request, res: Response) {
  const ownerId = res.locals.userId as string | undefined;
  const { videoId } = req.params;

  if (!ownerId || !mongoose.isValidObjectId(ownerId)) {
    return res.status(401).json({
      success: false,
      message: "Please sign in again.",
    });
  }

  if (!mongoose.isValidObjectId(videoId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid video ID.",
    });
  }

  let claimedVideoId: string | null = null;

  try {
    // Claim the draft atomically so two requests cannot start uploads
    // for the same draft at the same time.
    const video = await Video.findOneAndUpdate(
      {
        _id: videoId,
        ownerId,
        status: "draft",
        muxUploadId: { $exists: false },
      },
      {
        $set: { status: "waiting_for_upload" },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!video) {
      const existingVideo = await Video.findOne({
        _id: videoId,
        ownerId,
      }).select("status muxUploadId");

      if (!existingVideo) {
        return res.status(404).json({
          success: false,
          message: "Draft not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          existingVideo.status === "waiting_for_upload"
            ? "An upload has already been started for this video."
            : "Only saved drafts without an existing Mux upload can be resumed.",
      });
    }

    claimedVideoId = video._id.toString();

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
      success: true,
      message: "Draft upload created successfully.",
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
    // Restore the draft state if upload creation fails, allowing
    // the creator to try again.
    if (claimedVideoId) {
      await Video.updateOne(
        {
          _id: claimedVideoId,
          ownerId,
          status: "waiting_for_upload",
          muxUploadId: { $exists: false },
        },
        {
          $set: { status: "draft" },
        },
      ).catch(() => undefined);
    }

    console.error("Resume video upload failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to resume the draft upload. Please try again.",
    });
  }
}

export async function createVideoDraft(
  req: Request,
  res: Response,
) {
  const ownerId = res.locals.userId as string | undefined;

  if (!ownerId || !mongoose.isValidObjectId(ownerId)) {
    return res.status(401).json({
      success: false,
      message: "Please sign in again.",
    });
  }

  const title =
    typeof req.body?.title === "string" ? req.body.title.trim() : "";

  const description =
    typeof req.body?.description === "string"
      ? req.body.description.trim()
      : "";

  const visibility = req.body?.visibility ?? "private";

  if (title.length < 1 || title.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Draft title must be between 1 and 100 characters.",
    });
  }

  if (description.length > 5000) {
    return res.status(400).json({
      success: false,
      message: "Description cannot exceed 5000 characters.",
    });
  }

  if (!["private", "public", "unlisted"].includes(visibility)) {
    return res.status(400).json({
      success: false,
      message: "Invalid video visibility.",
    });
  }

  try {
    const channel = await Channel.findOne({
      ownerId,
      status: "active",
    }).select("_id");

    if (!channel) {
      return res.status(403).json({
        success: false,
        message: "Create an active channel before saving drafts.",
      });
    }

    const video = await Video.create({
      ownerId,
      channelId: channel._id,
      title,
      description,
      visibility,
      status: "draft",
    });

    return res.status(201).json({
      success: true,
      message: "Draft saved successfully.",
      video: {
        id: video._id.toString(),
        channelId: video.channelId.toString(),
        title: video.title,
        description: video.description,
        visibility: video.visibility,
        status: video.status,
        thumbnailUrl: video.thumbnailUrl,
        playbackId: video.playbackId,
        durationSeconds: video.durationSeconds,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create video draft failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save the draft. Please try again.",
    });
  }
}


export async function getMyVideos(
  req: Request,
  res: Response,
) {
  const ownerId = res.locals.userId as string | undefined;

  if (!ownerId || !mongoose.isValidObjectId(ownerId)) {
    return res.status(401).json({
      message: "Please sign in again.",
    });
  }

  const page = Math.max(
    1,
    Number.parseInt(String(req.query.page ?? "1"), 10) || 1,
  );

  const limit = Math.min(
    50,
    Math.max(
      1,
      Number.parseInt(String(req.query.limit ?? "10"), 10) || 10,
    ),
  );

  const filter: Record<string, unknown> = { ownerId };

  const status = req.query.status;

  if (typeof status === "string" && status !== "all") {
    const allowedStatuses = [
      "draft",
      "waiting_for_upload",
      "processing",
      "ready",
      "errored",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid video status filter.",
      });
    }

    filter.status = status;
  }

  try {
    const [videos, total] = await Promise.all([
      Video.find(filter)
        .select(
          "_id channelId title description visibility status thumbnailUrl playbackId durationSeconds createdAt updatedAt",
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Video.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      videos: videos.map((video) => ({
        id: video._id.toString(),
        channelId: video.channelId.toString(),
        title: video.title,
        description: video.description,
        visibility: video.visibility,
        status: video.status,
        thumbnailUrl: video.thumbnailUrl,
        playbackId: video.playbackId,
        durationSeconds: video.durationSeconds,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get creator videos failed:", error);

    return res.status(500).json({
      message: "Unable to load your videos. Please try again.",
    });
  }
}

// Update a video owned by the authenticated user.
export async function updateMyVideo(req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const { videoId } = req.params;
    const { title, description, visibility } = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
      res.status(400).json({
        success: false,
        message: "Invalid video ID.",
      });
      return;
    }

    const updates: Record<string, string> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim() || title.trim().length > 100) {
        res.status(400).json({
          success: false,
          message: "Title is required and must be 100 characters or fewer.",
        });
        return;
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.length > 5000) {
        res.status(400).json({
          success: false,
          message: "Description must be 5000 characters or fewer.",
        });
        return;
      }
      updates.description = description.trim();
    }

    if (visibility !== undefined) {
      if (!["private", "public", "unlisted"].includes(visibility)) {
        res.status(400).json({
          success: false,
          message: "Invalid visibility value.",
        });
        return;
      }
      updates.visibility = visibility;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid fields provided to update.",
      });
      return;
    }

    const video = await Video.findOneAndUpdate(
      { _id: videoId, ownerId: userId },
      { $set: updates },
      { new: true, runValidators: true },
    ).select(
      "title description visibility status thumbnailUrl playbackId durationSeconds createdAt updatedAt",
    );

    if (!video) {
      res.status(404).json({
        success: false,
        message: "Video not found.",
      });
      return;
    }

    res.json({
      success: true,
      video: {
        id: video._id.toString(),
        title: video.title,
        description: video.description,
        visibility: video.visibility,
        status: video.status,
        thumbnailUrl: video.thumbnailUrl,
        playbackId: video.playbackId,
        durationSeconds: video.durationSeconds,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      },
    });
  } catch (error) {
    console.error("updateMyVideo error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update video.",
    });
  }
}

// Delete a video owned by the authenticated user.
export async function deleteMyVideo(req: Request, res: Response) {
  try {
    const userId = res.locals.userId as string;
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
      res.status(400).json({
        success: false,
        message: "Invalid video ID.",
      });
      return;
    }

    const video = await Video.findOne({
      _id: videoId,
      ownerId: userId,
    });

    if (!video) {
      res.status(404).json({
        success: false,
        message: "Video not found.",
      });
      return;
    }

    // Remove the StreamSphere database record.
    // Mux asset cleanup can be added separately after confirming
    // the installed Mux SDK and the desired deletion behavior.
    await video.deleteOne();

    res.json({
      success: true,
      message: "Video removed from your library.",
      videoId,
    });
  } catch (error) {
    console.error("deleteMyVideo error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete video.",
    });
  }
}