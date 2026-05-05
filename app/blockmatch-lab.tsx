import { Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScorePanelV2 } from '@/src/components/blockmatch/v2/ScorePanelV2';
import { BoardCanvasV2 } from '@/src/components/blockmatch/v2/canvas/BoardCanvasV2';
import {
  BoardBackground,
  FlatBlockShape,
  ObstacleShape,
} from '@/src/components/blockmatch/v2/canvas/drawers';
import { LineClearPopup } from '@/src/components/blockmatch/v2/overlays/LineClearPopup';
import {
  StageCurtain,
  type CurtainPhase,
} from '@/src/components/blockmatch/v2/overlays/StageCurtain';
import {
  DUR_CURTAIN_CLOSE,
  DUR_CURTAIN_HOLD,
  DUR_CURTAIN_OPEN,
} from '@/src/components/blockmatch/v2/engine/constants';
import { colorForPieceId } from '@/src/lib/blockmatch/colors';
import { piecesBySize } from '@/src/lib/blockmatch/pieces';
import {
  BOARD_CELLS,
  BOARD_SIZE,
  type ActivePiece,
  type Cell,
  type GameState,
  type ObstacleId,
  type TurnSummary,
} from '@/src/lib/blockmatch/types';

/**
 * Dev sandbox for blockmatch animations and visual effects.
 *
 * Routes: `/blockmatch-lab`. Each section renders a real production
 * component (no mocks beyond the inputs they require) so what shows here
 * is exactly what ships. Buttons drive the components' inputs to trigger
 * each animation in isolation, removing the need to play through the game
 * to see a particular tier of praise / curtain phase / score bump.
 *
 * Sections:
 *   1. 칭찬 팝업 — LineClearPopup with 4 tier triggers + combo override
 *   2. 스테이지 커튼 — StageCurtain full-cycle play with stage number
 *   3. 점수 패널 — ScorePanelV2 with isolated bump triggers
 *   4. 라인 제거 — BoardCanvasV2 with row/col/cross clear triggers
 *   5. 장애물 갤러리 — ObstacleShape across all kinds and variants
 *   6. 블록 색 팔레트 — FlatBlockShape swatches per size
 */

