
import { MoreHorizontal, Play, Upload } from "lucide-react";
import type { VideoItem } from "../../types/studioVideo";

interface VideoTableProps {
  videos: VideoItem[];
  onEdit: (video: VideoItem) => void;
  onDelete: (video: VideoItem) => void | Promise<void>;
  onContinueUpload: (video: VideoItem) => void;
  onPreview: (video: VideoItem) => void;
  actionMenuId: string | null;
  setActionMenuId: (id: string | null) => void;
  deletingVideoId: string | null;
}

function VideoThumbnail({ video }: { video: VideoItem }) {
  return (
    <div className={`video-thumbnail thumb-${video.color}`}>
      {video.thumbnailUrl ? (
        <img
          className="video-thumbnail-image"
          src={video.thumbnailUrl}
          alt={`${video.title} thumbnail`}
          loading="lazy"
        />
      ) : (
        <Play size={22} fill="currentColor" />
      )}
      <span className="video-duration">{video.duration}</span>
    </div>
  );
}

export default function VideoTable({
  videos,
  onEdit,
  onDelete,
  onContinueUpload,
  actionMenuId,
  setActionMenuId,
  deletingVideoId,
  onPreview,
}: VideoTableProps) {
  return (
    <div className="table-scroll">
      <table className="video-table">
        <thead>
          <tr>
            <th className="video-column">VIDEO</th>
            <th>STATUS</th>
            <th>DATE</th>
            <th>VIEWS</th>
            <th>COMMENTS</th>
            <th>LIKES</th>
            <th aria-label="Actions" />
          </tr>
        </thead>

        <tbody>
          {videos.map((video) => (
            <tr key={video.id}>
              <td>
                <div className="video-cell">
                  <button
                    type="button"
                    className="video-preview-trigger"
                    onClick={() => onPreview(video)}
                    aria-label={`Preview ${video.title}`}
                  >
                    <VideoThumbnail video={video} />
                  </button>

                  <div className="video-title-wrap">
                    <button
                      type="button"
                      className="video-title-button"
                      onClick={() => onPreview(video)}
                    >
                      {video.title}
                    </button>
                    <span>Video · Standard</span>
                  </div>
                </div>
              </td>

              <td>
                <span
                  className={`status-pill status-${video.status.toLowerCase()}`}
                >
                  <span />
                  {video.status}
                </span>
              </td>

              <td className="table-muted">{video.date}</td>
              <td>{video.views}</td>
              <td>{video.comments}</td>
              <td>{video.likes}</td>

              <td>
                <div className="video-actions-wrap">
                  <button
                    className="icon-button row-action"
                    type="button"
                    onClick={() =>
                      setActionMenuId(
                        actionMenuId === video.id ? null : video.id,
                      )
                    }
                    aria-label={`Manage ${video.title}`}
                    aria-expanded={actionMenuId === video.id}
                  >
                    <MoreHorizontal size={19} />
                  </button>

                  {actionMenuId === video.id && (
                    <div className="video-actions-menu">
                      {video.status === "Draft" && (
                        <button
                          type="button"
                          onClick={() => {
                            setActionMenuId(null);
                            onContinueUpload(video);
                          }}
                        >
                          <Upload size={15} />
                          Continue upload
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setActionMenuId(null);
                          onEdit(video);
                        }}
                      >
                        Edit details
                      </button>

                      <button
                        type="button"
                        className="video-delete-action"
                        disabled={deletingVideoId === video.id}
                        onClick={() => {
                          setActionMenuId(null);
                          void onDelete(video);
                        }}
                      >
                        {deletingVideoId === video.id
                          ? "Deleting..."
                          : "Delete video"}
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {videos.length === 0 && (
            <tr>
              <td colSpan={7} className="table-muted">
                No videos found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
