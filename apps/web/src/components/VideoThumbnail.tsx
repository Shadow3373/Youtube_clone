
import { useState } from "react";
import { Play } from "lucide-react";

type VideoThumbnailProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  showPlay?: boolean;
  onClick?: () => void;
};

export default function VideoThumbnail({
  src,
  alt,
  className = "",
  loading = "lazy",
  showPlay = false,
  onClick,
}: VideoThumbnailProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`video-thumbnail-fallback ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
      aria-label={onClick ? alt : undefined}
    >
      {!failed && src ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="thumbnail-placeholder" aria-label="Thumbnail unavailable">
          <Play size={32} />
          <span>StreamSphere</span>
        </div>
      )}

      {showPlay && !failed && (
        <span className="thumbnail-play">
          <Play size={21} fill="currentColor" />
        </span>
      )}
    </div>
  );
}
