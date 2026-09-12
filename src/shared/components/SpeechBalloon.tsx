import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

export type BalloonBadge = 'check' | 'speaker' | 'lock';

interface Props {
  /** Preenchimento — cor "balão" do momento (manual pág. 3). */
  fill: string;
  /** Contorno — cor "borda" do momento. */
  border: string;
  width: number;
  height: number;
  /** Anel externo de 3 px separado por 3 px de branco (estado "Selecionado"). */
  selected?: boolean;
  /** Selo no canto superior direito (manual pág. 5: acerto ✓ / ouvir / fechado). */
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
 * Balão de fala da marca Letria: cápsula com cantos amplos, ponta curva
 * embaixo, luz suave no topo e sombra difusa (manual, págs. 1 e 5).
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
  const body = (
    <View style={{ width: width + 12, height: height + 26, alignItems: 'center' }}>
      <View
        style={[
          styles.ring,
          {
            width: width + 12,
            height: height + 12,
            borderRadius: (height + 12) / 2,
            borderColor: selected ? border : 'transparent',
          },
        ]}
      >
        {/* ponta do balão — fica atrás da cápsula */}
        <View
          style={[
            styles.tail,
            {
              top: height - 14,
              left: width * 0.32,
              backgroundColor: fill,
              borderColor: border,
            },
          ]}
        />
        <Pressable
          onPress={onPress}
          disabled={disabled || !onPress}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          style={({ pressed }) => [
            styles.capsule,
            {
              width,
              height,
              borderRadius: height / 2,
              backgroundColor: fill,
              borderColor: border,
              opacity: dimmed ? 0.55 : pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={[styles.highlight, { width: width * 0.34 }]} />
          {children}
        </Pressable>
        {badge && (
          <View style={[styles.badge, { borderColor: border, backgroundColor: badge === 'check' ? colors.primary : '#FFFFFF' }]}>
            <Text style={[styles.badgeText, badge !== 'check' && { fontSize: 14 }]}>{BADGE_ICON[badge]}</Text>
          </View>
        )}
      </View>
    </View>
  );
  return body;
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 3,
    padding: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    alignItems: 'center',
  },
  capsule: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Sombra difusa do manual: 0 6px 16px rgba(20,37,31,0.16)
    shadowColor: '#14251F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  highlight: {
    position: 'absolute',
    top: 10,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  tail: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    zIndex: -1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  badgeText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});
