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
  const { audio, db, prefs, setPref, fontScale, themeMode, setThemeMode, colors, isDark } = useServices();
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
        {/* Seletor de Tema Visual: Automático / Claro / Escuro */}
        <View style={[styles.themeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.themeHeader}>
            <Text style={styles.themeIcon}>{isDark ? '🌙' : '☀️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.themeTitle, { color: colors.text, fontSize: font.base * fontScale }]}>
                Tema visual
              </Text>
              <Text style={[styles.themeSubtitle, { color: colors.textMuted }]}>
                {themeMode === 'system' ? 'Acompanha o sistema' : themeMode === 'dark' ? 'Modo escuro' : 'Modo claro'}
              </Text>
            </View>
            <Pressable
              onPress={() => audio.speakPhrase('Escolha o tema visual: automático para acompanhar o aparelho, modo claro ou modo escuro.')}
              accessibilityRole="button"
              accessibilityLabel="Ouvir explicação do tema visual"
              style={styles.explainBtn}
            >
              <Text style={styles.explainIcon}>🔉</Text>
            </Pressable>
          </View>
          <View style={styles.themeOptions}>
            <ThemeChip
              label="Sistema"
              icon="📱"
              selected={themeMode === 'system'}
              onPress={() => {
                setThemeMode('system');
                audio.speakPhrase('Tema definido para acompanhar o sistema.');
              }}
              colors={colors}
            />
            <ThemeChip
              label="Claro"
              icon="☀️"
              selected={themeMode === 'light'}
              onPress={() => {
                setThemeMode('light');
                audio.speakPhrase('Modo claro ativado.');
              }}
              colors={colors}
            />
            <ThemeChip
              label="Escuro"
              icon="🌙"
              selected={themeMode === 'dark'}
              onPress={() => {
                setThemeMode('dark');
                audio.speakPhrase('Modo escuro ativado.');
              }}
              colors={colors}
            />
          </View>
        </View>

        <SettingRow
          icon={soundOn ? '🔊' : '🔇'}
          label="Som"
          value={soundOn}
          fontScale={fontScale}
          explainKey="settings/som"
          onToggle={(v) => toggle(PREF_KEYS.soundOn, v)}
          colors={colors}
        />
        <SettingRow
          icon="🔠"
          label="Letras grandes"
          value={largeText}
          fontScale={fontScale}
          explainKey="settings/letras-grandes"
          onToggle={(v) => toggle(PREF_KEYS.largeText, v)}
          colors={colors}
        />
        <SettingRow
          icon="🐢"
          label="Fala devagar"
          value={slowSpeech}
          fontScale={fontScale}
          explainKey="settings/fala-devagar"
          onToggle={(v) => toggle(PREF_KEYS.slowSpeech, v)}
          colors={colors}
        />
        <SettingRow
          icon="🔁"
          label="Repetir instrução"
          value={autoRepeat}
          fontScale={fontScale}
          explainKey="settings/repetir"
          onToggle={(v) => toggle(PREF_KEYS.autoRepeat, v)}
          colors={colors}
        />

        <Pressable
          onPress={() => audio.speakKey('settings/sem-conta-aviso')}
          accessibilityRole="button"
          accessibilityLabel="Ouvir aviso sobre seu progresso"
          style={styles.notice}
        >
          <Text style={[styles.noticeText, { fontSize: font.base * fontScale * 0.85, color: colors.textMuted }]}>
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

interface ThemeChipProps {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}

function ThemeChip({ label, icon, selected, onPress, colors }: ThemeChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Tema ${label}`}
      style={({ pressed }) => [
        styles.themeChip,
        {
          backgroundColor: selected ? colors.primaryLight : colors.surface,
          borderColor: selected ? colors.primaryAccent : colors.border,
          borderBottomWidth: pressed ? 1.5 : (selected ? 3.5 : 2),
          borderBottomColor: selected ? colors.primaryDark ?? '#0369A1' : colors.border,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
      ]}
    >
      <Text style={styles.themeChipIcon}>{icon}</Text>
      <Text
        style={[
          styles.themeChipLabel,
          {
            color: selected ? colors.primaryAccent : colors.text,
            fontWeight: selected ? '800' : '600',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onToggle,
  fontScale,
  explainKey,
  colors,
}: {
  icon: string;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  fontScale: number;
  explainKey?: string;
  colors: any;
}) {
  const { audio } = useServices();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        onPress={() => onToggle(!value)}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
        style={styles.rowToggle}
      >
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={[styles.rowText, { fontSize: font.lg * fontScale * 0.9, color: colors.text }]}>{label}</Text>
        <View style={[styles.track, { backgroundColor: colors.border }, value && { backgroundColor: colors.success }]}>
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
  list: { gap: spacing.md, flex: 1, justifyContent: 'center' },
  themeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  themeIcon: {
    fontSize: 28,
  },
  themeTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  themeSubtitle: {
    fontSize: font.xs,
    marginTop: 2,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  themeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  themeChipIcon: {
    fontSize: 16,
  },
  themeChipLabel: {
    fontSize: font.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH + 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: spacing.md,
  },
  rowToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH + 10 },
  explainBtn: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  explainIcon: { fontSize: 26 },
  rowIcon: { fontSize: 30 },
  rowText: { flex: 1, fontWeight: '700' },
  track: { width: 56, height: 32, borderRadius: 16, justifyContent: 'center', padding: 3 },
  trackOn: { backgroundColor: colors.success },
  thumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff' },
  thumbOn: { alignSelf: 'flex-end' },
  notice: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: spacing.sm },
  noticeText: { textAlign: 'center' },
  confirmBox: { gap: spacing.md, backgroundColor: colors.errorBg, borderRadius: 16, padding: spacing.md, borderWidth: 2, borderColor: colors.error },
  confirmText: { color: colors.error, fontWeight: '800', textAlign: 'center' },
});
