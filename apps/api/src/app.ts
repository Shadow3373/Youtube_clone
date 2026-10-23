import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import channelRoutes from "./routes/channel.routes";
import videoRoutes from "./routes/video.routes";

const app = express();

const allowedOrigins = (
    process.env.CLIENT_ORIGINS ??
    "http://localhost:5173,http://localhost:5174"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "Welcome to StreamSphere API"
    });
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/channels", channelRoutes);
app.use("/api/v1/videos", videoRoutes);

export default app;