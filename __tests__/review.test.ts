import { buildReviewLesson, selectReviewActivities, REVIEW_LESSON_ID } from '../src/features/review/review';
import type { Activity, Lesson } from '../src/services/content/types';
import type { ActivityStats } from '../src/services/db/repo';

const act = (id: string): Activity => ({
  id,
  type: 'listen-and-select',
  narratesTarget: true,
  prompt: { key: `k/${id}`, text: id },
  correctOptionId: 'x',
  options: [
    { id: 'x', label: 'X' },
    { id: 'y', label: 'Y' },
  ],
  hints: [{ level: 1, audio: { key: `k/${id}-h`, text: 'dica' } }],
});

const lesson = (id: string, actIds: string[]): Lesson => ({
  id,
  contentVersion: 'v1',
  title: id,
  objective: 'obj',
  prerequisites: [],
  estimatedMinutes: 5,
  intro: { key: `k/${id}-i`, text: 'intro' },
  outro: { key: `k/${id}-o`, text: 'outro' },
  activities: actIds.map(act),
});

const stats = (attempts: number, errors = 0, independent = 0): ActivityStats => ({ attempts, errors, independent });

describe('selectReviewActivities', () => {
  const lessons = [lesson('l1', ['a1', 'a2']), lesson('l2', ['b1', 'b2']), lesson('l3', ['c1'])];

  it('sem nenhuma tentativa, não há o que revisar', () => {
    expect(selectReviewActivities({ lessons, stats: new Map() })).toEqual([]);
  });

  it('prioriza atividades com mais erros', () => {
    const s = new Map<string, ActivityStats>([
      ['a1', stats(3, 0, 3)],
      ['a2', stats(3, 2, 1)],
    ]);
    const picked = selectReviewActivities({ lessons, stats: s, max: 5, freshCount: 1 });
    expect(picked[0].id).toBe('a2');
  });

  it('mistura exatamente freshCount itens nunca tentados', () => {
    const s = new Map<string, ActivityStats>([
      ['a1', stats(2, 0, 2)],
      ['a2', stats(2, 1, 0)],
      ['b1', stats(2, 0, 1)],
    ]);
    const picked = selectReviewActivities({ lessons, stats: s, max: 4, freshCount: 2 });
    const freshIds = picked.filter((a) => !s.has(a.id)).map((a) => a.id);
    expect(freshIds).toEqual(['b2', 'c1']); // ordem do módulo
    expect(picked).toHaveLength(4);
  });

  it('respeita o máximo mesmo com muitos itens', () => {
    const s = new Map<string, ActivityStats>([['a1', stats(5, 1, 0)]]);
    const picked = selectReviewActivities({ lessons, stats: s, max: 2, freshCount: 1 });
    expect(picked).toHaveLength(2);
  });

  it('depois de erros, prefere respostas guiadas a independentes', () => {
    const s = new Map<string, ActivityStats>([
      ['a1', stats(4, 0, 4)], // sempre independente
      ['a2', stats(4, 0, 0)], // sempre guiada — precisa mais de revisão
    ]);
    const picked = selectReviewActivities({ lessons, stats: s, max: 5, freshCount: 1 });
    expect(picked[0].id).toBe('a2');
  });
});

describe('buildReviewLesson', () => {
  it('produz lição válida com id de revisão', () => {
    const l = buildReviewLesson([act('a1')]);
    expect(l.id).toBe(REVIEW_LESSON_ID);
    expect(l.activities).toHaveLength(1);
    expect(l.intro.key).toBe('review/intro');
    expect(l.outro.key).toBe('review/outro');
  });
});
