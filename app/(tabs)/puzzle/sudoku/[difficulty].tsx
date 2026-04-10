import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import {
  Colors,
  FontFamily,
  Palette,
  Radius,
  Spacing,
  type ThemePalette,
  Typography,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SudokuBoard } from '@/src/components/SudokuBoard';
import { generatePuzzle, isSolved, N, SIZE } from '@/src/lib/sudoku';
import { clearSession, loadSession, saveSession, type SudokuSession } from '@/src/lib/storage';
import type { SudokuDifficulty } from '@/src/types/db';

const HINTS_PER_GAME = 3;

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function SudokuGameScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { difficulty } = useLocalSearchParams<{ difficulty: SudokuDifficulty }>();
  const diff = (difficulty ?? 'easy') as SudokuDifficulty;

  const [session, setSession] = useState<SudokuSession | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [memoMode, setMemoMode] = useState(false);
  const historyRef = useRef<{ idx: number; prev: number; prevMemo: number[] | undefined }[]>([]);

  useEffect(() => {
    const existing = loadSession(diff);
    if (existing && !existing.completedAt) {
      setSession(existing);
    } else {
      const { grid, solution } = generatePuzzle(diff);
      const fresh: SudokuSession = {
        difficulty: diff,
        puzzle: grid,
        solution,
        state: grid.slice(),
        memo: {},
        hintsLeft: HINTS_PER_GAME,
        errorCount: 0,
        elapsedSeconds: 0,
        startedAt: Date.now(),
        completedAt: null,
      };
      saveSession(fresh);
      setSession(fresh);
    }
  }, [diff]);

  useEffect(() => {
    if (!session || session.completedAt) return;
    const t = setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.completedAt) return prev;
        const next = { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
        saveSession(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [session?.completedAt, session?.difficulty]);

  const update = (mut: (s: SudokuSession) => SudokuSession) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = mut(prev);
      saveSession(next);
      return next;
    });
  };

  const inputDigit = (digit: number) => {
    if (!session || selected == null) return;
    if (session.puzzle[selected] !== 0) return;

    if (memoMode) {
      update((s) => {
        const memo = { ...s.memo };
        const cur = memo[selected] ?? [];
        memo[selected] = cur.includes(digit) ? cur.filter((v) => v !== digit) : [...cur, digit];
        const state = s.state.slice();
        state[selected] = 0;
        return { ...s, memo, state };
      });
      return;
    }

    historyRef.current.push({
      idx: selected,
      prev: session.state[selected],
      prevMemo: session.memo[selected],
    });

    update((s) => {
      const state = s.state.slice();
      state[selected] = digit;
      const memo = { ...s.memo };
      delete memo[selected];
      const wrong = digit !== s.solution[selected];
      const errorCount = wrong ? s.errorCount + 1 : s.errorCount;
      const completed = isSolved(state, s.solution);
      const next: SudokuSession = {
        ...s,
        state,
        memo,
        errorCount,
        completedAt: completed ? Date.now() : null,
      };
      return next;
    });
  };

  const erase = () => {
    if (!session || selected == null) return;
    if (session.puzzle[selected] !== 0) return;
    historyRef.current.push({
      idx: selected,
      prev: session.state[selected],
      prevMemo: session.memo[selected],
    });
    update((s) => {
      const state = s.state.slice();
      state[selected] = 0;
      const memo = { ...s.memo };
      delete memo[selected];
      return { ...s, state, memo };
    });
  };

  const undo = () => {
    const last = historyRef.current.pop();
    if (!last || !session) return;
    update((s) => {
      const state = s.state.slice();
      state[last.idx] = last.prev;
      const memo = { ...s.memo };
      if (last.prevMemo) memo[last.idx] = last.prevMemo;
      else delete memo[last.idx];
      return { ...s, state, memo };
    });
  };

  const useHint = () => {
    if (!session || selected == null) return;
    if (session.hintsLeft <= 0) {
      Alert.alert('힌트 소진', '이번 게임의 힌트를 모두 사용했습니다.');
      return;
    }
    if (session.puzzle[selected] !== 0) return;
    const correct = session.solution[selected];
    historyRef.current.push({
      idx: selected,
      prev: session.state[selected],
      prevMemo: session.memo[selected],
    });
    update((s) => {
      const state = s.state.slice();
      state[selected] = correct;
      const memo = { ...s.memo };
      delete memo[selected];
      const completed = isSolved(state, s.solution);
      return {
        ...s,
        state,
        memo,
        hintsLeft: s.hintsLeft - 1,
        completedAt: completed ? Date.now() : null,
      };
    });
  };

  // Navigate to complete screen when solved.
  useEffect(() => {
    if (session?.completedAt) {
      clearSession(session.difficulty);
      router.replace({
        pathname: '/(tabs)/puzzle/sudoku/complete',
        params: {
          elapsed: String(session.elapsedSeconds),
          errors: String(session.errorCount),
          difficulty: session.difficulty,
        },
      });
    }
  }, [session?.completedAt]);

  const cells = useMemo(() => session?.state ?? new Array(SIZE).fill(0), [session]);

  if (!session) return null;

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <Stack.Screen options={{ title: '스도쿠' }} />
      <View style={styles.statRow}>
        <Stat label="시간" value={fmtTime(session.elapsedSeconds)} palette={palette} />
        <Stat label="오류" value={`${session.errorCount}`} palette={palette} />
        <Stat label="힌트" value={`${session.hintsLeft}`} palette={palette} />
      </View>

      <View style={styles.boardWrap}>
        <SudokuBoard
          puzzle={session.puzzle}
          state={cells}
          memo={session.memo}
          selected={selected}
          onSelect={setSelected}
        />
      </View>

      <View style={styles.actionRow}>
        <ActionBtn label="실행취소" onPress={undo} palette={palette} />
        <ActionBtn label="지우기" onPress={erase} palette={palette} />
        <ActionBtn
          label={`메모 ${memoMode ? 'ON' : 'OFF'}`}
          onPress={() => setMemoMode((m) => !m)}
          palette={palette}
          active={memoMode}
        />
        <ActionBtn label="힌트" onPress={useHint} palette={palette} />
      </View>

      <View style={styles.padRow}>
        {Array.from({ length: 9 }, (_, i) => i + 1).map((d) => (
          <Pressable
            key={d}
            onPress={() => inputDigit(d)}
            style={({ pressed }) => [
              styles.padCell,
              {
                backgroundColor: pressed ? Palette.primarySoft : palette.surface,
                borderColor: palette.border,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: FontFamily.sansMedium,
                fontSize: 24,
                color: palette.text,
              }}
            >
              {d}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: ThemePalette;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[Typography.labelSm, { color: palette.textMuted }]}>{label}</Text>
      <Text style={[Typography.heading2, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

function ActionBtn({
  label,
  onPress,
  palette,
  active,
}: {
  label: string;
  onPress: () => void;
  palette: ThemePalette;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: active ? Palette.primarySoft : palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[Typography.labelSm, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: Spacing.base, gap: Spacing.base },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm },
  boardWrap: { paddingHorizontal: Spacing.xs },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'space-between' },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  padRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'center' },
  padCell: {
    width: '10.5%',
    aspectRatio: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
