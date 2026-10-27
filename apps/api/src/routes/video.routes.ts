import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  createVideoUpload,
  resumeVideoUpload,
  createVideoDraft,
  getMyVideos,
  getPublicVideos,
  updateMyVideo,
  deleteMyVideo,
} from "../controllers/video.controller";
import { recordVideoView } from "../controllers/video-views.controller";

const router = Router();

// Public viewer-facing endpoint — no authentication required.
router.get("/public", getPublicVideos);

router.get("/", authenticate, getMyVideos);

router.post("/uploads", authenticate, createVideoUpload);
router.post("/drafts", authenticate, createVideoDraft);
router.post("/:videoId/uploads", authenticate, resumeVideoUpload);

router.post("/:videoId/views", recordVideoView);
router.patch("/:videoId", authenticate, updateMyVideo);
router.delete("/:videoId", authenticate, deleteMyVideo);

export default router;