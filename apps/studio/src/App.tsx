

import { useEffect, useState } from "react";

import {

  Activity,

  BarChart3,

  Bell,

  CheckCircle2,

  ChevronDown,

  CircleHelp,

  Clapperboard,

  CloudUpload,

  Command,

  Eye,

  FileVideo,

  Globe,

  LayoutDashboard,

  Menu,

  MessageSquare,

  Play,

  Plus,

  Search,

  Settings,

  ShieldCheck,

  Sparkles,

  ThumbsUp,

  Users,

  Video,

  X,

} from "lucide-react";

import VideoTable from "./components/videos/VideoTable";

import type { VideoItem } from "./types/studioVideo";

import { uploadVideo } from "./lib/videoUpload";

import { createVideoDraft } from "./lib/videoApi";

import "./App.css";



type Page =

  | "Dashboard"

  | "Content"

  | "Analytics"

  | "Comments"

  | "Customization"

  | "Settings";



type ApiVideo = {

  id: string;

  channelId: string;

  title: string;

  description: string;

  visibility: "private" | "public" | "unlisted";

  status: "draft" | "waiting_for_upload" | "processing" | "ready" | "errored";

  thumbnailUrl: string | null;

  playbackId: string | null;

  durationSeconds: number | null;

  createdAt: string;

  updatedAt: string;

};



const API_BASE =

  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";



