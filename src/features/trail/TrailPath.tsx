import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useServices } from '../../services/ServicesProvider';
import { colors, font, shadows, spacing } from '../../shared/theme';
import { getTrailStage, getTrailStages, LESSON_TOKENS } from './stages';
import { zigzagOffset, type TrailNode } from './trail';

const NODE_SIZE = 76;
const ROW_H = 130;
const HEADER_H = 92;
const DOT_SIZE = 8;

type Row =
  | { type: 'header'; stageIndex: number; key: string }
  | { type: 'node'; node: TrailNode; zig: number; key: string }
  | { type: 'trophy'; key: string };

interface Props {
  nodes: TrailNode[];
  selectedId: string | null;
  complete: boolean;
  onNodePress: (node: TrailNode) => void;
  onStagePress: (stageIndex: number) => void;
  onTrophyPress: () => void;
}

/**
 * Trilha Gamificada Letria estilo Apple HIG & Duolingo
 * Caminho sinuoso com nós 3D táteis, anéis de foco e banners translúcidos.
 */
export function TrailPath({
  nodes,
  selectedId,
  complete,
  onNodePress,
  onStagePress,
  onTrophyPress,
}: Props) {
  const { colors: themeColors, isDark } = useServices();
  const stages = getTrailStages(isDark);
  const [width, setWidth] = useState(0);
  const span = Math.max(0, width / 2 - 76);
  const centerX = (zig: number) => width / 2 + zig * span;

  const rows: Row[] = [];
  stages.forEach((stage, s) => {
    const stageNodes = nodes.filter((n) => n.stageIndex === s);
    if (!stageNodes.length) return;
    rows.push({ type: 'header', stageIndex: s, key: `h${s}` });
    stageNodes.forEach((node, ni) => {
      const zig = zigzagOffset(ni);
      rows.push({ type: 'node', node, zig, key: node.lessonId });
    });
  });

  if (complete && nodes.length > 0) {
    rows.push({ type: 'trophy', key: 'trophy' });
  }

  if (nodes.length === 0) {
    return null;
  }

  const rowHeight = (r: Row) => (r.type === 'header' ? HEADER_H : ROW_H);

  function connector(rowIdx: number) {
    if (rowIdx === 0) return null;
    const prev = rows[rowIdx - 1];
    if (prev.type === 'node') {
      return { fromX: centerX(prev.zig), dist: ROW_H };
    }
    return null;
  }

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.container}>
      {rows.map((row, i) => {
        if (row.type === 'header') {
          const stage = stages[row.stageIndex] ?? getTrailStage(row.stageIndex, isDark);
          const stageNodes = nodes.filter((n) => n.stageIndex === row.stageIndex);
          const allDone = stageNodes.length > 0 && stageNodes.every((n) => n.state === 'completed');
          const isCurrent = stageNodes.some((n) => n.state === 'current');

          return (
            <Pressable
              key={row.key}
              onPress={() => onStagePress(row.stageIndex)}
              accessibilityRole="button"
              accessibilityLabel={`Momento ${row.stageIndex + 1}: ${stage.name}`}
              style={[styles.headerRow, { height: HEADER_H }]}
            >
              <View
                style={[
                  styles.stageBanner,
                  {
                    backgroundColor: isDark ? colors.surface : '#FFFFFF',
                    borderColor: isDark ? colors.borderStrong : colors.border,
                    borderLeftColor: stage.borda,
                    borderLeftWidth: 4,
                  },
                ]}
              >
                <View style={[styles.stageIconBg, { backgroundColor: stage.fundo }]}>
                  <Text style={styles.stageIcon}>{stage.icon}</Text>
                </View>

                <View style={styles.stageInfo}>
                  <Text style={[styles.stageTag, { color: stage.borda }]}>
                    MOMENTO {row.stageIndex + 1} DE 6
                  </Text>
                  <Text style={[styles.stageTitle, { color: colors.text }]} numberOfLines={1}>
                    {stage.name}
                  </Text>
                </View>

                {allDone ? (
                  <View style={[styles.statusPill, { backgroundColor: colors.successBg }]}>
                    <Text style={[styles.statusText, { color: colors.success }]}>✓ Concluído</Text>
                  </View>
                ) : isCurrent ? (
                  <View style={[styles.statusPill, { backgroundColor: colors.streakBg }]}>
                    <Text style={[styles.statusText, { color: colors.streak }]}>Atual</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        }

        if (row.type === 'trophy') {
          const stage = stages[stages.length - 1];
          const prev = connector(i);
          return (
            <View key={row.key} style={[styles.nodeRow, { height: ROW_H + 30 }]}>
              {prev && <Dots fromX={prev.fromX} toX={width / 2} dist={prev.dist} color={stage.borda} />}
              <View style={{ position: 'absolute', top: ROW_H / 2 - NODE_SIZE / 2, left: width / 2 - NODE_SIZE / 2 }}>
                <Pressable
                  onPress={onTrophyPress}
                  accessibilityRole="button"
                  accessibilityLabel={complete ? 'Troféu conquistado' : 'Troféu final'}
                  style={({ pressed }) => [
                    styles.nodeButton,
                    {
                      width: NODE_SIZE,
                      height: NODE_SIZE,
                      borderRadius: NODE_SIZE / 2,
                      backgroundColor: complete ? '#FEF08A' : isDark ? '#1E293B' : '#F1F5F9',
                      borderColor: complete ? '#EAB308' : isDark ? '#334155' : '#CBD5E1',
                      borderBottomWidth: pressed ? 2 : 5,
                      borderBottomColor: complete ? '#CA8A04' : isDark ? '#0F172A' : '#94A3B8',
                      opacity: complete ? 1 : 0.65,
                      transform: [{ translateY: pressed ? 3 : 0 }],
                    },
                  ]}
                >
                  <Text style={styles.trophyIcon}>{complete ? '🏆' : '⭐'}</Text>
                </Pressable>
              </View>
            </View>
          );
        }

        const { node, zig } = row;
        const stage = stages[node.stageIndex];
        const done = node.state === 'completed';
        const isCurrent = node.state === 'current';
        const isLocked = node.state === 'locked';
        const isSelected = selectedId === node.lessonId;
        const prev = connector(i);

        const nodeBg = isLocked ? (isDark ? '#1E293B' : '#F1F5F9') : stage.balao;
        const nodeBorder = isLocked ? (isDark ? '#334155' : '#CBD5E1') : stage.borda;
        const textColor = isLocked ? (isDark ? '#64748B' : '#94A3B8') : '#FFFFFF';

        return (
          <View key={row.key} style={[styles.nodeRow, { height: ROW_H }]}>
            {prev && <Dots fromX={prev.fromX} toX={centerX(zig)} dist={prev.dist} color={stage.borda} />}

            <View
              style={{
                position: 'absolute',
                top: ROW_H / 2 - NODE_SIZE / 2,
                left: centerX(zig) - NODE_SIZE / 2,
              }}
            >
              {/* Anel Externo de Destaque para Lição Atual */}
              {(isCurrent || isSelected) && (
                <View
                  style={[
                    styles.currentRing,
                    {
                      width: NODE_SIZE + 16,
                      height: NODE_SIZE + 16,
                      borderRadius: (NODE_SIZE + 16) / 2,
                      borderColor: stage.borda,
                    },
                  ]}
                />
              )}

              <Pressable
                onPress={() => onNodePress(node)}
                accessibilityRole="button"
                accessibilityLabel={`Lição ${node.lessonId.replace('lesson-', '')}`}
                accessibilityHint="Toque para ouvir; toque de novo para abrir"
                style={({ pressed }) => [
                  styles.nodeButton,
                  {
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    borderRadius: NODE_SIZE / 2,
                    backgroundColor: nodeBg,
                    borderColor: nodeBorder,
                    borderBottomWidth: isLocked ? 2 : (pressed ? 2 : 6),
                    borderBottomColor: isLocked ? (isDark ? '#334155' : '#CBD5E1') : stage.borda,
                    opacity: isLocked ? 0.7 : 1,
                    transform: [{ translateY: isLocked ? 0 : (pressed ? 4 : 0) }],
                  },
                ]}
              >
                {/* Brilho de Vidro Apple no topo */}
                {!isLocked && <View style={styles.nodeSheen} />}

                {isLocked ? (
                  <Text style={styles.lockIcon}>🔒</Text>
                ) : (
                  <Text style={[styles.token, { color: textColor }]}>
                    {LESSON_TOKENS[node.lessonId] ?? '📖'}
                  </Text>
                )}
              </Pressable>

              {/* Selo de Conclusão ✓ */}
              {done && (
                <View style={[styles.doneBadge, { backgroundColor: colors.success, borderColor: isDark ? colors.surface : '#FFFFFF' }]}>
                  <Text style={styles.doneCheck}>✓</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Pontos do caminho sinuoso fluido no estilo Duolingo */
function Dots({ fromX, toX, dist, color }: { fromX: number; toX: number; dist: number; color?: string }) {
  const dots: { x: number; y: number }[] = [];
  const n = Math.max(3, Math.floor(dist / 14));
  for (let k = 1; k < n; k++) {
    const t = k / n;
    const y = -dist + t * dist;
    if (y > -(dist - 48) && y < -48) {
      dots.push({ x: fromX + (toX - fromX) * t, y });
    }
  }
  return (
    <>
      {dots.map((d, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              left: d.x - DOT_SIZE / 2,
              top: ROW_H / 2 + d.y - DOT_SIZE / 2,
              backgroundColor: color ?? colors.textMuted,
            },
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  stageBanner: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.subtle,
  },
  stageIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIcon: {
    fontSize: 20,
  },
  stageInfo: {
    flex: 1,
  },
  stageTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stageTitle: {
    fontSize: font.sm * 1.05,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  nodeRow: {
    width: '100%',
  },
  currentRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    borderWidth: 3,
    borderStyle: 'dashed',
  },
  nodeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    ...shadows.tactile,
  },
  nodeSheen: {
    position: 'absolute',
    top: 4,
    width: '60%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  token: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lockIcon: {
    fontSize: 24,
    opacity: 0.7,
  },
  trophyIcon: {
    fontSize: 34,
  },
  doneBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 4,
    ...shadows.subtle,
  },
  doneCheck: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    opacity: 0.35,
  },
});
