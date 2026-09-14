import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useServices } from '../../services/ServicesProvider';
import type { Option } from '../../services/content/types';
import { SpeechBalloon } from './SpeechBalloon';
import { colors as defaultColors, font, MIN_TOUCH, shadows, spacing } from '../theme';

interface Props {
  options: Option[];
  /** Ids eliminados por dica — ficam visivelmente desativados. */
  eliminated: string[];
  /** Id selecionado e resultado, para feedback visual (nunca só por cor). */
  selectedId?: string;
  selectedCorrect?: boolean;
  onSelect: (opt: Option) => void;
  /** Toca o áudio da opção — conta como ajuda na tentativa. */
  onListenOption: (opt: Option) => void;
  fontScale: number;
  disabled?: boolean;
  /** Cores do momento da lição (manual pág. 3). Padrão: momento 1. */
  fill?: string;
  border?: string;
}

/**
 * Opções visuais como cápsulas táteis da marca Letria:
 * - Destaque máximo ao pictograma (emoji de ancoragem concreta de 50px)
 * - Letra/palavra em chip contrastante com alta legibilidade
 * - Botão individual de escuta 🔉 tátil e evidente
 */
export function OptionGrid({
  options,
  eliminated,
  selectedId,
  selectedCorrect,
  onSelect,
  onListenOption,
  fontScale,
  disabled,
  fill = '#10B981',
  border = '#059669',
}: Props) {
  let colors = defaultColors;
  let isDark = false;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const s = useServices();
    if (s?.colors) colors = s.colors;
    if (s?.isDark !== undefined) isDark = s.isDark;
  } catch {
    // fallback se fora de provider
  }

  const [gridW, setGridW] = useState(0);
  const cols = 2;
  const cellW = gridW ? (gridW - spacing.md * (cols - 1)) / cols : 0;

  return (
    <View style={styles.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width)}>
      {options.map((o) => {
        const isEliminated = eliminated.includes(o.id);
        const isSelected = selectedId === o.id;
        const badge = isSelected && selectedCorrect === true ? 'check' : isSelected && selectedCorrect === false ? 'speaker' : null;
        return (
          <View key={o.id} style={{ width: cellW || undefined, opacity: isEliminated ? 0.28 : 1 }}>
            {cellW > 0 && (
              <SpeechBalloon
                fill={fill}
                border={border}
                width={cellW - 14}
                height={o.image ? 142 : 104}
                selected={isSelected}
                badge={badge}
                dimmed={isEliminated}
                onPress={() => onSelect(o)}
                disabled={disabled || isEliminated}
                accessibilityLabel={o.audio ? undefined : o.label}
                accessibilityHint="Toque para escolher esta opção"
              >
                <View style={styles.contentWrap}>
                  {o.image ? <Text style={styles.emoji}>{o.image}</Text> : null}
                  <View
                    style={[
                      styles.labelChip,
                      {
                        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.75)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <Text style={[styles.label, { fontSize: (o.image ? font.lg : font.xl) * fontScale, color: colors.text }]}>
                      {o.label}
                    </Text>
                  </View>
                </View>
              </SpeechBalloon>
            )}
            {o.audio && !isEliminated && (
              <Pressable
                onPress={() => onListenOption(o)}
                accessibilityRole="button"
                accessibilityLabel={`Ouvir pronúncia da opção ${o.label}`}
                style={({ pressed }) => [
                  styles.miniListen,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: border,
                    borderBottomWidth: pressed ? 1.5 : 3.5,
                    borderBottomColor: isDark ? '#0F172A' : '#CBD5E1',
                    transform: [{ translateY: pressed ? 2 : 0 }],
                  },
                ]}
              >
                <Text style={styles.miniListenIcon}>🔉</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 2,
  },
  labelChip: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  miniListen: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.tactile,
  },
  miniListenIcon: {
    fontSize: 22,
  },
});
