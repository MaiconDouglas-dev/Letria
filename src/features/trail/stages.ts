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
}

export const TRAIL_STAGES: TrailStage[] = [
  { id: 'boas-vindas', name: 'Boas-vindas', speakKey: 'trail/momento-1', icon: '🌱', balao: '#91C875', fundo: '#EAF3E5', borda: '#355529' },
  { id: 'palavra-geradora', name: 'Palavra geradora', speakKey: 'trail/momento-2', icon: '💬', balao: '#76C6A2', fundo: '#E6F3EC', borda: '#285744' },
  { id: 'silabas', name: 'Sílabas', speakKey: 'trail/momento-3', icon: '🧩', balao: '#72C3D5', fundo: '#E6F2F5', borda: '#28545F' },
  { id: 'novas-palavras', name: 'Novas palavras', speakKey: 'trail/momento-4', icon: '📖', balao: '#8DB2DF', fundo: '#EAF0F8', borda: '#334C72' },
  { id: 'frase-assistida', name: 'Frase assistida', speakKey: 'trail/momento-5', icon: '✍️', balao: '#ADA0D5', fundo: '#EFEBF7', borda: '#4B3B70' },
  { id: 'conquista', name: 'Conquista', speakKey: 'trail/momento-6', icon: '🏆', balao: '#BE9BD5', fundo: '#F3EBF7', borda: '#603E78' },
];

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
