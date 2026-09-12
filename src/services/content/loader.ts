import type { AudioSource } from 'expo-audio';

import { AUDIO_MANIFEST } from '../../generated/audioManifest';
import module1Json from '../../../content/module-1.json';
import uiAudioJson from '../../../content/ui-audio.json';
import { validateLesson, validateModuleManifest } from './schema';
import type { Lesson, ModuleManifest } from './types';

// Registro estático de lições: novos arquivos em content/lessons são incluídos aqui.
import lesson01Json from '../../../content/lessons/lesson-01.json';
import lesson02Json from '../../../content/lessons/lesson-02.json';
import lesson03Json from '../../../content/lessons/lesson-03.json';
import lesson04Json from '../../../content/lessons/lesson-04.json';
import lesson05Json from '../../../content/lessons/lesson-05.json';
import lesson06Json from '../../../content/lessons/lesson-06.json';
import lesson07Json from '../../../content/lessons/lesson-07.json';
import lesson08Json from '../../../content/lessons/lesson-08.json';
import lesson09Json from '../../../content/lessons/lesson-09.json';
import lesson10Json from '../../../content/lessons/lesson-10.json';

const MODULES: ModuleManifest[] = [validateModuleManifest(module1Json)];

const LESSON_REGISTRY: Record<string, Lesson> = {
  'lesson-01': validateLesson(lesson01Json as unknown),
  'lesson-02': validateLesson(lesson02Json as unknown),
  'lesson-03': validateLesson(lesson03Json as unknown),
  'lesson-04': validateLesson(lesson04Json as unknown),
  'lesson-05': validateLesson(lesson05Json as unknown),
  'lesson-06': validateLesson(lesson06Json as unknown),
  'lesson-07': validateLesson(lesson07Json as unknown),
  'lesson-08': validateLesson(lesson08Json as unknown),
  'lesson-09': validateLesson(lesson09Json as unknown),
  'lesson-10': validateLesson(lesson10Json as unknown),
};

/** Textos falados da interface (geram assets audio/ui-*, audio/onboarding-*, etc.). */
export const UI_AUDIO_TEXT: Record<string, string> = uiAudioJson as Record<string, string>;

/**
 * Índice reverso chave → texto falado (UI + todas as lições).
 * Alimenta o fallback de TTS: se o asset faltar, o app ainda "fala" o texto.
 */
const AUDIO_TEXT_INDEX: Record<string, string> = { ...UI_AUDIO_TEXT };
(function collectAudioText(node: unknown) {
  if (Array.isArray(node)) {
    node.forEach(collectAudioText);
  } else if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (typeof o.key === 'string' && typeof o.text === 'string') {
      AUDIO_TEXT_INDEX[o.key] = o.text;
    } else {
      Object.values(o).forEach(collectAudioText);
    }
  }
})(LESSON_REGISTRY);

export function audioText(key: string): string | undefined {
  return AUDIO_TEXT_INDEX[key];
}

/** Resolve chave de áudio para o asset empacotado; null se o arquivo não foi gerado. */
export function audioSource(key: string): AudioSource | null {
  return AUDIO_MANIFEST[key] ?? null;
}

export function getLesson(id: string): Lesson | null {
  return LESSON_REGISTRY[id] ?? null;
}

export function getModule(id: string): ModuleManifest | null {
  return MODULES.find((m) => m.id === id) ?? null;
}

/** Primeira lição do módulo (ordem declarada no manifesto). */
export function firstLessonId(moduleId = 'module-1'): string | null {
  return getModule(moduleId)?.lessonIds[0] ?? null;
}

/** Todas as lições do módulo, na ordem do manifesto. */
export function moduleLessonIds(moduleId = 'module-1'): string[] {
  return getModule(moduleId)?.lessonIds ?? [];
}

/**
 * Próxima lição a fazer: primeira cuja posição não esteja concluída.
 * `isCompleted` recebe o lessonId e diz se a lição está completa.
 */
export function nextLessonId(moduleId: string, isCompleted: (id: string) => boolean): string | null {
  const ids = moduleLessonIds(moduleId);
  return ids.find((id) => !isCompleted(id)) ?? ids[ids.length - 1] ?? null;
}

/**
 * Verifica se toda referência de áudio do conteúdo existe no manifesto.
 * Roda no carregamento e em teste — publicar sem assets válidos deve falhar cedo.
 */
export function missingAudioKeys(): string[] {
  const missing = new Set<string>();
  const check = (key?: string) => {
    if (key && !(key in AUDIO_MANIFEST)) missing.add(key);
  };
  for (const lesson of Object.values(LESSON_REGISTRY)) {
    check(lesson.intro.key);
    check(lesson.outro.key);
    for (const a of lesson.activities) {
      check(a.prompt.key);
      check(a.feedbackCorrect?.key);
      check(a.feedbackIncorrect?.key);
      a.options?.forEach((o) => check(o.audio?.key));
      a.hints.forEach((h) => check(h.audio.key));
    }
  }
  Object.keys(UI_AUDIO_TEXT).forEach(check);
  return [...missing];
}
