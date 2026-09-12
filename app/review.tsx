import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LessonPlayer } from '../src/features/learning/LessonPlayer';
import { buildReviewLesson, selectReviewActivities } from '../src/features/review/review';
import { useServices } from '../src/services/ServicesProvider';
import { getLesson, moduleLessonIds } from '../src/services/content/loader';
import { getActivityStats } from '../src/services/db/repo';
import type { Lesson } from '../src/services/content/types';
import { BigButton } from '../src/shared/components/BigButton';
import { ScreenShell } from '../src/shared/components/ScreenShell';
import { colors, font, spacing } from '../src/shared/theme';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Revisão: mistura atividades já tentadas (priorizando as fracas)
 * com itens novos. Sem progresso próprio — as attempts são registradas
 * com os activity_ids reais e alimentam a próxima seleção.
 */
export default function Review() {
  const { audio, db, fontScale } = useServices();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [empty, setEmpty] = useState(false);

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
          audio.speakKey('home/nada-para-revisar');
        } else {
          setLesson(buildReviewLesson(shuffle(picked)));
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

  if (empty) {
    return (
      <ScreenShell title="Revisão" speakKey="home/nada-para-revisar">
        <View style={styles.center}>
          <Text style={styles.hero}>📚</Text>
          <Text style={[styles.text, { fontSize: font.lg * fontScale }]}>
            Ainda não há nada para revisar.
          </Text>
          <BigButton label="Voltar ao início" onPress={() => router.replace('/home')} />
        </View>
      </ScreenShell>
    );
  }

  if (!lesson) {
    return <ScreenShell title="Revisão">{null}</ScreenShell>;
  }

  return <LessonPlayer lesson={lesson} review />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  hero: { fontSize: 72 },
  text: { textAlign: 'center', color: colors.text, fontWeight: '600' },
});
