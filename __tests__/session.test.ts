import { advance, resumeIndex, statusFor } from '../src/features/learning/session';
import type { LessonProgress } from '../src/services/db/repo';

const progress = (status: LessonProgress['status'], idx: number): LessonProgress => ({
  lessonId: 'l1',
  contentVersion: 'v1',
  status,
  activityIndex: idx,
  updatedAt: 'now',
});

describe('resumeIndex — retomada real', () => {
  it('sem progresso começa do zero', () => {
    expect(resumeIndex(null, 4)).toBe(0);
  });
  it('em andamento retoma na posição salva', () => {
    expect(resumeIndex(progress('in_progress', 2), 4)).toBe(2);
  });
  it('concluída recomeça do zero', () => {
    expect(resumeIndex(progress('completed', 3), 4)).toBe(0);
  });
  it('índice salvo além do fim é limitado', () => {
    expect(resumeIndex(progress('in_progress', 9), 4)).toBe(3);
  });
});

describe('advance', () => {
  it('avança para a próxima atividade', () => {
    expect(advance({ index: 0, done: false }, 3)).toEqual({ index: 1, done: false });
  });
  it('na última atividade marca conclusão', () => {
    expect(advance({ index: 2, done: false }, 3)).toEqual({ index: 2, done: true });
  });
});

describe('statusFor', () => {
  it('done → completed', () => {
    expect(statusFor({ index: 2, done: true })).toBe('completed');
  });
  it('meio → in_progress', () => {
    expect(statusFor({ index: 1, done: false })).toBe('in_progress');
  });
});
