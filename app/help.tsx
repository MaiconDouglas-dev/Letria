import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useServices } from '../src/services/ServicesProvider';
import { BigButton } from '../src/shared/components/BigButton';
import { ScreenShell } from '../src/shared/components/ScreenShell';
import { colors, font, spacing } from '../src/shared/theme';

const ITEMS = [
  { icon: '🔊', text: 'Ouvir — repete o que foi dito' },
  { icon: '❓', text: 'Ajuda — esta tela' },
  { icon: '💡', text: 'Dica — uma pista na lição' },
  { icon: '⬅️', text: 'Voltar — tela anterior' },
] as const;

/** Tela de ajuda: explica em áudio e imagem o que cada botão faz. */
export default function Help() {
  const { audio, fontScale } = useServices();

  useEffect(() => {
    audio.speakKey('help/explicacao');
    return () => audio.stop();
  }, [audio]);

  return (
    <ScreenShell title="Ajuda" speakKey="help/explicacao">
      <View style={styles.list}>
        {ITEMS.map((i) => (
          <View key={i.icon + i.text} style={styles.row}>
            <Text style={styles.rowIcon}>{i.icon}</Text>
            <Text style={[styles.rowText, { fontSize: font.base * fontScale }]}>{i.text}</Text>
          </View>
        ))}
        <BigButton label="Ouvir a explicação" icon="🔊" variant="secondary" onPress={() => audio.speakKey('help/explicacao')} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg, justifyContent: 'center', flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  rowIcon: { fontSize: 36 },
  rowText: { color: colors.text, fontWeight: '600', flex: 1 },
});
