
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchPublicVideos,
  formatDuration,
  formatRelativeDate,
  type PublicVideo,
} from "./lib/videoApi";
import {
  Activity,
  Compass,
  Flame,
  Home,
  Menu,
  Play,
  Search,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import MuxPlayer from "@mux/mux-player-react";
import VideoThumbnail from "./components/VideoThumbnail";
import "./App.css";

type VideoItem = {
  id: string;
  title: string;
  creator: string;
  category: string;
  duration: string;
  views: string;
  age: string;
  thumbnail: string;
  avatar: string;
  playbackId: string;
  description: string;
};

const categories = ["All", "Latest"];

function mapPublicVideo(video: PublicVideo): VideoItem {
  return {
    id: video.id,
    title: video.title,
    creator: video.channel.name,
    category: "All",
    duration: formatDuration(video.durationSeconds),
    views: "",
    age: formatRelativeDate(video.createdAt),
    thumbnail:
      video.thumbnailUrl ??
      `https://image.mux.com/${video.playbackId}/thumbnail.jpg?time=1`,
    avatar: video.channel.name.trim().charAt(0).toUpperCase() || "S",
    playbackId: video.playbackId,
    description: video.description,
  };
}

export default function App() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] =
    useState<VideoItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVideos() {
      setLoading(true);
      setLoadError("");

      try {
        const result = await fetchPublicVideos({ page: 1, limit: 24 });

        if (!cancelled) {
          setVideos(result.videos.map(mapPublicVideo));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load videos.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadVideos();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedVideo) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedVideo(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVideo]);

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();

    return videos.filter((video) => {
      const matchesSearch =
        !query ||
        video.title.toLowerCase().includes(query) ||
        video.creator.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query);

      const matchesCategory = category === "All" || category === "Latest";
      return matchesSearch && matchesCategory;
    });
  }, [videos, search, category]);

  const featuredVideo = videos[0];

  // const handleSelectVideo = (video: VideoItem) => {
  //   if (!video.playbackId?.trim()) {
  //     window.alert(
  //       "This video is not ready for playback yet. Please try again later.",
  //     );
  //     return;
  //   }

  //   setSelectedVideo(video);
  // };

  return (
    <div className="stream-app">
      <header className="topbar">
        <div className="brand-area">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <a className="brand" href="#" aria-label="StreamSphere home">
            <span className="brand-mark">
              <Play size={19} fill="currentColor" />
            </span>
            <span>Stream<span>Sphere</span></span>
          </a>
        </div>

        <form
          className="search-box"
          onSubmit={(event) => {
            event.preventDefault();
            document
              .getElementById("video-library")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <Search size={19} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search videos, creators, and more..."
            aria-label="Search videos"
          />
          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </form>

        <div className="topbar-actions">
          <button
            className="explore-button"
            onClick={() => {
              setCategory("All");
              document
                .getElementById("video-library")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Compass size={17} />
            <span>Explore</span>
          </button>
          <button
            className="avatar-button"
            title="Profile — coming soon"
            onClick={() => window.alert("Account features are coming soon.")}
          >
            M
          </button>
        </div>
      </header>

      <div className="app-body">
        {sidebarOpen && (
          <button
            className="sidebar-scrim"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          />
        )}

        <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
          <nav className="sidebar-nav" aria-label="Main navigation">
            <button
              className="nav-link active"
              onClick={() => {
                setCategory("All");
                setSearch("");
                setSidebarOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Home size={19} /> Home
            </button>
            <button
              className="nav-link"
              onClick={() => {
                setCategory("All");
                setSidebarOpen(false);
                document
                  .getElementById("video-library")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Compass size={19} /> Explore
            </button>
            <button
              className="nav-link"
              onClick={() => {
                setCategory("Latest");
                setSidebarOpen(false);
                document
                  .getElementById("video-library")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Flame size={19} /> Trending
            </button>
            <button
              className="nav-link"
              onClick={() =>
                window.alert("Your subscriptions will be available soon.")
              }
            >
              <Activity size={19} /> Subscriptions
            </button>

            <div className="sidebar-divider" />

            <div className="sidebar-label">YOUR SPACE</div>
            <button
              className="nav-link"
              onClick={() =>
                window.alert("Sign in to access your watch history.")
              }
            >
              <Video size={19} /> Watch history
            </button>
            <button
              className="nav-link"
              onClick={() =>
                window.alert("Sign in to save your favorite videos.")
              }
            >
              <Sparkles size={19} /> Saved videos
            </button>
          </nav>

          <div className="sidebar-promo">
            <span className="promo-icon"><Sparkles size={20} /></span>
            <h3>Your world of video.</h3>
            <p>Discover creators, ideas, and stories worth sharing.</p>
            <span className="promo-tag">WELCOME TO STREAMSPHERE</span>
          </div>

          <div className="sidebar-footer">
            <span>About</span><span>Privacy</span><span>Terms</span>
            <p>© 2026 StreamSphere</p>
          </div>
        </aside>

        <main className="main-content">
          <section className="hero-section">
            <div className="hero-copy">
              <div className="hero-eyebrow">
                <span className="live-dot" />
                A NEW WAY TO DISCOVER
              </div>
              <h1>
                Your next favorite
                <br />
                <span>starts here.</span>
              </h1>
              <p>
                Discover fresh perspectives, inspiring creators, and videos
                that make you think, feel, and explore.
              </p>
              <button
                className="hero-button"
                onClick={() => {
                  document
                    .getElementById("video-library")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Explore videos <Play size={17} fill="currentColor" />
              </button>
              <div className="hero-caption">
                <span className="caption-line" />
                STORIES WITHOUT LIMITS
              </div>
            </div>

            {featuredVideo ? (

              <button
                className="hero-art"
                onClick={() => navigate(`/watch/${featuredVideo.id}`)}
                aria-label={`Preview ${featuredVideo.title}`}
              >
                <VideoThumbnail
                  src={featuredVideo.thumbnail}
                  alt={featuredVideo.title}
                  loading="eager"
                />
                <div className="hero-art-overlay" />
                <div className="hero-play"><Play size={26} fill="currentColor" /></div>
                <div className="hero-art-caption">
                  <span>FEATURED STORY</span>
                  <strong>{featuredVideo.title}</strong>
                  <small>{featuredVideo.creator} · {featuredVideo.duration}</small>
                </div>
                <span className="hero-floating-badge">
                  <Sparkles size={14} /> LATEST VIDEO
                </span>
              </button>
            ) : (
              <div className="hero-art hero-art-empty" aria-live="polite">
                <div className="hero-art-overlay" />
                <div className="hero-art-caption">
                  <span>{loading ? "LOADING YOUR FEED" : "WELCOME TO STREAMSPHERE"}</span>
                  <strong>{loading ? "Finding videos for you…" : "Your next favorite starts here."}</strong>
                  <small>{loadError ? "Check the API connection below." : "New public videos will appear here."}</small>
                </div>
              </div>
            )}
          </section>

          <section className="discovery-strip">
            <div>
              <span className="strip-indicator" />
              <strong>Find your next obsession</strong>
            </div>
            <p>Fresh ideas. Real people. Endless perspectives.</p>
          </section>

          <section id="video-library" className="library-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">THE DISCOVERY FEED</span>
                <h2>Explore videos<span className="heading-dot">.</span></h2>
                <p>A handpicked starting point for your next watch.</p>
              </div>
              <span className="result-count">
                {filteredVideos.length} {filteredVideos.length === 1 ? "video" : "videos"}
              </span>
            </div>

            <div className="category-list" aria-label="Filter by category">
              {categories.map((item) => (
                <button
                  key={item}
                  className={`category-chip ${category === item ? "selected" : ""}`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="empty-results" role="status">
                <p>Loading public videos…</p>
              </div>
            ) : loadError ? (
              <div className="empty-results" role="alert">
                <h3>Could not load videos</h3>
                <p>{loadError}</p>
                <p>Confirm the API is running and VITE_API_BASE_URL points to it.</p>
                <button onClick={() => window.location.reload()}>Try again</button>
              </div>
            ) : filteredVideos.length > 0 ? (
              <div className="video-grid">
                {filteredVideos.map((video, index) => (
                  <article className="video-card" key={video.id}>
                    {/* <button
                      className="thumbnail-button"
                      onClick={() => handleSelectVideo(video)}
                      aria-label={`Preview ${video.title}`}
                    > */}
                    <button
                      className="thumbnail-button"
                      onClick={() => navigate(`/watch/${video.id}`)}
                      aria-label={`Watch ${video.title}`}
                    >
                      <VideoThumbnail
                        className="video-thumbnail-wrapper"
                        src={video.thumbnail}
                        alt={video.title}
                        loading={index > 2 ? "lazy" : "eager"}
                      />
                      <span className="thumbnail-duration">{video.duration}</span>
                      <span className="thumbnail-play">
                        <Play size={21} fill="currentColor" />
                      </span>
                    </button>

                    <div className="video-info">
                      <span className="creator-avatar">{video.avatar}</span>
                      <div className="video-copy">
                        {/* <button
                          className="video-card-title"
                          onClick={() => handleSelectVideo(video)}
                        > */}
                        <button
                          className="video-card-title"
                          onClick={() => navigate(`/watch/${video.id}`)}
                        >
                          {video.title}
                        </button>
                        <p className="creator-name">{video.creator}</p>
                        <p className="video-meta">{video.age}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-results">
                <Search size={30} />
                <h3>No videos found</h3>
                <p>There are no public videos matching your search yet.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>

          <footer className="web-footer">
            <a className="brand footer-brand" href="#">
              <span className="brand-mark"><Play size={16} fill="currentColor" /></span>
              <span>Stream<span>Sphere</span></span>
            </a>
            <p>A world of stories, one stream at a time.</p>
            <span>© 2026 StreamSphere. Built for discovery.</span>
          </footer>
        </main>
      </div>

      {selectedVideo && (
        <div
          className="preview-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedVideo(null);
          }}
        >
          <section
            className="preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
          >
            <div className="preview-heading">
              <div>
                <span className="section-eyebrow">VIDEO PREVIEW</span>
                <h2 id="preview-title">{selectedVideo.title}</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelectedVideo(null)}
                aria-label="Close preview"
              >
                <X size={21} />
              </button>
            </div>
            <MuxPlayer
              key={selectedVideo.playbackId}
              className="preview-player"
              playbackId={selectedVideo.playbackId}
              metadata={{
                video_title: selectedVideo.title,
                video_id: selectedVideo.id,
              }}
              accentColor="#9360e8"
              streamType="on-demand"
            />
            <div className="preview-details">
              <span className="creator-avatar">{selectedVideo.avatar}</span>
              <div>
                <strong>{selectedVideo.creator}</strong>
                <p>{selectedVideo.category} · {selectedVideo.duration}</p>
              </div>
            </div>
            <p className="preview-notice">
              {selectedVideo.description || "No description has been added for this video yet."}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
