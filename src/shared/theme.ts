/**
 * Tema Letria — Manual de marca "Alfabetização por voz" (pág. 3).
 * Bases fixas: texto #14251F, ação principal #244D3D,
 * superfície #FFFFFF, página neutra #FAF9F6.
 * As cores dos 6 momentos da trilha vivem em features/trail/stages.ts.
 */
export const colors = {
  bg: '#FAF9F6',
  text: '#14251F',
  textMuted: '#45564E',
  primary: '#244D3D',
  primaryDark: '#1A362B',
  help: '#F59E0B',
  helpText: '#14251F',
  success: '#355529',
  successBg: '#EAF3E5',
  error: '#B91C1C',
  errorBg: '#FEE2E2',
  border: '#D8D5CC',
  surface: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

/** Alvo mínimo de toque — manual pede ≥ 56 (acima do mínimo WCAG). */
export const MIN_TOUCH = 56;

export const font = {
  base: 20,
  lg: 26,
  xl: 34,
  title: 30,
};
