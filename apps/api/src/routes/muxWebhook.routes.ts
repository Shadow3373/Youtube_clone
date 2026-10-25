
import { Router, type Request, type Response } from "express";
import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import mongoose from "mongoose";
import Video from "../models/Video";

const router = Router();

type MuxEvent = {
  id?: string;
  type?: string;
  data?: {
    id?: string;
    asset_id?: string;
    upload_id?: string;
    passthrough?: string;
    duration?: number;
    status?: string;
    playback_ids?: Array<{
      id: string;
      policy?: string;
    }>;
    new_asset_settings?: {
      passthrough?: string;
    };
  };
};

function verifyMuxSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  const values = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const separator = part.indexOf("=");
      return separator < 0
        ? ["", ""]
        : [
            part.slice(0, separator).trim(),
            part.slice(separator + 1).trim(),
          ];
    }),
  );

  const timestamp = values.t;
  const signature = values.v1;

  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) {
    return false;
  }

  // Reject timestamps more than five minutes from the current time.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest();

  let received: Buffer;
  try {
    received = Buffer.from(signature, "hex");
  } catch {
    return false;
  }

  return (
    received.length === expected.length &&
    timingSafeEqual(received, expected)
  );
}

async function findVideo(
  passthrough?: string,
  assetId?: string,
  uploadId?: string,
) {
  const conditions: Record<string, unknown>[] = [];

  if (assetId) conditions.push({ muxAssetId: assetId });
  if (uploadId) conditions.push({ muxUploadId: uploadId });

  if (passthrough && mongoose.isValidObjectId(passthrough)) {
    conditions.push({ _id: passthrough });
  }

  if (!conditions.length) return null;

  return Video.findOne({ $or: conditions });
}

router.post("/", async (req: Request, res: Response) => {
  const secret = process.env.MUX_WEBHOOK_SECRET;

  if (!secret) {
    console.error("MUX_WEBHOOK_SECRET is not configured.");
    return res.status(500).json({ message: "Webhook is not configured." });
  }

  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ message: "Expected raw webhook body." });
  }

  if (
    !verifyMuxSignature(
      req.body,
      req.header("mux-signature"),
      secret,
    )
  ) {
    return res.status(401).json({ message: "Invalid webhook signature." });
  }

  let event: MuxEvent;

  try {
    event = JSON.parse(req.body.toString("utf8")) as MuxEvent;
  } catch {
    return res.status(400).json({ message: "Invalid JSON payload." });
  }

  const data = event.data;

  if (!event.type || !data) {
    return res.status(400).json({ message: "Invalid Mux event." });
  }

  try {
    const passthrough =
      data.passthrough ??
      data.new_asset_settings?.passthrough;

    switch (event.type) {
      case "video.upload.asset_created": {
        // For this event, data.id identifies the upload.
        const uploadId = data.id;
        const assetId = data.asset_id;

        const video = await findVideo(
          passthrough,
          assetId,
          uploadId,
        );

        if (video) {
          if (assetId) video.muxAssetId = assetId;
          video.status = "processing";
          await video.save();
        } else {
          console.warn("No StreamSphere video matched upload event.", {
            eventId: event.id,
            uploadId,
            assetId,
          });
        }

        break;
      }

      case "video.asset.ready": {
        const assetId = data.id;
        const video = await findVideo(passthrough, assetId);

        if (video) {
          const playback =
            data.playback_ids?.find((item) => item.policy === "public") ??
            data.playback_ids?.[0];

          video.muxAssetId = assetId ?? video.muxAssetId;

          if (playback?.id) {
            video.playbackId = playback.id;
            video.thumbnailUrl =
              `https://image.mux.com/${playback.id}/thumbnail.jpg?time=1`;
          }

          if (typeof data.duration === "number") {
            video.durationSeconds = data.duration;
          }

          // Do not mark ready if no playback ID was provided.
          if (playback?.id) {
            video.status = "ready";
          }

          await video.save();
        } else {
          console.warn("No StreamSphere video matched ready event.", {
            eventId: event.id,
            assetId,
          });
        }

        break;
      }

      case "video.asset.errored":
      case "video.upload.errored": {
        const assetId =
          event.type === "video.asset.errored" ? data.id : data.asset_id;
        const uploadId =
          event.type === "video.upload.errored" ? data.id : data.upload_id;

        const video = await findVideo(
          passthrough,
          assetId,
          uploadId,
        );

        if (video) {
          if (assetId) video.muxAssetId = assetId;
          video.status = "errored";
          await video.save();
        }

        break;
      }

      default:
        // Acknowledge other valid events without processing them.
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Mux webhook processing failed:", error);

    // A non-2xx response lets Mux retry transient processing failures.
    return res.status(500).json({ message: "Webhook processing failed." });
  }
});

export default router;
