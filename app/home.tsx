import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { buildTrail, currentStageIndex, trailComplete, type TrailNode } from '../src/features/trail/trail';
import { lessonTrailKey, STAGE_TOKENS, TRAIL_STAGES } from '../src/features/trail/stages';
import { TrailPath } from '../src/features/trail/TrailPath';
import { useServices } from '../src/services/ServicesProvider';
import { moduleLessonIds } from '../src/services/content/loader';
import { getAllLessonProgress } from '../src/services/db/repo';
import { BigButton } from '../src/shared/components/BigButton';
import { PatternBackground } from '../src/shared/components/PatternBackground';
import { ScreenShell } from '../src/shared/components/ScreenShell';
import { SpeechBalloon } from '../src/shared/components/SpeechBalloon';
import { colors, font, MIN_TOUCH, spacing } from '../src/shared/theme';

/**
 * Sua jornada — página inicial do manual (pág. 4): marcadores dos 6
 * momentos no topo, balão da etapa atual no centro, pergunta falada e
 * botão grande. Abaixo, a trilha completa para rever ou abrir lições.
 * O fundo acompanha o momento atual e fica lilás ao concluir.
 */
export default function Home() {
  const { audio, db, fontScale } = useServices();
  const [nodes, setNodes] = useState<TrailNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let mounted = true;
    audio.speakKey('trail/explicacao');
    void getAllLessonProgress(db).then((map) => {
      if (!mounted) return;
      const done = (id: string) => map.get(id)?.status === 'completed';
      setNodes(buildTrail(moduleLessonIds('module-1'), done));
      setStarted([...map.values()].some((p) => p.status !== 'not_started'));
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
  const stage = TRAIL_STAGES[stageIdx];

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

  /** Estado do marcador de cada momento: feito / atual / futuro. */
  function stageDot(s: number): 'done' | 'current' | 'todo' {
    const inStage = nodes.filter((n) => n.stageIndex === s);
    if (inStage.length && inStage.every((n) => n.state === 'completed')) return 'done';
    if (inStage.some((n) => n.state === 'current')) return 'current';
    return 'todo';
  }

  return (
    <ScreenShell title="Sua jornada" speakKey="trail/explicacao" showBack={false} bgColor={stage.fundo}>
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <PatternBackground />

        {/* Marcadores dos 6 momentos — manual pág. 4 */}
        <View style={styles.dots}>
          {TRAIL_STAGES.map((s, i) => {
            const st = stageDot(i);
            return (
              <Pressable
                key={s.id}
                onPress={() => audio.speakKey(s.speakKey)}
                accessibilityRole="button"
                accessibilityLabel={`Momento ${i + 1}: ${s.name}`}
                style={[styles.dot, st === 'done' && styles.dotDone, st === 'current' && styles.dotCurrent]}
              >
                {st === 'done' ? <Text style={styles.dotCheck}>✓</Text> : st === 'current' ? <View style={styles.dotInner} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* Balão principal da etapa atual */}
        <View style={styles.hero}>
          <SpeechBalloon
            fill={stage.balao}
            border={stage.borda}
            width={250}
            height={150}
            selected
            badge={complete ? 'check' : null}
            onPress={() => current && audio.speakKey(lessonTrailKey(current.lessonId, false))}
            accessibilityLabel={`Momento atual: ${stage.name}`}
          >
            {complete ? (
              <View style={styles.medal}>
                <Text style={styles.medalCheck}>✓</Text>
              </View>
            ) : (
              <Text style={[styles.heroToken, { color: stage.borda, fontSize: (stageIdx >= 3 ? 44 : 56) * fontScale * 0.9 }]}>
                {STAGE_TOKENS[stageIdx]}
              </Text>
            )}
          </SpeechBalloon>
        </View>

        <Text style={[styles.question, { fontSize: font.title * fontScale }]}>
          {complete ? 'Você concluiu!' : started ? 'Vamos continuar?' : 'Vamos começar?'}
        </Text>

        <View style={styles.shortcuts}>
          <Shortcut icon="⭐" label="Progresso" onPress={() => router.push('/progress')} />
          <Shortcut
            icon="🔁"
            label="Revisar"
            onPress={() => (started ? router.push('/review') : audio.speakKey('home/nada-para-revisar'))}
          />
          <Shortcut icon="⚙️" label="Ajustes" onPress={() => router.push('/settings')} />
        </View>

        {/* Trilha completa — balões das lições para ouvir, rever ou abrir */}
        <TrailPath
          nodes={nodes}
          selectedId={selectedId}
          complete={complete}
          onNodePress={onNodePress}
          onStagePress={(s) => audio.speakKey(TRAIL_STAGES[s].speakKey)}
          onTrophyPress={() => audio.speakKey(complete ? 'trail/venceu' : 'trail/trofeu')}
        />
      </ScrollView>

      <View style={styles.cta}>
        {complete ? (
          <BigButton label="Ouvir conquista" icon="▶" onPress={() => audio.speakKey('trail/venceu')} />
        ) : (
          <BigButton
            label={started ? 'Continuar' : 'Começar'}
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

function Shortcut({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.shortcut}>
      <Text style={styles.shortcutIcon}>{icon}</Text>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  dots: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotCurrent: { borderColor: colors.primary, borderWidth: 3 },
  dotCheck: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  dotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  hero: { alignItems: 'center', paddingVertical: spacing.md },
  heroToken: { fontWeight: '900', letterSpacing: 2 },
  medal: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalCheck: { fontSize: 34, fontWeight: '900', color: colors.primary },
  question: { fontWeight: '900', color: colors.text, marginBottom: spacing.sm },
  shortcuts: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  shortcut: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
  },
  shortcutIcon: { fontSize: 22 },
  shortcutLabel: { fontSize: font.base * 0.7, fontWeight: '700', color: colors.text },
  cta: { paddingTop: spacing.sm },
});