function formatDuration(seconds: number | null): string {

  if (seconds === null || !Number.isFinite(seconds)) return "—";

  const total = Math.floor(seconds);

  const hours = Math.floor(total / 3600);

  const minutes = Math.floor((total % 3600) / 60);

  const remainingSeconds = total % 60;

  if (hours > 0) {

    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;

}



function mapApiVideo(video: ApiVideo): VideoItem {

  let status: VideoItem["status"];

  switch (video.status) {

    case "ready":

      status = video.visibility === "public" ? "Published" : "Ready";

      break;

    case "draft":

      status = "Draft";

      break;

    case "errored":

      status = "Failed";

      break;

    default:

      status = "Processing";

  }

  return {

    id: video.id,

    title: video.title,

    description: video.description ?? "",

    date: new Date(video.createdAt).toLocaleDateString("en-US", {

      month: "short", day: "2-digit", year: "numeric",

    }),

    views: "—",

    comments: "—",

    likes: "—",

    status,

    color: "purple",

    duration: formatDuration(video.durationSeconds),

    thumbnailUrl: video.thumbnailUrl,

    playbackId: video.playbackId,

    visibility: video.visibility,

  };

}



async function fetchMyVideos(): Promise<VideoItem[]> {

  const response = await fetch(`${API_BASE}/videos?page=1&limit=50`, {

    method: "GET",

    credentials: "include",

  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {

    throw new Error(result?.message || "Unable to load your videos.");

  }

  if (!Array.isArray(result?.videos)) {

    throw new Error("The video API returned an invalid response.");

  }

  return (result.videos as ApiVideo[]).map(mapApiVideo);

}



const navigation = [

  { label: "Dashboard", icon: LayoutDashboard },

  { label: "Content", icon: Clapperboard },

  { label: "Analytics", icon: BarChart3 },

  { label: "Comments", icon: MessageSquare },

  { label: "Customization", icon: Sparkles },

  { label: "Settings", icon: Settings },

] as const;



const chartValues = [

  24, 31, 28, 38, 33, 44, 36, 48, 42, 54, 45, 61, 51, 67,

  57, 72, 64, 78, 68, 86, 74, 93, 82, 100, 88, 107, 95, 115,

];



function MetricCard({

  label,

  value,

  change,

  icon: Icon,

}: {

  label: string;

  value: string;

  change: string;

  icon: typeof Eye;

}) {

  return (

    <article className="metric-card">

      <div className="metric-top">

        <span>{label}</span>

        <span className="metric-icon">

          <Icon size={18} />

        </span>

      </div>

      <div className="metric-value">{value}</div>

      <div className="metric-change">

        <span className="change-positive">↗ {change}</span>

        <span className="muted"> vs. previous 28 days</span>

      </div>

    </article>

  );

}



function ViewsChart() {

  const points = chartValues

    .map((value, index) => `${index * 13},${130 - value}`)

    .join(" ");



  return (

    <div className="chart-wrap">

      <div className="chart-y-labels">

        <span>12K</span>

        <span>9K</span>

        <span>6K</span>

        <span>3K</span>

        <span>0</span>

      </div>

      <svg

        className="views-chart"

        viewBox="0 0 351 135"

        preserveAspectRatio="none"

        role="img"

        aria-label="Illustrative channel views trend"

      >

        {[12, 40, 68, 96, 124].map((y) => (

          <line

            key={y}

            x1="0"

            y1={y}

            x2="351"

            y2={y}

            stroke="var(--border)"

            strokeDasharray="4 5"

          />

        ))}

        <defs>

          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">

            <stop offset="0%" stopColor="#8b5cf6" stopOpacity=".25" />

            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />

          </linearGradient>

        </defs>

        <polygon

          points={`0,130 ${points} 351,130`}

          fill="url(#chartFill)"

        />

        <polyline

          points={points}

          fill="none"

          stroke="#9875ff"

          strokeWidth="2.5"

          strokeLinecap="round"

          strokeLinejoin="round"

          vectorEffect="non-scaling-stroke"

        />

      </svg>

      <div className="chart-x-labels">

        <span>Sep 27</span>

        <span>Oct 4</span>

        <span>Oct 11</span>

        <span>Oct 18</span>

        <span>Oct 24</span>

      </div>

    </div>

  );

}



function App() {

  const [page, setPage] = useState<Page>("Dashboard");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [query, setQuery] = useState("");

  const [videos, setVideos] = useState<VideoItem[]>([]);

  const [videosLoading, setVideosLoading] = useState(true);

  const [videosError, setVideosError] = useState("");

  const [notice, setNotice] = useState("");

  const [showProfile, setShowProfile] = useState(false);

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);

  const [editTitle, setEditTitle] = useState("");

  const [editDescription, setEditDescription] = useState("");

  const [editVisibility, setEditVisibility] = useState<

    "private" | "public" | "unlisted"

  >("private");

  const [editSaving, setEditSaving] = useState(false);

  const [editError, setEditError] = useState("");

  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  const [resumingDraft, setResumingDraft] =
    useState<VideoItem | null>(null);





  const filteredVideos = videos.filter((video) =>

    video.title.toLowerCase().includes(query.toLowerCase()),

  );



  function resetUploadForm() {
    setUploadTitle("");
    setUploadDescription("");
    setUploadVisibility("private");
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError("");
  }

  function openUpload() {
    setNotice("");
    setPage("Content");
    setSidebarOpen(false);
    setShowProfile(false);
    resetUploadForm();
    setResumingDraft(null);
    setUploadOpen(true);
  }

  function handleContinueUpload(video: VideoItem) {
    if (video.id.startsWith("local-draft-")) {
      setNotice("This draft is not saved in the backend yet.");
      return;
    }

    setNotice("");
    setPage("Content");
    setSidebarOpen(false);
    setShowProfile(false);
    resetUploadForm();

    setResumingDraft(video);
    setUploadTitle(video.title);
    setUploadDescription(video.description);
    setUploadVisibility(video.visibility);
    setUploadOpen(true);
  }



  const [uploadOpen, setUploadOpen] = useState(false);

  const [uploadTitle, setUploadTitle] = useState("");

  const [uploadDescription, setUploadDescription] = useState("");

  const [uploadVisibility, setUploadVisibility] = useState<

    "private" | "public" | "unlisted"

  >("private");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadProgress, setUploadProgress] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const [uploadError, setUploadError] = useState("");



  useEffect(() => {

    let cancelled = false;



    const loadVideos = async (showLoader: boolean) => {

      if (showLoader && !cancelled) setVideosLoading(true);

      try {

        const result = await fetchMyVideos();

        if (!cancelled) {

          setVideos(result);

          setVideosError("");

        }

      } catch (error) {

        if (!cancelled) {

          setVideosError(error instanceof Error ? error.message : "Unable to load your videos.");

        }

      } finally {

        if (showLoader && !cancelled) setVideosLoading(false);

      }

    };



    void loadVideos(true);

    const intervalId = window.setInterval(() => void loadVideos(false), 10000);

    return () => {

      cancelled = true;

      window.clearInterval(intervalId);

    };

  }, []);





  function openEditVideo(video: VideoItem) {

    if (video.id.startsWith("local-draft-")) {

      setNotice("This local draft is not saved in the backend yet.");

      setActionMenuId(null);

      return;

    }



    setEditingVideo(video);

    setEditTitle(video.title);

    setEditDescription(video.description);

    setEditVisibility(video.visibility);

    setEditError("");

    setActionMenuId(null);

  }



  async function handleSaveVideo() {

    if (!editingVideo) return;



    if (!editTitle.trim()) {

      setEditError("Video title is required.");

      return;

    }



    setEditSaving(true);

    setEditError("");



    try {

      const response = await fetch(

        `${API_BASE}/videos/${encodeURIComponent(editingVideo.id)}`,

        {

          method: "PATCH",

          credentials: "include",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({

            title: editTitle.trim(),

            description: editDescription,

            visibility: editVisibility,

          }),

        },

      );



      const result = await response.json().catch(() => null);



      if (!response.ok) {

        throw new Error(result?.message || "Unable to update video.");

      }



      setVideos(await fetchMyVideos());

      setEditingVideo(null);

      setNotice("Video details updated successfully.");

    } catch (error) {

      setEditError(

        error instanceof Error ? error.message : "Unable to update video.",

      );

    } finally {

      setEditSaving(false);

    }

  }



  async function handleDeleteVideo(video: VideoItem) {

    if (video.id.startsWith("local-draft-")) {

      setVideos((current) => current.filter((item) => item.id !== video.id));

      setActionMenuId(null);

      setNotice("Local draft removed.");

      return;

    }



    if (

      !window.confirm(

        `Delete "${video.title}" from your library? This cannot be undone.`,

      )

    ) {

      setActionMenuId(null);

      return;

    }



    setDeletingVideoId(video.id);

    setActionMenuId(null);



    try {

      const response = await fetch(

        `${API_BASE}/videos/${encodeURIComponent(video.id)}`,

        {

          method: "DELETE",

          credentials: "include",

        },

      );



      const result = await response.json().catch(() => null);



      if (!response.ok) {

        throw new Error(result?.message || "Unable to delete video.");

      }



      setVideos((current) => current.filter((item) => item.id !== video.id));

      setNotice(

        "Video removed from your library. The Mux asset has not been deleted.",

      );

    } catch (error) {

      setNotice(

        error instanceof Error ? error.message : "Unable to delete video.",

      );

    } finally {

      setDeletingVideoId(null);

    }

  }







  async function saveDraft() {

    if (!uploadTitle.trim()) {

      setUploadError("Enter a video title before saving your draft.");

      return;

    }



    setSavingDraft(true);

    setUploadError("");

    setNotice("");




    try {
      if (resumingDraft) {
        const response = await fetch(
          `${API_BASE}/videos/${encodeURIComponent(resumingDraft.id)}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: uploadTitle.trim(),
              description: uploadDescription.trim(),
              visibility: uploadVisibility,
            }),
          },
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message || "Unable to update the saved draft.",
          );
        }
      } else {
        await createVideoDraft({
          title: uploadTitle.trim(),
          description: uploadDescription.trim(),
          visibility: uploadVisibility,
        });
      }

      const refreshedVideos = await fetchMyVideos();
      setVideos(refreshedVideos);

      setUploadOpen(false);
      setUploadTitle("");
      setUploadDescription("");
      setUploadVisibility("private");
      setSelectedFile(null);
      setUploadProgress(0);
      setResumingDraft(null);

      setNotice(
        resumingDraft
          ? "Draft updated successfully."
          : "Draft saved successfully. You can continue editing it later.",
      );
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Unable to save your draft. Please try again.",
      );
    } finally {
      setSavingDraft(false);
    }


  }





  async function handleVideoUpload() {

    if (!uploadTitle.trim()) {

      setUploadError("Please enter a video title.");

      return;

    }

    if (!selectedFile) {

      setUploadError("Please select a video file.");

      return;

    }

    if (!selectedFile.type.startsWith("video/")) {

      setUploadError("Please select a valid video file.");

      return;

    }



    setUploading(true);

    setUploadError("");

    setUploadProgress(0);



    try {

      await uploadVideo({
        file: selectedFile,
        title: uploadTitle.trim(),
        description: uploadDescription.trim(),
        visibility: uploadVisibility,
        ...(resumingDraft ? { videoId: resumingDraft.id } : {}),
        onProgress: (percent) => setUploadProgress(percent),
      });

      const refreshedVideos = await fetchMyVideos();

      setVideos(refreshedVideos);

      setUploadOpen(false);

      setUploadTitle("");

      setUploadDescription("");

      setUploadVisibility("private");

      setSelectedFile(null);

      setResumingDraft(null);

      setUploadProgress(0);

      setNotice(

        "Video uploaded successfully. Its status will refresh automatically while Mux processes it.",

      );

    } catch (error) {

      setUploadError(

        error instanceof Error

          ? error.message

          : "Video upload failed. Please try again.",

      );

    } finally {

      setUploading(false);

    }

  }



  function selectPage(label: Page) {

    setPage(label);

    setSidebarOpen(false);

    setNotice("");

  }



  return (

    <div className="studio-app">

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>

        <div className="brand">

          <div className="brand-symbol">

            <Play size={19} fill="currentColor" />

          </div>

          <span>Stream<span className="brand-accent">Sphere</span></span>

          <button

            className="icon-button sidebar-close"

            onClick={() => setSidebarOpen(false)}

            aria-label="Close navigation"

          >

            <X size={20} />

          </button>

        </div>



        <button

          className="channel-card"

          onClick={() => setShowProfile(!showProfile)}

        >

          <div className="channel-avatar">S</div>

          <div className="channel-info">

            <strong>My Channel</strong>

            <span>Creator account</span>

          </div>

          <ChevronDown size={16} />

        </button>



        {showProfile && (

          <div className="profile-popover">

            <strong>My Channel</strong>

            <p>Channel profile and account settings</p>

            <button onClick={() => selectPage("Customization")}>

              Customize channel

            </button>

          </div>

        )}



        <div className="nav-caption">WORKSPACE</div>

        <nav className="navigation">

          {navigation.map(({ label, icon: Icon }) => (

            <button

              key={label}

              className={`nav-item ${page === label ? "nav-active" : ""}`}

              onClick={() => selectPage(label)}

            >

              <Icon size={19} strokeWidth={1.8} />

              <span>{label}</span>

              {label === "Comments" && <span className="nav-count">3</span>}

            </button>

          ))}

        </nav>



        <div className="sidebar-bottom">

          <div className="sidebar-tip">

            <div className="tip-icon"><Sparkles size={17} /></div>

            <strong>Your creator journey</strong>

            <p>Publish your first video and start building your audience.</p>

            <button onClick={openUpload}>Create a video <Plus size={14} /></button>

          </div>

          <div className="sidebar-footer">

            <span className="online-dot" />

            <span>Workspace ready</span>

            <span className="version">v0.1</span>

          </div>

        </div>

      </aside>



      {sidebarOpen && (

        <button

          className="mobile-overlay"

          onClick={() => setSidebarOpen(false)}

          aria-label="Close navigation overlay"

        />

      )}



      <main className="main-area">

        <header className="topbar">

          <div className="topbar-left">

            <button

              className="icon-button mobile-menu"

              onClick={() => setSidebarOpen(true)}

              aria-label="Open navigation"

            >

              <Menu size={22} />

            </button>

            <div className="breadcrumb">

              <span>Studio</span>

              <span className="breadcrumb-separator">/</span>

              <strong>{page}</strong>

            </div>

          </div>



          <div className="topbar-actions">

            <label className="search-box">

              <Search size={17} />

              <input

                placeholder="Search your content..."

                value={query}

                onChange={(event) => setQuery(event.target.value)}

                aria-label="Search videos"

              />

              <kbd>⌘ K</kbd>

            </label>

            <button

              className="icon-button notification-button"

              aria-label="Notifications"

              onClick={() => setNotice("You are all caught up on notifications.")}

            >

              <Bell size={19} />

              <span />

            </button>

            <button className="top-avatar" aria-label="Account">S</button>

          </div>

        </header>



        <div className="page-content">

          {notice && (

            <div className="notice" role="status">

              <CheckCircle2 size={17} />

              <span>{notice}</span>

              <button onClick={() => setNotice("")} aria-label="Dismiss message">

                <X size={16} />

              </button>

            </div>

          )}



          {page === "Dashboard" && (

            <>

              <section className="welcome-row">

                <div>

                  <div className="eyebrow"><Sparkles size={14} /> CREATOR WORKSPACE</div>

                  <h1>Good evening, Creator <span>✦</span></h1>

                  <p>Here's what's happening with your channel today.</p>

                </div>

                <button className="primary-button" onClick={openUpload}>

                  <CloudUpload size={17} /> Upload video

                </button>

              </section>



              <section className="metric-grid">

                <MetricCard label="Total views" value="26.4K" change="18.6%" icon={Eye} />

                <MetricCard label="Subscribers" value="1,284" change="12.4%" icon={Users} />

                <MetricCard label="Watch time" value="846 hrs" change="8.2%" icon={Activity} />

                <MetricCard label="Engagement" value="7.8%" change="2.1%" icon={ThumbsUp} />

              </section>



              <section className="dashboard-grid">

                <article className="panel analytics-panel">

                  <div className="panel-heading">

                    <div>

                      <h2>Channel performance</h2>

                      <p>Track how your audience is growing.</p>

                    </div>

                    <select aria-label="Analytics time period" defaultValue="28">

                      <option value="7">Last 7 days</option>

                      <option value="28">Last 28 days</option>

                      <option value="90">Last 90 days</option>

                    </select>

                  </div>

                  <div className="chart-total">

                    <strong>26,482</strong>

                    <span className="change-positive">↗ 18.6%</span>

                  </div>

                  <span className="muted chart-subtitle">Views during this period</span>

                  <ViewsChart />

                </article>



                <article className="panel quick-panel">

                  <div className="panel-heading">

                    <div>

                      <h2>Quick actions</h2>

                      <p>Keep your channel moving.</p>

                    </div>

                  </div>

                  <button className="quick-action" onClick={openUpload}>

                    <span className="quick-icon purple-bg"><CloudUpload size={19} /></span>

                    <span><strong>Upload a video</strong><small>Share something new</small></span>

                    <Plus size={17} />

                  </button>

                  <button className="quick-action" onClick={() => selectPage("Analytics")}>

                    <span className="quick-icon blue-bg"><BarChart3 size={19} /></span>

                    <span><strong>View analytics</strong><small>Understand your audience</small></span>

                    <Plus size={17} />

                  </button>

                  <button className="quick-action" onClick={() => selectPage("Customization")}>

                    <span className="quick-icon orange-bg"><Sparkles size={19} /></span>

                    <span><strong>Customize channel</strong><small>Make it your own</small></span>

                    <Plus size={17} />

                  </button>

                  <div className="tip-banner">

                    <Sparkles size={16} />

                    <span>Consistency is key. Keep creating!</span>

                  </div>

                </article>

              </section>



              <section className="panel video-panel">

                <div className="panel-heading video-heading">

                  <div>

                    <h2>Recent content</h2>

                    <p>Your latest videos and their performance.</p>

                  </div>

                  <button className="text-button" onClick={() => selectPage("Content")}>

                    View all videos <span>→</span>

                  </button>

                </div>

                <VideoTable

                  videos={videos.slice(0, 3)}

                  onEdit={openEditVideo}

                  onDelete={handleDeleteVideo}

                  onContinueUpload={handleContinueUpload}

                  actionMenuId={actionMenuId}

                  setActionMenuId={setActionMenuId}

                  deletingVideoId={deletingVideoId}

                />

              </section>

            </>

          )}



          {page === "Content" && (

            <>

              <section className="welcome-row">

                <div>

                  <div className="eyebrow"><FileVideo size={14} /> YOUR LIBRARY</div>

                  <h1>Channel content</h1>

                  <p>Manage your videos, drafts, and publishing status.</p>

                </div>

                <button className="primary-button" onClick={openUpload}>

                  <Plus size={17} /> Create video

                </button>

              </section>

              <section className="metric-grid content-stats">

                <MetricCard label="Total videos" value={String(videos.length)} change="Your library" icon={Video} />

                <MetricCard label="Published" value={String(videos.filter(v => v.status === "Published").length)} change="Public videos" icon={CheckCircle2} />

                <MetricCard label="Drafts" value={String(videos.filter(v => v.status === "Draft").length)} change="Not published" icon={FileVideo} />

                <MetricCard label="Processing" value={String(videos.filter(v => v.status === "Processing").length)} change="In progress" icon={Activity} />

              </section>

              <section className="panel video-panel">

                <div className="panel-heading">

                  <div><h2>All videos</h2><p>Search and manage your library.</p></div>

                  <span className="library-count">{filteredVideos.length} videos</span>

                </div>

                {videosLoading && <p className="empty-state">Loading your videos…</p>}

                {videosError && (

                  <div className="upload-error" role="alert">

                    <span>{videosError}</span>

                    <button

                      className="secondary-button"

                      onClick={async () => {

                        setVideosLoading(true);

                        setVideosError("");

                        try {

                          setVideos(await fetchMyVideos());

                        } catch (error) {

                          setVideosError(error instanceof Error ? error.message : "Unable to load your videos.");

                        } finally {

                          setVideosLoading(false);

                        }

                      }}

                    >Retry</button>

                  </div>

                )}

                {!videosLoading && !videosError && (

                  <>

                    <VideoTable

                      videos={filteredVideos}

                      onEdit={openEditVideo}

                      onDelete={handleDeleteVideo}

                      onContinueUpload={handleContinueUpload}

                      actionMenuId={actionMenuId}

                      setActionMenuId={setActionMenuId}

                      deletingVideoId={deletingVideoId}

                    />

                    {filteredVideos.length === 0 && <p className="empty-state">No videos match your search.</p>}

                  </>

                )}

              </section>

            </>

          )}



          {page === "Analytics" && (

            <section className="welcome-row">

              <div>

                <div className="eyebrow"><BarChart3 size={14} /> PERFORMANCE</div>

                <h1>Channel analytics</h1>

                <p>Understand views, watch time, and audience growth.</p>

              </div>

            </section>

          )}



          {page === "Comments" && (

            <section className="welcome-row">

              <div>

                <div className="eyebrow"><MessageSquare size={14} /> COMMUNITY</div>

                <h1>Comments</h1>

                <p>Build your community by engaging with viewers.</p>

              </div>

            </section>

          )}



          {page === "Customization" && (

            <section className="welcome-row">

              <div>

                <div className="eyebrow"><Sparkles size={14} /> CHANNEL BRANDING</div>

                <h1>Channel customization</h1>

                <p>Shape your channel's look and identity.</p>

              </div>

            </section>

          )}



          {page === "Settings" && (

            <section className="welcome-row">

              <div>

                <div className="eyebrow"><Settings size={14} /> PREFERENCES</div>

                <h1>Studio settings</h1>

                <p>Manage your creator workspace preferences.</p>

              </div>

            </section>

          )}



          {page !== "Dashboard" && page !== "Content" && (

            <section className="panel placeholder-panel">

              <div className="placeholder-icon"><Command size={25} /></div>

              <h2>{page} workspace</h2>

              <p>This section is ready for the next development step.</p>

              <span className="coming-soon">UI foundation · API integration pending</span>

              <button className="secondary-button" onClick={() => selectPage("Dashboard")}>

                Back to dashboard

              </button>

            </section>

          )}



          <footer className="page-footer">

            <span>© 2026 StreamSphere Studio</span>

            <span className="footer-links"><ShieldCheck size={14} /> Creator workspace <span>·</span> <CircleHelp size={14} /> Help & support</span>

          </footer>

        </div>

      </main>



      {uploadOpen && (

        <div

          className="modal-backdrop"

          onClick={() => {

            if (!uploading && !savingDraft) setUploadOpen(false);

          }}

        >

          <section

            className="upload-modal"

            role="dialog"

            aria-modal="true"

            aria-labelledby="upload-title"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="modal-heading">

              <div>

                <span className="eyebrow">CREATOR TOOLS</span>

                <h2 id="upload-title">Upload a video</h2>

                <p>Select a video and add its details before uploading.</p>

              </div>

              <button

                className="icon-button"

                onClick={() => {

                  if (!uploading && !savingDraft) setUploadOpen(false);

                }}

                aria-label="Close upload dialog"

                disabled={uploading || savingDraft}

              >

                <X size={20} />

              </button>

            </div>





            <div

              className={`video-dropzone ${isDraggingFile ? "video-dropzone-dragging" : ""} ${selectedFile ? "video-dropzone-has-file" : ""

                }`}

              onDragEnter={(event) => {

                event.preventDefault();

                event.stopPropagation();

                if (!uploading) setIsDraggingFile(true);

              }}

              onDragOver={(event) => {

                event.preventDefault();

                event.stopPropagation();

                if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";

              }}

              onDragLeave={(event) => {

                event.preventDefault();

                event.stopPropagation();



                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {

                  setIsDraggingFile(false);

                }

              }}

              onDrop={(event) => {

                event.preventDefault();

                event.stopPropagation();

                setIsDraggingFile(false);



                if (uploading) return;



                const file = event.dataTransfer.files?.[0];



                if (!file) return;



                const isVideo =

                  file.type.startsWith("video/") ||

                  /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);



                if (!isVideo) {

                  setUploadError("Please drop a supported video file.");

                  return;

                }



                setSelectedFile(file);

                setUploadError("");

              }}

            >

              <input

                id="video-file-input"

                className="video-file-input"

                type="file"

                accept="video/*,.mp4,.mov,.webm,.m4v,.avi,.mkv"

                disabled={uploading || savingDraft}

                onChange={(event) => {

                  const file = event.currentTarget.files?.[0];

                  if (!file) return;



                  const isVideo =

                    file.type.startsWith("video/") ||

                    /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);



                  if (!isVideo) {

                    setUploadError("Please select a supported video file.");

                    setSelectedFile(null);

                  } else {

                    setSelectedFile(file);

                    setUploadError("");

                  }



                  // Allow selecting the same file again.

                  event.currentTarget.value = "";

                }}

              />



              {!selectedFile ? (

                <label

                  htmlFor="video-file-input"

                  className="video-dropzone-empty"

                >

                  <span className="video-upload-icon">

                    <CloudUpload size={30} strokeWidth={1.8} />

                  </span>



                  <strong className="video-dropzone-title">

                    {isDraggingFile ? "Drop your video here" : "Drag and drop your video"}

                  </strong>



                  <span className="video-dropzone-subtitle">

                    or click below to browse your computer

                  </span>



                  <span className="video-dropzone-formats">

                    <span>MP4</span>

                    <span>MOV</span>

                    <span>WebM</span>

                  </span>



                  <span className="video-browse-button">

                    <Plus size={16} />

                    Choose video

                  </span>

                </label>

              ) : (

                <div className="video-selected-file">

                  <div className="video-selected-icon">

                    <FileVideo size={27} />

                  </div>



                  <div className="video-selected-info">

                    <strong title={selectedFile.name}>

                      {selectedFile.name}

                    </strong>



                    <span>

                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB

                    </span>



                    <span className="video-file-ready">

                      <CheckCircle2 size={14} />

                      Ready to upload

                    </span>



                    <label

                      htmlFor="video-file-input"

                      className="video-replace-file"

                    >

                      Replace video

                    </label>

                  </div>



                  <button

                    type="button"

                    className="video-remove-file"

                    onClick={() => {

                      setSelectedFile(null);

                      setUploadError("");

                    }}

                    disabled={uploading || savingDraft}

                    aria-label="Remove selected video"

                  >

                    <X size={18} />

                  </button>

                </div>

              )}

            </div>





            <label className="field-label" htmlFor="video-title">

              Video title

            </label>

            <input

              id="video-title"

              className="form-input"

              value={uploadTitle}

              onChange={(event) => setUploadTitle(event.target.value)}

              placeholder="Give your video a title"

              maxLength={100}

              disabled={uploading || savingDraft}

            />



            <label className="field-label" htmlFor="video-description">

              Description

            </label>

            <textarea

              id="video-description"

              className="form-input upload-description"

              value={uploadDescription}

              onChange={(event) => setUploadDescription(event.target.value)}

              placeholder="Tell viewers what your video is about"

              maxLength={5000}

              rows={3}

              disabled={uploading || savingDraft}

            />





            <div className="visibility-options">

              {([

                {

                  value: "private",

                  title: "Private",

                  description: "Only you can access this video.",

                  Icon: ShieldCheck,

                },

                {

                  value: "unlisted",

                  title: "Unlisted",

                  description: "Accessible to anyone with the link.",

                  Icon: Eye,

                },

                {

                  value: "public",

                  title: "Public",

                  description: "Visible to everyone.",

                  Icon: Globe,

                },

              ] as const).map(({ value, title, description, Icon }) => (

                <button

                  key={value}

                  type="button"

                  className={`visibility-option ${uploadVisibility === value ? "visibility-option-active" : ""

                    }`}

                  onClick={() => setUploadVisibility(value)}

                  disabled={uploading || savingDraft}

                  aria-pressed={uploadVisibility === value}

                >

                  <Icon size={18} />

                  <span className="visibility-option-copy">

                    <strong>{title}</strong>

                    <small>{description}</small>

                  </span>

                  {uploadVisibility === value && <CheckCircle2 size={17} />}

                </button>

              ))}

            </div>





            {uploading && (

              <div className="upload-progress">

                <div className="upload-progress-heading">

                  <span>Uploading video to Mux…</span>

                  <strong>{uploadProgress}%</strong>

                </div>

                <progress value={uploadProgress} max="100" />

                <p>Keep this window open until the upload finishes.</p>

              </div>

            )}



            {uploadError && (

              <div className="upload-error" role="alert">

                {uploadError}

              </div>

            )}



            <div className="modal-actions">

              <button

                type="button"

                className="secondary-button"

                onClick={() => void saveDraft()}

                disabled={uploading || savingDraft}

              >

                {savingDraft ? "Saving..." : "Save draft"}

              </button>

              <button

                className="secondary-button"

                onClick={() => {

                  if (!uploading && !savingDraft) setUploadOpen(false);

                }}

                disabled={uploading || savingDraft}

              >

                Cancel

              </button>

              <button

                className="primary-button"

                onClick={handleVideoUpload}

                disabled={uploading || savingDraft}

              >

                <CloudUpload size={17} />

                {uploading ? "Uploading…" : "Upload video"}

              </button>

            </div>

          </section>

        </div>

      )}





      {editingVideo && (

        <div

          className="modal-backdrop"

          onClick={() => {

            if (!editSaving) setEditingVideo(null);

          }}

        >

          <section

            className="upload-modal edit-video-modal"

            role="dialog"

            aria-modal="true"

            aria-labelledby="edit-video-heading"

            onClick={(event) => event.stopPropagation()}

          >

            <div className="modal-heading">

              <div>

                <span className="eyebrow">VIDEO SETTINGS</span>

                <h2 id="edit-video-heading">Edit video details</h2>

                <p>Update your video's information.</p>

              </div>



              <button

                className="icon-button"

                onClick={() => setEditingVideo(null)}

                disabled={editSaving}

                aria-label="Close edit dialog"

              >

                <X size={20} />

              </button>

            </div>



            <label className="field-label" htmlFor="edit-title">

              Video title

            </label>

            <input

              id="edit-title"

              className="form-input"

              value={editTitle}

              onChange={(event) => setEditTitle(event.target.value)}

              maxLength={100}

              disabled={editSaving}

            />



            <label className="field-label" htmlFor="edit-description">

              Description

            </label>

            <textarea

              id="edit-description"

              className="form-input upload-description"

              value={editDescription}

              onChange={(event) => setEditDescription(event.target.value)}

              maxLength={5000}

              rows={4}

              disabled={editSaving}

            />



            <label className="field-label" htmlFor="edit-visibility">

              Visibility

            </label>

            <select

              id="edit-visibility"

              className="form-input"

              value={editVisibility}

              onChange={(event) =>

                setEditVisibility(

                  event.target.value as "private" | "public" | "unlisted",

                )

              }

              disabled={editSaving}

            >

              <option value="private">Private</option>

              <option value="unlisted">Unlisted</option>

              <option value="public">Public</option>

            </select>



            {editError && (

              <div className="upload-error" role="alert">

                {editError}

              </div>

            )}



            <div className="modal-actions">

              <button

                className="secondary-button"

                onClick={() => setEditingVideo(null)}

                disabled={editSaving}

              >

                Cancel

              </button>



              <button

                className="primary-button"

                onClick={handleSaveVideo}

                disabled={editSaving}

              >

                {editSaving ? "Saving…" : "Save changes"}

              </button>

            </div>

          </section>

        </div>

      )}



    </div>

  );

}





export default App;