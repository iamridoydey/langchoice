import { Language, LeaderboardEntry, Vote, VoteRequest } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  console.log(`${BASE}/api${path}`);
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export const getLanguages  = () => apiFetch<Language[]>("/languages");
export const getLeaderboard = () => apiFetch<LeaderboardEntry[]>("/leaderboard");
export const getVotes      = (slug: string) => apiFetch<Vote[]>(`/votes/${slug}`);
export const castVote      = (data: VoteRequest) =>
  apiFetch<Vote>("/vote", { method: "POST", body: JSON.stringify(data) });
