import { Platform } from 'react-native';

export const Palette = {
  primary: '#C8773A',
  primaryPressed: '#A05E28',
  primarySoft: '#F5E6D8',
  cafe: '#5C4A8F',
  puzzle: '#2E7D6B',
  error: '#C0392B',
  success: '#2E7D6B',
  warning: '#BA7517',
  /**
   * Blockmatch board surface — locked to a warm light palette regardless of
   * system color scheme. Empty cells use a slightly darker tint so the grid
   * reads even before any blocks are placed; gridLine sits between the two
   * for hairline separators between cells.
   */
  boardWarm: {
    background: '#FAF7F2',
    emptyTint: '#F0E9DA',
    gridLine: '#E5DCC9',
  },
} as const;

export type ThemePalette = {
  text: string;
  textMuted: string;
  background: string;
  surface: string;
  border: string;
  tint: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  cafeAccent: string;
  puzzleAccent: string;
};

export const Colors: { light: ThemePalette; dark: ThemePalette } = {
  light: {
    text: '#3D3B38',
    textMuted: '#6B6860',
    background: '#FAF7F2',
    surface: '#FFFFFF',
    border: '#D8D4CC',
    tint: Palette.primary,
    icon: '#6B6860',
    tabIconDefault: '#9C9890',
    tabIconSelected: Palette.primary,
    cafeAccent: Palette.cafe,
    puzzleAccent: Palette.puzzle,
  },
  dark: {
    text: '#F0EDE6',
    textMuted: '#B8B4AD',
    background: '#1C1A17',
    surface: '#28251F',
    border: '#3D3A34',
    tint: Palette.primary,
    icon: '#B8B4AD',
    tabIconDefault: '#7A766E',
    tabIconSelected: Palette.primary,
    cafeAccent: '#9080C7',
    puzzleAccent: '#5BB39C',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const Shadow = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const FontFamily = {
  // Loaded via expo-font in app/_layout.tsx
  serif: 'GowunBatang_400Regular',
  serifBold: 'GowunBatang_700Bold',
  sans: 'AstaSans_400Regular',
  sansMedium: 'AstaSans_500Medium',
  sansBold: 'AstaSans_700Bold',
} as const;

export const Typography = {
  display: { fontFamily: FontFamily.serifBold, fontSize: 28, lineHeight: 36 },
  heading1: { fontFamily: FontFamily.serifBold, fontSize: 24, lineHeight: 32 },
  heading2: { fontFamily: FontFamily.serifBold, fontSize: 20, lineHeight: 28 },
  bodyLg: { fontFamily: FontFamily.serif, fontSize: 18, lineHeight: 32 },
  bodyMd: { fontFamily: FontFamily.sans, fontSize: 16, lineHeight: 26 },
  bodySm: { fontFamily: FontFamily.sans, fontSize: 14, lineHeight: 22 },
  labelLg: { fontFamily: FontFamily.sansMedium, fontSize: 14, lineHeight: 18 },
  labelSm: { fontFamily: FontFamily.sansMedium, fontSize: 12, lineHeight: 16 },
  sudokuNum: { fontFamily: FontFamily.sansMedium, fontSize: 20, lineHeight: 20 },
} as const;

// Legacy alias kept so existing template files keep compiling.
export const Fonts = Platform.select({
  ios: {
    sans: FontFamily.sans,
    serif: FontFamily.serif,
    rounded: FontFamily.sans,
    mono: 'ui-monospace',
  },
  default: {
    sans: FontFamily.sans,
    serif: FontFamily.serif,
    rounded: FontFamily.sans,
    mono: 'monospace',
  },
});
