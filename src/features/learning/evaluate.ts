import type { Activity } from '../../services/content/types';

export interface Evaluation {
  correct: boolean;
  /**
   * false quando a resposta usou ajuda que entrega o conteúdo
   * (alvo narrado, pela instrução ou pelo botão de ouvir) —
   * não conta como leitura independente.
   */
  independentRead: boolean;
}

/**
 * Leitura/resposta independente persistida: certa, sem o alvo narrado
 * e sem dicas usadas. Repetir a instrução não desqualifica — a instrução
 * não entrega a resposta. Re-ouvir o alvo (instrução narrada, 🔉 no alvo
 * ou 🔉 na opção certa) e usar dicas desqualificam.
 */
export function computeIndependentRead(correct: boolean, targetWasNarrated: boolean, hintsUsed: number): boolean {
  return correct && !targetWasNarrated && hintsUsed === 0;
}

/** Avalia uma seleção em atividade de escolha. */
export function evaluateSelection(activity: Activity, selectedOptionId: string, targetWasNarrated: boolean): Evaluation {
  const correct = selectedOptionId === activity.correctOptionId;
  return { correct, independentRead: correct && !targetWasNarrated };
}

const norm = (s: string) => s.normalize('NFC').toUpperCase().replace(/\s+/g, '');

/** Avalia palavra montada em compose-word (pieces juntas === target). */
export function evaluateCompose(activity: Activity, assembled: string[], targetWasNarrated: boolean): Evaluation {
  const correct = norm(assembled.join('')) === norm(activity.target ?? '');
  return { correct, independentRead: correct && !targetWasNarrated };
}

/** Prefixo válido? Permite feedback imediato em compose-word sem revelar a resposta. */
export function isComposePrefix(activity: Activity, assembled: string[]): boolean {
  return norm(activity.target ?? '').startsWith(norm(assembled.join('')));
}

/**
 * Soma a ajuda usada na tentativa: repetições de instrução,
 * áudios de opções e dicas acionadas. Registrada sem punição —
 * serve para medir independência, nunca para penalizar.
 */
export function computeHelpUsed(input: { promptReplays: number; optionListens: number; hintsUsed: number }): number {
  return input.promptReplays + input.optionListens + input.hintsUsed;
}
