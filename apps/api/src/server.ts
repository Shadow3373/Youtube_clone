import path from "node:path";
import dotenv from "dotenv";

for (const envPath of [
    path.resolve(__dirname, "../.env"),
    // path.resolve(__dirname, "../../../atlas-credentials.env"),
]) {
    dotenv.config({ path: envPath });
}

async function startServer() {
    const { default: app } = await import("./app");
    const { connectDatabase } = await import("./config/database");

    const PORT = Number(process.env.PORT) || 5000;
    const isProduction = process.env.NODE_ENV === "production";

    try {
        await connectDatabase();
        console.log("Database connection established.");
    } catch (error) {
        console.warn("Database connection failed. Starting API in degraded mode.", error);

        if (isProduction) {
            console.error("Production environment requires a valid database connection. Exiting.");
            process.exit(1);
        }
    }

    app.listen(PORT, () => {
        console.log(`StreamSphere API running at http://localhost:${PORT}`);
    });
}

void startServer();