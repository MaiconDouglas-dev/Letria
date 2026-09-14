import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useServices } from '../../services/ServicesProvider';
import { colors as defaultColors, font, MIN_TOUCH, shadows, spacing } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  /** Ícone emoji ou símbolo à esquerda do texto. */
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'help';
  disabled?: boolean;
  accessibilityHint?: string;
  /** Cor de destaque customizada (ex: cor da etapa) */
  customColor?: string;
  customBevelColor?: string;
}

/**
 * Botão 3D Tátil estilo Apple & Duolingo com a identidade da Letria:
 * Possui chanfro inferior com sensação física de clique mecânico.
 */
export function BigButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  accessibilityHint,
  customColor,
  customBevelColor,
}: Props) {
  let themeColors = defaultColors;
  let isDark = false;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const s = useServices();
    if (s?.colors) themeColors = s.colors;
    if (s?.isDark !== undefined) isDark = s.isDark;
  } catch {
    // fallback
  }

  let bg = '#059669'; // Letria Emerald
  let bevelColor = '#047857';
  let borderColor = 'rgba(255, 255, 255, 0.15)';
  let fg = '#FFFFFF';

  if (disabled) {
    bg = isDark ? '#1E293B' : '#E2E8F0';
    bevelColor = isDark ? '#0F172A' : '#CBD5E1';
    borderColor = isDark ? '#334155' : '#CBD5E1';
    fg = isDark ? '#64748B' : '#94A3B8';
  } else if (customColor) {
    bg = customColor;
    bevelColor = customBevelColor ?? customColor;
  } else if (variant === 'primary') {
    bg = '#059669';
    bevelColor = '#047857';
    borderColor = 'rgba(255, 255, 255, 0.2)';
    fg = '#FFFFFF';
  } else if (variant === 'secondary') {
    bg = isDark ? '#1E293B' : '#FFFFFF';
    bevelColor = isDark ? '#0B0F17' : '#CBD5E1';
    borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0';
    fg = isDark ? '#F8FAFC' : '#0F172A';
  } else if (variant === 'danger') {
    bg = '#EF4444';
    bevelColor = '#B91C1C';
    borderColor = 'rgba(255, 255, 255, 0.2)';
    fg = '#FFFFFF';
  } else if (variant === 'help') {
    bg = '#F59E0B';
    bevelColor = '#D97706';
    borderColor = 'rgba(255, 255, 255, 0.2)';
    fg = '#FFFFFF';
  }

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
        {
          backgroundColor: bg,
          borderColor,
          borderBottomColor: bevelColor,
          borderBottomWidth: pressed && !disabled ? 2 : 5,
          transform: [{ translateY: pressed && !disabled ? 3 : 0 }],
        },
      ]}
    >
      <Text style={styles.label} maxFontSizeMultiplier={1.5}>
        {icon ? `${icon}  ` : ''}
        <Text style={{ color: fg }}>{label}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderBottomWidth: 5,
    width: '100%',
    ...shadows.subtle,
  },
  label: {
    fontSize: font.base * 1.05,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});

