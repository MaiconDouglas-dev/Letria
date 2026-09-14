import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useServices } from '../../services/ServicesProvider';
import { colors, font, MIN_TOUCH, shadows, spacing } from '../../shared/theme';

interface TrailHeaderProps {
  streakDays: number;
  wordsLearned: number;
  stars: number;
  onSettingsPress?: () => void;
  onHelpPress?: () => void;
  onListenPress?: () => void;
}

/**
 * Cabeçalho Unificado de Gamificação estilo Apple HIG
 * Mostra a marca Letria, chips foscos com métricas táteis e ações rápidas.
 */
export function TrailHeader({
  streakDays,
  wordsLearned,
  stars,
  onSettingsPress,
  onHelpPress,
  onListenPress,
}: TrailHeaderProps) {
  const { audio, colors: themeColors, isDark } = useServices();
  const colors = themeColors;

  function speakStreak() {
    if (streakDays > 0) {
      audio.speakPhrase(`${streakDays} dias praticando! Seu esforço diário faz toda a diferença.`);
    } else {
      audio.speakPhrase('Pronto para começar seu dia de aprendizado? Um passo de cada vez.');
    }
  }

  function speakWords() {
    audio.speakPhrase(`Você já aprendeu e praticou ${wordsLearned} palavras! Seu repertório está crescendo.`);
  }

  function speakStars() {
    audio.speakPhrase(`Você tem ${stars} estrelas conquistadas pelo seu progresso.`);
  }

  return (
    <View style={styles.container}>
      {/* Marca Letria com Ícone Transparente */}
      <View style={styles.brand}>
        <Image
          source={require('../../../assets/symbol.png')}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel="Símbolo Letria"
        />
        <Text style={[styles.brandName, { color: colors.text }]}>Letria</Text>
      </View>

      {/* Chips Apple de Gamificação */}
      <View style={styles.badges}>
        {/* Dias Ativos / Ofensiva */}
        <Pressable
          onPress={speakStreak}
          accessibilityRole="button"
          accessibilityLabel={`${streakDays} dias de ofensiva`}
          style={({ pressed }) => [
            styles.badge,
            { backgroundColor: colors.streakBg, borderColor: colors.borderLight },
            pressed && styles.badgePressed,
          ]}
        >
          <Text style={styles.badgeIcon}>🔥</Text>
          <Text style={[styles.badgeText, { color: colors.streak }]}>{streakDays}</Text>
        </Pressable>

        {/* Palavras Aprendidas */}
        <Pressable
          onPress={speakWords}
          accessibilityRole="button"
          accessibilityLabel={`${wordsLearned} palavras aprendidas`}
          style={({ pressed }) => [
            styles.badge,
            { backgroundColor: colors.wordsBg, borderColor: colors.borderLight },
            pressed && styles.badgePressed,
          ]}
        >
          <Text style={styles.badgeIcon}>📚</Text>
          <Text style={[styles.badgeText, { color: colors.words }]}>{wordsLearned}</Text>
        </Pressable>

        {/* Estrelas */}
        <Pressable
          onPress={speakStars}
          accessibilityRole="button"
          accessibilityLabel={`${stars} estrelas`}
          style={({ pressed }) => [
            styles.badge,
            { backgroundColor: colors.starsBg, borderColor: colors.borderLight },
            pressed && styles.badgePressed,
          ]}
        >
          <Text style={styles.badgeIcon}>⭐</Text>
          <Text style={[styles.badgeText, { color: colors.stars }]}>{stars}</Text>
        </Pressable>
      </View>

      {/* Ações: Ouvir, Configurações e Ajuda */}
      <View style={styles.actions}>
        {onListenPress && (
          <Pressable
            onPress={onListenPress}
            accessibilityRole="button"
            accessibilityLabel="Ouvir explicação desta tela"
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.badgePressed,
            ]}
          >
            <Text style={styles.actionIcon}>🔊</Text>
          </Pressable>
        )}
        <Pressable
          onPress={onSettingsPress ?? (() => router.push('/settings'))}
          accessibilityRole="button"
          accessibilityLabel="Ajustes"
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.badgePressed,
          ]}
        >
          <Text style={styles.actionIcon}>⚙️</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    minHeight: 52,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  brandName: {
    fontSize: font.lg,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    minHeight: 34,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  badgePressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeText: {
    fontSize: font.xs,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  actionIcon: {
    fontSize: 16,
  },
});
