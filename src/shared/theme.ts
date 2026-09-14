/**
 * Tema Letria — Design System Apple Minimalista & Gradiente Oficial
 * Baseado na identidade visual da marca Letria:
 * - Gradiente vibrante: Esmeralda (#10B981) → Turquesa (#06B6D4) → Azul (#3B82F6) → Roxo (#8B5CF6)
 * - Fundo ultra-limpo no padrão iOS (#F8FAFC) com superfícies táteis puras (#FFFFFF)
 * - Micro-bordas refinadas e sombras difusas suaves
 */

export const lightColors = {
  // Fundos do Sistema Apple
  bg: '#F8FAFC',
  bgSubtle: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceTranslucent: 'rgba(255, 255, 255, 0.88)',
  surfaceElevated: '#FFFFFF',

  // Tipografia Slate de Alta Legibilidade
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',

  // Cores da Marca (Extraídas da Logo)
  emerald: '#10B981',
  emeraldDark: '#059669',
  emeraldLight: '#ECFDF5',

  teal: '#06B6D4',
  tealDark: '#0891B2',
  tealLight: '#ECFEFF',

  blue: '#3B82F6',
  blueDark: '#2563EB',
  blueLight: '#EFF6FF',

  indigo: '#6366F1',
  indigoDark: '#4F46E5',
  indigoLight: '#EEF2FF',

  purple: '#8B5CF6',
  purpleDark: '#7C3AED',
  purpleLight: '#FAF5FF',

  // Ações Principais
  primary: '#0F172A', // Preto titânio Apple para botões principais ou Esmeralda
  primaryAccent: '#10B981',
  primaryLight: '#ECFDF5',

  // Feedback Semântico Acolhedor
  success: '#10B981',
  successBg: '#ECFDF5',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  help: '#F59E0B',
  helpText: '#0F172A',

  // Bordas Sutis Apple
  border: 'rgba(15, 23, 42, 0.08)',
  borderLight: 'rgba(15, 23, 42, 0.04)',
  borderStrong: 'rgba(15, 23, 42, 0.14)',

  // Os 6 Momentos com Gradientes da Marca
  stages: [
    { name: 'Boas-vindas', balao: '#10B981', fundo: '#F0FDF4', borda: '#059669', icon: '🌱' },
    { name: 'Palavra geradora', balao: '#06B6D4', fundo: '#ECFEFF', borda: '#0891B2', icon: '💬' },
    { name: 'Sílabas', balao: '#0EA5E9', fundo: '#F0F9FF', borda: '#0284C7', icon: '🧩' },
    { name: 'Novas palavras', balao: '#3B82F6', fundo: '#EFF6FF', borda: '#2563EB', icon: '📖' },
    { name: 'Frase assistida', balao: '#6366F1', fundo: '#EEF2FF', borda: '#4F46E5', icon: '✍️' },
    { name: 'Conquista', balao: '#8B5CF6', fundo: '#FAF5FF', borda: '#7C3AED', icon: '🏆' },
  ],

  // Elementos de Gamificação Minimalistas
  streak: '#F97316',
  streakBg: '#FFF7ED',
  words: '#0EA5E9',
  wordsBg: '#F0F9FF',
  stars: '#F59E0B',
  starsBg: '#FEFCE8',
  whatsapp: '#22C55E',
  whatsappBg: '#F0FDF4',
};

export const darkColors = {
  // Fundos do Sistema Apple Dark Mode (OLED)
  bg: '#0B0F17',
  bgSubtle: '#131B2E',
  surface: '#1E293B',
  surfaceTranslucent: 'rgba(30, 41, 59, 0.88)',
  surfaceElevated: '#283548',

  // Tipografia de Alta Legibilidade no Escuro
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textLight: '#64748B',

  // Cores da Marca (Luminosas no Escuro)
  emerald: '#10B981',
  emeraldDark: '#059669',
  emeraldLight: 'rgba(16, 185, 129, 0.18)',

  teal: '#06B6D4',
  tealDark: '#0891B2',
  tealLight: 'rgba(6, 182, 212, 0.18)',

  blue: '#3B82F6',
  blueDark: '#2563EB',
  blueLight: 'rgba(59, 130, 246, 0.18)',

  indigo: '#6366F1',
  indigoDark: '#4F46E5',
  indigoLight: 'rgba(99, 102, 241, 0.18)',

  purple: '#8B5CF6',
  purpleDark: '#7C3AED',
  purpleLight: 'rgba(139, 92, 246, 0.18)',

  // Ações Principais
  primary: '#10B981',
  primaryAccent: '#10B981',
  primaryLight: 'rgba(16, 185, 129, 0.25)',

  // Feedback Semântico Acolhedor
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.2)',
  error: '#F87171',
  errorBg: 'rgba(239, 68, 68, 0.2)',
  help: '#FBBF24',
  helpText: '#F8FAFC',

  // Bordas Sutis Apple Dark
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.22)',

  // Os 6 Momentos com Fundos Escuros Harmônicos
  stages: [
    { name: 'Boas-vindas', balao: '#10B981', fundo: '#06261A', borda: '#10B981', icon: '🌱' },
    { name: 'Palavra geradora', balao: '#06B6D4', fundo: '#07272F', borda: '#06B6D4', icon: '💬' },
    { name: 'Sílabas', balao: '#0EA5E9', fundo: '#07253B', borda: '#0EA5E9', icon: '🧩' },
    { name: 'Novas palavras', balao: '#3B82F6', fundo: '#0D2147', borda: '#3B82F6', icon: '📖' },
    { name: 'Frase assistida', balao: '#6366F1', fundo: '#181944', borda: '#6366F1', icon: '✍️' },
    { name: 'Conquista', balao: '#8B5CF6', fundo: '#231444', borda: '#8B5CF6', icon: '🏆' },
  ],

  // Elementos de Gamificação Minimalistas
  streak: '#FB923C',
  streakBg: 'rgba(249, 115, 22, 0.18)',
  words: '#38BDF8',
  wordsBg: 'rgba(14, 165, 233, 0.18)',
  stars: '#FBBF24',
  starsBg: 'rgba(245, 158, 11, 0.18)',
  whatsapp: '#22C55E',
  whatsappBg: 'rgba(34, 197, 94, 0.18)',
};

export type ThemeColors = typeof lightColors;

/** Paleta padrão de compatibilidade estática */
export const colors = lightColors;

/** Retorna as cores de acordo com o modo escuro ativo */
export function getThemeColors(isDark: boolean): ThemeColors {
  return isDark ? darkColors : lightColors;
}

export const spacing = {
  xxs: 2,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 44,
};

/** Alvo mínimo de toque WCAG / Apple HIG */
export const MIN_TOUCH = 56;

export const font = {
  xs: 13,
  sm: 15,
  base: 18,
  lg: 22,
  xl: 28,
  title: 32,
  display: 40,
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

/**
 * Sombras Difusas no Padrão Apple HIG
 * Efeito de flutuação suave, sem bordas pesadas
 */
export const shadows = {
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  tactile: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  balloon: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
};
