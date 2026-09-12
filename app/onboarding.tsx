import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PREF_KEYS, useServices } from '../src/services/ServicesProvider';
import { BigButton } from '../src/shared/components/BigButton';
import { ScreenShell } from '../src/shared/components/ScreenShell';
import { colors, font, spacing } from '../src/shared/theme';

const STEPS = [
  { key: 'onboarding/passo-1', emoji: '🔊', caption: 'Toque no alto-falante para ouvir' },
  { key: 'onboarding/passo-2', emoji: '❓', caption: 'O botão amarelo é a ajuda' },
  { key: 'onboarding/passo-3', emoji: '👆', caption: 'Toque nas figuras para responder' },
] as const;

/** Tutorial falado em 3 passos — nenhum texto precisa ser lido. */
export default function Onboarding() {
  const { audio, setPref } = useServices();
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  useEffect(() => {
    audio.speakKey(current.key);
    return () => audio.stop();
  }, [audio, current.key]);

  const next = () => {
    if (last) {
      setPref(PREF_KEYS.onboarded, '1');
      router.replace('/home');
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <ScreenShell title="Como usar" speakKey={current.key}>
      <View style={styles.center}>
        <Text style={styles.hero}>{current.emoji}</Text>
        <Text style={styles.caption}>{current.caption}</Text>
        <Text style={styles.stepIndicator}>
          {step + 1} de {STEPS.length}
        </Text>
        <View style={styles.col}>
          <BigButton label="Ouvir de novo" icon="🔊" variant="secondary" onPress={() => audio.speakKey(current.key)} />
          <BigButton label={last ? 'Começar' : 'Próximo'} onPress={next} />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  hero: { fontSize: 88 },
  caption: { fontSize: font.lg, color: colors.text, fontWeight: '600', textAlign: 'center', maxWidth: 420 },
  stepIndicator: { fontSize: font.base, color: colors.textMuted },
  col: { gap: spacing.md, alignSelf: 'stretch' },
});
