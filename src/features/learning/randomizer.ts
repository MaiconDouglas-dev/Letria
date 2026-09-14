import type { Activity, Option } from '../../services/content/types';
import { getPraisePhrase, getGentleErrorPhrase, getRandomPhrase } from '../phrases/phraseBank';

/** Embaralha um array de forma determinística ou aleatória */
export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Prepara uma atividade para execução:
 * - Embaralha as opções de escolha para que a posição da resposta correta mude a cada sessão.
 * - Embaralha as peças de montagem (compose-word).
 * - Mantém integridade referencial com correctOptionId e dicas.
 */
export function randomizeActivity(activity: Activity): Activity {
  const prepared: Activity = { ...activity };

  if (prepared.options && prepared.options.length > 1) {
    prepared.options = shuffleArray(prepared.options);
  }

  return prepared;
}

/** Retorna frase randômica de incentivo para acertos */
export function getRandomPraise(streak = 1): string {
  return getPraisePhrase(streak);
}

/** Retorna frase randômica acolhedora para erros sem punição */
export function getRandomErrorEncouragement(errorCount = 1): string {
  return getGentleErrorPhrase(errorCount);
}

/** Retorna frase de reforço pedagógico */
export function getRandomHintPhrase(): string {
  return getRandomPhrase('dificuldade');
}
