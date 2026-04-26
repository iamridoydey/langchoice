"use client";

import React from "react";
import { LeaderboardEntry } from "@/lib/types";

interface Props {
  entries: LeaderboardEntry[];
}

const MEDALS: Record<number, { emoji: string; color: string }> = {
  0: { emoji: "🥇", color: "#F59E0B" },
  1: { emoji: "🥈", color: "#94A3B8" },
  2: { emoji: "🥉", color: "#CD7C45" },
};

export default function Leaderboard({ entries }: Props) {
  const total = entries.reduce((s, e) => s + e.vote_count, 0);
  const maxVotes = entries[0]?.vote_count ?? 1;

  if (entries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-32 gap-4 rounded-2xl my-6"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <span className="text-4xl select-none">📊</span>
        <p
          className="text-sm"
          style={{
            color: "var(--color-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          No votes yet. Be the first!
        </p>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-4">
      <div className="space-y-2.5">
        {entries.map((entry, i) => {
          const pct = total > 0 ? (entry.vote_count / total) * 100 : 0;
          const barPct = maxVotes > 0 ? (entry.vote_count / maxVotes) * 100 : 0;
          const medal = MEDALS[i];
          const isTop3 = i < 3;

          return (
            <div
              key={entry.slug}
              className="group relative overflow-hidden rounded-2xl transition-all duration-200"
              style={{
                background: isTop3
                  ? "var(--color-panel)"
                  : "var(--color-surface)",
                border: `1px solid ${isTop3 ? "var(--color-line)" : "var(--color-border)"}`,
                animation: `fadeUp 0.4s ease both`,
                animationDelay: `${i * 45}ms`,
              }}
            >
              {/* Background progress fill */}
              <div
                className="absolute inset-y-0 left-0 transition-all duration-700 ease-out pointer-events-none"
                style={{
                  width: `${barPct}%`,
                  background: `${entry.color}07`,
                  maxWidth: "100%",
                }}
              />

              {/* Left accent edge for top 3 */}
              {isTop3 && (
                <div
                  className="absolute left-0 inset-y-0 w-0.75"
                  style={{ background: entry.color }}
                />
              )}

              <div className="relative flex items-center gap-3 sm:gap-5 px-4 sm:px-5 py-4 sm:py-5">
                {/* Rank */}
                <div className="shrink-0 w-8 sm:w-10 text-center">
                  {isTop3 ? (
                    <span className="text-xl leading-none select-none">
                      {medal.emoji}
                    </span>
                  ) : (
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        color: "var(--color-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      #{i + 1}
                    </span>
                  )}
                </div>

                {/* Color dot */}
                <div
                  className="shrink-0 w-2.5 h-2.5 rounded-full hidden sm:block"
                  style={{
                    background: entry.color,
                    boxShadow: isTop3 ? `0 0 8px ${entry.color}50` : "none",
                  }}
                />

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                    <span
                      className="leading-none"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: isTop3
                          ? "clamp(22px, 4vw, 28px)"
                          : "clamp(18px, 3.5vw, 22px)",
                        fontWeight: 800,
                        color: isTop3 ? entry.color : "var(--color-bright)",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {entry.name}
                    </span>
                    <span
                      className="text-xs hidden md:block truncate"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {entry.description}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5">
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: "var(--color-border)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${barPct}%`,
                          background: `linear-gradient(90deg, ${entry.color}, ${entry.color}77)`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="shrink-0 text-right">
                  <div
                    className="text-base sm:text-lg font-bold tabular-nums leading-none"
                    style={{
                      color: isTop3 ? entry.color : "var(--color-text)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {pct.toFixed(1)}%
                  </div>
                  <div
                    className="text-xs mt-1 tabular-nums"
                    style={{
                      color: "var(--color-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {entry.vote_count.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div
        className="mt-8 flex items-center justify-center gap-3 text-xs"
        style={{ color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}
      >
        <span>{entries.length} languages</span>
        <span style={{ color: "var(--color-border)" }}>·</span>
        <span>{total.toLocaleString()} votes cast</span>
      </div>
    </div>
  );
}
