import type {
  Video,
  VideoDraftInput,
  VideosResponse,
  VideoResponse,
} from "../types/video";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || "The request failed.");
  }

  return result as T;
}

export async function fetchVideos(): Promise<Video[]> {
  const result = await request<VideosResponse>("/videos?page=1&limit=50");
  return result.videos;
}

export async function createVideoDraft(
  input: VideoDraftInput,
): Promise<Video> {
  const result = await request<VideoResponse>("/videos/drafts", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return result.video;
}

export async function updateVideo(
  id: string,
  input: Partial<VideoDraftInput>,
): Promise<Video> {
  const result = await request<VideoResponse>(
    `/videos/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );

  return result.video;
}

export async function deleteVideo(id: string): Promise<void> {
  await request<{ success: boolean; message: string }>(
    `/videos/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}
