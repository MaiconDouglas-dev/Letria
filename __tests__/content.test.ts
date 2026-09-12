import { getLesson, missingAudioKeys, moduleLessonIds } from '../src/services/content/loader';
import { validateLesson } from '../src/services/content/schema';
import lesson01 from '../content/lessons/lesson-01.json';

describe('conteúdo', () => {
  it('lição 1 passa na validação de schema', () => {
    const lesson = validateLesson(lesson01 as unknown);
    expect(lesson.id).toBe('lesson-01');
    expect(lesson.activities.length).toBeGreaterThanOrEqual(4);
  });

  it('rejeita lição sem áudio de instrução', () => {
    const bad = { ...lesson01, activities: [{ ...(lesson01.activities[0] as object), prompt: {} }] };
    expect(() => validateLesson(bad)).toThrow(/prompt/);
  });

  it('rejeita correctOptionId inexistente', () => {
    const bad = {
      ...lesson01,
      activities: [{ ...(lesson01.activities[0] as object), correctOptionId: 'fantasma' }],
    };
    expect(() => validateLesson(bad)).toThrow(/correctOptionId/);
  });

  it('toda referência de áudio do conteúdo e da UI tem asset gerado', () => {
    expect(missingAudioKeys()).toEqual([]);
  });

  it('o módulo tem 10 lições registradas e válidas', () => {
    const ids = moduleLessonIds('module-1');
    expect(ids).toHaveLength(10);
    for (const id of ids) {
      const lesson = getLesson(id);
      expect(lesson).not.toBeNull();
      expect(lesson!.activities.length).toBeGreaterThan(0);
    }
  });

  it('toda atividade publicada tem pelo menos uma dica', () => {
    for (const id of moduleLessonIds('module-1')) {
      for (const a of getLesson(id)!.activities) {
        expect(a.hints.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('compose-word: peças compõem exatamente o alvo (validado no schema)', () => {
    const bad = {
      ...lesson01,
      activities: [
        {
          id: 'x',
          type: 'compose-word',
          narratesTarget: true,
          prompt: { key: 'k', text: 't' },
          target: 'CASA',
          pieces: ['CA', 'LA'], // LA não forma CASA
          hints: [],
        },
      ],
    };
    expect(() => validateLesson(bad)).toThrow(/target/);
  });
});
