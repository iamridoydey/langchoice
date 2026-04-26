"use client";

import { useEffect, useRef, useState } from "react";
import { Language } from "@/lib/types";
import { castVote } from "@/lib/api";

interface Props {
  language: Language;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VoteModal({ language, onClose, onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async () => {
    const trimUser = username.trim();
    const trimComment = comment.trim();
    if (!trimUser) {
      setError("Username is required.");
      return;
    }
    if (trimUser.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }
    if (!trimComment) {
      setError("Please tell us why you chose this language.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await castVote({
        lang_slug: language.slug,
        username: trimUser,
        comment: trimComment,
      });
      onSuccess();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = username.trim().length >= 2 && comment.trim().length > 0;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(14px)",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div
        className="w-full max-w-md relative overflow-hidden rounded-2xl"
        style={{
          background: "var(--color-panel)",
          border: `1px solid ${language.color}30`,
          boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${language.color}15, 0 0 80px ${language.color}08`,
          animation: "slide-in 0.22s cubic-bezier(0.32,0.72,0,1) both",
        }}
      >
        {/* Top color stripe */}
        <div
          className="h-0.75 w-full"
          style={{ background: language.color }}
        />

        {/* Ambient glow */}
        <div
          className="absolute top-0 left-0 right-0 h-28 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top, ${language.color}12 0%, transparent 70%)`,
          }}
        />

        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: language.color }}
                />
                <span
                  className="text-xs uppercase tracking-[3px]"
                  style={{
                    color: "var(--color-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Voting for
                </span>
              </div>
              <h2
                className="leading-none mb-1.5"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(30px, 6vw, 42px)",
                  fontWeight: 900,
                  color: language.color,
                  letterSpacing: "0.01em",
                }}
              >
                {language.name}
              </h2>
              <p
                className="text-sm leading-snug"
                style={{ color: "var(--color-dim)" }}
              >
                {language.description}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-muted)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-bright)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-muted)";
              }}
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 2l8 8M10 2L2 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div
            className="mb-6 -mx-6 sm:-mx-8 border-t"
            style={{ borderColor: "var(--color-border)" }}
          />

          {/* Form */}
          <div className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="lc-username"
                className="flex items-center justify-between mb-2"
              >
                <span
                  className="text-xs font-semibold uppercase tracking-[2px]"
                  style={{
                    color: "var(--color-sub)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Username <span style={{ color: "#f87171" }}>*</span>
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: "var(--color-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {username.length}/32
                </span>
              </label>
              <input
                id="lc-username"
                ref={inputRef}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="your_handle"
                maxLength={32}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-bright)",
                  fontFamily: "var(--font-mono)",
                  caretColor: language.color,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = language.color + "55";
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${language.color}10`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Comment */}
            <div>
              <label
                htmlFor="lc-comment"
                className="flex items-center justify-between mb-2"
              >
                <span
                  className="text-xs font-semibold uppercase tracking-[2px]"
                  style={{
                    color: "var(--color-sub)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Why {language.name}?{" "}
                  <span style={{ color: "#f87171" }}>*</span>
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: "var(--color-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {comment.length}/280
                </span>
              </label>
              <textarea
                id="lc-comment"
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setError("");
                }}
                placeholder={`Tell us why you chose ${language.name}…`}
                maxLength={280}
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all duration-150"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-bright)",
                  fontFamily: "var(--font-body)",
                  caretColor: language.color,
                  lineHeight: "1.65",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = language.color + "55";
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${language.color}10`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs"
                style={{
                  background: "rgba(248,113,113,0.07)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  color: "#fca5a5",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span className="mt-px shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-none px-5 py-3 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-dim)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-bright)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-dim)";
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading || !canSubmit}
                className="flex-1 py-3 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-150"
                style={{
                  background:
                    canSubmit && !loading
                      ? language.color
                      : "var(--color-surface)",
                  border: `1px solid ${canSubmit && !loading ? "transparent" : "var(--color-border)"}`,
                  color: canSubmit && !loading ? "#000" : "var(--color-muted)",
                  cursor: loading || !canSubmit ? "not-allowed" : "pointer",
                  opacity: !canSubmit ? 0.5 : 1,
                }}
              >
                {loading ? (
                  <>
                    <div
                      className="w-4 h-4 rounded-full border-2"
                      style={{
                        borderColor: "rgba(0,0,0,0.25)",
                        borderTopColor: "rgba(0,0,0,0.75)",
                        animation: "spin 0.6s linear infinite",
                      }}
                    />
                    Submitting…
                  </>
                ) : (
                  <>
                    Cast Vote
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 7h10M7 2l5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>

            <p
              className="text-center text-xs"
              style={{
                color: "var(--color-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              one vote per person · cannot be changed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
