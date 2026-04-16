import type { Offset, PieceDef, PieceShape } from './types';

function normalize(shape: PieceShape): PieceShape {
  const minR = Math.min(...shape.map(([r]) => r));
  const minC = Math.min(...shape.map(([, c]) => c));
  const translated = shape.map(([r, c]) => [r - minR, c - minC] as Offset);
  return translated
    .slice()
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function key(shape: PieceShape): string {
  return shape.map(([r, c]) => `${r},${c}`).join('|');
}

function rotate(shape: PieceShape): PieceShape {
  return shape.map(([r, c]) => [c, -r] as Offset);
}

function reflect(shape: PieceShape): PieceShape {
  return shape.map(([r, c]) => [r, -c] as Offset);
}

/**
 * All orientations reachable from `shape` under rotation AND reflection (up to 8).
 * Used only for free-polyomino deduplication so that mirror-image pieces share a
 * single canonical `freeKey` (e.g., L-pentomino and J-pentomino collapse to one).
 */
function allOrientations(shape: PieceShape): PieceShape[] {
  const seen = new Map<string, PieceShape>();
  let cur = normalize(shape);
  for (let i = 0; i < 4; i++) {
    const n = normalize(cur);
    seen.set(key(n), n);
    cur = rotate(cur);
  }
  cur = reflect(normalize(shape));
  for (let i = 0; i < 4; i++) {
    const n = normalize(cur);
    seen.set(key(n), n);
    cur = rotate(cur);
  }
  return Array.from(seen.values());
}

/**
 * The up-to-4 orientations reachable by pure 90° CW rotations (no reflection).
 * Stored on each PieceDef as `rotations`, so tapping to rotate always produces
 * a real 90° turn — never a chirality flip — which keeps the rotation animation
 * in sync with the shape transition. Without this split, asymmetric pieces had 8
 * `variants` and the 4th tap would mirror the piece, causing a visible flicker.
 */
function pureRotations(shape: PieceShape): PieceShape[] {
  const seen = new Map<string, PieceShape>();
  let cur = normalize(shape);
  for (let i = 0; i < 4; i++) {
    const n = normalize(cur);
    seen.set(key(n), n);
    cur = rotate(cur);
  }
  return Array.from(seen.values());
}

function freeKey(shape: PieceShape): string {
  return allOrientations(shape)
    .map(key)
    .sort()[0];
}

function neighbors([r, c]: Offset): Offset[] {
  return [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ] as Offset[];
}

function enumerateFreePolyominoes(maxSize: 1 | 2 | 3 | 4 | 5): PieceShape[][] {
  const byFreeKey = new Map<string, PieceShape>();
  byFreeKey.set(freeKey([[0, 0]]), normalize([[0, 0]]));
  let frontier: PieceShape[] = [normalize([[0, 0]])];
  const result: PieceShape[][] = [[normalize([[0, 0]])]];

  for (let size = 2; size <= maxSize; size++) {
    const nextByFree = new Map<string, PieceShape>();
    for (const shape of frontier) {
      const cellSet = new Set(shape.map(([r, c]) => `${r},${c}`));
      const candidates = new Set<string>();
      for (const cell of shape) {
        for (const nb of neighbors(cell)) {
          const k = `${nb[0]},${nb[1]}`;
          if (!cellSet.has(k)) candidates.add(k);
        }
      }
      for (const k of candidates) {
        const [nr, nc] = k.split(',').map(Number);
        const candidate = normalize([...shape, [nr, nc]]);
        const fk = freeKey(candidate);
        if (!byFreeKey.has(fk) && !nextByFree.has(fk)) {
          nextByFree.set(fk, candidate);
        }
      }
    }
    for (const [k, v] of nextByFree) byFreeKey.set(k, v);
    frontier = Array.from(nextByFree.values());
    result.push(frontier);
  }
  return result;
}

function buildAll(): PieceDef[] {
  const tiers = enumerateFreePolyominoes(5);
  const defs: PieceDef[] = [];
  for (let s = 1; s <= 5; s++) {
    const list = tiers[s - 1];
    list.forEach((shape, idx) => {
      defs.push({
        id: `P${s}-${idx}`,
        size: s as 1 | 2 | 3 | 4 | 5,
        rotations: pureRotations(shape),
      });
    });
  }
  return defs;
}

export const ALL_PIECES: PieceDef[] = buildAll();

const BY_ID = new Map(ALL_PIECES.map((p) => [p.id, p]));

export function getPiece(id: string): PieceDef {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`Unknown piece id: ${id}`);
  return p;
}

export function piecesBySize(size: 1 | 2 | 3 | 4 | 5): PieceDef[] {
  return ALL_PIECES.filter((p) => p.size === size);
}
