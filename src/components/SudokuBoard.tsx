import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamily, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { findConflicts, N } from '@/src/lib/sudoku';

type Props = {
  puzzle: number[];
  state: number[];
  memo: Record<number, number[]>;
  selected: number | null;
  onSelect: (idx: number) => void;
};

export function SudokuBoard({ puzzle, state, memo, selected, onSelect }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const conflicts = useMemo(() => findConflicts(state), [state]);
  const selectedValue = selected != null ? state[selected] : 0;

  return (
    <View style={[styles.board, { borderColor: palette.text }]}>
      {Array.from({ length: N }).map((_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: N }).map((_, c) => {
            const idx = r * N + c;
            const value = state[idx];
            const isFixed = puzzle[idx] !== 0;
            const isSelected = selected === idx;
            const sameRow = selected != null && Math.floor(selected / N) === r;
            const sameCol = selected != null && selected % N === c;
            const sameBox =
              selected != null &&
              Math.floor(Math.floor(selected / N) / 3) === Math.floor(r / 3) &&
              Math.floor((selected % N) / 3) === Math.floor(c / 3);
            const sameValue = selectedValue && value === selectedValue;
            const conflict = conflicts.has(idx);

            const bg = isSelected
              ? Palette.primarySoft
              : sameValue
                ? '#FCEAD8'
                : sameRow || sameCol || sameBox
                  ? scheme === 'dark'
                    ? '#2F2C26'
                    : '#FBF7F0'
                  : palette.surface;

            const borderRight = (c + 1) % 3 === 0 && c !== N - 1 ? 2 : 0.5;
            const borderBottom = (r + 1) % 3 === 0 && r !== N - 1 ? 2 : 0.5;

            return (
              <Pressable
                key={c}
                onPress={() => onSelect(idx)}
                style={[
                  styles.cell,
                  {
                    backgroundColor: bg,
                    borderRightWidth: borderRight,
                    borderBottomWidth: borderBottom,
                    borderColor: palette.text,
                  },
                ]}
              >
                {value !== 0 ? (
                  <Text
                    style={{
                      fontFamily: FontFamily.sansMedium,
                      fontSize: 22,
                      color: conflict
                        ? '#C0392B'
                        : isFixed
                          ? palette.text
                          : Palette.primaryPressed,
                    }}
                  >
                    {value}
                  </Text>
                ) : (
                  <View style={styles.memoGrid}>
                    {Array.from({ length: 9 }).map((_, m) => {
                      const v = m + 1;
                      const present = memo[idx]?.includes(v);
                      return (
                        <Text
                          key={m}
                          style={{
                            width: '33%',
                            textAlign: 'center',
                            fontSize: 9,
                            fontFamily: FontFamily.sans,
                            color: present ? palette.textMuted : 'transparent',
                          }}
                        >
                          {v}
                        </Text>
                      );
                    })}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    aspectRatio: 1,
    borderWidth: 2,
  },
  row: { flex: 1, flexDirection: 'row' },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
});
