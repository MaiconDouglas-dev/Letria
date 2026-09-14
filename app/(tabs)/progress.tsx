import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PHRASE_BANK } from '../../src/features/phrases/phraseBank';
import { useServices } from '../../src/services/ServicesProvider';
import { moduleLessonIds } from '../../src/services/content/loader';
import { countIndependentActivities, getAllLessonProgress, getGamificationStats, type GamificationStats } from '../../src/services/db/repo';
import { ScreenShell } from '../../src/shared/components/ScreenShell';
import { colors, font, shadows, spacing } from '../../src/shared/theme';

const VOCABULARY_WORDS = [
  { word: 'CASA', icon: '🏠', stage: 'Boas-vindas' },
  { word: 'ÔNIBUS', icon: '🚌', stage: 'Boas-vindas' },
  { word: 'CHAVE', icon: '🔑', stage: 'Boas-vindas' },
  { word: 'MAÇÃ', icon: '🍎', stage: 'Boas-vindas' },
  { word: 'BOLA', icon: '⚽', stage: 'Palavras da rua' },
  { word: 'BALA', icon: '🍬', stage: 'Sílabas' },
  { word: 'LATA', icon: '🥫', stage: 'Sílabas' },
  { word: 'MALA', icon: '🧳', stage: 'Novas palavras' },
  { word: 'PARE', icon: '🛑', stage: 'Palavras da rua' },
  { word: 'PATO', icon: '🦆', stage: 'Novas palavras' },
  { word: 'CAFÉ', icon: '☕', stage: 'Novas palavras' },
  { word: 'REMEDIO', icon: '💊', stage: 'Sobrevivência' },
];

