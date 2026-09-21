"use client";

import { useMemo, useState } from "react";
import { Check, Gamepad2, Search } from "lucide-react";

export type GameCandidate = {
  trackId: string;
  trackName: string;
  artistName: string;
  externalUrl: string | null;
  source: "list" | "feed";
};

type Props = {
  candidates: GameCandidate[];
  selected: string[];
  onChange: (selected: string[]) => void;
  limit?: number;
  emptyText?: string;
};

export function GameTrackPicker({ candidates, selected, onChange, limit = 4, emptyText }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr-TR");
    return needle
      ? candidates.filter((item) => `${item.trackName} ${item.artistName}`.toLocaleLowerCase("tr-TR").includes(needle))
      : candidates;
  }, [candidates, query]);

  function toggle(trackId: string) {
    onChange(selected.includes(trackId)
      ? selected.filter((id) => id !== trackId)
      : selected.length < limit ? [...selected, trackId] : selected);
  }

  return (
    <>
      <label className="game-track-search">
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Şarkı veya sanatçı ara" />
      </label>
      {filtered.length > 0 ? (
        <div className="game-track-list">
          {filtered.map((track) => {
            const active = selected.includes(track.trackId);
            const disabled = !active && selected.length >= limit;
            return (
              <button key={track.trackId} type="button" disabled={disabled} aria-pressed={active} onClick={() => toggle(track.trackId)} className={active ? "game-track-row is-selected" : "game-track-row"}>
                <span className="game-track-check">{active && <Check size={15} />}</span>
                <span className="min-w-0">
                  <strong>{track.trackName}</strong>
                  <small>{track.artistName} · {track.source === "list" ? "Listem" : "Paylaşımım"}</small>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="games-empty-state">
          <Gamepad2 size={22} />
          <strong>Uygun şarkı bulunamadı</strong>
          <p>{emptyText || "Listende veya paylaşımlarında en az dört benzersiz parça olmalı."}</p>
        </div>
      )}
    </>
  );
}
