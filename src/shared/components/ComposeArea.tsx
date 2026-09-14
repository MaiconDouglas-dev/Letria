import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useServices } from '../../services/ServicesProvider';
import { SpeechBalloon } from './SpeechBalloon';
import { colors as defaultColors, font, MIN_TOUCH, spacing } from '../theme';

interface Props {
  /** Peças disponíveis (necessárias + distratores), já embaralhadas. */
  pieces: string[];
  /** Índices de `pieces` já usados, na ordem escolhida. */
  assembledIdx: number[];
  /** Índice temporariamente marcado como errado (feedback visual + sonoro). */
  wrongIdx?: number;
  /** Peças desativadas por dica. */
  eliminatedIdx: number[];
  onTapPiece: (pieceIndex: number) => void;
  /** Remove a última peça montada. */
  onUndo: () => void;
  fontScale: number;
  disabled?: boolean;
  /** Cores do momento da lição (manual pág. 3). Padrão: momento 1. */
  fill?: string;
  border?: string;
}

/** Largura do balão por peça: 88–112 px conforme a sílaba (manual pág. 5). */
function pieceWidth(p: string): number {
  return Math.min(140, Math.max(96, 56 + p.length * 24));
}

/**
 * Montar palavra por toque: peças-balão na base, encaixe no topo.
 * Peça errada ganha selo "ouvir de novo" e volta — sem vermelho de punição.
 */
export function ComposeArea({ pieces, assembledIdx, wrongIdx, eliminatedIdx, onTapPiece, onUndo, fontScale, disabled, fill = '#91C875', border = '#355529' }: Props) {
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

  const used = new Set(assembledIdx);
  return (
    <View style={styles.root}>
      {/* Área de montagem: mostra o que já foi encaixado */}
      <View style={[styles.assembled, { backgroundColor: themeColors.surface, borderColor: isDark ? themeColors.borderStrong : themeColors.border }]}>
        {assembledIdx.length === 0 ? (
          <Text style={[styles.placeholder, { fontSize: font.base * fontScale, color: themeColors.textMuted }]}>Toque nas partes em ordem</Text>
        ) : (
          assembledIdx.map((pi, pos) => (
            <View key={`${pi}-${pos}`} style={[styles.slot, { backgroundColor: fill, borderColor: border }]}>
              <Text style={[styles.slotText, { fontSize: font.xl * fontScale, color: themeColors.text }]}>{pieces[pi]}</Text>
            </View>
          ))
        )}
        {assembledIdx.length > 0 && (
          <Pressable
            onPress={onUndo}
            accessibilityRole="button"
            accessibilityLabel="Apagar última parte"
            style={styles.undo}
          >
            <Text style={[styles.undoIcon, { color: themeColors.textMuted }]}>⌫</Text>
          </Pressable>
        )}
      </View>

      {/* Peças disponíveis para encaixar */}
      <View style={styles.piecesRow}>
        {pieces.map((piece, i) => {
          const isUsed = used.has(i);
          const isWrong = wrongIdx === i;
          const isEliminated = eliminatedIdx.includes(i);
          if (isUsed || isEliminated) return null;

          return (
            <SpeechBalloon
              key={`${piece}-${i}`}
              width={pieceWidth(piece)}
              height={88}
              badge={isWrong ? 'speaker' : null}
              dimmed={isUsed || isEliminated}
              onPress={() => onTapPiece(i)}
              disabled={disabled || isUsed || isEliminated}
              accessibilityLabel={`Parte ${piece}`}
              accessibilityHint={isWrong ? 'Ouvir de novo' : 'Encaixar na palavra'}
              fill={fill}
              border={border}
            >
              <Text style={[styles.pieceText, { fontSize: font.xl * fontScale, color: themeColors.text }]}>
                {piece}
              </Text>
            </SpeechBalloon>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg, flex: 1, justifyContent: 'center' },
  assembled: {
    minHeight: MIN_TOUCH * 1.8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: defaultColors.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: defaultColors.border,
    borderStyle: 'dashed',
    padding: spacing.md,
  },
  placeholder: { color: defaultColors.textMuted, fontWeight: '600' },
  slot: {
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: { fontWeight: '900' },
  undo: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  undoIcon: { fontSize: 30, color: defaultColors.textMuted },
  piecesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' },
  pieceText: { fontWeight: '900' },
});
