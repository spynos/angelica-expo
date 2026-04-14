import { idx } from './board';
import { BOARD_SIZE, type Cell, type ObstacleState } from './types';

type Direction = 'h' | 'v';

function damage(o: ObstacleState, dir: Direction): ObstacleState {
  const needs = { ...o.needs };
  let hp = o.hp;
  switch (o.id) {
    case 'basic':
      hp = 0;
      break;
    case 'horiz':
      if (dir === 'h') hp = 0;
      break;
    case 'vert':
      if (dir === 'v') hp = 0;
      break;
    case 'durable2':
      hp = Math.max(0, hp - 1);
      break;
    case 'composite':
      if (dir === 'h' && needs.h > 0) needs.h -= 1;
      if (dir === 'v' && needs.v > 0) needs.v -= 1;
      hp = needs.h + needs.v;
      break;
  }
  return { ...o, hp, needs };
}

export type ClearResult = {
  board: Cell[];
  rowsCleared: number[];
  colsCleared: number[];
  obstaclesDestroyed: number;
};

export function clearLines(board: Cell[]): ClearResult {
  const rowsCleared: number[] = [];
  const colsCleared: number[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    let full = true;
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[idx(r, c)].kind === 'empty') {
        full = false;
        break;
      }
    }
    if (full) rowsCleared.push(r);
  }

  for (let c = 0; c < BOARD_SIZE; c++) {
    let full = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (board[idx(r, c)].kind === 'empty') {
        full = false;
        break;
      }
    }
    if (full) colsCleared.push(c);
  }

  if (rowsCleared.length === 0 && colsCleared.length === 0) {
    return { board, rowsCleared, colsCleared, obstaclesDestroyed: 0 };
  }

  // Apply damage in two passes: collect cells touched by clears, then mutate.
  // Same obstacle hit by both row+col counts as one of each direction.
  const next = board.slice();
  const hits = new Map<number, Direction[]>();
  for (const r of rowsCleared) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const i = idx(r, c);
      const arr = hits.get(i) ?? [];
      arr.push('h');
      hits.set(i, arr);
    }
  }
  for (const c of colsCleared) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      const i = idx(r, c);
      const arr = hits.get(i) ?? [];
      arr.push('v');
      hits.set(i, arr);
    }
  }

  let obstaclesDestroyed = 0;
  for (const [i, dirs] of hits) {
    const cell = next[i];
    if (cell.kind === 'block') {
      next[i] = { kind: 'empty' };
    } else if (cell.kind === 'obstacle') {
      let o = cell.obstacle;
      for (const d of dirs) o = damage(o, d);
      if (o.hp <= 0) {
        next[i] = { kind: 'empty' };
        obstaclesDestroyed += 1;
      } else {
        next[i] = { kind: 'obstacle', obstacle: o };
      }
    }
  }

  return { board: next, rowsCleared, colsCleared, obstaclesDestroyed };
}
