import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useServices } from '../../services/ServicesProvider';
import { colors, font, MIN_TOUCH, shadows, spacing } from '../theme';

interface Props {
  /** Título visual da tela. */
  title?: string;
  /** Chave de áudio que explica a tela (tocada pelo botão ouvir no topo). */
  speakKey?: string;
  children: React.ReactNode;
  /** Mostra botão voltar no rodapé (padrão: sim quando há histórico). */
  showBack?: boolean;
  /** Ação customizada para o botão voltar. */
  onBack?: () => void;
  /** Cor de fundo da página (padrão: página neutra da marca). */
  bgColor?: string;
  /** Ações customizadas no canto superior direito do cabeçalho. */
  actions?: React.ReactNode;
  /** Cabeçalho customizado completo (substitui o cabeçalho padrão). */
  customHeader?: React.ReactNode;
  /** Oculta o cabeçalho padrão. */
  hideHeader?: boolean;
  /** Estilo customizado para a área de conteúdo. */
  bodyStyle?: ViewStyle;
}

/**
 * Casca padrão das telas com design minimalista Apple HIG.
 * Responsiva com largura máxima centralizada para iPads e telas maiores.
 */
export function ScreenShell({
  title,
  speakKey,
  children,
  showBack = true,
  onBack,
  bgColor,
  actions,
  customHeader,
  hideHeader = false,
  bodyStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const { audio, fontScale, colors: themeColors, isDark } = useServices();
  const currentColors = themeColors ?? colors;

  return (
    <View style={[styles.root, { backgroundColor: bgColor ? bgColor : currentColors.bg }]}>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + spacing.xs,
            paddingBottom: insets.bottom + spacing.xs,
          },
        ]}
      >
        {customHeader ? (
          customHeader
        ) : hideHeader ? null : (
          <View style={styles.header}>
            {speakKey ? (
              <Pressable
                onPress={() => audio.speakKey(speakKey)}
                accessibilityRole="button"
                accessibilityLabel="Ouvir explicação desta tela"
                style={({ pressed }) => [
                  styles.iconBtn,
                  { backgroundColor: currentColors.surface, borderColor: currentColors.border },
                  pressed && styles.iconBtnPressed,
                ]}
              >
                <Text style={styles.icon}>🔊</Text>
              </Pressable>
            ) : (
              <View style={styles.headerPlaceholder} />
            )}

            {title ? (
              <Text style={[styles.title, { fontSize: font.title * 0.75 * fontScale, color: currentColors.text }]} numberOfLines={1}>
                {title}
              </Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <View style={styles.headerRight}>
              {actions}
              <Pressable
                onPress={() => router.push('/help')}
                accessibilityRole="button"
                accessibilityLabel="Ajuda"
                accessibilityHint="Abre a tela de ajuda falada"
                style={({ pressed }) => [
                  styles.iconBtn,
                  styles.helpBtn,
                  { backgroundColor: currentColors.surface, borderColor: currentColors.border },
                  pressed && styles.iconBtnPressed,
                ]}
              >
                <Text style={styles.helpIcon}>❓</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={[styles.body, bodyStyle]}>{children}</View>

        {showBack && (
          <View style={styles.footer}>
            <Pressable
              onPress={onBack ? onBack : () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: currentColors.surface, borderColor: currentColors.border },
                pressed && styles.backBtnPressed,
              ]}
            >
              <Text style={[styles.backLabel, { fontSize: font.base * fontScale, color: currentColors.text }]}>← Voltar</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    minHeight: 52,
  },
  headerPlaceholder: {
    width: 44,
    height: 44,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  iconBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  helpBtn: {
    backgroundColor: colors.surface,
  },
  icon: {
    fontSize: 20,
  },
  helpIcon: {
    fontSize: 18,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  body: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  backBtn: {
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  backBtnPressed: {
    opacity: 0.8,
  },
  backLabel: {
    color: colors.text,
    fontWeight: '700',
  },
});
