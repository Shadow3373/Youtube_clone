import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (_req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;

    res.status(databaseConnected ? 200 : 503).json({
        success: databaseConnected,
        message: databaseConnected
            ? "StreamSphere API is healthy"
            : "Database connection is unavailable",
        data: {
            api: "running",
            database: databaseConnected ? "connected" : "disconnected",
            timestamp: new Date().toISOString()
        }
    });
});

export default router;