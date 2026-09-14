import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useServices } from '../../services/ServicesProvider';
import { colors as defaultColors, shadows } from '../theme';

export type BalloonBadge = 'check' | 'speaker' | 'lock';

interface Props {
  /** Preenchimento — cor principal ou fundo. */
  fill: string;
  /** Contorno — cor de destaque da borda. */
  border: string;
  width: number;
  height: number;
  /** Anel de foco / seleção. */
  selected?: boolean;
  /** Selo no canto superior direito (acerto ✓ / ouvir / fechado). */
  badge?: BalloonBadge | null;
  /** Apagado — lição fechada ou peça eliminada. */
  dimmed?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  children?: React.ReactNode;
}

const BADGE_ICON: Record<BalloonBadge, string> = { check: '✓', speaker: '🔉', lock: '🔒' };

/**
 * Cápsula Tátil no padrão Apple HIG.
 * Superfície limpa com cantos arredondados, toque tátil e sombra difusa.
 */
export function SpeechBalloon({
  fill,
  border,
  width,
  height,
  selected,
  badge,
  dimmed,
  onPress,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  children,
}: Props) {
  let colors = defaultColors;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const s = useServices();
    if (s?.colors) colors = s.colors;
  } catch {
    // fallback se renderizado fora do provider (ex: testes unitários)
  }

  const isInteractive = !!onPress && !disabled;

  return (
    <View style={{ width: width + 8, height: height + 8, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={[
          styles.outerRing,
          {
            width: width + 8,
            height: height + 8,
            borderRadius: Math.min(28, (height + 8) / 2),
            borderColor: selected ? border : 'transparent',
          },
        ]}
      >
        <Pressable
          onPress={onPress}
          disabled={disabled || !onPress}
          accessibilityRole={isInteractive ? 'button' : undefined}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={({ pressed }) => [
            styles.card,
            {
              width,
              height,
              borderRadius: Math.min(24, height / 2),
              backgroundColor: fill,
              borderColor: border,
              borderBottomWidth: isInteractive ? (pressed ? 2 : 5) : 1.5,
              opacity: dimmed ? 0.45 : 1,
              transform: [{ translateY: pressed && isInteractive ? 2 : 0 }],
            },
          ]}
        >
          {/* Reflexo sutil de vidro Apple no topo */}
          <View style={[styles.sheen, { width: width * 0.6 }]} />
          {children}
        </Pressable>

        {badge && (
          <View
            style={[
              styles.badge,
              {
                borderColor: border,
                backgroundColor: badge === 'check' ? colors.success : colors.surface,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: badge === 'check' ? '#FFFFFF' : colors.text, fontSize: 13 }]}>
              {BADGE_ICON[badge]}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerRing: {
    borderWidth: 2.5,
    padding: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.card,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    ...shadows.subtle,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
});
