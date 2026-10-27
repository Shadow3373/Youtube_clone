import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import {
  fetchPublicVideos,
  formatDuration,
  formatRelativeDate,
  type PublicVideo,
} from "../lib/videoApi";
import { recordPublicVideoView } from "../lib/videoApi";
import VideoThumbnail from "../components/VideoThumbnail";
import "../App.css";

const MuxPlayer = lazy(() => import("@mux/mux-player-react"));

export default function WatchPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadVideos() {
      setLoading(true);
      setError("");

      try {
        const result = await fetchPublicVideos({ page: 1, limit: 100 });

        if (!cancelled) {
          setVideos(result.videos);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load this video.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadVideos();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;
    const storageKey = `streamsphere-viewed:${videoId}`;

    async function recordView() {
      try {
        let viewerKey = sessionStorage.getItem(storageKey);

        if (!viewerKey) {
          viewerKey = crypto.randomUUID();
        }

        const alreadyViewed = sessionStorage.getItem(storageKey);

        if (alreadyViewed) {
          return;
        }

        // Store before requesting so rerenders don't submit again.
        sessionStorage.setItem(storageKey, viewerKey);

        const count = await recordPublicVideoView(videoId!, viewerKey);

        if (!cancelled) {
          setViewCount(count);
        }
      } catch (error) {
        // View tracking should not prevent the video from playing.
        console.error("View tracking failed:", error);
      }
    }

    void recordView();

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const video = useMemo(
    () => videos.find((item) => item.id === videoId),
    [videos, videoId],
  );

  const relatedVideos = useMemo(
    () => videos.filter((item) => item.id !== videoId).slice(0, 8),
    [videos, videoId],
  );

  if (loading) {
    return (
      <main className="watch-page">
        <p className="watch-status">Loading video…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="watch-page">
        <Link className="watch-back" to="/">
          <ArrowLeft size={18} /> Back to StreamSphere
        </Link>
        <div className="watch-status" role="alert">
          <h2>Could not load video</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      </main>
    );
  }

  if (!video) {
    return (
      <main className="watch-page">
        <Link className="watch-back" to="/">
          <ArrowLeft size={18} /> Back to StreamSphere
        </Link>
        <div className="watch-status">
          <h2>Video not found</h2>
          <p>This video may be private, unavailable, or outside the current feed.</p>
          <Link to="/">Explore public videos</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="watch-page">
      <header className="watch-topbar">
        <Link className="brand" to="/" aria-label="StreamSphere home">
          <span className="brand-mark">
            <Play size={19} fill="currentColor" />
          </span>
          <span>Stream<span>Sphere</span></span>
        </Link>

        <Link className="watch-back" to="/">
          <ArrowLeft size={18} /> Back to videos
        </Link>
      </header>

      <div className="watch-layout">
        <section className="watch-primary">
          <div className="watch-player-shell">
            <Suspense fallback={<div className="watch-player-loading">Loading player…</div>}>
              <MuxPlayer
                key={video.playbackId}
                className="watch-player"
                playbackId={video.playbackId}
                streamType="on-demand"
                accentColor="#9360e8"
                metadata={{
                  video_id: video.id,
                  video_title: video.title,
                  viewer_user_id: "",
                }}
              />
            </Suspense>
          </div>

          <h1 className="watch-title">{video.title}</h1>

          <div className="watch-channel">
            <span className="creator-avatar">
              {video.channel.name.trim().charAt(0).toUpperCase() || "S"}
            </span>
            <div>
              <strong>{video.channel.name}</strong>
              <p>@{video.channel.handle}</p>
            </div>
          </div>

          <div className="watch-description">
            <p>
              {formatRelativeDate(video.createdAt)}
              {" · "}
              {formatDuration(video.durationSeconds)}
            </p>
            <p>{video.description || "No description has been added yet."}</p>
            <p className="watch-view-count">
              {viewCount === null
                ? "Views updating…"
                : `${viewCount.toLocaleString()} ${viewCount === 1 ? "view" : "views"}`}
            </p>
          </div>
        </section>

        <aside className="watch-related">
          <h2>Related videos</h2>

          {relatedVideos.length === 0 ? (
            <p className="watch-muted">No other public videos are available yet.</p>
          ) : (
            relatedVideos.map((item) => (
              <button
                type="button"
                className="related-video"
                key={item.id}
                onClick={() => navigate(`/watch/${item.id}`)}
              >
                <div className="related-thumbnail">
                  <VideoThumbnail
                    src={
                      item.thumbnailUrl ??
                      `https://image.mux.com/${item.playbackId}/thumbnail.jpg?time=1`
                    }
                    alt={item.title}
                  />
                </div>
                <div className="related-copy">
                  <strong>{item.title}</strong>
                  <span>{item.channel.name}</span>
                  <span>{formatDuration(item.durationSeconds)}</span>
                </div>
              </button>
            ))
          )}
        </aside>
      </div>
    </main>
  );
}
