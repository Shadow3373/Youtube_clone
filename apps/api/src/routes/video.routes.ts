
import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { createVideoUpload } from "../controllers/video.controller";

const router = Router();

router.post("/uploads", authenticate, createVideoUpload);

export default router;
