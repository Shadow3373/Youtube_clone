
import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import {
    createChannel,
    getMyChannel,
    getChannelByHandle,
    updateMyChannel,
} from "../controllers/channel.controller";

const router = Router();

// Private routes
router.post("/", authenticate, createChannel);
router.get("/me", authenticate, getMyChannel);
router.patch("/me", authenticate, updateMyChannel);

// Public route — keep this after /me
router.get("/:handle", getChannelByHandle);

export default router;
