export interface PublicVideo {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    playbackId: string;
    durationSeconds: number | null;
    views: number;
    createdAt: string;
    updatedAt: string;
    channel: {
        id: string;
        name: string;
        handle: string;
        avatarUrl: string | null;
    };
}

export interface PublicVideosResponse {
    success: boolean;
    videos: PublicVideo[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

export async function fetchPublicVideos(options: {
    page?: number;
    limit?: number;
    search?: string;
} = {}): Promise<PublicVideosResponse> {
    const params = new URLSearchParams({
        page: String(options.page ?? 1),
        limit: String(options.limit ?? 24),
    });

    if (options.search?.trim()) params.set("search", options.search.trim());

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/videos/public?${params.toString()}`, {
            method: "GET",
            headers: { Accept: "application/json" },
        });
    } catch {
        throw new Error(
            `Cannot connect to the API at ${API_BASE_URL}. Start the API server and check CORS/VITE_API_BASE_URL.`,
        );
    }

    const responseText = await response.text();
    let payload: unknown;

    try {
        payload = responseText ? JSON.parse(responseText) : {};
    } catch {
        throw new Error(
            `The API returned a non-JSON response (HTTP ${response.status}). Check that the URL points to the API server: ${API_BASE_URL}.`,
        );
    }

    if (!response.ok) {
        const message =
            typeof payload === "object" && payload !== null && "message" in payload &&
                typeof (payload as { message?: unknown }).message === "string"
                ? (payload as { message: string }).message
                : `Request failed with HTTP ${response.status}`;
        throw new Error(message);
    }

    if (
        typeof payload !== "object" ||
        payload === null ||
        !("success" in payload) ||
        !("videos" in payload) ||
        !Array.isArray((payload as { videos: unknown }).videos)
    ) {
        throw new Error("The API response format is unexpected. Check GET /api/v1/videos/public.");
    }

    const result = payload as PublicVideosResponse;
    if (!result.success) throw new Error("The API could not return public videos.");
    return result;
}

export function formatDuration(seconds: number | null): string {
    if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "—";
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainingSeconds = total % 60;
    const pad = (value: number) => String(value).padStart(2, "0");
    return hours > 0
        ? `${hours}:${pad(minutes)}:${pad(remainingSeconds)}`
        : `${minutes}:${pad(remainingSeconds)}`;
}

export function formatRelativeDate(dateString: string): string {
    const timestamp = new Date(dateString).getTime();
    if (!Number.isFinite(timestamp)) return "";

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (elapsedSeconds < 60) return "Just now";
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
}


export async function recordPublicVideoView(
  videoId: string,
  viewerKey: string,
): Promise<number> {
  const response = await fetch(
    `${API_BASE_URL}/videos/${encodeURIComponent(videoId)}/views`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ viewerKey }),
    },
  );

  const result = await response.json().catch(() => null);

  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || "Unable to record video view.");
  }

  return Number(result.views ?? 0);
}
