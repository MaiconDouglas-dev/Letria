import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LessonPlayer } from '../../src/features/learning/LessonPlayer';
import { getRandomPhrase } from '../../src/features/phrases/phraseBank';
import { buildReviewLesson, selectReviewActivities } from '../../src/features/review/review';
import { useServices } from '../../src/services/ServicesProvider';
import { getLesson, moduleLessonIds } from '../../src/services/content/loader';
import { getActivityStats } from '../../src/services/db/repo';
import type { Lesson } from '../../src/services/content/types';
import { BigButton } from '../../src/shared/components/BigButton';
import { ScreenShell } from '../../src/shared/components/ScreenShell';
import { colors, font, shadows, spacing } from '../../src/shared/theme';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ReviewTab() {
  const { audio, db, fontScale, colors: themeColors, isDark } = useServices();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [inSession, setInSession] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [activityCount, setActivityCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stats = await getActivityStats(db);
        const lessons = moduleLessonIds('module-1')
          .map((id) => getLesson(id))
          .filter((l): l is Lesson => l != null);
        const picked = selectReviewActivities({ lessons, stats });
        if (!mounted) return;
        if (picked.length === 0) {
          setEmpty(true);
          audio.speakPhrase('Ainda não há atividades para revisar. Complete sua primeira lição na Trilha!');
        } else {
          setEmpty(false);
          setActivityCount(picked.length);
          setLesson(buildReviewLesson(shuffle(picked)));
          audio.speakPhrase('Hora de praticar! Revisar o que você já aprendeu fortalece sua leitura.');
        }
      } catch {
        if (mounted) {
          setEmpty(true);
          audio.speakKey('ui/erro-generico');
        }
      }
    })();
    return () => {
      mounted = false;
      audio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (inSession && lesson) {
    return <LessonPlayer lesson={lesson} review onExit={() => setInSession(false)} />;
  }

  return (
    <ScreenShell
      title="Revisar"
      showBack={false}
      speakKey={empty ? 'home/nada-para-revisar' : undefined}
    >
      <View style={styles.center}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? '#064E3B' : themeColors.emeraldLight,
              borderColor: themeColors.emerald,
            },
          ]}
        >
          <Text style={styles.hero}>🔁</Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              { fontSize: font.title * fontScale, color: themeColors.text },
            ]}
          >
            {empty ? 'Nada para revisar ainda' : 'Prática Espaçada'}
          </Text>

          <Text
            style={[
              styles.subtitle,
              { fontSize: font.base * fontScale, color: themeColors.textMuted },
            ]}
          >
            {empty
              ? 'Conclua lições na Trilha para que as palavras aprendidas apareçam aqui para você praticar.'
              : `Temos ${activityCount} atividades preparadas para reforçar o que você aprendeu, sem pressa e no seu ritmo.`}
          </Text>

          <View
            style={[
              styles.quoteBox,
              {
                backgroundColor: themeColors.bgSubtle,
                borderLeftColor: themeColors.emerald,
              },
            ]}
          >
            <Text style={[styles.quoteText, { color: themeColors.text }]}>
              "{empty ? 'Toda jornada começa por um passo.' : getRandomPhrase('acertouReforco')}"
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {empty ? (
            <BigButton
              label="Ir para a Trilha"
              icon="🗺️"
              onPress={() => router.replace('/(tabs)')}
            />
          ) : (
            <BigButton
              label="Iniciar Prática"
              icon="▶"
              onPress={() => setInSession(true)}
              accessibilityHint="Inicia atividades de revisão selecionadas"
            />
          )}
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.emeraldLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.emerald,
    ...shadows.subtle,
  },
  hero: {
    fontSize: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  title: {
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 24,
    fontSize: font.sm,
  },
  quoteBox: {
    marginTop: spacing.xs,
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.emerald,
    width: '100%',
  },
  quoteText: {
    fontSize: font.xs * 1.1,
    fontStyle: 'italic',
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: spacing.xs,
  },
});
