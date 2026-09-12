import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

import { LessonPlayer } from '../../src/features/learning/LessonPlayer';
import { useServices } from '../../src/services/ServicesProvider';
import { getLesson } from '../../src/services/content/loader';
import { BigButton } from '../../src/shared/components/BigButton';
import { ScreenShell } from '../../src/shared/components/ScreenShell';
import { colors, font, spacing } from '../../src/shared/theme';
import { router } from 'expo-router';

/** Rota /lesson/<id> — resolve a lição do registro de conteúdo. */
export default function LessonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { audio, fontScale } = useServices();
  const lesson = typeof id === 'string' ? getLesson(id) : null;

  useEffect(() => {
    if (!lesson) audio.speakKey('lesson/carregando-erro');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lesson) {
    return (
      <ScreenShell title="Lição">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
          <Text style={{ fontSize: 56 }}>⚠️</Text>
          <Text style={{ fontSize: font.lg * fontScale, color: colors.text, textAlign: 'center' }}>
            Não consegui abrir esta lição.
          </Text>
          <BigButton label="Voltar" onPress={() => router.replace('/home')} />
        </View>
      </ScreenShell>
    );
  }

  return <LessonPlayer lesson={lesson} />;
}
