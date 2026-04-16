export const BOARD_SIZE = 10;
export const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;

export type ObstacleId = 'basic' | 'horiz' | 'vert' | 'durable2' | 'composite';

export type ObstacleState = {
  id: ObstacleId;
  hp: number;
  needs: { h: number; v: number };
};

export type Cell =
  | { kind: 'empty' }
  | { kind: 'block'; pieceId: string }
  | { kind: 'obstacle'; obstacle: ObstacleState };

export type Offset = readonly [number, number];
export type PieceShape = ReadonlyArray<Offset>;

export type PieceDef = {
  id: string;
  size: 1 | 2 | 3 | 4 | 5;
  rotations: PieceShape[];
};

export type ActivePiece = {
  defId: string;
  rotationIdx: number;
};

export type GameState = {
  board: Cell[];
  current: ActivePiece;
  next: [ActivePiece, ActivePiece];
  score: number;
  combo: number;
  highScore: number;
  stage: number;
  isOver: boolean;
  seed: string;
  rngState: number;
};

export type Action =
  | { type: 'place'; row: number; col: number }
  | { type: 'rotate' }
  | { type: 'restart'; seed?: string }
  | { type: 'commitStage' };

export type TurnSummary = {
  linesCleared: number;
  rowsCleared: number[];
  colsCleared: number[];
  obstaclesDestroyed: number;
  scoreGained: number;
  stageCleared: boolean;
};
