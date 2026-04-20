"use client";

import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";

function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    /* ignore */
  }
}

// Click-to-play YouTube embed that fires PostHog events for section
// visibility and play intent. Keeps YouTube's JS off the page until
// someone actually clicks play.
export default function HowItWorksVideo({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seenRef.current) {
            seenRef.current = true;
            track("how_it_works_section_viewed", { video_id: videoId });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [videoId]);

  const handlePlay = () => {
    track("video_play_clicked", { video_id: videoId });
    setPlaying(true);
  };

  return (
    <div
      ref={containerRef}
      className="mt-8 aspect-video rounded-xl overflow-hidden border border-line bg-paper shadow-sm relative"
    >
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      ) : (
        <button
          type="button"
          onClick={handlePlay}
          aria-label={`Play: ${title}`}
          className="w-full h-full relative group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition">
            <div className="h-20 w-20 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
              <svg
                viewBox="0 0 24 24"
                width="32"
                height="32"
                fill="#111"
                aria-hidden
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
