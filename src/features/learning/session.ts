import type { LessonProgress, LessonStatus } from '../../services/db/repo';

export interface SessionState {
  /** Índice da atividade atual (0-based). */
  index: number;
  done: boolean;
}

/** Índice inicial da sessão a partir do progresso salvo — retomada real. */
export function resumeIndex(progress: LessonProgress | null, activityCount: number): number {
  if (!progress || progress.status === 'completed') return 0;
  return Math.min(Math.max(0, progress.activityIndex), activityCount - 1);
}

/**
 * Avança a sessão após uma resposta correta.
 * Resposta errada não avança nem bloqueia — repetição sem punição.
 */
export function advance(state: SessionState, activityCount: number): SessionState {
  const next = state.index + 1;
  return next >= activityCount ? { index: state.index, done: true } : { index: next, done: false };
}

/** Status a persistir para uma posição da lição. */
export function statusFor(state: SessionState): LessonStatus {
  return state.done ? 'completed' : state.index > 0 ? 'in_progress' : 'not_started';
}