export default function ProgressTab() {
  const { audio, db, fontScale, colors, isDark } = useServices();
  const [stats, setStats] = useState<GamificationStats>({
    streakDays: 1,
    wordsLearned: 0,
    stars: 0,
    completedLessons: 0,
  });
  const [independent, setIndependent] = useState(0);

  useEffect(() => {
    let mounted = true;
    audio.speakPhrase('Aqui estão suas conquistas e todas as palavras que você já construiu!');

    void Promise.all([
      getGamificationStats(db),
      countIndependentActivities(db),
      getAllLessonProgress(db),
    ]).then(([s, ind]) => {
      if (!mounted) return;
      setStats(s);
      setIndependent(ind);
    });

    return () => {
      mounted = false;
      audio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio]);

  function speakWord(word: string) {
    audio.speakPhrase(`${word}! Esta palavra agora faz parte do seu repertório.`);
  }

  function speakStat(title: string, desc: string) {
    audio.speakPhrase(`${title}. ${desc}`);
  }

  return (
    <ScreenShell title="Conquistas" showBack={false}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner com Mensagem de Orgulho */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationIcon}>🌱</Text>
          <View style={styles.motivationTextContainer}>
            <Text style={[styles.motivationTitle, { fontSize: font.lg * fontScale }]}>
              Seu esforço importa
            </Text>
            <Text style={[styles.motivationSubtitle, { fontSize: font.sm * fontScale }]}>
              {stats.completedLessons > 0
                ? 'Você está construindo algo novo a cada dia. Seu ritmo é o ritmo certo.'
                : 'Toda jornada começa com o primeiro passo. Vamos praticar juntos!'}
            </Text>
          </View>
        </View>

        {/* Grade de Estatísticas de Gamificação */}
        <View style={styles.grid}>
          {/* Dias Ativos */}
          <Pressable
            onPress={() => speakStat('Ofensiva', `${stats.streakDays} dias praticando com consistência.`)}
            accessibilityRole="button"
            accessibilityLabel={`${stats.streakDays} dias de prática`}
            style={[styles.statCard, { backgroundColor: colors.streakBg }]}
          >
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statNumber, { color: colors.streak }]}>{stats.streakDays}</Text>
            <Text style={styles.statLabel}>Dias Ativos</Text>
          </Pressable>

          {/* Palavras Aprendidas */}
          <Pressable
            onPress={() => speakStat('Palavras', `${stats.wordsLearned} palavras aprendidas no seu vocabulário.`)}
            accessibilityRole="button"
            accessibilityLabel={`${stats.wordsLearned} palavras aprendidas`}
            style={[styles.statCard, { backgroundColor: colors.wordsBg }]}
          >
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={[styles.statNumber, { color: colors.words }]}>{stats.wordsLearned}</Text>
            <Text style={styles.statLabel}>Palavras</Text>
          </Pressable>

          {/* Estrelas */}
          <Pressable
            onPress={() => speakStat('Estrelas', `${stats.stars} estrelas conquistadas pelo seu progresso.`)}
            accessibilityRole="button"
            accessibilityLabel={`${stats.stars} estrelas`}
            style={[styles.statCard, { backgroundColor: colors.starsBg }]}
          >
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={[styles.statNumber, { color: colors.stars }]}>{stats.stars}</Text>
            <Text style={styles.statLabel}>Estrelas</Text>
          </Pressable>

          {/* Lições */}
          <Pressable
            onPress={() => speakStat('Lições', `${stats.completedLessons} de 10 lições concluídas.`)}
            accessibilityRole="button"
            accessibilityLabel={`${stats.completedLessons} lições concluídas`}
            style={[styles.statCard, { backgroundColor: colors.successBg }]}
          >
            <Text style={styles.statEmoji}>🏁</Text>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {stats.completedLessons}/10
            </Text>
            <Text style={styles.statLabel}>Lições</Text>
          </Pressable>
        </View>

        {/* Meu Repertório de Palavras */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: font.title * fontScale * 0.8 }]}>
            Meu Repertório de Palavras
          </Text>
          <Text style={styles.sectionSub}>Toque em qualquer palavra para ouvir o som dela</Text>
        </View>

        <View style={styles.wordsGrid}>
          {VOCABULARY_WORDS.map((item, i) => {
            const unlocked = i < Math.max(4, stats.wordsLearned);
            return (
              <Pressable
                key={item.word}
                onPress={() => unlocked && speakWord(item.word)}
                accessibilityRole="button"
                accessibilityLabel={`Palavra ${item.word}: ${unlocked ? 'desbloqueada' : 'bloqueada'}`}
                style={[
                  styles.wordCard,
                  {
                    backgroundColor: unlocked
                      ? isDark
                        ? colors.surface
                        : '#FFFFFF'
                      : isDark
                        ? '#131B2E'
                        : '#F1F5F9',
                    borderColor: isDark ? colors.borderStrong : colors.border,
                  },
                  !unlocked && styles.wordCardLocked,
                ]}
              >
                <Text style={styles.wordIcon}>{unlocked ? item.icon : '🔒'}</Text>
                <Text
                  style={[
                    styles.wordText,
                    !unlocked && styles.wordTextLocked,
                  ]}
                >
                  {unlocked ? item.word : '••••'}
                </Text>
                {unlocked && <Text style={styles.soundHint}>🔉</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Marco Especial */}
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneIcon}>🏆</Text>
          <View style={styles.milestoneText}>
            <Text style={styles.milestoneTitle}>Marco de Aprendizagem</Text>
            <Text style={styles.milestoneDesc}>
              {stats.completedLessons >= 10
                ? PHRASE_BANK.marcos.cemPalavras
                : stats.completedLessons >= 1
                ? PHRASE_BANK.marcos.primeiraLicao
                : PHRASE_BANK.marcos.primeiraPalavra}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  motivationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  motivationIcon: { fontSize: 32 },
  motivationTextContainer: { flex: 1 },
  motivationTitle: { fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  motivationSubtitle: { color: colors.textMuted, marginTop: 2, lineHeight: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 18,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  statEmoji: { fontSize: 26 },
  statNumber: { fontSize: font.title * 0.9, fontWeight: '900' },
  statLabel: { fontSize: font.xs, fontWeight: '700', color: colors.textMuted },
  sectionHeader: { marginTop: spacing.lg, marginBottom: spacing.xs },
  sectionTitle: { fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  sectionSub: { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    minHeight: 48,
    ...shadows.subtle,
  },
  wordCardLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: colors.borderLight,
    opacity: 0.6,
  },
  wordIcon: { fontSize: 18 },
  wordText: { fontSize: font.sm, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  wordTextLocked: { color: colors.textLight },
  soundHint: { fontSize: 13, marginLeft: 2, opacity: 0.5 },
  milestoneCard: {
    backgroundColor: colors.emeraldLight,
    borderRadius: 20,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.emerald,
    ...shadows.subtle,
  },
  milestoneIcon: { fontSize: 30 },
  milestoneText: { flex: 1 },
  milestoneTitle: { fontSize: font.xs, fontWeight: '800', color: colors.emeraldDark, letterSpacing: 0.5 },
  milestoneDesc: { fontSize: font.sm, fontWeight: '700', color: colors.text, marginTop: 2, lineHeight: 20 },
});
