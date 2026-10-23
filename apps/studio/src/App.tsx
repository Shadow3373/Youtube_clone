
import { useState } from "react";
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
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
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
import "./App.css";

type Page =
  | "Dashboard"
  | "Content"
  | "Analytics"
  | "Comments"
  | "Customization"
  | "Settings";

type VideoItem = {
  title: string;
  date: string;
  views: string;
  comments: string;
  likes: string;
  status: "Published" | "Draft" | "Processing";
  color: string;
  duration: string;
};

const initialVideos: VideoItem[] = [
  {
    title: "Building My First Full Stack Application",
    date: "Oct 22, 2026",
    views: "12,450",
    comments: "84",
    likes: "1.2K",
    status: "Published",
    color: "purple",
    duration: "12:45",
  },
  {
    title: "React and TypeScript: Complete Guide",
    date: "Oct 20, 2026",
    views: "8,320",
    comments: "56",
    likes: "876",
    status: "Published",
    color: "blue",
    duration: "18:32",
  },
  {
    title: "My Developer Setup in 2026",
    date: "Oct 18, 2026",
    views: "5,670",
    comments: "32",
    likes: "542",
    status: "Published",
    color: "orange",
    duration: "09:18",
  },
  {
    title: "Node.js API Performance Tips",
    date: "Not published",
    views: "—",
    comments: "—",
    likes: "—",
    status: "Draft",
    color: "green",
    duration: "14:06",
  },
];

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

function VideoThumbnail({ video }: { video: VideoItem }) {
  return (
    <div className={`video-thumbnail thumb-${video.color}`}>
      <Play size={22} fill="currentColor" />
      <span className="video-duration">{video.duration}</span>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState(initialVideos);
  const [notice, setNotice] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(query.toLowerCase()),
  );

  function openUpload() {
    setNotice("");
    setPage("Content");
    setSidebarOpen(false);
    setShowProfile(false);
    setUploadOpen(true);
  }

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");

  function saveDraft() {
    if (!uploadTitle.trim()) {
      setNotice("Enter a video title before saving your draft.");
      return;
    }

    setVideos((current) => [
      {
        title: uploadTitle.trim(),
        date: "Not published",
        views: "—",
        comments: "—",
        likes: "—",
        status: "Draft",
        color: "purple",
        duration: "00:00",
      },
      ...current,
    ]);
    setUploadTitle("");
    setUploadOpen(false);
    setNotice("Draft saved locally. Video upload is not connected yet.");
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
                <VideoTable videos={videos.slice(0, 3)} onOpen={selectPage} />
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
                <VideoTable videos={filteredVideos} onOpen={selectPage} />
                {filteredVideos.length === 0 && <p className="empty-state">No videos match your search.</p>}
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
        <div className="modal-backdrop" onClick={() => setUploadOpen(false)}>
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
                <h2 id="upload-title">Create a video</h2>
                <p>Start a draft for your next upload.</p>
              </div>
              <button className="icon-button" onClick={() => setUploadOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="upload-dropzone">
              <div className="upload-cloud"><CloudUpload size={28} /></div>
              <strong>Video upload integration coming next</strong>
              <p>We'll connect this area to Mux for secure direct uploads and video processing.</p>
              <span className="file-support">MP4 · MOV · WebM — planned support</span>
            </div>
            <label className="field-label" htmlFor="video-title">Video title</label>
            <input
              id="video-title"
              className="form-input"
              value={uploadTitle}
              onChange={(event) => setUploadTitle(event.target.value)}
              placeholder="Give your video a title"
              maxLength={100}
            />
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setUploadOpen(false)}>Cancel</button>
              <button className="primary-button" onClick={saveDraft}>Save draft</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function VideoTable({
  videos,
  onOpen,
}: {
  videos: VideoItem[];
  onOpen: (page: Page) => void;
}) {
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
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video, index) => (
            <tr key={`${video.title}-${index}`}>
              <td>
                <div className="video-cell">
                  <VideoThumbnail video={video} />
                  <div className="video-title-wrap">
                    <strong>{video.title}</strong>
                    <span>Video · Standard</span>
                  </div>
                </div>
              </td>
              <td>
                <span className={`status-pill status-${video.status.toLowerCase()}`}>
                  <span />{video.status}
                </span>
              </td>
              <td className="table-muted">{video.date}</td>
              <td>{video.views}</td>
              <td>{video.comments}</td>
              <td>{video.likes}</td>
              <td>
                <button
                  className="icon-button row-action"
                  onClick={() => onOpen("Content")}
                  aria-label={`Manage ${video.title}`}
                >
                  <MoreHorizontal size={19} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;