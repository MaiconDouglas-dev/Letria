import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, MIN_TOUCH, spacing } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  /** Ícone emoji à esquerda do texto — placeholder visual até ilustrações reais. */
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'help';
  disabled?: boolean;
  accessibilityHint?: string;
}

/** Botão grande de alta legibilidade — ação principal das telas. */
export function BigButton({ label, onPress, icon, variant = 'primary', disabled, accessibilityHint }: Props) {
  const bg = disabled
    ? colors.border
    : variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.error
        : variant === 'help'
          ? colors.help
          : colors.surface;
  const fg = variant === 'secondary' || variant === 'help' ? colors.helpText : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={styles.label} maxFontSizeMultiplier={1.6}>
        {icon ? `${icon}  ` : ''}
        <Text style={{ color: fg }}>{label}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: MIN_TOUCH + 12,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  label: {
    fontSize: font.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
});
