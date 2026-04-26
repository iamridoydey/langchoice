"use client";

import { Language, LeaderboardEntry } from "@/lib/types";

interface Props {
  languages: Language[];
  leaderboard: LeaderboardEntry[];
  onSelect: (lang: Language) => void;
}

export default function LanguageGrid({
  languages,
  leaderboard,
  onSelect,
}: Props) {
  const totalVotes = leaderboard.reduce((s, e) => s + e.vote_count, 0);

  const voteMap = leaderboard.reduce<Record<string, number>>((acc, e) => {
    acc[e.slug] = e.vote_count;
    return acc;
  }, {});

  const maxVotes = Math.max(...leaderboard.map((e) => e.vote_count), 1);

  const sorted = [...languages].sort(
    (a, b) => (voteMap[b.slug] ?? 0) - (voteMap[a.slug] ?? 0),
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {sorted.map((lang, i) => {
          const votes = voteMap[lang.slug] ?? 0;
          const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const barWidth = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;

          return (
            <button
              key={lang.slug}
              onClick={() => onSelect(lang)}
              className="group relative text-left rounded-2xl cursor-pointer overflow-hidden"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                animation: `fadeUp 0.45s ease both`,
                animationDelay: `${i * 50}ms`,
                transition:
                  "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
                display: "flex",
                flexDirection: "column",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = lang.color + "60";
                el.style.transform = "translateY(-3px)";
                el.style.boxShadow = `0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px ${lang.color}25`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--color-border)";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Top stripe */}
              <div
                style={{
                  height: 3,
                  background: lang.color,
                  transition: "height 0.2s",
                  flexShrink: 0,
                }}
                className="group-hover:h-1.25"
              />

              {/* Hover ambient */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
                style={{
                  background: `radial-gradient(ellipse at top left, ${lang.color}0e 0%, transparent 55%)`,
                }}
              />

              {/* Body */}
              <div
                className="relative flex flex-col"
                style={{ padding: "20px 20px 20px 20px", gap: 16, flex: 1 }}
              >
                {/* Row 1: dot + vote count */}
                <div className="flex items-center justify-between">
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: lang.color,
                      boxShadow: `0 0 8px ${lang.color}70`,
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                    className="group-hover:scale-125"
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {votes.toLocaleString()} votes
                  </span>
                </div>

                {/* Row 2: name + tagline */}
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 32,
                      fontWeight: 800,
                      color: "var(--color-bright)",
                      lineHeight: 1,
                      letterSpacing: "0.01em",
                      marginBottom: 6,
                    }}
                  >
                    {lang.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--color-muted)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as const,
                      overflow: "hidden",
                    }}
                  >
                    {lang.description}
                  </p>
                </div>

                {/* Row 3: progress bar */}
                <div style={{ marginTop: "auto" }}>
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      share
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        color: pct > 0 ? lang.color : "var(--color-muted)",
                      }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: "var(--color-panel)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 2,
                        width: `${barWidth}%`,
                        background: `linear-gradient(90deg, ${lang.color}, ${lang.color}88)`,
                        transition: "width 0.7s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Row 4: CTA */}
                <div
                  className="flex items-center justify-between border-t"
                  style={{ paddingTop: 12, borderColor: "var(--color-border)" }}
                >
                  <span
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      fontSize: 12,
                      color: lang.color,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    vote →
                  </span>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                    style={{
                      background: lang.color + "18",
                      border: `1px solid ${lang.color}35`,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6h8M6 2l4 4-4 4"
                        stroke={lang.color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {totalVotes > 0 && (
        <div className="text-center" style={{ marginTop: 32 }}>
          <span
            style={{
              fontSize: 13,
              color: "var(--color-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {totalVotes.toLocaleString()} total votes cast
          </span>
        </div>
      )}
    </div>
  );
}
