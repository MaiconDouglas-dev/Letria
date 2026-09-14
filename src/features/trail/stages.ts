/**
 * Os seis momentos da trilha — Manual de marca Letria, página 3.
 * Cada momento tem balão (peça), fundo (página) e borda (contorno/texto).
 */
export interface TrailStage {
  id: string;
  name: string;
  speakKey: string;
  icon: string;
  /** Cor de preenchimento dos balões do momento. */
  balao: string;
  /** Cor de fundo da página quando este é o momento atual. */
  fundo: string;
  /** Cor de borda e texto de apoio do momento. */
  borda: string;
  darkFundo?: string;
  darkBorda?: string;
}

export const TRAIL_STAGES: TrailStage[] = [
  { id: 'boas-vindas', name: 'Boas-vindas', speakKey: 'trail/momento-1', icon: '🌱', balao: '#10B981', fundo: '#F0FDF4', borda: '#059669', darkFundo: '#06261A', darkBorda: '#10B981' },
  { id: 'palavra-geradora', name: 'Palavra geradora', speakKey: 'trail/momento-2', icon: '💬', balao: '#06B6D4', fundo: '#ECFEFF', borda: '#0891B2', darkFundo: '#07272F', darkBorda: '#06B6D4' },
  { id: 'silabas', name: 'Sílabas', speakKey: 'trail/momento-3', icon: '🧩', balao: '#0EA5E9', fundo: '#F0F9FF', borda: '#0284C7', darkFundo: '#07253B', darkBorda: '#0EA5E9' },
  { id: 'novas-palavras', name: 'Novas palavras', speakKey: 'trail/momento-4', icon: '📖', balao: '#3B82F6', fundo: '#EFF6FF', borda: '#2563EB', darkFundo: '#0D2147', darkBorda: '#3B82F6' },
  { id: 'frase-assistida', name: 'Frase assistida', speakKey: 'trail/momento-5', icon: '✍️', balao: '#6366F1', fundo: '#EEF2FF', borda: '#4F46E5', darkFundo: '#181944', darkBorda: '#6366F1' },
  { id: 'conquista', name: 'Conquista', speakKey: 'trail/momento-6', icon: '🏆', balao: '#8B5CF6', fundo: '#FAF5FF', borda: '#7C3AED', darkFundo: '#231444', darkBorda: '#8B5CF6' },
];

/** Retorna o estágio com as cores do tema ativo (claro ou escuro) */
export function getTrailStage(stageIndex: number, isDark = false): TrailStage {
  const stage = TRAIL_STAGES[stageIndex] ?? TRAIL_STAGES[0];
  if (!isDark) return stage;
  return {
    ...stage,
    fundo: stage.darkFundo ?? '#0B0F17',
    borda: stage.darkBorda ?? stage.balao,
  };
}

export function getTrailStages(isDark = false): TrailStage[] {
  return TRAIL_STAGES.map((_, i) => getTrailStage(i, isDark));
}

/**
 * Lição → momento (contíguo, na ordem do módulo — a trilha é um caminho linear).
 * Mapeamento do Módulo 1 para os 6 momentos da marca.
 */
export const LESSON_STAGE: Record<string, number> = {
  'lesson-01': 0,
  'lesson-02': 1,
  'lesson-03': 1,
  'lesson-04': 2,
  'lesson-05': 3,
  'lesson-06': 3,
  'lesson-07': 4,
  'lesson-08': 4,
  'lesson-09': 4,
  'lesson-10': 5,
};

/**
 * Letras/sílabas de cada lição dentro do balão — texto real, não imagem
 * (manual pág. 6: "letras devem ser texto real, não parte da imagem").
 */
export const LESSON_TOKENS: Record<string, string> = {
  'lesson-01': 'CASA',
  'lesson-02': 'A E',
  'lesson-03': 'M S',
  'lesson-04': 'MA',
  'lesson-05': 'BOLA',
  'lesson-06': 'PARE',
  'lesson-07': 'BALA',
  'lesson-08': 'LATA',
  'lesson-09': 'MALA',
  'lesson-10': 'ABC',
};

/** Letra que representa cada momento no balão principal da home. */
export const STAGE_TOKENS = ['A', 'MA', 'TRA', 'BOLA', 'LATA', '🏆'];

/** Título falado por lição — chaves trail/licao-NN-aberta|feita em ui-audio.json. */
export function lessonTrailKey(lessonId: string, done: boolean): string {
  const num = lessonId.replace('lesson-', '');
  return `trail/licao-${num}-${done ? 'feita' : 'aberta'}`;
}
