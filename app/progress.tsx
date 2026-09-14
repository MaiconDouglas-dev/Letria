import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useServices } from '../src/services/ServicesProvider';
import { moduleLessonIds } from '../src/services/content/loader';
import { countIndependentActivities, getAllLessonProgress } from '../src/services/db/repo';
import { ScreenShell } from '../src/shared/components/ScreenShell';
import { colors, font, MIN_TOUCH, spacing } from '../src/shared/theme';

interface ProgressData {
  lessonsDone: number;
  lessonsTotal: number;
  independentActivities: number;
}

/**
 * Progresso sem leitura: números grandes + cada linha toca um áudio
 * com a frase completa ("Você terminou três lições de dez.").
 * Sem ranking, streak ou comparação — só o que a própria pessoa fez.
 */
export default function Progress() {
  const { audio, db, fontScale, colors: themeColors } = useServices();
  const currentColors = themeColors ?? colors;
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await getAllLessonProgress(db);
        const total = moduleLessonIds('module-1');
        const independent = await countIndependentActivities(db);
        if (!mounted) return;
        setData({
          lessonsDone: total.filter((id) => progress.get(id)?.status === 'completed').length,
          lessonsTotal: total.length,
          independentActivities: independent,
        });
        audio.speakKey('progress/explicacao');
      } catch {
        if (mounted) audio.speakKey('ui/erro-generico');
      }
    })();
    return () => {
      mounted = false;
      audio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio]);

  const lessonsKey = `progress/licoes-${Math.min(data?.lessonsDone ?? 0, data?.lessonsTotal ?? 0)}`;
  const starsKey = `progress/estrelas-${Math.min(data?.independentActivities ?? 0, 50)}`;

  return (
    <ScreenShell title="Meu progresso" speakKey="progress/explicacao">
      <View style={styles.list}>
        <StatRow
          icon="🏁"
          label="Lições terminadas"
          value={data ? `${data.lessonsDone} de ${data.lessonsTotal}` : '…'}
          onPress={() => audio.speakKey(lessonsKey)}
          fontScale={fontScale}
          currentColors={currentColors}
        />
        <StatRow
          icon="⭐"
          label="Atividades sem ajuda"
          value={data ? String(data.independentActivities) : '…'}
          onPress={() => audio.speakKey(starsKey)}
          fontScale={fontScale}
          currentColors={currentColors}
        />
        <Text style={[styles.note, { fontSize: font.base * fontScale * 0.85, color: currentColors.textMuted }]}>
          ⭐ conta respostas certas que você deu sem ouvir a palavra e sem dica.
        </Text>
      </View>
    </ScreenShell>
  );
}

function StatRow({
  icon,
  label,
  value,
  onPress,
  fontScale,
  currentColors,
}: {
  icon: string;
  label: string;
  value: string;
  onPress: () => void;
  fontScale: number;
  currentColors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Toque para ouvir.`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: currentColors.surface,
          borderColor: currentColors.border,
          borderBottomWidth: pressed ? 2 : 5,
          borderBottomColor: currentColors.borderDark ?? currentColors.border,
          transform: [{ translateY: pressed ? 3 : 0 }],
        },
      ]}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowTextBox}>
        <Text style={[styles.rowLabel, { fontSize: font.lg * fontScale * 0.85, color: currentColors.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { fontSize: font.xl * fontScale, color: currentColors.text }]}>{value}</Text>
      </View>
      <Text style={styles.rowIcon}>🔉</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH + 40,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowIcon: { fontSize: 40 },
  rowTextBox: { flex: 1 },
  rowLabel: { fontWeight: '700' },
  rowValue: { fontWeight: '900' },
  note: { textAlign: 'center' },
});
