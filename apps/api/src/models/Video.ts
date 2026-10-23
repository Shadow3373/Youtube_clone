
import { Schema, model, models, type InferSchemaType } from "mongoose";

const videoSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
    visibility: {
      type: String,
      enum: ["private", "public", "unlisted"],
      default: "private",
    },
    status: {
      type: String,
      enum: [
        "draft",
        "waiting_for_upload",
        "processing",
        "ready",
        "errored",
      ],
      default: "draft",
      index: true,
    },
    muxUploadId: {
      type: String,
      unique: true,
      sparse: true,
    },
    muxAssetId: {
      type: String,
      default: null,
    },
    playbackId: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
);

videoSchema.index({ channelId: 1, createdAt: -1 });

export type VideoDocument = InferSchemaType<typeof videoSchema>;

const Video = models.Video || model("Video", videoSchema);

export default Video;
