import { idx, makeEmptyBoard } from './board';
import { ALL_PIECES, piecesBySize } from './pieces';
import {
  BOARD_SIZE,
  type ActivePiece,
  type Cell,
  type ObstacleId,
  type ObstacleState,
} from './types';

export type Rng = { next(): number; state(): number };

export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return {
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    state() {
      return s;
    },
  };
}

export function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SIZE_WEIGHTS_BY_STAGE = (stage: number): Record<1 | 2 | 3 | 4 | 5, number> => ({
  1: Math.max(0.05, 0.15 - stage * 0.01),
  2: 0.2,
  3: 0.25,
  4: 0.3,
  5: Math.min(0.3, 0.1 + stage * 0.02),
});

export function pickPiece(rng: Rng, stage: number): ActivePiece {
  const weights = SIZE_WEIGHTS_BY_STAGE(stage);
  const sizes: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];
  const total = sizes.reduce((s, v) => s + weights[v], 0);
  let r = rng.next() * total;
  let pickedSize: 1 | 2 | 3 | 4 | 5 = 4;
  for (const v of sizes) {
    r -= weights[v];
    if (r <= 0) {
      pickedSize = v;
      break;
    }
  }
  const pool = piecesBySize(pickedSize);
  const def = pool[Math.floor(rng.next() * pool.length)] ?? ALL_PIECES[0];
  const rotationIdx = Math.floor(rng.next() * def.rotations.length);
  return { defId: def.id, rotationIdx };
}

function obstacleStateFor(id: ObstacleId): ObstacleState {
  switch (id) {
    case 'basic':
    case 'horiz':
    case 'vert':
      return { id, hp: 1, needs: { h: 0, v: 0 } };
    case 'durable2':
      return { id, hp: 2, needs: { h: 0, v: 0 } };
    case 'composite':
      return { id, hp: 2, needs: { h: 1, v: 1 } };
  }
}

function obstaclePoolFor(stage: number): ObstacleId[] {
  if (stage <= 1) return ['basic'];
  if (stage <= 3) return ['basic', 'basic', 'horiz', 'vert'];
  if (stage <= 6) return ['basic', 'horiz', 'vert', 'durable2'];
  return ['basic', 'horiz', 'vert', 'durable2', 'composite'];
}

export function generateStage(rng: Rng, stage: number): Cell[] {
  const board = makeEmptyBoard();
  const obstacleCount = Math.min(20, 3 + Math.floor(stage * 1.5));
  const pool = obstaclePoolFor(stage);
  const placed = new Set<number>();
  let attempts = 0;
  while (placed.size < obstacleCount && attempts < obstacleCount * 5) {
    attempts += 1;
    const r = 1 + Math.floor(rng.next() * (BOARD_SIZE - 2));
    const c = 1 + Math.floor(rng.next() * (BOARD_SIZE - 2));
    const i = idx(r, c);
    if (placed.has(i)) continue;
    const id = pool[Math.floor(rng.next() * pool.length)];
    board[i] = { kind: 'obstacle', obstacle: obstacleStateFor(id) };
    placed.add(i);
  }
  return board;
}
