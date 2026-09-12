import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SpeechBalloon } from '../../shared/components/SpeechBalloon';
import { colors, font, spacing } from '../../shared/theme';
import { LESSON_TOKENS, TRAIL_STAGES } from './stages';
import { zigzagOffset, type TrailNode } from './trail';

/** Balões de lição: mínimo 112×88 do manual (pág. 5) para caber palavras. */
const BW = 118;
const BH = 88;
const ROW_H = 138;
const HEADER_H = 84;
const DOT = 8;

type Row =
  | { type: 'header'; stageIndex: number; key: string }
  | { type: 'node'; node: TrailNode; zig: number; key: string }
  | { type: 'trophy'; key: string };

interface Props {
  nodes: TrailNode[];
  /** Nó selecionado pelo último toque (anel externo). */
  selectedId: string | null;
  complete: boolean;
  onNodePress: (node: TrailNode) => void;
  onStagePress: (stageIndex: number) => void;
  onTrophyPress: () => void;
}

/**
 * Caminho em zigue-zague dos balões de lição, agrupados pelos 6 momentos.
 * Cada balão é uma cápsula de fala com a letra da lição — manual, págs. 5 e 10.
 */
export function TrailPath({ nodes, selectedId, complete, onNodePress, onStagePress, onTrophyPress }: Props) {
  const [width, setWidth] = useState(0);
  const span = Math.max(0, width / 2 - 96);
  const centerX = (zig: number) => width / 2 + zig * span;

  const rows: Row[] = [];
  TRAIL_STAGES.forEach((stage, s) => {
    const stageNodes = nodes.filter((n) => n.stageIndex === s);
    if (!stageNodes.length) return;
    rows.push({ type: 'header', stageIndex: s, key: `h${s}` });
    stageNodes.forEach((node) => {
      rows.push({ type: 'node', node, zig: zigzagOffset(nodes.indexOf(node)), key: node.lessonId });
    });
  });
  rows.push({ type: 'trophy', key: 'trophy' });

  const rowHeight = (r: Row) => (r.type === 'header' ? HEADER_H : ROW_H);
  function connector(rowIdx: number) {
    for (let i = rowIdx - 1; i >= 0; i--) {
      if (rows[i].type !== 'node') continue;
      const prev = rows[i] as Extract<Row, { type: 'node' }>;
      let dist = 0;
      for (let j = i; j < rowIdx; j++) dist += rowHeight(rows[j]);
      return { fromX: centerX(prev.zig), dist };
    }
    return null;
  }

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {rows.map((row, i) => {
        if (row.type === 'header') {
          const stage = TRAIL_STAGES[row.stageIndex];
          return (
            <Pressable
              key={row.key}
              onPress={() => onStagePress(row.stageIndex)}
              accessibilityRole="button"
              accessibilityLabel={`Momento ${row.stageIndex + 1}: ${stage.name}`}
              style={[styles.headerRow, { height: HEADER_H }]}
            >
              <View style={[styles.stagePill, { backgroundColor: '#FFFFFF', borderColor: stage.borda }]}>
                <Text style={[styles.stageText, { color: stage.borda }]}>
                  {stage.icon}  Momento {row.stageIndex + 1} · {stage.name}
                </Text>
              </View>
            </Pressable>
          );
        }
        if (row.type === 'trophy') {
          const stage = TRAIL_STAGES[TRAIL_STAGES.length - 1];
          const prev = connector(i);
          return (
            <View key={row.key} style={[styles.nodeRow, { height: ROW_H + 20 }]}>
              {prev && <Dots fromX={prev.fromX} toX={width / 2} dist={prev.dist} />}
              <View style={{ position: 'absolute', top: ROW_H / 2 - (BH + 26) / 2, left: width / 2 - (BW + 12) / 2 }}>
                <SpeechBalloon
                  fill={complete ? stage.balao : stage.fundo}
                  border={stage.borda}
                  width={BW}
                  height={BH}
                  selected={complete}
                  badge={complete ? 'check' : 'lock'}
                  dimmed={!complete}
                  onPress={onTrophyPress}
                  accessibilityLabel={complete ? 'Troféu conquistado' : 'Troféu ainda fechado'}
                >
                  <Text style={styles.trophyIcon}>🏆</Text>
                </SpeechBalloon>
              </View>
            </View>
          );
        }
        const { node, zig } = row;
        const stage = TRAIL_STAGES[node.stageIndex];
        const done = node.state === 'completed';
        const ring = node.state === 'current' || selectedId === node.lessonId;
        const prev = connector(i);
        return (
          <View key={row.key} style={[styles.nodeRow, { height: ROW_H }]}>
            {prev && <Dots fromX={prev.fromX} toX={centerX(zig)} dist={prev.dist} />}
            <View style={{ position: 'absolute', top: ROW_H / 2 - (BH + 26) / 2, left: centerX(zig) - (BW + 12) / 2 }}>
              <SpeechBalloon
                fill={node.state === 'locked' ? stage.fundo : stage.balao}
                border={stage.borda}
                width={BW}
                height={BH}
                selected={ring}
                badge={done ? 'check' : node.state === 'locked' ? 'lock' : null}
                dimmed={node.state === 'locked'}
                onPress={() => onNodePress(node)}
                accessibilityLabel={`Lição ${node.lessonId.replace('lesson-', '')}`}
                accessibilityHint="Toque para ouvir; toque de novo para abrir"
              >
                <Text style={[styles.token, { color: stage.borda }]}>
                  {LESSON_TOKENS[node.lessonId] ?? '📚'}
                </Text>
              </SpeechBalloon>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Pontos do caminho entre dois balões — interpola a curva do zigue-zague. */
function Dots({ fromX, toX, dist }: { fromX: number; toX: number; dist: number }) {
  const dots: { x: number; y: number }[] = [];
  const n = Math.max(2, Math.floor(dist / 18));
  for (let k = 1; k < n; k++) {
    const t = k / n;
    const y = -dist + t * dist;
    if (y > -(dist - 64) && y < -64) {
      dots.push({ x: fromX + (toX - fromX) * t, y });
    }
  }
  return (
    <>
      {dots.map((d, i) => (
        <View
          key={i}
          style={[styles.dot, { left: d.x - DOT / 2, top: ROW_H / 2 + d.y - DOT / 2 }]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: { justifyContent: 'center', alignItems: 'center' },
  stagePill: {
    borderRadius: 28,
    borderWidth: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 56,
    justifyContent: 'center',
  },
  stageText: { fontSize: font.base, fontWeight: '800' },
  nodeRow: { width: '100%' },
  token: { fontSize: 30, fontWeight: '900', letterSpacing: 1 },
  trophyIcon: { fontSize: 40 },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.textMuted,
    opacity: 0.35,
  },
});
