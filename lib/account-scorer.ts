export type AccountPost = {
  id: string;
  text: string;
  date: string;
  url: string;
};

export type AccountScores = {
  signal: number;
  originality: number;
  clarity: number;
  habits: number;
};

export type AccountReport = {
  shareId: string;
  analyzedAt: string;
  handle: string;
  name: string;
  bio: string;
  avatar: string;
  followers: number | null;
  posts: AccountPost[];
  replies: AccountPost[];
  scores: AccountScores;
  overall: number;
  model: string;
};
