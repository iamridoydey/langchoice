export interface Language {
  id: string;
  slug: string;
  name: string;
  color: string;
  description: string;
}

export interface Vote {
  id: string;
  lang_slug: string;
  username: string;
  comment: string;
  created_at: string;
}

export interface LeaderboardEntry {
  slug: string;
  name: string;
  color: string;
  description: string;
  vote_count: number;
}

export interface VoteRequest {
  lang_slug: string;
  username: string;
  comment: string;
}
