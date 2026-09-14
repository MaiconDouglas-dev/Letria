import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useServices } from '../../src/services/ServicesProvider';
import { ScreenShell } from '../../src/shared/components/ScreenShell';
import { colors, font, MIN_TOUCH, shadows, spacing } from '../../src/shared/theme';

export default function SupportTab() {
  const { audio, fontScale, colors: themeColors, isDark } = useServices();

  async function openWhatsApp(text: string) {
    const encoded = encodeURIComponent(text);
    const appUrl = `whatsapp://send?text=${encoded}`;
    const webUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl);
    }
  }

  function handleEducator() {
    audio.speakPhrase('Abrindo o WhatsApp para conversar com o educador ou suporte do Letria.');
    void openWhatsApp(
      'Olá! Estou usando o aplicativo Letria e gostaria de uma orientação sobre as atividades de leitura.'
    );
  }

  function handleFamily() {
    audio.speakPhrase('Abrindo o WhatsApp para você pedir ajuda a um familiar ou amigo.');
    void openWhatsApp(
      'Oi! Estou praticando minha leitura no aplicativo Letria e gostaria de uma ajudinha com uma palavra. Pode me ajudar?'
    );
  }

  function handleShare() {
    audio.speakPhrase('Compartilhando sua conquista no WhatsApp com quem você ama!');
    void openWhatsApp(
      'Olha só que notícia boa! Hoje pratiquei no aplicativo Letria e aprendi novas palavras. Ler é um novo começo! 🎉'
    );
  }

  return (
    <ScreenShell title="Apoio e Família" showBack={false}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Banner do Hub */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View
            style={[
              styles.whatsappIconBg,
              { backgroundColor: isDark ? '#064E3B' : themeColors.whatsappBg },
            ]}
          >
            <Text style={styles.whatsappIcon}>💬</Text>
          </View>
          <View style={styles.bannerText}>
            <Text
              style={[
                styles.bannerTitle,
                { fontSize: font.lg * fontScale, color: themeColors.text },
              ]}
            >
              Você não está sozinho
            </Text>
            <Text
              style={[
                styles.bannerSubtitle,
                { fontSize: font.sm * fontScale, color: themeColors.textMuted },
              ]}
            >
              Aprender com apoio de quem a gente gosta fica ainda melhor. Toque em qualquer opção para usar o WhatsApp.
            </Text>
          </View>
        </View>

        {/* Lista de Ações de Apoio */}
        <View style={styles.cardsContainer}>
          {/* Ação 1: Educador / Mentor */}
          <Pressable
            onPress={handleEducator}
            accessibilityRole="button"
            accessibilityLabel="Falar com Educador pelo WhatsApp"
            style={({ pressed }) => [
              styles.actionCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
              pressed && { backgroundColor: themeColors.bgSubtle },
            ]}
          >
            <View
              style={[
                styles.actionIconBg,
                { backgroundColor: isDark ? '#064E3B' : themeColors.whatsappBg },
              ]}
            >
              <Text style={styles.actionEmoji}>🧑‍🏫</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text
                style={[
                  styles.actionTitle,
                  { fontSize: font.base * 0.9 * fontScale, color: themeColors.text },
                ]}
              >
                Falar com Educador / Suporte
              </Text>
              <Text style={[styles.actionDesc, { color: themeColors.textMuted }]}>
                Tire dúvidas sobre as lições diretamente com nossa equipe voluntária.
              </Text>
            </View>
            <Text style={[styles.chevron, { color: themeColors.textLight }]}>→</Text>
          </Pressable>

          {/* Ação 2: Ajuda de Familiar ou Amigo */}
          <Pressable
            onPress={handleFamily}
            accessibilityRole="button"
            accessibilityLabel="Pedir ajuda a um familiar pelo WhatsApp"
            style={({ pressed }) => [
              styles.actionCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
              pressed && { backgroundColor: themeColors.bgSubtle },
            ]}
          >
            <View
              style={[
                styles.actionIconBg,
                { backgroundColor: isDark ? '#1E293B' : themeColors.wordsBg },
              ]}
            >
              <Text style={styles.actionEmoji}>🤝</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text
                style={[
                  styles.actionTitle,
                  { fontSize: font.base * 0.9 * fontScale, color: themeColors.text },
                ]}
              >
                Pedir ajuda a familiar ou amigo
              </Text>
              <Text style={[styles.actionDesc, { color: themeColors.textMuted }]}>
                Manda uma mensagem carinhosa já pronta para seu filho, neto ou amigo te ajudar.
              </Text>
            </View>
            <Text style={[styles.chevron, { color: themeColors.textLight }]}>→</Text>
          </Pressable>

          {/* Ação 3: Compartilhar Conquistas */}
          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar minhas conquistas no WhatsApp"
            style={({ pressed }) => [
              styles.actionCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
              pressed && { backgroundColor: themeColors.bgSubtle },
            ]}
          >
            <View
              style={[
                styles.actionIconBg,
                { backgroundColor: isDark ? '#78350F' : themeColors.starsBg },
              ]}
            >
              <Text style={styles.actionEmoji}>🎉</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text
                style={[
                  styles.actionTitle,
                  { fontSize: font.base * 0.9 * fontScale, color: themeColors.text },
                ]}
              >
                Compartilhar meu orgulho
              </Text>
              <Text style={[styles.actionDesc, { color: themeColors.textMuted }]}>
                Envie no grupo da família ou para amigos que você está avançando na leitura!
              </Text>
            </View>
            <Text style={[styles.chevron, { color: themeColors.textLight }]}>→</Text>
          </Pressable>
        </View>

        {/* Dica de Segurança e Dignidade */}
        <View
          style={[
            styles.safetyBox,
            {
              backgroundColor: themeColors.bgSubtle,
              borderColor: themeColors.borderLight,
            },
          ]}
        >
          <Text style={styles.safetyIcon}>🔒</Text>
          <Text style={[styles.safetyText, { color: themeColors.textMuted }]}>
            O Letria não acessa seus contatos nem lê suas mensagens. O WhatsApp só abre quando você toca para enviar.
          </Text>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  banner: {
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
  whatsappIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.whatsappBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappIcon: { fontSize: 24 },
  bannerText: { flex: 1 },
  bannerTitle: { fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  bannerSubtitle: { color: colors.textMuted, marginTop: 2, lineHeight: 18, fontSize: font.xs * 1.1 },
  cardsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    minHeight: MIN_TOUCH + 16,
    ...shadows.subtle,
  },
  actionCardPressed: {
    backgroundColor: colors.bgSubtle,
    transform: [{ scale: 0.99 }],
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: { fontSize: 22 },
  actionInfo: { flex: 1 },
  actionTitle: { fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  actionDesc: { fontSize: font.xs, color: colors.textMuted, marginTop: 2, lineHeight: 17 },
  chevron: { fontSize: 18, fontWeight: '700', color: colors.textLight },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSubtle,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  safetyIcon: { fontSize: 18 },
  safetyText: { flex: 1, fontSize: font.xs, color: colors.textMuted, fontWeight: '600', lineHeight: 18 },
});
