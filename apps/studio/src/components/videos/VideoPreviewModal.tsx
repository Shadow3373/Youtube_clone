
import MuxPlayer from "@mux/mux-player-react";
import { X, PlayCircle } from "lucide-react";
import type { VideoItem } from "../../types/studioVideo";

interface VideoPreviewModalProps {
  video: VideoItem;
  onClose: () => void;
}

export default function VideoPreviewModal({
  video,
  onClose,
}: VideoPreviewModalProps) {
  const canPlay = Boolean(video.playbackId) &&
    (video.status === "Published" || video.status === "Ready");

  return (
    <div
      className="video-preview-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="video-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-preview-title"
      >
        <header className="video-preview-header">
          <div>
            <span className="eyebrow">VIDEO PREVIEW</span>
            <h2 id="video-preview-title">{video.title}</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close video preview"
          >
            <X size={20} />
          </button>
        </header>

        <div className="video-preview-player">
          {canPlay && video.playbackId ? (
            <MuxPlayer
              key={video.id}
              playbackId={video.playbackId}
              streamType="on-demand"
              metadata={{
                video_id: video.id,
                video_title: video.title,
              }}
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
              }}
            />
          ) : (
            <div className="video-preview-unavailable">
              <PlayCircle size={44} />
              <h3>
                {video.status === "Processing"
                  ? "Video is still processing"
                  : video.status === "Failed"
                    ? "Video processing failed"
                    : "Video playback is not available"}
              </h3>
              <p>
                {video.playbackId
                  ? "Playback will be available when the video is ready."
                  : "Mux has not provided a playback ID for this video yet."}
              </p>
            </div>
          )}
        </div>

        <div className="video-preview-details">
          <div>
            <span className="video-preview-label">Status</span>
            <strong>{video.status}</strong>
          </div>
          <div>
            <span className="video-preview-label">Duration</span>
            <strong>{video.duration}</strong>
          </div>
          <div>
            <span className="video-preview-label">Visibility</span>
            <strong>{video.visibility}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
