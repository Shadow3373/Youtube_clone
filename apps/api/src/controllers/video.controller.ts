
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
    return res.status(401).json({
      success: false,
      message: "Please sign in again.",
    });
  }

  const title =
    typeof req.body?.title === "string"
      ? req.body.title.trim()
      : "";

  const description =
    typeof req.body?.description === "string"
      ? req.body.description.trim()
      : "";

  const visibility = req.body?.visibility ?? "private";

  if (!title || title.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Title must be between 1 and 100 characters.",
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

  let video: InstanceType<typeof Video> | null = null;
  let muxUploadId: string | null = null;

  try {
    const channel = await Channel.findOne({
      ownerId,
      status: "active",
    }).select("_id");

    if (!channel) {
      return res.status(403).json({
        success: false,
        message: "Create an active channel before uploading videos.",
      });
    }

    const corsOrigin = process.env.MUX_CORS_ORIGIN;

    if (!corsOrigin) {
      throw new Error("MUX_CORS_ORIGIN is not configured.");
    }

    video = await Video.create({
      ownerId,
      channelId: channel._id,
      title,
      description,
      visibility,
      status: "waiting_for_upload",
    });

    const upload = await mux.video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policies:
          visibility === "private" ? ["signed"] : ["public"],
        video_quality: "basic",
        passthrough: video._id.toString(),
      },
    });

    muxUploadId = upload.id;

    video.muxUploadId = upload.id;
    await video.save();

    return res.status(201).json({
      success: true,
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
    console.error("Create video upload failed:", error);

    let safeToDeleteVideo = !muxUploadId;

    if (muxUploadId) {
      try {
        await mux.video.uploads.cancel(muxUploadId);
        safeToDeleteVideo = true;
      } catch (cancelError) {
        console.error(
          "Failed to cancel Mux upload; preserving video record:",
          cancelError,
        );

        // Keep the record from being treated as a fresh draft.
        // Persist the upload ID if the database is available again.
        if (video) {
          await Video.updateOne(
            { _id: video._id, ownerId },
            {
              $set: {
                muxUploadId,
                status: "waiting_for_upload",
              },
            },
          ).catch((persistError) => {
            console.error(
              "Failed to persist orphaned upload ID:",
              persistError,
            );
          });
        }
      }
    }

    if (video && safeToDeleteVideo) {
      await Video.deleteOne({
        _id: video._id,
        ownerId,
      }).catch((deleteError) => {
        console.error(
          "Failed to clean up video record:",
          deleteError,
        );
      });
    }

    return res.status(500).json({
      success: false,
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

  const { title, description, visibility } = req.body ?? {};
  const normalizedTitle =
    typeof title === "string" ? title.trim() : "";
  const normalizedDescription =
    typeof description === "string" ? description.trim() : "";

  if (!normalizedTitle || normalizedTitle.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Title is required and must be 100 characters or fewer.",
    });
  }

  if (
    description !== undefined &&
    typeof description !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Description must be a string.",
    });
  }

  if (normalizedDescription.length > 5000) {
    return res.status(400).json({
      success: false,
      message: "Description must be 5000 characters or fewer.",
    });
  }

  if (!["private", "public", "unlisted"].includes(visibility)) {
    return res.status(400).json({
      success: false,
      message: "Invalid video visibility.",
    });
  }

  let claimedVideoId: string | null = null;
  let muxUploadId: string | null = null;

  try {
    const video = await Video.findOneAndUpdate(
      {
        _id: videoId,
        ownerId,
        status: "draft",
        $or: [
          { muxUploadId: { $exists: false } },
          { muxUploadId: null },
        ],
      },
      {
        $set: {
          status: "waiting_for_upload",
          title: normalizedTitle,
          description: normalizedDescription,
          visibility,
        },
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
        playback_policies:
          visibility === "private" ? ["signed"] : ["public"],
        video_quality: "basic",
        passthrough: video._id.toString(),
      },
    });

    muxUploadId = upload.id;

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
    console.error("Resume video upload failed:", error);

    let canRestoreDraft = !muxUploadId;

    if (muxUploadId) {
      try {
        await mux.video.uploads.cancel(muxUploadId);
        canRestoreDraft = true;
      } catch (cancelError) {
        console.error(
          "Failed to cancel Mux upload; preserving upload state:",
          cancelError,
        );

        if (claimedVideoId) {
          await Video.updateOne(
            {
              _id: claimedVideoId,
              ownerId,
              status: "waiting_for_upload",
            },
            {
              $set: { muxUploadId },
            },
          ).catch((persistError) => {
            console.error(
              "Failed to persist Mux upload ID:",
              persistError,
            );
          });
        }
      }
    }

    if (claimedVideoId && canRestoreDraft) {
      const rollbackFilter: Record<string, unknown> = {
        _id: claimedVideoId,
        ownerId,
        status: "waiting_for_upload",
      };

      if (muxUploadId) {
        rollbackFilter.muxUploadId = muxUploadId;
      } else {
        rollbackFilter.$or = [
          { muxUploadId: { $exists: false } },
          { muxUploadId: null },
        ];
      }

      await Video.updateOne(
        rollbackFilter,
        {
          $set: { status: "draft" },
          $unset: { muxUploadId: "" },
        },
      ).catch((rollbackError) => {
        console.error(
          "Failed to restore draft after upload error:",
          rollbackError,
        );
      });
    }

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


