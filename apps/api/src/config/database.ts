import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
    const runtime = globalThis as typeof globalThis & {
        process?: { env?: Record<string, string | undefined> };
    };
    const mongoUri = runtime.process?.env?.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("MONGODB_URI is missing from environment variables");
    }

    const connectionOptions: mongoose.ConnectOptions = {
        serverSelectionTimeoutMS: 10000,
        allowPartialTrustChain: undefined,
        ALPNProtocols: undefined,
        ca: undefined,
        cert: undefined,
        checkServerIdentity: undefined,
        ciphers: undefined,
        crl: undefined,
        ecdhCurve: undefined,
        key: undefined,
        minDHSize: undefined,
        passphrase: undefined,
        pfx: undefined,
        rejectUnauthorized: undefined,
        secureContext: undefined,
        secureProtocol: undefined,
        servername: undefined,
        session: undefined,
        autoSelectFamily: undefined,
        autoSelectFamilyAttemptTimeout: undefined,
        keepAliveInitialDelay: undefined,
        family: undefined,
        hints: undefined,
        localAddress: undefined,
        localPort: undefined,
        lookup: undefined
    };

    await mongoose.connect(mongoUri, connectionOptions);

    console.log("MongoDB connected successfully");
}