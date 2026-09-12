import type { Activity, Lesson } from '../../services/content/types';
import type { ActivityStats } from '../../services/db/repo';

/** Id da pseudo-lição de revisão — attempts dela carregam os activity_ids reais. */
export const REVIEW_LESSON_ID = 'review-session';

export interface ReviewSelectionInput {
  /** Lições do módulo na ordem do manifesto. */
  lessons: Lesson[];
  /** Estatísticas por activity_id (tentativas registradas). */
  stats: Map<string, ActivityStats>;
  /** Tamanho máximo da sessão de revisão. */
  max?: number;
  /** Quantos itens novos (nunca tentados) misturar. */
  freshCount?: number;
}

/**
 * Seleciona atividades para revisão (seção 3/4 da especificação):
 * - base: atividades já tentadas, priorizando as mais fracas
 *   (mais erros, depois mais respostas guiadas/não independentes);
 * - mistura `freshCount` itens NOVOS (nunca tentados), na ordem do módulo —
 *   revisão nunca é só repetição;
 * - retorna [] quando não há nenhuma tentativa: não existe o que revisar.
 *
 * Determinística (mesma entrada → mesma saída) para ser testável;
 * o embaralhamento visual fica na camada de UI.
 */
export function selectReviewActivities({ lessons, stats, max = 5, freshCount = 1 }: ReviewSelectionInput): Activity[] {
  const all = lessons.flatMap((l) => l.activities);
  const attempted = all.filter((a) => (stats.get(a.id)?.attempts ?? 0) > 0);
  if (attempted.length === 0) return [];

  const weakness = (a: Activity): number => {
    const s = stats.get(a.id)!;
    const guided = s.attempts - s.independent;
    // Erros pesam mais; depois respostas guiadas; desempate por menos prática.
    return s.errors * 100 + guided * 10 - s.attempts;
  };

  const weak = [...attempted].sort((a, b) => weakness(b) - weakness(a) || a.id.localeCompare(b.id));
  const fresh = all.filter((a) => (stats.get(a.id)?.attempts ?? 0) === 0);

  return [...weak.slice(0, Math.max(0, max - freshCount)), ...fresh.slice(0, freshCount)];
}

/** Monta a pseudo-lição de revisão reutilizável pelo LessonPlayer. */
export function buildReviewLesson(activities: Activity[]): Lesson {
  return {
    id: REVIEW_LESSON_ID,
    contentVersion: 'review',
    title: 'Revisão',
    objective: 'Praticar itens já vistos, misturados com uma novidade.',
    prerequisites: [],
    estimatedMinutes: 5,
    intro: {
      key: 'review/intro',
      text: 'Hora de revisar! Você vai praticar de novo coisas que já viu, com uma novidade no meio. Sem pressa.',
    },
    outro: {
      key: 'review/outro',
      text: 'Revisão terminada. Muito bem por praticar de novo!',
    },
    activities,
  };
}
