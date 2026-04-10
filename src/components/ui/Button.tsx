import { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Palette, Radius, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  leftSlot?: React.ReactNode;
};

export const Button = forwardRef<View, Props>(function Button(
  { label, variant = 'primary', loading, fullWidth = true, leftSlot, disabled, style, ...rest },
  ref,
) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  return (
    <Pressable
      ref={ref}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variant === 'primary' && {
          backgroundColor: pressed ? Palette.primaryPressed : Palette.primary,
        },
        variant === 'secondary' && {
          backgroundColor: pressed ? palette.border : palette.surface,
          borderWidth: 1,
          borderColor: palette.border,
        },
        variant === 'ghost' && {
          backgroundColor: 'transparent',
        },
        (disabled || loading) && { opacity: 0.5 },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {leftSlot ? <View style={styles.left}>{leftSlot}</View> : null}
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : palette.text} />
      ) : (
        <Text
          style={[
            Typography.labelLg,
            { color: variant === 'primary' ? '#fff' : palette.text },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fullWidth: { alignSelf: 'stretch' },
  left: { marginRight: Spacing.xs },
});
