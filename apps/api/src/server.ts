import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function startServer() {
    const { default: app } = await import("./app");
    const { connectDatabase } = await import("./config/database");

    const PORT = Number(process.env.PORT) || 5000;

    try {
        await connectDatabase();

        app.listen(PORT, () => {
            console.log(`StreamSphere API running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start StreamSphere API:", error);
        process.exit(1);
    }
}

void startServer();