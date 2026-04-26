import { Language, LeaderboardEntry, Vote, VoteRequest } from "./types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Relative path — goes to your own domain
  // Browser:  hits langchoice.com/api/leaderboard
  // Server:   Route Handler proxies to backend internally
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }

  return res.json();
}

export const getLanguages = () => apiFetch<Language[]>("/languages");
export const getLeaderboard = () =>
  apiFetch<LeaderboardEntry[]>("/leaderboard");
export const getVotes = (slug: string) => apiFetch<Vote[]>(`/votes/${slug}`);
export const castVote = (data: VoteRequest) =>
  apiFetch<Vote>("/vote", { method: "POST", body: JSON.stringify(data) });
