import { applyPlace, canPlace, canPlaceAnywhere } from './board';
import { generateStage, mulberry32, pickPiece, seedFromString, type Rng } from './generator';
import { clearLines } from './lineClear';
import { getPiece } from './pieces';
import { turnScore } from './score';
import type { Action, ActivePiece, GameState, TurnSummary } from './types';

function makeRng(seed: string): { rng: Rng; seedStr: string } {
  const seedStr = seed || `bm-${Date.now()}`;
  const rng = mulberry32(seedFromString(seedStr));
  return { rng, seedStr };
}

function nextPiece(rng: Rng, stage: number): ActivePiece {
  return pickPiece(rng, stage);
}

export function initialState(seed?: string, stage: number = 1, highScore: number = 0): GameState {
  const { rng, seedStr } = makeRng(seed ?? '');
  const board = generateStage(rng, stage);
  const current = nextPiece(rng, stage);
  const next: [ActivePiece, ActivePiece] = [
    nextPiece(rng, stage),
    nextPiece(rng, stage),
  ];
  return {
    board,
    current,
    next,
    score: 0,
    combo: 0,
    highScore,
    stage,
    isOver: false,
    seed: seedStr,
    rngState: rng.state(),
  };
}

function rngFromState(state: number): Rng {
  return mulberry32(state);
}

export function reduce(state: GameState, action: Action): { state: GameState; turn?: TurnSummary } {
  switch (action.type) {
    case 'rotate': {
      if (state.isOver) return { state };
      const def = getPiece(state.current.defId);
      // No-op for pieces with a single orientation (full rotational symmetry:
      // monomino, 2×2 square, X-pentomino). They have no other rotation to
      // transition to, and animating one would produce a visible wobble — the
      // shape tilts through intermediate angles and lands back where it started,
      // which reads as a flicker.
      if (def.rotations.length <= 1) return { state };
      const nextPieceState: ActivePiece = {
        defId: state.current.defId,
        rotationIdx: state.current.rotationIdx + 1,
      };
      return { state: { ...state, current: nextPieceState } };
    }
    case 'restart': {
      return { state: initialState(action.seed, 1, state.highScore) };
    }
    case 'commitStage': {
      const rng = rngFromState(state.rngState);
      const newStage = state.stage + 1;
      const newBoard = generateStage(rng, newStage);
      return {
        state: {
          ...state,
          board: newBoard,
          stage: newStage,
          rngState: rng.state(),
        },
      };
    }
    case 'place': {
      if (state.isOver) return { state };
      if (!canPlace(state.board, state.current, action.row, action.col)) {
        return { state };
      }

      const obstaclesBefore = state.board.some((c) => c.kind === 'obstacle');

      const placed = applyPlace(state.board, state.current, action.row, action.col);
      const cleared = clearLines(placed);
      const linesCleared = cleared.rowsCleared.length + cleared.colsCleared.length;
      const newCombo = linesCleared > 0 ? state.combo + 1 : 0;
      const gained = turnScore(linesCleared, cleared.obstaclesDestroyed, newCombo);
      const newScore = state.score + gained;

      const obstaclesAfter = cleared.board.some((c) => c.kind === 'obstacle');
      const stageCleared = obstaclesBefore && !obstaclesAfter;

      const rng = rngFromState(state.rngState);
      const newCurrent = state.next[0];
      const newNext: [ActivePiece, ActivePiece] = [
        state.next[1],
        nextPiece(rng, state.stage),
      ];

      const isOver = !stageCleared && !canPlaceAnywhere(cleared.board, newCurrent);

      const turn: TurnSummary = {
        linesCleared,
        rowsCleared: cleared.rowsCleared,
        colsCleared: cleared.colsCleared,
        obstaclesDestroyed: cleared.obstaclesDestroyed,
        scoreGained: gained,
        stageCleared,
      };

      return {
        state: {
          ...state,
          board: cleared.board,
          current: newCurrent,
          next: newNext,
          score: newScore,
          combo: newCombo,
          highScore: Math.max(state.highScore, newScore),
          isOver,
          rngState: rng.state(),
        },
        turn,
      };
    }
  }
}