export default function BlockMatchLab() {
  const palette = Colors[(useColorScheme() ?? 'light') as 'light' | 'dark'];

  return (
    <>
      <Stack.Screen options={{ title: '블록매치 LAB' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={styles.scroll}
      >
        <PraiseSection />
        <CurtainSection />
        <ScorePanelSection />
        <LineClearSection />
        <ObstacleGallerySection />
        <BlockSwatchSection />
      </ScrollView>
    </>
  );
}

// ---------------------------------------------------------------------------
// 1. Praise popup
// ---------------------------------------------------------------------------

const TIER_LABELS = ['GOOD', 'GREAT', 'EXCELLENT', 'AMAZING'] as const;
const DEMO_BOARD_W = 320;
const DEMO_BOARD_H = 280;
const DEMO_CELL = 32;

function PraiseSection() {
  const [lastTurn, setLastTurn] = useState<TurnSummary | null>(null);
  const [combo, setCombo] = useState(1);
  const counter = useRef(0); // forces a new lastTurn ref on each click

  const trigger = (tier: 0 | 1 | 2 | 3) => {
    counter.current += 1;
    // The popup picks tier from `Math.min(3, max(0, v - 1))` where
    // v = lines >= 2 ? lines : combo. So:
    //   tier 0 (GOOD): lines=1, combo doesn't matter for tier (combo prop
    //                   still drives the "Nx" line below the praise)
    //   tier 1 (GREAT): lines=2
    //   tier 2 (EXCELLENT): lines=3
    //   tier 3 (AMAZING): lines>=4
    const linesCleared = tier === 0 ? 1 : tier + 1;
    setLastTurn({
      linesCleared,
      rowsCleared: [4],
      colsCleared: [],
      obstaclesDestroyed: 0,
      scoreGained: 100,
      stageCleared: false,
    });
  };

  return (
    <Section title="칭찬 팝업">
      <View style={styles.row}>
        {TIER_LABELS.map((label, i) => (
          <SmallButton
            key={label}
            label={label}
            onPress={() => trigger(i as 0 | 1 | 2 | 3)}
          />
        ))}
      </View>
      <View style={[styles.row, { marginTop: Spacing.sm }]}>
        <Text style={styles.metaLabel}>combo:</Text>
        <SmallButton label="−" onPress={() => setCombo((c) => Math.max(1, c - 1))} />
        <Text style={styles.metaValue}>{combo}</Text>
        <SmallButton label="+" onPress={() => setCombo((c) => c + 1)} />
        <SmallButton label="reset" onPress={() => setLastTurn(null)} />
      </View>

      <View style={[styles.demoBox, { width: DEMO_BOARD_W, height: DEMO_BOARD_H }]}>
        <LineClearPopup
          lastTurn={lastTurn}
          combo={combo}
          placedCentroidCol={DEMO_BOARD_W / DEMO_CELL / 2}
          cellSize={DEMO_CELL}
          boardWidth={DEMO_BOARD_W}
          boardHeight={DEMO_BOARD_H}
        />
      </View>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 2. Stage curtain
// ---------------------------------------------------------------------------

function CurtainSection() {
  const [phase, setPhase] = useState<CurtainPhase>('idle');
  const [stage, setStage] = useState(1);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => timersRef.current.forEach(clearTimeout),
    [],
  );

  const playFull = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setPhase('clearing');
    timersRef.current.push(
      setTimeout(() => setPhase('banner'), DUR_CURTAIN_CLOSE),
      setTimeout(
        () => setPhase('spawning'),
        DUR_CURTAIN_CLOSE + DUR_CURTAIN_HOLD,
      ),
      setTimeout(
        () => setPhase('idle'),
        DUR_CURTAIN_CLOSE + DUR_CURTAIN_HOLD + DUR_CURTAIN_OPEN,
      ),
    );
  };

  return (
    <Section title="스테이지 커튼">
      <View style={styles.row}>
        <Text style={styles.metaLabel}>stage:</Text>
        <SmallButton label="−" onPress={() => setStage((s) => Math.max(1, s - 1))} />
        <Text style={styles.metaValue}>{stage}</Text>
        <SmallButton label="+" onPress={() => setStage((s) => s + 1)} />
      </View>
      <View style={[styles.row, { marginTop: Spacing.sm }]}>
        <SmallButton label="play full sequence" onPress={playFull} />
        <SmallButton label="hold: clearing" onPress={() => setPhase('clearing')} />
        <SmallButton label="hold: banner" onPress={() => setPhase('banner')} />
        <SmallButton label="reset" onPress={() => setPhase('idle')} />
      </View>
      <Text style={styles.metaSub}>phase: {phase}</Text>

      <View style={[styles.demoBox, { width: DEMO_BOARD_W, height: DEMO_BOARD_H }]}>
        <Canvas style={{ width: DEMO_BOARD_W, height: DEMO_BOARD_H }}>
          <BoardBackground
            boardCols={10}
            boardRows={10}
            cellSize={DEMO_BOARD_W / 10}
          />
        </Canvas>
        <StageCurtain
          phase={phase}
          clearedStage={stage}
          boardWidth={DEMO_BOARD_W}
          boardHeight={DEMO_BOARD_H}
        />
      </View>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 3. Score panel animations
// ---------------------------------------------------------------------------

function ScorePanelSection() {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [stage, setStage] = useState(1);
  const [highScore, setHighScore] = useState(0);

  const bumpScore = () => {
    setScore((s) => {
      const next = s + 120;
      if (next > highScore) setHighScore(next);
      return next;
    });
  };
  const bumpCombo = () => setCombo((c) => c + 1);
  const bumpStage = () => setStage((s) => s + 1);
  const resetCombo = () => setCombo(0);
  const reset = () => {
    setScore(0);
    setCombo(0);
    setStage(1);
    setHighScore(0);
  };

  return (
    <Section title="점수 패널 애니메이션">
      <View style={styles.row}>
        <SmallButton label="+120 score" onPress={bumpScore} />
        <SmallButton label="combo +1" onPress={bumpCombo} />
        <SmallButton label="combo reset" onPress={resetCombo} />
        <SmallButton label="stage +1" onPress={bumpStage} />
        <SmallButton label="reset all" onPress={reset} />
      </View>

      <ScorePanelV2
        score={score}
        highScore={highScore}
        stage={stage}
        combo={combo}
      />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 4. Line clear animation
// ---------------------------------------------------------------------------

const LINE_CLEAR_BOARD_W = 320;
const LINE_CLEAR_CELL = LINE_CLEAR_BOARD_W / BOARD_SIZE;

function LineClearSection() {
  const [seedTick, setSeedTick] = useState(0);
  const [board, setBoard] = useState<Cell[]>(() => makeFilledBoard());
  const [turn, setTurn] = useState<TurnSummary | null>(null);

  const state = useMemo<GameState>(
    () => makeDemoState(`lab-clear-${seedTick}`, board),
    [seedTick, board],
  );

  const reset = () => {
    setSeedTick((t) => t + 1);
    setBoard(makeFilledBoard());
    setTurn(null);
  };

  const clearRow = (row: number) => {
    setBoard((prev) => withRowEmpty(prev, row));
    setTurn(makeTurn({ rowsCleared: [row] }));
  };

  const clearCol = (col: number) => {
    setBoard((prev) => withColEmpty(prev, col));
    setTurn(makeTurn({ colsCleared: [col] }));
  };

  const clearCross = (row: number, col: number) => {
    setBoard((prev) => withColEmpty(withRowEmpty(prev, row), col));
    setTurn(makeTurn({ rowsCleared: [row], colsCleared: [col] }));
  };

  const clearAll = () => {
    setBoard(() =>
      Array.from({ length: BOARD_CELLS }, () => ({ kind: 'empty' as const })),
    );
    setTurn(
      makeTurn({
        rowsCleared: Array.from({ length: BOARD_SIZE }, (_, r) => r),
      }),
    );
  };

  return (
    <Section title="라인 제거 애니메이션">
      <View style={styles.row}>
        <SmallButton label="row 0" onPress={() => clearRow(0)} />
        <SmallButton label="row 4" onPress={() => clearRow(4)} />
        <SmallButton label="row 9" onPress={() => clearRow(9)} />
        <SmallButton label="col 0" onPress={() => clearCol(0)} />
        <SmallButton label="col 4" onPress={() => clearCol(4)} />
        <SmallButton label="col 9" onPress={() => clearCol(9)} />
      </View>
      <View style={[styles.row, { marginTop: Spacing.sm }]}>
        <SmallButton label="cross (4,4)" onPress={() => clearCross(4, 4)} />
        <SmallButton label="all rows" onPress={clearAll} />
        <SmallButton label="reset board" onPress={reset} />
      </View>

      <View
        style={[
          styles.demoBox,
          { width: LINE_CLEAR_BOARD_W, height: LINE_CLEAR_BOARD_W },
        ]}
      >
        <BoardCanvasV2
          state={state}
          lastTurn={turn}
          cellSize={LINE_CLEAR_CELL}
        />
      </View>
    </Section>
  );
}

function makeFilledBoard(): Cell[] {
  // Diagonal tiling across all 5 piece sizes so each row and column contains
  // a mix of colors — the clear sweep reads as a whole-line wipe rather than
  // a single-color band fading out.
  const ids = ([1, 2, 3, 4, 5] as const).map((s) => piecesBySize(s)[0].id);
  return Array.from({ length: BOARD_CELLS }, (_, i) => {
    const row = Math.floor(i / BOARD_SIZE);
    const col = i % BOARD_SIZE;
    return { kind: 'block' as const, pieceId: ids[(row + col) % ids.length] };
  });
}

function withRowEmpty(board: Cell[], row: number): Cell[] {
  const next = board.slice();
  for (let c = 0; c < BOARD_SIZE; c++) {
    next[row * BOARD_SIZE + c] = { kind: 'empty' };
  }
  return next;
}

function withColEmpty(board: Cell[], col: number): Cell[] {
  const next = board.slice();
  for (let r = 0; r < BOARD_SIZE; r++) {
    next[r * BOARD_SIZE + col] = { kind: 'empty' };
  }
  return next;
}

function makeTurn(p: {
  rowsCleared?: number[];
  colsCleared?: number[];
}): TurnSummary {
  const rowsCleared = p.rowsCleared ?? [];
  const colsCleared = p.colsCleared ?? [];
  return {
    linesCleared: rowsCleared.length + colsCleared.length,
    rowsCleared,
    colsCleared,
    obstaclesDestroyed: 0,
    scoreGained: 0,
    stageCleared: false,
  };
}

function makeDemoState(seed: string, board: Cell[]): GameState {
  const piece: ActivePiece = { defId: piecesBySize(1)[0].id, rotationIdx: 0 };
  return {
    board,
    current: piece,
    next: [piece, piece],
    score: 0,
    combo: 0,
    highScore: 0,
    stage: 1,
    isOver: false,
    seed,
    rngState: 0,
  };
}

// ---------------------------------------------------------------------------
// 5. Obstacles gallery
// ---------------------------------------------------------------------------

const OBS_CELL = 56;

type ObstacleVariant = {
  label: string;
  obstacleId: ObstacleId;
  hp: number;
  needsH: number;
  needsV: number;
};

const OBSTACLE_VARIANTS: ObstacleVariant[] = [
  { label: 'basic', obstacleId: 'basic', hp: 1, needsH: 0, needsV: 0 },
  { label: 'horiz', obstacleId: 'horiz', hp: 1, needsH: 0, needsV: 0 },
  { label: 'vert', obstacleId: 'vert', hp: 1, needsH: 0, needsV: 0 },
  { label: 'durable2 (hp=2)', obstacleId: 'durable2', hp: 2, needsH: 0, needsV: 0 },
  { label: 'durable2 (hp=1)', obstacleId: 'durable2', hp: 1, needsH: 0, needsV: 0 },
  {
    label: 'composite (h+v)',
    obstacleId: 'composite',
    hp: 2,
    needsH: 1,
    needsV: 1,
  },
  {
    label: 'composite (h only)',
    obstacleId: 'composite',
    hp: 1,
    needsH: 1,
    needsV: 0,
  },
  {
    label: 'composite (v only)',
    obstacleId: 'composite',
    hp: 1,
    needsH: 0,
    needsV: 1,
  },
  {
    label: 'composite (none)',
    obstacleId: 'composite',
    hp: 0,
    needsH: 0,
    needsV: 0,
  },
];

function ObstacleGallerySection() {
  return (
    <Section title="장애물 갤러리">
      <View style={styles.gallery}>
        {OBSTACLE_VARIANTS.map((v) => (
          <View key={v.label} style={styles.galleryItem}>
            <Canvas style={{ width: OBS_CELL, height: OBS_CELL }}>
              <Group>
                <ObstacleShape
                  size={OBS_CELL}
                  obstacleId={v.obstacleId}
                  hp={v.hp}
                  needsH={v.needsH}
                  needsV={v.needsV}
                />
              </Group>
            </Canvas>
            <Text style={styles.galleryLabel}>{v.label}</Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 6. Block color palette
// ---------------------------------------------------------------------------

function BlockSwatchSection() {
  const swatches = useMemo(() => {
    const sizes: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];
    return sizes.map((size) => {
      const first = piecesBySize(size)[0];
      return { size, pieceId: first.id, fill: colorForPieceId(first.id) };
    });
  }, []);

  return (
    <Section title="블록 색 팔레트 (사이즈별)">
      <View style={styles.row}>
        {swatches.map((s) => (
          <View key={s.size} style={styles.galleryItem}>
            <Canvas style={{ width: OBS_CELL, height: OBS_CELL }}>
              <Group>
                <FlatBlockShape size={OBS_CELL} fill={s.fill} />
              </Group>
            </Canvas>
            <Text style={styles.galleryLabel}>size {s.size}</Text>
            <Text style={styles.galleryHex}>{s.fill}</Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Shared UI bits
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
    >
      <Text style={styles.btnLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A554D',
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFF8EE',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E5DCC9',
  },
  btnPressed: {
    backgroundColor: '#F0E6D0',
  },
  btnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A554D',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A736B',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5A554D',
    minWidth: 24,
    textAlign: 'center',
  },
  metaSub: {
    fontSize: 11,
    color: '#7A736B',
    fontStyle: 'italic',
  },
  demoBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    position: 'relative',
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  galleryItem: {
    alignItems: 'center',
    gap: 4,
  },
  galleryLabel: {
    fontSize: 11,
    color: '#5A554D',
    fontWeight: '600',
  },
  galleryHex: {
    fontSize: 10,
    color: '#7A736B',
    fontVariant: ['tabular-nums'],
  },
});
