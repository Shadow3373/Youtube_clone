
export type VideoVisibility = "private" | "public" | "unlisted";

export type VideoStatus =
  | "draft"
  | "waiting_for_upload"
  | "processing"
  | "ready"
  | "errored";

export interface Video {
  id: string;
  channelId: string;
  title: string;
  description: string;
  visibility: VideoVisibility;
  status: VideoStatus;
  thumbnailUrl: string | null;
  playbackId: string | null;
  durationSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoDraftInput {
  title: string;
  description: string;
  visibility: VideoVisibility;
}

export interface VideosResponse {
  success: boolean;
  videos: Video[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface VideoResponse {
  success: boolean;
  message?: string;
  video: Video;
}
