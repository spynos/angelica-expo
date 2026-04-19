import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';

import { FontFamily } from '@/constants/theme';

import { DUR_CURTAIN_CLOSE, DUR_CURTAIN_OPEN } from '../engine/constants';

const CURTAIN_DARK = '#7A3C18';  // warm amber chestnut
const CURTAIN_MID = '#E8A850';   // warm spring apricot-gold

const EASING = Easing.inOut(Easing.cubic);

export type CurtainPhase = 'idle' | 'clearing' | 'banner' | 'spawning';

export function StageCurtain({
  phase,
  clearedStage,
  boardWidth,
  boardHeight,
}: {
  phase: CurtainPhase;
  clearedStage: number;
  boardWidth: number;
  boardHeight: number;
}) {
  const panelH = boardHeight / 2;

  const topY = useSharedValue(-panelH);
  const bottomY = useSharedValue(panelH);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    switch (phase) {
      case 'clearing':
        topY.value = -panelH;
        bottomY.value = panelH;
        textOpacity.value = 0;
        topY.value = withTiming(0, { duration: DUR_CURTAIN_CLOSE, easing: EASING });
        bottomY.value = withTiming(0, { duration: DUR_CURTAIN_CLOSE, easing: EASING });
        break;
      case 'banner':
        textOpacity.value = withTiming(1, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        });
        break;
      case 'spawning':
        textOpacity.value = withTiming(0, { duration: 180 });
        topY.value = withTiming(-panelH, { duration: DUR_CURTAIN_OPEN, easing: EASING });
        bottomY.value = withTiming(panelH, { duration: DUR_CURTAIN_OPEN, easing: EASING });
        break;
      case 'idle':
        topY.value = -panelH;
        bottomY.value = panelH;
        textOpacity.value = 0;
        break;
    }
    // panelH intentionally omitted — stable after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const topStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: topY.value }],
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomY.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View
      style={[styles.wrap, { width: boardWidth, height: boardHeight }]}
      pointerEvents="none"
    >
      {/* Top panel — slides down from above */}
      <Animated.View
        style={[styles.panel, { top: 0, width: boardWidth, height: panelH }, topStyle]}
      >
        <Canvas style={{ width: boardWidth, height: panelH }}>
          <Rect x={0} y={0} width={boardWidth} height={panelH}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, panelH)}
              colors={[CURTAIN_DARK, CURTAIN_MID]}
            />
          </Rect>
        </Canvas>
      </Animated.View>

      {/* Bottom panel — slides up from below */}
      <Animated.View
        style={[styles.panel, { top: panelH, width: boardWidth, height: panelH }, bottomStyle]}
      >
        <Canvas style={{ width: boardWidth, height: panelH }}>
          <Rect x={0} y={0} width={boardWidth} height={panelH}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, panelH)}
              colors={[CURTAIN_MID, CURTAIN_DARK]}
            />
          </Rect>
        </Canvas>
      </Animated.View>

      {/* STAGE X CLEAR! text — centered on the seam */}
      <Animated.View style={[styles.textOverlay, textStyle]} pointerEvents="none">
        <Text style={styles.stageLabel}>STAGE</Text>
        <Text style={styles.stageNumber}>{clearedStage}</Text>
        <Text style={styles.clearText}>CLEAR!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  panel: {
    position: 'absolute',
    left: 0,
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  stageLabel: {
    fontFamily: FontFamily.serif,
    fontSize: 22,
    color: 'rgba(255, 234, 200, 0.75)',
    letterSpacing: 6,
  },
  stageNumber: {
    fontFamily: FontFamily.serifBold,
    fontSize: 80,
    lineHeight: 88,
    color: '#FFF4E0',
  },
  clearText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 28,
    color: '#F9C840',
    letterSpacing: 4,
  },
});
