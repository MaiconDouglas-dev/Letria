/**
 * Modelo de conteúdo do Passo a Palavra (seção 7 da especificação).
 * O conteúdo vive em `content/` como JSON versionado, separado do código.
 */

/** Referência a um asset de áudio: chave no manifesto + texto falado (fonte do gerador). */
export interface AudioRef {
  /** Chave estável, ex.: "lesson-01/intro" → assets/audio/lesson-01/intro.m4a */
  key: string;
  /** Texto exato que deve ser falado. Usado por scripts/gen-audio e para revisão. */
  text: string;
}

/** Uma alternativa selecionável em atividades de escolha. */
export interface Option {
  id: string;
  /** Texto grande exibido na opção (para quem está aprendendo a ler). */
  label: string;
  /** Pictograma placeholder (emoji) — substituir por ilustração real (campo asset). */
  image?: string;
  /** Áudio opcional narrando a opção. Narração da palavra-alvo conta como ajuda. */
  audio?: AudioRef;
}

export type ActivityType =
  | 'listen-and-select' // ouvir e selecionar uma opção
  | 'word-to-meaning' // relacionar palavra escrita a significado
  | 'compose-word'; // montar palavra com letras/sílabas por toque

export interface Hint {
  level: number;
  /** Áudio da pista (não deve entregar a resposta salvo no último nível). */
  audio: AudioRef;
  /** Ids de opções erradas a eliminar visualmente, quando aplicável. */
  eliminateOptions?: string[];
}

export interface Activity {
  id: string;
  type: ActivityType;
  /** Instrução narrada — sempre em áudio, nunca só em texto. */
  prompt: AudioRef;
  /** Se true, narrar o alvo conta como ajuda e a resposta não é "leitura independente". */
  narratesTarget: boolean;
  options?: Option[];
  /** Id da opção correta (atividades de escolha). */
  correctOptionId?: string;
  /** Alvo: palavra exibida em word-to-meaning; palavra a montar em compose-word. */
  target?: string;
  /** Áudio que narra a palavra-alvo — tocá-la conta como ajuda (leitura não independente). */
  targetAudio?: AudioRef;
  /** Sílabas/letras necessárias para montar `target`, em qualquer ordem no JSON. */
  pieces?: string[];
  /** Peças extras erradas para embaralhar (opcional). */
  distractors?: string[];
  hints: Hint[];
  /** Áudios de feedback sobrescrevem os padrões de ui-audio quando presentes. */
  feedbackCorrect?: AudioRef;
  feedbackIncorrect?: AudioRef;
}

export interface Lesson {
  id: string;
  /** Versão do conteúdo — gravada em cada Attempt. */
  contentVersion: string;
  title: string;
  /** Objetivo observável, para revisão pedagógica e evidência de aprendizagem. */
  objective: string;
  prerequisites: string[];
  estimatedMinutes: number;
  /** Áudio de abertura da lição. */
  intro: AudioRef;
  /** Áudio de encerramento — reconhece esforço sem afirmar domínio. */
  outro: AudioRef;
  activities: Activity[];
}

export interface ModuleManifest {
  id: string;
  contentVersion: string;
  title: string;
  lessonIds: string[];
}
