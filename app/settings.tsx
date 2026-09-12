import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PREF_KEYS, useServices } from '../src/services/ServicesProvider';
import { eraseAllProgress } from '../src/services/db/repo';
import { BigButton } from '../src/shared/components/BigButton';
import { ScreenShell } from '../src/shared/components/ScreenShell';
import { colors, font, MIN_TOUCH, spacing } from '../src/shared/theme';

/**
 * Ajustes falados: som, letras grandes e apagar progresso.
 * Exclusão exige duas confirmações com aviso em áudio — proteção contra toque acidental.
 */
export default function Settings() {
  const { audio, db, prefs, setPref, fontScale } = useServices();
  const [confirmStep, setConfirmStep] = useState(0);

  const soundOn = prefs[PREF_KEYS.soundOn] !== '0';
  const largeText = prefs[PREF_KEYS.largeText] === '1';
  const slowSpeech = prefs[PREF_KEYS.slowSpeech] === '1';
  const autoRepeat = prefs[PREF_KEYS.autoRepeat] === '1';

  useEffect(() => {
    audio.speakKey('settings/explicacao');
    return () => audio.stop();
  }, [audio]);

  const toggle = (key: string, on: boolean) => setPref(key, on ? '1' : '0');

  const doErase = async () => {
    try {
      await eraseAllProgress(db);
      setConfirmStep(0);
      audio.speakKey('settings/apagado');
      router.replace('/');
    } catch {
      audio.speakKey('ui/erro-generico');
    }
  };

  return (
    <ScreenShell title="Ajustes" speakKey="settings/explicacao">
      <View style={styles.list}>
        <SettingRow
          icon={soundOn ? '🔊' : '🔇'}
          label="Som"
          value={soundOn}
          fontScale={fontScale}
          explainKey="settings/som"
          onToggle={(v) => toggle(PREF_KEYS.soundOn, v)}
        />
        <SettingRow
          icon="🔠"
          label="Letras grandes"
          value={largeText}
          fontScale={fontScale}
          explainKey="settings/letras-grandes"
          onToggle={(v) => toggle(PREF_KEYS.largeText, v)}
        />
        <SettingRow
          icon="🐢"
          label="Fala devagar"
          value={slowSpeech}
          fontScale={fontScale}
          explainKey="settings/fala-devagar"
          onToggle={(v) => toggle(PREF_KEYS.slowSpeech, v)}
        />
        <SettingRow
          icon="🔁"
          label="Repetir instrução"
          value={autoRepeat}
          fontScale={fontScale}
          explainKey="settings/repetir"
          onToggle={(v) => toggle(PREF_KEYS.autoRepeat, v)}
        />

        <Pressable
          onPress={() => audio.speakKey('settings/sem-conta-aviso')}
          accessibilityRole="button"
          accessibilityLabel="Ouvir aviso sobre seu progresso"
          style={styles.notice}
        >
          <Text style={[styles.noticeText, { fontSize: font.base * fontScale * 0.85 }]}>
            ℹ️ Seu progresso fica guardado neste aparelho. Toque para ouvir.
          </Text>
        </Pressable>

        {confirmStep === 0 && (
          <BigButton
            label="Apagar meu progresso"
            icon="🗑️"
            variant="danger"
            onPress={() => {
              setConfirmStep(1);
              audio.speakKey('settings/apagar-aviso-1');
            }}
            accessibilityHint="Pede confirmação antes de apagar"
          />
        )}
        {confirmStep === 1 && (
          <View style={styles.confirmBox}>
            <Text style={[styles.confirmText, { fontSize: font.base * fontScale }]}>
              Isso apaga tudo o que você já fez. Tem certeza?
            </Text>
            <BigButton
              label="Sim, quero apagar"
              variant="danger"
              onPress={() => {
                setConfirmStep(2);
                audio.speakKey('settings/apagar-aviso-2');
              }}
            />
            <BigButton label="Não, voltar" variant="secondary" onPress={() => setConfirmStep(0)} />
          </View>
        )}
        {confirmStep === 2 && (
          <View style={styles.confirmBox}>
            <Text style={[styles.confirmText, { fontSize: font.base * fontScale }]}>
              Última confirmação.
            </Text>
            <BigButton label="Apagar tudo agora" variant="danger" onPress={() => void doErase()} />
            <BigButton label="Não apagar" variant="secondary" onPress={() => setConfirmStep(0)} />
          </View>
        )}
      </View>
    </ScreenShell>
  );
}

function SettingRow({ icon, label, value, onToggle, fontScale, explainKey }: { icon: string; label: string; value: boolean; onToggle: (v: boolean) => void; fontScale: number; explainKey?: string }) {
  const { audio } = useServices();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onToggle(!value)}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
        style={styles.rowToggle}
      >
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={[styles.rowText, { fontSize: font.lg * fontScale * 0.9 }]}>{label}</Text>
        <View style={[styles.track, value && styles.trackOn]}>
          <View style={[styles.thumb, value && styles.thumbOn]} />
        </View>
      </Pressable>
      {explainKey && (
        <Pressable
          onPress={() => audio.speakKey(explainKey)}
          accessibilityRole="button"
          accessibilityLabel={`Ouvir explicação: ${label}`}
          style={styles.explainBtn}
        >
          <Text style={styles.explainIcon}>🔉</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.lg, flex: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH + 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
  },
  rowToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH + 16 },
  explainBtn: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  explainIcon: { fontSize: 26 },
  rowIcon: { fontSize: 34 },
  rowText: { flex: 1, color: colors.text, fontWeight: '700' },
  track: { width: 60, height: 34, borderRadius: 17, backgroundColor: colors.border, justifyContent: 'center', padding: 3 },
  trackOn: { backgroundColor: colors.success },
  thumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff' },
  thumbOn: { alignSelf: 'flex-end' },
  notice: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: spacing.sm },
  noticeText: { color: colors.textMuted, textAlign: 'center' },
  confirmBox: { gap: spacing.md, backgroundColor: colors.errorBg, borderRadius: 16, padding: spacing.md, borderWidth: 2, borderColor: colors.error },
  confirmText: { color: colors.error, fontWeight: '800', textAlign: 'center' },
});
