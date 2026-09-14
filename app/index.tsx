import { Redirect, router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { PREF_KEYS, useServices } from '../src/services/ServicesProvider';
import { BigButton } from '../src/shared/components/BigButton';
import { Logo } from '../src/shared/components/Logo';
import { ScreenShell } from '../src/shared/components/ScreenShell';
import { spacing } from '../src/shared/theme';

/** Tela de abertura: primeira execução mostra acolhimento; depois vai direto à Trilha. */
export default function Index() {
  const { audio, prefs } = useServices();

  useEffect(() => {
    audio.speakPhrase('Bem-vindo ao Letria. Ler é um novo começo. Toque no botão grande para começar.');
    return () => audio.stop();
  }, [audio]);

  if (prefs[PREF_KEYS.onboarded] === '1') return <Redirect href="/(tabs)" />;

  return (
    <ScreenShell showBack={false}>
      <View style={styles.center}>
        <Logo size={150} showTagline />
        <View style={styles.col}>
          <BigButton
            label="Ouvir a apresentação"
            icon="🔊"
            variant="secondary"
            onPress={() =>
              audio.speakPhrase('Bem-vindo ao Letria. Aqui você aprende a ler e escrever sem pressa, no seu próprio ritmo.')
            }
          />
          <BigButton
            label="Começar"
            onPress={() => router.push('/onboarding')}
            accessibilityHint="Inicia a explicação de como usar o aplicativo"
          />
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
    gap: spacing.xl,
  },
  col: {
    gap: spacing.md,
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
