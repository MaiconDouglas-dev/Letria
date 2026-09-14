import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Text, useColorScheme, View } from 'react-native';

import { AudioController } from './audio/controller';
import type { DbDriver } from './db/driver';
import { openExpoDriver } from './db/expoDriver';
import { migrate } from './db/migrations';
import { getPreference, setPreference } from './db/repo';
import { getThemeColors, type ThemeColors } from '../shared/theme';

export type ThemeMode = 'system' | 'dark' | 'light';

export const PREF_KEYS = {
  onboarded: 'onboarded',
  soundOn: 'soundOn',
  largeText: 'largeText',
  /** Fala devagar: playbackRate 0.8 em todos os áudios. */
  slowSpeech: 'slowSpeech',
  /** Repete a instrução da atividade sozinha, uma vez. */
  autoRepeat: 'autoRepeat',
  /** Modo de tema: 'system' | 'dark' | 'light'. */
  themeMode: 'themeMode',
} as const;

export interface Services {
  audio: AudioController;
  db: DbDriver;
  prefs: Record<string, string>;
  setPref: (key: string, value: string) => void;
  /** true = letras grandes ativas (multiplicador de fonte). */
  fontScale: number;
  /** Modo de tema escolhido ('system' | 'dark' | 'light'). */
  themeMode: ThemeMode;
  /** Se o modo escuro está ativo no momento. */
  isDark: boolean;
  /** Cores ativas (claras ou escuras). */
  colors: ThemeColors;
  /** Atalho para mudar o tema. */
  setThemeMode: (mode: ThemeMode) => void;
}

const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const s = useContext(ServicesContext);
  if (!s) throw new Error('useServices fora de ServicesProvider');
  return s;
}

/** Hook conveniente para componentes consumirem o tema ativo */
export function useTheme() {
  const { colors, isDark, themeMode, setThemeMode } = useServices();
  return { colors, isDark, themeMode, setThemeMode };
}

/**
 * Inicializa serviços do app: banco + migrações, preferências, modo de áudio.
 * Bloqueia a UI até o banco abrir — progresso nunca pode ser salvo em driver inválido.
 */
export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [services, setServices] = useState<Services | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const audioRef = useRef(new AudioController());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await openExpoDriver();
        await migrate(db);
        const entries = await Promise.all(
          Object.values(PREF_KEYS).map(async (k) => [k, (await getPreference(db, k)) ?? ''] as const),
        );
        const prefs = Object.fromEntries(entries);
        const audio = audioRef.current;
        await audio.configure();
        audio.setEnabled(prefs[PREF_KEYS.soundOn] !== '0');
        audio.setRate(prefs[PREF_KEYS.slowSpeech] === '1' ? 0.8 : 1);

        const currentThemePref = (prefs[PREF_KEYS.themeMode] as ThemeMode) || 'system';
        const isDark = currentThemePref === 'dark' || (currentThemePref === 'system' && systemColorScheme === 'dark');
        const activeColors = getThemeColors(isDark);

        if (!cancelled) {
          setServices({
            audio,
            db,
            prefs,
            setPref: (key, value) => {
              void setPreference(db, key, value);
              setServices((s) => {
                if (!s) return s;
                const newPrefs = { ...s.prefs, [key]: value };
                const themePref = (newPrefs[PREF_KEYS.themeMode] as ThemeMode) || 'system';
                const dark = themePref === 'dark' || (themePref === 'system' && systemColorScheme === 'dark');
                return {
                  ...s,
                  prefs: newPrefs,
                  themeMode: themePref,
                  isDark: dark,
                  colors: getThemeColors(dark),
                  fontScale: newPrefs[PREF_KEYS.largeText] === '1' ? 1.35 : 1,
                };
              });
              if (key === PREF_KEYS.soundOn) audio.setEnabled(value !== '0');
              if (key === PREF_KEYS.slowSpeech) audio.setRate(value === '1' ? 0.8 : 1);
            },
            fontScale: prefs[PREF_KEYS.largeText] === '1' ? 1.35 : 1,
            themeMode: currentThemePref,
            isDark,
            colors: activeColors,
            setThemeMode: (mode) => {
              void setPreference(db, PREF_KEYS.themeMode, mode);
              setServices((s) => {
                if (!s) return s;
                const newPrefs = { ...s.prefs, [PREF_KEYS.themeMode]: mode };
                const dark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
                return {
                  ...s,
                  prefs: newPrefs,
                  themeMode: mode,
                  isDark: dark,
                  colors: getThemeColors(dark),
                };
              });
            },
          });
        }
      } catch (e) {
        if (!cancelled) setInitError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [systemColorScheme]);

  // Interrupção: app indo para background pausa a fala; ao voltar não retoma sozinho.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') audioRef.current.stop();
    });
    return () => sub.remove();
  }, []);

  const value = useMemo(() => services, [services]);

  if (initError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 20, textAlign: 'center' }}>
          Não foi possível preparar o aplicativo. Feche e abra de novo.{'\n\n'}
          {initError}
        </Text>
      </View>
    );
  }
  if (!value) return null;
  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}
