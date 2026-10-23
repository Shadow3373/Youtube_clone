
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, Clapperboard, ImagePlus, LoaderCircle, Play } from "lucide-react";
import "./ChannelGate.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

type Props = { children: ReactNode };

type ChannelForm = {
  name: string;
  handle: string;
  description: string;
  avatarUrl: string;
};

export default function ChannelGate({ children }: Props) {
  const [checking, setChecking] = useState(true);
  const [hasChannel, setHasChannel] = useState(false);
  const [form, setForm] = useState<ChannelForm>({
    name: "",
    handle: "",
    description: "",
    avatarUrl: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkChannel() {
      try {
        const response = await fetch(`${API_BASE}/channels/me`, {
          credentials: "include",
        });

        if (!active) return;

        if (response.ok) {
          setHasChannel(true);
        } else if (response.status === 404) {
          // The signed-in creator has not created a channel yet.
          setHasChannel(false);
        } else {
          setError("We couldn't check your channel. Please try again.");
        }
      } catch {
        if (active) {
          setError("Cannot connect to StreamSphere. Check that the API is running.");
        }
      } finally {
        if (active) setChecking(false);
      }
    }

    void checkChannel();

    return () => {
      active = false;
    };
  }, []);

  function updateField(field: keyof ChannelForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]:
        field === "handle"
          ? value.toLowerCase().replace(/[^a-z0-9_]/g, "")
          : value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const handle = form.handle.trim();
    const description = form.description.trim();

    if (name.length < 2) {
      setError("Channel name must contain at least 2 characters.");
      return;
    }

    if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
      setError("Your handle must be 3–30 characters using letters, numbers, or underscores.");
      return;
    }

    setLoading(true);

    try {
      const payload: {
        name: string;
        handle: string;
        description?: string;
        avatarUrl?: string;
      } = { name, handle };

      if (description) payload.description = description;
      if (form.avatarUrl.trim()) payload.avatarUrl = form.avatarUrl.trim();

      const response = await fetch(`${API_BASE}/channels`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Unable to create your channel. Please check your details.",
        );
      }

      setHasChannel(true);
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
      <div className="channel-gate-loading">
        <LoaderCircle className="channel-spinner" size={28} />
        <p>Preparing your creator space...</p>
      </div>
    );
  }

  if (hasChannel) return <>{children}</>;

  return (
    <main className="channel-onboarding">
      <header className="channel-onboarding-header">
        <div className="channel-brand">
          <span className="channel-brand-icon">
            <Play size={19} fill="currentColor" />
          </span>
          <span>StreamSphere</span>
          <span className="channel-studio-label">STUDIO</span>
        </div>
        <span className="channel-step-label">CHANNEL SETUP · STEP 1 OF 1</span>
      </header>

      <section className="channel-setup-layout">
        <div className="channel-intro">
          <span className="channel-kicker">YOUR CREATOR IDENTITY</span>
          <h1>
            Give your
            <br />
            channel a <span>home.</span>
          </h1>
          <p>
            Set up your channel to start publishing videos, building your
            audience, and tracking your growth on StreamSphere.
          </p>

          <div className="channel-benefits">
            <div><Check size={17} /> Your own public channel page</div>
            <div><Check size={17} /> A home for all your videos</div>
            <div><Check size={17} /> Creator tools and analytics</div>
          </div>
        </div>

        <form className="channel-form-card" onSubmit={handleSubmit}>
          <div className="channel-card-heading">
            <div className="channel-card-icon"><Clapperboard size={22} /></div>
            <div>
              <h2>Create your channel</h2>
              <p>You can refine your branding later.</p>
            </div>
          </div>

          <label htmlFor="channel-name">Channel name <span>*</span></label>
          <input
            id="channel-name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Manikandan Creates"
            minLength={2}
            maxLength={60}
            required
          />

          <label htmlFor="channel-handle">Channel handle <span>*</span></label>
          <div className="channel-handle-input">
            <span>@</span>
            <input
              id="channel-handle"
              value={form.handle}
              onChange={(e) => updateField("handle", e.target.value)}
              placeholder="yourchannel"
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_]{3,30}"
              title="Use 3–30 lowercase letters, numbers, or underscores."
              required
            />
          </div>
          <p className="channel-field-hint">
            Your unique channel address: /@{form.handle || "yourchannel"}
          </p>

          <label htmlFor="channel-description">Description</label>
          <textarea
            id="channel-description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Tell viewers what your channel is about..."
            rows={3}
            maxLength={500}
          />

          <label htmlFor="channel-avatar">Profile image URL <span className="channel-optional">(optional)</span></label>
          <div className="channel-handle-input">
            <ImagePlus size={18} />
            <input
              id="channel-avatar"
              type="url"
              value={form.avatarUrl}
              onChange={(e) => updateField("avatarUrl", e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {error && <div className="channel-form-error" role="alert">{error}</div>}

          <button className="channel-create-button" type="submit" disabled={loading}>
            {loading ? "Creating channel..." : "Create my channel"}
            {!loading && <ArrowRight size={18} />}
          </button>

          <p className="channel-form-footnote">
            Your channel details will be saved to your StreamSphere account.
          </p>
        </form>
      </section>
    </main>
  );
}
