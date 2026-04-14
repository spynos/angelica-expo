import { router } from 'expo-router';

import type { IconSymbolName } from '@/components/ui/icon-symbol';

export type GameId = 'sudoku' | 'blockmatch' | 'crossword' | 'quiz';

export type GameMeta = {
  id: GameId;
  title: string;
  description: string;
  defaultByline: string;
  icon: IconSymbolName;
  background: string;
  foreground: string;
  mutedForeground: string;
  open: () => void;
  comingSoon?: boolean;
};

export const GAMES: Record<GameId, GameMeta> = {
  sudoku: {
    id: 'sudoku',
    title: '스도쿠',
    description: '숫자의 결을 따라 오늘의 한 판을 풀어보세요.',
    defaultByline: 'By 안젤리카',
    icon: 'square.grid.3x3.fill',
    background: '#A8C4F0',
    foreground: '#1F2A44',
    mutedForeground: '#3C4A66',
    open: () => router.push('/(tabs)/puzzle/sudoku/easy' as any),
  },
  crossword: {
    id: 'crossword',
    title: '십자말풀이',
    description: '단서를 따라 오늘의 낱말을 채워보세요.',
    defaultByline: '준비 중',
    icon: 'pencil',
    background: '#E9B8D1',
    foreground: '#3B1E30',
    mutedForeground: '#5E3A50',
    open: () => router.push('/(tabs)/puzzle/crossword' as any),
    comingSoon: true,
  },
  blockmatch: {
    id: 'blockmatch',
    title: '블록매치',
    description: '블록을 끼워 라인을 지우고 장애물을 걷어내세요.',
    defaultByline: '점수 도전',
    icon: 'puzzlepiece.fill',
    background: '#F4D35E',
    foreground: '#3A2B04',
    mutedForeground: '#5C4810',
    open: () => router.push('/(tabs)/puzzle/blockmatch' as any),
  },
  quiz: {
    id: 'quiz',
    title: '장학퀴즈',
    description: '한 문제, 한 숨. 오늘의 지식 한 조각.',
    defaultByline: '준비 중',
    icon: 'lightbulb',
    background: '#B8DABE',
    foreground: '#1E3A24',
    mutedForeground: '#3C5A42',
    open: () => router.push('/(tabs)/puzzle/quiz' as any),
    comingSoon: true,
  },
};

export const GAME_ORDER: GameId[] = ['sudoku', 'crossword', 'blockmatch', 'quiz'];

export const GAME_LIST: GameMeta[] = GAME_ORDER.map((id) => GAMES[id]);
