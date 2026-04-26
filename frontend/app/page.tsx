"use client";

import { useEffect, useState } from "react";
import LanguageGrid from "@/components/LanguageGrid";
import VoteModal from "@/components/VoteModal";
import Leaderboard from "@/components/Leaderboard";
import { Language, LeaderboardEntry } from "@/lib/types";
import { getLanguages, getLeaderboard } from "@/lib/api";

export default function Home() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"vote" | "board">("vote");

  useEffect(() => {
    Promise.all([getLanguages(), getLeaderboard()])
      .then(([langs, board]) => {
        setLanguages(langs);
        setLeaderboard(board);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleVoteSuccess = () => {
    setSelectedLang(null);
    getLeaderboard().then(setLeaderboard);
    setActiveTab("board");
  };

  const totalVotes = leaderboard.reduce((s, e) => s + e.vote_count, 0);

  return (
    <div className="relative min-h-screen flex flex-col" style={{ zIndex: 1 }}>
      {/* ─────────────────────────────── NAV ─── */}
      <nav
        className="sticky top-0 z-40 border-b w-full"
        style={{
          background: "rgba(9,9,11,0.92)",
          backdropFilter: "blur(20px)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Inner constrained row */}
        <div
          className="mx-auto w-full"
          style={{ maxWidth: 1152, padding: "0 24px" }}
        >
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#a855f7)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "0.03em",
                  }}
                >
                  LC
                </span>
              </div>
              <span
                className="text-sm font-semibold"
                style={{
                  color: "var(--color-bright)",
                  fontFamily: "var(--font-body)",
                }}
              >
                LangChoice
              </span>
              <span
                className="hidden sm:inline-block text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                v1
              </span>
            </div>

            {/* Tab switcher */}
            <div
              className="flex items-center gap-0.5 p-1 rounded-xl"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              {(["vote", "board"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 sm:px-6 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer"
                  style={{
                    background:
                      activeTab === tab ? "var(--color-panel)" : "transparent",
                    color:
                      activeTab === tab
                        ? "var(--color-bright)"
                        : "var(--color-muted)",
                    border:
                      activeTab === tab
                        ? "1px solid var(--color-line)"
                        : "1px solid transparent",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {tab === "vote" ? "⚔ Vote" : "◈ Board"}
                </button>
              ))}
            </div>

            {/* Live counter */}
            <div
              className="hidden sm:flex items-center gap-2 text-xs shrink-0"
              style={{
                color: "var(--color-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#22c55e",
                  animation: "pulse-dot 2s ease-in-out infinite",
                }}
              />
              {loading ? "—" : `${totalVotes.toLocaleString()} votes`}
            </div>
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────── MAIN ─── */}
      <main
        className="flex-1 mx-auto important w-full"
        style={{ maxWidth: 1152, padding: "0 24px" }}
      >
        {/* VOTE hero */}
        {activeTab === "vote" && (
          <div
            style={{
              paddingTop: 64,
              paddingBottom: 48,
              animation: "fadeUp 0.45s ease both",
            }}
          >
            {/* Pill */}
            <div style={{ marginBottom: 28 }}>
              <span
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.22)",
                  color: "#818cf8",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#818cf8",
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }}
                />
                Community poll · Open
              </span>
            </div>

            {/* Headline — capped so it never bleeds */}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(44px, 7vw, 96px)",
                fontWeight: 900,
                color: "var(--color-bright)",
                lineHeight: 0.92,
                letterSpacing: "-0.01em",
                marginBottom: 20,
                maxWidth: 800,
              }}
            >
              What&apos;s your
              <br />
              <span
                style={{
                  WebkitTextStroke: "2px #6366f1",
                  color: "transparent",
                }}
              >
                language
              </span>{" "}
              of choice?
            </h1>

            <p
              style={{
                color: "var(--color-dim)",
                fontSize: 16,
                lineHeight: 1.65,
                maxWidth: 480,
              }}
            >
              Pick the language you reach for first. Back it up with a reason.
              One vote — make it count.
            </p>
          </div>
        )}

        {/* BOARD heading */}
        {activeTab === "board" && (
          <div
            style={{
              paddingTop: 48,
              paddingBottom: 24,
              animation: "fadeUp 0.4s ease both",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(36px, 5vw, 68px)",
                fontWeight: 900,
                color: "var(--color-bright)",
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              Leaderboard
            </h1>
            <p
              style={{
                color: "var(--color-muted)",
                fontSize: 13,
                fontFamily: "var(--font-mono)",
              }}
            >
              {loading ? "—" : `${totalVotes.toLocaleString()} votes cast`} ·
              live results
            </p>
          </div>
        )}

        {/* Content area */}
        {loading ? (
          <div
            className="flex items-center justify-center"
            style={{ paddingTop: 120, paddingBottom: 120 }}
          >
            <div
              className="w-8 h-8 rounded-full border-2"
              style={{
                borderColor: "var(--color-border)",
                borderTopColor: "#6366f1",
                animation: "spin 0.7s linear infinite",
              }}
            />
          </div>
        ) : activeTab === "vote" ? (
          <LanguageGrid
            languages={languages}
            leaderboard={leaderboard}
            onSelect={setSelectedLang}
          />
        ) : (
          <Leaderboard entries={leaderboard} />
        )}
      </main>

      {/* ─────────────────────────────── FOOTER ─── */}
      <footer
        className="w-full border-t"
        style={{ borderColor: "var(--color-border)", marginTop: 64 }}
      >
        <div
          className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{
            maxWidth: 1152,
            padding: "20px 24px",
            fontSize: 12,
            color: "var(--color-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span>langchoice · community poll</span>
          <span>next.js 16 · go gin · aws documentdb</span>
        </div>
      </footer>

      {/* ─────────────────────────────── MODAL ─── */}
      {selectedLang && (
        <VoteModal
          language={selectedLang}
          onClose={() => setSelectedLang(null)}
          onSuccess={handleVoteSuccess}
        />
      )}
    </div>
  );
}
