import type { Activity, AudioRef, Lesson, ModuleManifest, Option } from './types';

const ACTIVITY_TYPES = new Set(['listen-and-select', 'word-to-meaning', 'compose-word']);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function audioRef(raw: unknown, path: string, errors: string[]): AudioRef | null {
  if (typeof raw !== 'object' || raw === null) {
    errors.push(`${path}: esperado objeto { key, text }`);
    return null;
  }
  const { key, text } = raw as Record<string, unknown>;
  if (!isNonEmptyString(key)) errors.push(`${path}.key: string obrigatória`);
  if (!isNonEmptyString(text)) errors.push(`${path}.text: string obrigatória (texto falado)`);
  if (isNonEmptyString(key) && isNonEmptyString(text)) return { key, text };
  return null;
}

function activity(raw: unknown, path: string, errors: string[]): Activity | null {
  if (typeof raw !== 'object' || raw === null) {
    errors.push(`${path}: esperado objeto`);
    return null;
  }
  const a = raw as Record<string, unknown>;
  if (!isNonEmptyString(a.id)) errors.push(`${path}.id: string obrigatória`);
  if (!isNonEmptyString(a.type) || !ACTIVITY_TYPES.has(a.type as string)) {
    errors.push(`${path}.type: deve ser um de ${[...ACTIVITY_TYPES].join(', ')}`);
  }
  const prompt = audioRef(a.prompt, `${path}.prompt`, errors);
  if (!Array.isArray(a.hints)) errors.push(`${path}.hints: array obrigatório (pode ser vazio)`);

  const type = a.type as Activity['type'];
  if (type === 'listen-and-select' || type === 'word-to-meaning') {
    if (!Array.isArray(a.options) || a.options.length < 2) {
      errors.push(`${path}.options: mínimo de 2 opções`);
    } else {
      const ids = new Set<string>();
      a.options.forEach((o, i) => {
        if (typeof o !== 'object' || o === null || !isNonEmptyString((o as Option).id) || !isNonEmptyString((o as Option).label)) {
          errors.push(`${path}.options[${i}]: precisa de id e label`);
          return;
        }
        const opt = o as Option;
        if (ids.has(opt.id)) errors.push(`${path}.options[${i}]: id duplicado "${opt.id}"`);
        ids.add(opt.id);
        if (opt.audio) audioRef(opt.audio, `${path}.options[${i}].audio`, errors);
      });
      if (!isNonEmptyString(a.correctOptionId) || !ids.has(a.correctOptionId as string)) {
        errors.push(`${path}.correctOptionId: precisa referenciar uma opção existente`);
      }
    }
    if (type === 'word-to-meaning' && !isNonEmptyString(a.target)) {
      errors.push(`${path}.target: palavra exibida obrigatória em word-to-meaning`);
    }
  }
  if (type === 'compose-word') {
    if (!isNonEmptyString(a.target)) errors.push(`${path}.target: palavra-alvo obrigatória`);
    if (!Array.isArray(a.pieces) || a.pieces.length < 2 || !a.pieces.every(isNonEmptyString)) {
      errors.push(`${path}.pieces: pelo menos 2 letras/sílabas não vazias`);
    } else if (isNonEmptyString(a.target)) {
      const norm = (s: string) => s.normalize('NFC').toUpperCase().replace(/\s+/g, '');
      if (norm((a.pieces as string[]).join('')) !== norm(a.target as string)) {
        errors.push(`${path}.pieces: juntas devem formar exatamente o target "${a.target}"`);
      }
    }
    if (a.distractors !== undefined && (!Array.isArray(a.distractors) || !a.distractors.every(isNonEmptyString))) {
      errors.push(`${path}.distractors: array de strings`);
    }
  }
  if (a.targetAudio) audioRef(a.targetAudio, `${path}.targetAudio`, errors);

  const hints = (a.hints as unknown[] | undefined)?.map((h, i) => {
    if (typeof h !== 'object' || h === null) {
      errors.push(`${path}.hints[${i}]: esperado objeto`);
      return null;
    }
    const hint = h as Record<string, unknown>;
    const audio = audioRef(hint.audio, `${path}.hints[${i}].audio`, errors);
    return audio ? { level: i + 1, audio, eliminateOptions: hint.eliminateOptions as string[] | undefined } : null;
  });

  if (!prompt || !hints || hints.some((h) => h === null)) return null;
  return {
    id: a.id as string,
    type,
    prompt,
    narratesTarget: a.narratesTarget === true,
    options: a.options as Activity['options'],
    correctOptionId: a.correctOptionId as string | undefined,
    target: a.target as string | undefined,
    targetAudio: a.targetAudio ? audioRef(a.targetAudio, `${path}.targetAudio`, errors) ?? undefined : undefined,
    pieces: a.pieces as string[] | undefined,
    distractors: a.distractors as string[] | undefined,
    hints: hints as Activity['hints'],
    feedbackCorrect: a.feedbackCorrect ? audioRef(a.feedbackCorrect, `${path}.feedbackCorrect`, errors) ?? undefined : undefined,
    feedbackIncorrect: a.feedbackIncorrect ? audioRef(a.feedbackIncorrect, `${path}.feedbackIncorrect`, errors) ?? undefined : undefined,
  };
}

