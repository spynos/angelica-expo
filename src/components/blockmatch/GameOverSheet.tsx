import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function GameOverSheet({
  visible,
  score,
  highScore,
  isNewHigh,
  onRestart,
  onClose,
}: {
  visible: boolean;
  score: number;
  highScore: number;
  isNewHigh: boolean;
  onRestart: () => void;
  onClose: () => void;
}) {
  const palette = Colors[useColorScheme() ?? 'light'];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
          <Text style={[Typography.heading1, { color: palette.text, textAlign: 'center' }]}>
            게임 종료
          </Text>
          <Text
            style={[
              Typography.bodyMd,
              { color: palette.textMuted, textAlign: 'center', marginTop: Spacing.xs },
            ]}
          >
            {isNewHigh ? '새로운 최고 점수!' : '잠시 숨을 고르세요.'}
          </Text>

          <View style={styles.scoreRow}>
            <ScoreCell label="이번 점수" value={score} palette={palette.text} muted={palette.textMuted} />
            <ScoreCell label="최고 점수" value={highScore} palette={palette.text} muted={palette.textMuted} />
          </View>

          <Pressable
            onPress={onRestart}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: pressed ? Palette.primaryPressed : Palette.primary },
            ]}
          >
            <Text style={[Typography.labelLg, { color: '#fff' }]}>다시하기</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.secondaryBtn}>
            <Text style={[Typography.labelLg, { color: palette.textMuted }]}>퍼즐 홈으로</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ScoreCell({
  label,
  value,
  palette,
  muted,
}: {
  label: string;
  value: number;
  palette: string;
  muted: string;
}) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[Typography.labelSm, { color: muted }]}>{label}</Text>
      <Text style={[Typography.heading2, { color: palette }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.modal,
  },
  scoreRow: {
    flexDirection: 'row',
    marginVertical: Spacing.lg,
  },
  primaryBtn: {
    paddingVertical: Spacing.base,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
});
