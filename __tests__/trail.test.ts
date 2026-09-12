import { moduleLessonIds } from '../src/services/content/loader';
import { LESSON_STAGE, lessonTrailKey, TRAIL_STAGES } from '../src/features/trail/stages';
import { buildTrail, currentStageIndex, trailComplete, zigzagOffset } from '../src/features/trail/trail';

const IDS = moduleLessonIds('module-1');
const done =
  (...ids: string[]) =>
  (id: string) =>
    ids.includes(id);

describe('trilha — estados dos balões', () => {
  test('nada começado: lição 1 atual, resto fechado', () => {
    const nodes = buildTrail(IDS, () => false);
    expect(nodes[0].state).toBe('current');
    expect(nodes.slice(1).every((n) => n.state === 'locked')).toBe(true);
    expect(trailComplete(nodes)).toBe(false);
  });

  test('primeira incompleta vira a atual; anteriores ficam concluídas', () => {
    const nodes = buildTrail(IDS, done('lesson-01', 'lesson-02'));
    expect(nodes.find((n) => n.lessonId === 'lesson-03')?.state).toBe('current');
    expect(nodes.find((n) => n.lessonId === 'lesson-02')?.state).toBe('completed');
    expect(nodes.find((n) => n.lessonId === 'lesson-04')?.state).toBe('locked');
  });

  test('lição em andamento (não concluída) continua sendo a atual', () => {
    const nodes = buildTrail(IDS, done('lesson-01'));
    expect(nodes.find((n) => n.lessonId === 'lesson-02')?.state).toBe('current');
  });

  test('tudo concluído: nenhum nó fechado, trilha completa', () => {
    const nodes = buildTrail(IDS, () => true);
    expect(trailComplete(nodes)).toBe(true);
    expect(nodes.every((n) => n.state === 'completed')).toBe(true);
  });
});

describe('trilha — momentos e fundo', () => {
  test('toda lição do módulo pertence a um momento válido', () => {
    IDS.forEach((id) => {
      const s = LESSON_STAGE[id];
      expect(s).toBeGreaterThanOrEqual(0);
      expect(TRAIL_STAGES[s]).toBeDefined();
    });
  });

  test('momentos são contíguos na ordem do caminho', () => {
    const order = IDS.map((id) => LESSON_STAGE[id]);
    const sorted = [...order].sort((a, b) => a - b);
    expect(order).toEqual(sorted);
  });

  test('fundo acompanha o momento atual; concluída fica no último (lilás)', () => {
    const mid = buildTrail(IDS, done('lesson-01', 'lesson-02'));
    expect(currentStageIndex(mid)).toBe(1); // lesson-03 → palavra geradora
    const all = buildTrail(IDS, () => true);
    expect(currentStageIndex(all)).toBe(TRAIL_STAGES.length - 1);
  });
});

describe('trilha — detalhes', () => {
  test('chave de áudio do balão usa número da lição e estado', () => {
    expect(lessonTrailKey('lesson-03', false)).toBe('trail/licao-03-aberta');
    expect(lessonTrailKey('lesson-10', true)).toBe('trail/licao-10-feita');
  });

  test('zigue-zague alterna lados e se repete', () => {
    const offs = IDS.map((_, i) => zigzagOffset(i));
    expect(new Set(offs).size).toBeGreaterThan(2);
    expect(zigzagOffset(0)).toBe(zigzagOffset(10));
  });
});
