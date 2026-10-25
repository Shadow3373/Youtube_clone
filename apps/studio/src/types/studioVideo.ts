
export type StudioVideoStatus =
  | "Published"
  | "Draft"
  | "Processing"
  | "Ready"
  | "Failed";

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  date: string;
  views: string;
  comments: string;
  likes: string;
  status: StudioVideoStatus;
  color: string;
  duration: string;
  thumbnailUrl: string | null;
  playbackId: string | null;
  visibility: "private" | "public" | "unlisted";
}
