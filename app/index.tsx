import { Redirect, router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PREF_KEYS, useServices } from '../src/services/ServicesProvider';
import { BigButton } from '../src/shared/components/BigButton';
import { ScreenShell } from '../src/shared/components/ScreenShell';
import { colors, font, spacing } from '../src/shared/theme';

/** Tela de abertura: primeira execução mostra acolhimento; depois vai direto à home. */
export default function Index() {
  const { audio, prefs } = useServices();

  useEffect(() => {
    audio.speakKey('onboarding/bem-vindo');
    return () => audio.stop();
  }, [audio]);

  if (prefs[PREF_KEYS.onboarded] === '1') return <Redirect href="/home" />;

  return (
    <ScreenShell title="Passo a Palavra" showBack={false}>
      <View style={styles.center}>
        <Text style={styles.hero}>📖</Text>
        <Text style={styles.tagline}>Um passo de cada vez.</Text>
        <View style={styles.col}>
          <BigButton
            label="Ouvir a apresentação"
            icon="🔊"
            variant="secondary"
            onPress={() => audio.speakKey('onboarding/bem-vindo')}
          />
          <BigButton label="Começar" onPress={() => router.push('/onboarding')} accessibilityHint="Inicia a explicação de como usar" />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  hero: { fontSize: 80 },
  tagline: { fontSize: font.xl, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  col: { gap: spacing.md, alignSelf: 'stretch' },
});