export async function getPublicVideos(req: Request, res: Response) {
  const page = Math.max(
    1,
    Number.parseInt(String(req.query.page ?? "1"), 10) || 1,
  );

  const limit = Math.min(
    24,
    Math.max(
      1,
      Number.parseInt(String(req.query.limit ?? "12"), 10) || 12,
    ),
  );

  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim().slice(0, 100)
      : "";

  try {
    // Only videos from active channels may appear publicly.
    const activeChannels = await Channel.find({ status: "active" })
      .select("_id")
      .lean();

    const activeChannelIds = activeChannels.map((channel) => channel._id);

    const filter: Record<string, unknown> = {
      status: "ready",
      visibility: "public",
      playbackId: { $nin: [null, ""] },
      channelId: { $in: activeChannelIds },
    };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedSearch, "i");

      const matchingChannels = await Channel.find({
        status: "active",
        $or: [{ name: regex }, { handle: regex }],
      })
        .select("_id")
        .lean();

      const matchingChannelIds = matchingChannels.map(
        (channel) => channel._id,
      );

      filter.$or = [
        { title: regex },
        { description: regex },
        { channelId: { $in: matchingChannelIds } },
      ];
    }

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .select(
          "_id channelId title description visibility status thumbnailUrl playbackId durationSeconds views createdAt updatedAt",
        )
        .populate({
          path: "channelId",
          select: "name handle avatarUrl",
        })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Video.countDocuments(filter),
    ]);

    const publicVideos = videos
      .filter((video) => video.channelId)
      .map((video) => {
        const channel = video.channelId as unknown as {
          _id: mongoose.Types.ObjectId;
          name: string;
          handle: string;
          avatarUrl: string | null;
        };

        return {
          id: video._id.toString(),
          title: video.title,
          description: video.description,
          thumbnailUrl:
            video.thumbnailUrl ||
            `https://image.mux.com/${video.playbackId}/thumbnail.jpg?time=1`,
          playbackId: video.playbackId,
          durationSeconds: video.durationSeconds,
          views: video.views ?? 0,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
          channel: {
            id: channel._id.toString(),
            name: channel.name,
            handle: channel.handle,
            avatarUrl: channel.avatarUrl,
          },
        };
      });

    return res.status(200).json({
      success: true,
      videos: publicVideos,
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
    console.error("Get public videos failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load public videos. Please try again.",
    });
  }
}
