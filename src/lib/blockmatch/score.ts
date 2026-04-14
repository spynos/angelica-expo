const LINE_TABLE: Record<number, number> = {
  0: 0,
  1: 100,
  2: 250,
  3: 450,
  4: 700,
};

const OBSTACLE_BONUS = 50;

export function lineScore(linesCleared: number): number {
  if (linesCleared <= 0) return 0;
  if (linesCleared <= 4) return LINE_TABLE[linesCleared];
  return 700 + (linesCleared - 4) * 300;
}

export function comboMultiplier(combo: number): number {
  return 1 + 0.2 * Math.max(combo - 1, 0);
}

export function turnScore(linesCleared: number, obstaclesDestroyed: number, combo: number): number {
  const base = lineScore(linesCleared) + obstaclesDestroyed * OBSTACLE_BONUS;
  return Math.round(base * comboMultiplier(combo));
}
