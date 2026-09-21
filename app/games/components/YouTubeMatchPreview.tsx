"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { GameTrack } from "../gameTypes";

export function YouTubeMatchPreview({ track }: { track: GameTrack }) {
  const [pageOrigin, setPageOrigin] = useState("");
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.artistName} ${track.trackName}`)}`;

  useEffect(() => {
    setPageOrigin(window.location.origin);
  }, []);

  if (track.youtubeVideoId && pageOrigin) {
    const query = new URLSearchParams({
      controls: "1",
      rel: "0",
      playsinline: "1",
      origin: pageOrigin,
      widget_referrer: pageOrigin,
    });
    return (
      <div className="game-video-frame">
        <iframe
          src={`https://www.youtube.com/embed/${track.youtubeVideoId}?${query}`}
          title={`${track.trackName} - ${track.artistName}`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="game-video-placeholder">
      <span><Play size={22} fill="currentColor" /></span>
      <div><strong>{track.trackName}</strong><small>{track.artistName}</small></div>
      <a href={searchUrl} target="_blank" rel="noreferrer">YouTube'da bul <ExternalLink size={13} /></a>
    </div>
  );
}
