
import { useCallback, useEffect, useState } from "react";
import {
  createVideoDraft,
  fetchVideos,
  updateVideo,
  deleteVideo,
} from "../lib/videoApi";
import type { Video, VideoDraftInput } from "../types/video";

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshVideos = useCallback(async () => {
    setError("");

    try {
      const items = await fetchVideos();
      setVideos(items);
      return items;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load videos.";
      setError(message);
      throw err;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const items = await fetchVideos();
        if (!cancelled) setVideos(items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load videos.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveDraft = useCallback(async (input: VideoDraftInput) => {
    const video = await createVideoDraft(input);
    setVideos((current) => [video, ...current]);
    return video;
  }, []);

  const editVideo = useCallback(
    async (id: string, input: Partial<VideoDraftInput>) => {
      const updated = await updateVideo(id, input);
      setVideos((current) =>
        current.map((video) => (video.id === id ? updated : video)),
      );
      return updated;
    },
    [],
  );

  const removeVideo = useCallback(async (id: string) => {
    await deleteVideo(id);
    setVideos((current) => current.filter((video) => video.id !== id));
  }, []);

  return {
    videos,
    setVideos,
    loading,
    error,
    refreshVideos,
    saveDraft,
    editVideo,
    removeVideo,
  };
}
