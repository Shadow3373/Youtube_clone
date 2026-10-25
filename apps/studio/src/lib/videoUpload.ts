import * as UpChunk from "@mux/upchunk";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export type VideoUploadInput = {
  file: File;
  title: string;
  description: string;
  visibility: "private" | "public" | "unlisted";
  videoId?: string;
  onProgress?: (percent: number) => void;
};

export type VideoUploadResult = {
  success?: boolean;
  video: {
    id: string;
    title: string;
    description: string;
    visibility: string;
    status: string;
  };
  upload: {
    id: string;
    url: string;
  };
};

export async function uploadVideo({
  file,
  title,
  description,
  visibility,
  videoId,
  onProgress,
}: VideoUploadInput): Promise<VideoUploadResult> {
  const supportedVideo =
    file.type.startsWith("video/") ||
    /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);

  if (!supportedVideo) {
    throw new Error("Please select a supported video file.");
  }

  const endpoint = videoId
    ? `${API_BASE}/videos/${encodeURIComponent(videoId)}/uploads`
    : `${API_BASE}/videos/uploads`;

  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, visibility }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || "Could not create the video upload.",
    );
  }

  if (!result?.video?.id || !result?.upload?.url) {
    throw new Error("The server returned an invalid upload response.");
  }

  const data = result as VideoUploadResult;

  await new Promise<void>((resolve, reject) => {
    const upload = UpChunk.createUpload({
      endpoint: data.upload.url,
      file,
      chunkSize: 5120,
    });

    upload.on("progress", (event) => {
      onProgress?.(Math.round(event.detail));
    });

    upload.on("success", () => resolve());

    upload.on("error", (event) => {
      reject(new Error(event.detail?.message || "Video upload failed."));
    });
  });

  return data;
}