
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Play } from "lucide-react";
import "./AuthGate.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

type Props = {
  children: ReactNode;
};

export default function AuthGate({ children }: Props) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });

        if (active) setAuthenticated(response.ok);
      } catch {
        if (active) setAuthenticated(false);
      } finally {
        if (active) setChecking(false);
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Unable to sign in. Check your credentials and try again.",
        );
      }

      // Verify the session cookie works before opening the Studio.
      const session = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });

      if (!session.ok) {
        throw new Error(
          "Sign-in response received, but the session could not be verified.",
        );
      }

      setAuthenticated(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <span>Connecting to StreamSphere...</span>
      </div>
    );
  }

  if (authenticated) return <>{children}</>;

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand">
          <span className="auth-brand-icon">
            <Play size={21} fill="currentColor" />
          </span>
          <span>StreamSphere</span>
          <span className="auth-brand-badge">STUDIO</span>
        </div>

        <div className="auth-visual-content">
          <span className="auth-eyebrow">YOUR CREATOR JOURNEY STARTS HERE</span>
          <h1>
            Create more.
            <br />
            <span>Reach further.</span>
          </h1>
          <p>
            Your videos, your audience, your growth — everything you need
            to manage your creative world in one place.
          </p>

          <div className="auth-feature-list">
            <div><span>01</span> Manage your video library</div>
            <div><span>02</span> Understand your audience</div>
            <div><span>03</span> Grow your channel</div>
          </div>
        </div>

        <div className="auth-visual-footer">
          <span className="auth-live-dot" />
          Built for creators. Ready for your next idea.
        </div>
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
      </section>

      <section className="auth-form-side">
        <div className="auth-mobile-brand">
          <span className="auth-brand-icon">
            <Play size={20} fill="currentColor" />
          </span>
          <span>StreamSphere</span>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form-heading">
            <span className="auth-eyebrow">CREATOR STUDIO</span>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your creator dashboard.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="auth-email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={18} />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-password-label">
              <label htmlFor="auth-password">Password</label>
            </div>
            <div className="auth-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in to Studio"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-security-note">
            <LockKeyhole size={15} />
            Your session is protected with secure, HttpOnly cookies.
          </div>
          <p className="auth-bottom-note">
            Your creative space. All in one place.
          </p>
        </div>
      </section>
    </main>
  );
}
