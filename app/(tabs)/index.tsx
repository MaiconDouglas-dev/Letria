import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { buildTrail, currentStageIndex, trailComplete, type TrailNode } from '../../src/features/trail/trail';
import { getTrailStage, lessonTrailKey, STAGE_TOKENS, TRAIL_STAGES } from '../../src/features/trail/stages';
import { TrailPath } from '../../src/features/trail/TrailPath';
import { TrailHeader } from '../../src/features/trail/TrailHeader';
import { useServices } from '../../src/services/ServicesProvider';
import { moduleLessonIds } from '../../src/services/content/loader';
import { getAllLessonProgress, getGamificationStats, type GamificationStats } from '../../src/services/db/repo';
import { BigButton } from '../../src/shared/components/BigButton';
import { PatternBackground } from '../../src/shared/components/PatternBackground';
import { ScreenShell } from '../../src/shared/components/ScreenShell';
import { SpeechBalloon } from '../../src/shared/components/SpeechBalloon';
import { colors, font, MIN_TOUCH, shadows, spacing } from '../../src/shared/theme';

export default function TrailScreen() {
  const { audio, db, fontScale, colors: themeColors, isDark } = useServices();
  const currentColors = themeColors ?? colors;
  const [nodes, setNodes] = useState<TrailNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [stats, setStats] = useState<GamificationStats>({
    streakDays: 1,
    wordsLearned: 0,
    stars: 0,
    completedLessons: 0,
  });

  useEffect(() => {
    let mounted = true;
    audio.speakKey('trail/explicacao');

    void Promise.all([
      getAllLessonProgress(db),
      getGamificationStats(db),
    ]).then(([map, s]) => {
      if (!mounted) return;
      const done = (id: string) => map.get(id)?.status === 'completed';
      setNodes(buildTrail(moduleLessonIds('module-1'), done));
      setStarted([...map.values()].some((p) => p.status !== 'not_started'));
      setStats(s);
    });

    return () => {
      mounted = false;
      audio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio]);

  const complete = trailComplete(nodes);
  const current = nodes.find((n) => n.state === 'current');
  const stageIdx = complete ? TRAIL_STAGES.length - 1 : currentStageIndex(nodes);
  const stage = getTrailStage(stageIdx, isDark);

  function openLesson(id: string) {
    router.push(`/lesson/${id}`);
  }

  function onNodePress(node: TrailNode) {
    if (node.state === 'locked') {
      setSelectedId(node.lessonId);
      audio.speakKey('trail/fechada');
      return;
    }
    if (selectedId === node.lessonId) {
      openLesson(node.lessonId);
      return;
    }
    setSelectedId(node.lessonId);
    audio.speakKey(lessonTrailKey(node.lessonId, node.state === 'completed'));
  }

  function stageDot(s: number): 'done' | 'current' | 'todo' {
    const inStage = nodes.filter((n) => n.stageIndex === s);
    if (inStage.length && inStage.every((n) => n.state === 'completed')) return 'done';
    if (inStage.some((n) => n.state === 'current')) return 'current';
    return 'todo';
  }

  return (
    <ScreenShell
      showBack={false}
      bgColor={currentColors.bg}
      customHeader={
        <TrailHeader
          streakDays={stats.streakDays}
          wordsLearned={stats.wordsLearned}
          stars={stats.stars}
          onListenPress={() => audio.speakKey('trail/explicacao')}
          onSettingsPress={() => router.push('/settings')}
        />
      }
    >
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Marcadores dos 6 momentos minimalistas */}
        <View style={[styles.dotsCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
          <View style={styles.dots}>
            {TRAIL_STAGES.map((s, i) => {
              const st = stageDot(i);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => audio.speakKey(s.speakKey)}
                  accessibilityRole="button"
                  accessibilityLabel={`Momento ${i + 1}: ${s.name}`}
                  style={[
                    styles.dot,
                    st === 'done' && styles.dotDone,
                    st === 'current' && { borderColor: s.borda, borderWidth: 2.5, backgroundColor: s.fundo },
                  ]}
                >
                  {st === 'done' ? (
                    <Text style={styles.dotCheck}>✓</Text>
                  ) : st === 'current' ? (
                    <View style={[styles.dotInner, { backgroundColor: s.borda }]} />
                  ) : (
                    <Text style={styles.dotNumber}>{i + 1}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Card de Destaque da Etapa Atual (Apple Glass Card) */}
        <View style={styles.heroSection}>
          <Pressable
            onPress={() => current && audio.speakKey(lessonTrailKey(current.lessonId, false))}
            accessibilityRole="button"
            accessibilityLabel={`Momento atual: ${stage.name}`}
            style={({ pressed }) => [
              styles.heroCard,
              {
                backgroundColor: currentColors.surface,
                borderColor: currentColors.border,
                borderLeftColor: stage.borda,
                borderLeftWidth: 4,
              },
              pressed && styles.heroCardPressed,
            ]}
          >
            <View style={styles.heroContent}>
              <View style={[styles.heroBadge, { backgroundColor: stage.fundo }]}>
                <Text style={styles.heroBadgeEmoji}>{stage.icon}</Text>
              </View>

              <View style={styles.heroTextContainer}>
                <Text style={[styles.heroStageTag, { color: stage.borda }]}>
                  MOMENTO {stageIdx + 1} • {stage.name.toUpperCase()}
                </Text>
                <Text style={[styles.heroTitle, { fontSize: font.title * 0.7 * fontScale, color: currentColors.text }]}>
                  {complete
                    ? 'Parabéns! Trilha Concluída'
                    : STAGE_TOKENS[stageIdx]}
                </Text>
                <Text style={[styles.heroSub, { color: currentColors.textMuted }]}>
                  {complete
                    ? 'Você completou todas as lições!'
                    : 'Toque para ouvir a explicação desta etapa'}
                </Text>
              </View>

              <View style={[styles.heroActionCircle, { backgroundColor: stage.fundo }]}>
                <Text style={styles.heroActionIcon}>🔊</Text>
              </View>
            </View>
          </Pressable>
        </View>

        <Text style={[styles.question, { fontSize: font.lg * fontScale, color: currentColors.text }]}>
          {complete ? '🎉 Parabéns pela conquista!' : started ? 'Continue de onde parou' : 'Vamos começar sua jornada'}
        </Text>

        {/* Trilha Sinuosa estilo Duolingo */}
        <TrailPath
          nodes={nodes}
          selectedId={selectedId}
          complete={complete}
          onNodePress={onNodePress}
          onStagePress={(s) => audio.speakKey(TRAIL_STAGES[s].speakKey)}
          onTrophyPress={() => audio.speakKey(complete ? 'trail/venceu' : 'trail/trofeu')}
        />
      </ScrollView>

      {/* Botão de Ação Rápida no Rodapé */}
      <View style={styles.cta}>
        {complete ? (
          <BigButton label="Ouvir conquista" icon="▶" onPress={() => audio.speakKey('trail/venceu')} />
        ) : (
          <BigButton
            label={started ? 'Continuar aprendendo' : 'Começar'}
            icon="▶"
            onPress={() => current && openLesson(current.lessonId)}
            disabled={!current}
            accessibilityHint="Abre sua próxima lição"
          />
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  dotsCard: {
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dotCheck: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  dotInner: { width: 8, height: 8, borderRadius: 4 },
  dotNumber: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  heroSection: {
    paddingVertical: spacing.xs,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  heroCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeEmoji: {
    fontSize: 24,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroStageTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  heroSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  heroActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionIcon: {
    fontSize: 16,
  },
  question: {
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  cta: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: 'transparent',
  },
});
