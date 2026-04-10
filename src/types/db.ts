export type PoemFont = 'serif' | 'sans' | 'cursive';
export type PoemBgColor = '#FFFFFF' | '#FAF7F2' | '#F5E6D8' | '#EDE8F5';
export type PoemVisibility = 'public' | 'private';
export type SudokuDifficulty = 'easy' | 'medium' | 'hard';
export type DevicePlatform = 'ios' | 'android';

export type UserProfile = {
  id: string;
  nickname: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Poem = {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  font: PoemFont;
  bg_color: PoemBgColor;
  visibility: PoemVisibility;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type PoemWithAuthor = Poem & {
  author: Pick<UserProfile, 'id' | 'nickname' | 'avatar_url'>;
  like_count: number;
  liked_by_me: boolean;
  bookmarked_by_me: boolean;
};

export type Puzzle = {
  id: string;
  difficulty: SudokuDifficulty;
  grid: number[];
  solution: number[];
  puzzle_date: string;
  created_at: string;
};

export type PuzzleRecord = {
  id: string;
  user_id: string;
  puzzle_id: string;
  state: number[];
  memo: Record<string, number[]> | null;
  elapsed_seconds: number;
  error_count: number;
  hint_count: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};
