import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Option } from '../../services/content/types';
import { SpeechBalloon } from './SpeechBalloon';
import { colors, font, MIN_TOUCH, spacing } from '../theme';

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
 * Opções como balõezinhos de fala (manual pág. 10): cápsulas coloridas do
 * momento, letra real, 🔉 para ouvir no canto, ✓ no acerto — sem vermelho
 * de punição no erro.
 */
export function OptionGrid({ options, eliminated, selectedId, selectedCorrect, onSelect, onListenOption, fontScale, disabled, fill = '#91C875', border = '#355529' }: Props) {
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
          <View key={o.id} style={{ width: cellW || undefined, opacity: isEliminated ? 0.3 : 1 }}>
            {cellW > 0 && (
              <SpeechBalloon
                fill={fill}
                border={border}
                width={cellW - 14}
                height={o.image ? 128 : 100}
                selected={isSelected}
                badge={badge}
                dimmed={isEliminated}
                onPress={() => onSelect(o)}
                disabled={disabled || isEliminated}
                accessibilityLabel={o.audio ? undefined : o.label}
                accessibilityHint="Toque para escolher esta opção"
              >
                {o.image ? <Text style={styles.emoji}>{o.image}</Text> : null}
                <Text style={[styles.label, { fontSize: (o.image ? font.lg : font.xl) * fontScale, color: colors.text }]}>
                  {o.label}
                </Text>
              </SpeechBalloon>
            )}
            {o.audio && !isEliminated && (
              <Pressable
                onPress={() => onListenOption(o)}
                accessibilityRole="button"
                accessibilityLabel="Ouvir esta opção"
                style={styles.miniListen}
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
  emoji: { fontSize: 44 },
  label: { fontWeight: '900', letterSpacing: 1 },
  miniListen: {
    position: 'absolute',
    bottom: 20,
    right: 14,
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniListenIcon: { fontSize: 26 },
});