/** Valida uma lição; lança erro listando todos os problemas encontrados. */
export function validateLesson(raw: unknown): Lesson {
  const errors: string[] = [];
  if (typeof raw !== 'object' || raw === null) throw new Error('lição: esperado objeto JSON');
  const l = raw as Record<string, unknown>;

  if (!isNonEmptyString(l.id)) errors.push('lesson.id: string obrigatória');
  if (!isNonEmptyString(l.contentVersion)) errors.push('lesson.contentVersion: obrigatória (ex.: "2026-09-12.1")');
  if (!isNonEmptyString(l.title)) errors.push('lesson.title: string obrigatória');
  if (!isNonEmptyString(l.objective)) errors.push('lesson.objective: objetivo observável obrigatório');
  if (!Array.isArray(l.prerequisites)) errors.push('lesson.prerequisites: array obrigatório (pode ser vazio)');
  if (typeof l.estimatedMinutes !== 'number' || l.estimatedMinutes <= 0) errors.push('lesson.estimatedMinutes: número > 0');

  const intro = audioRef(l.intro, 'lesson.intro', errors);
  const outro = audioRef(l.outro, 'lesson.outro', errors);

  if (!Array.isArray(l.activities) || l.activities.length === 0) {
    errors.push('lesson.activities: pelo menos 1 atividade');
  }
  const activities = (l.activities as unknown[] | undefined)?.map((a, i) => activity(a, `lesson.activities[${i}]`, errors)) ?? [];
  const ids = new Set<string>();
  for (const a of activities) {
    if (a && ids.has(a.id)) errors.push(`activity id duplicado: "${a.id}"`);
    if (a) ids.add(a.id);
  }

  if (errors.length > 0 || !intro || !outro || activities.some((a) => a === null)) {
    throw new Error(`Lição inválida:\n- ${errors.join('\n- ')}`);
  }
  return {
    id: l.id as string,
    contentVersion: l.contentVersion as string,
    title: l.title as string,
    objective: l.objective as string,
    prerequisites: l.prerequisites as string[],
    estimatedMinutes: l.estimatedMinutes as number,
    intro,
    outro,
    activities: activities as Activity[],
  };
}

export function validateModuleManifest(raw: unknown): ModuleManifest {
  const errors: string[] = [];
  if (typeof raw !== 'object' || raw === null) throw new Error('módulo: esperado objeto JSON');
  const m = raw as Record<string, unknown>;
  if (!isNonEmptyString(m.id)) errors.push('module.id: string obrigatória');
  if (!isNonEmptyString(m.contentVersion)) errors.push('module.contentVersion: obrigatória');
  if (!isNonEmptyString(m.title)) errors.push('module.title: string obrigatória');
  if (!Array.isArray(m.lessonIds) || m.lessonIds.length === 0 || !m.lessonIds.every(isNonEmptyString)) {
    errors.push('module.lessonIds: array não vazio de strings');
  }
  if (errors.length > 0) throw new Error(`Módulo inválido:\n- ${errors.join('\n- ')}`);
  return m as unknown as ModuleManifest;
}
