import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
  createVideoUpload,
  resumeVideoUpload,
  createVideoDraft,
  getMyVideos,
  updateMyVideo,
  deleteMyVideo,
} from "../controllers/video.controller";

const router = Router();

router.get("/", authenticate, getMyVideos);

router.post("/uploads", authenticate, createVideoUpload);
router.post("/drafts", authenticate, createVideoDraft);
router.post("/:videoId/uploads", authenticate, resumeVideoUpload);

router.patch("/:videoId", authenticate, updateMyVideo);
router.delete("/:videoId", authenticate, deleteMyVideo);

export default router;