import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useServices } from '../../services/ServicesProvider';
import { colors, font, MIN_TOUCH, spacing } from '../theme';

interface Props {
  /** Título visual da tela. */
  title: string;
  /** Chave de áudio que explica a tela (tocada pelo botão ouvir no topo). */
  speakKey?: string;
  children: React.ReactNode;
  /** Mostra botão voltar no rodapé (padrão: sim quando há histórico). */
  showBack?: boolean;
  /** Cor de fundo da página (padrão: página neutra da marca). */
  bgColor?: string;
}

/**
 * Casca padrão das telas: ajuda sempre no canto superior direito,
 * ouvir sempre no canto superior esquerdo, voltar sempre no rodapé esquerdo.
 * Posições fixas são requisito de UX — não mover sem revisar a especificação.
 */
export function ScreenShell({ title, speakKey, children, showBack = true, bgColor }: Props) {
  const insets = useSafeAreaInsets();
  const { audio, fontScale } = useServices();

  return (
    <View style={[styles.root, bgColor ? { backgroundColor: bgColor } : null, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => speakKey && audio.speakKey(speakKey)}
          accessibilityRole="button"
          accessibilityLabel="Ouvir explicação desta tela"
          style={styles.iconBtn}
        >
          <Text style={styles.icon}>🔊</Text>
        </Pressable>
        <Text style={[styles.title, { fontSize: font.title * fontScale }]} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          onPress={() => router.push('/help')}
          accessibilityRole="button"
          accessibilityLabel="Ajuda"
          accessibilityHint="Abre a tela de ajuda falada"
          style={[styles.iconBtn, styles.helpBtn]}
        >
          <Text style={styles.icon}>❓</Text>
        </Pressable>
      </View>

      <View style={styles.body}>{children}</View>

      <View style={styles.footer}>
        {showBack ? (
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={styles.backBtn}
          >
            <Text style={[styles.backLabel, { fontSize: font.lg * fontScale }]}>⬅️ Voltar</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpBtn: { backgroundColor: colors.help, borderColor: colors.help },
  icon: { fontSize: 28 },
  title: { flex: 1, textAlign: 'center', fontWeight: '800', color: colors.text },
  body: { flex: 1, paddingVertical: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  backBtn: {
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  backLabel: { color: colors.primary, fontWeight: '700' },
});
