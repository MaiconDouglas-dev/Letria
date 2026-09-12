import { computeHelpUsed, computeIndependentRead, evaluateCompose, evaluateSelection, isComposePrefix } from '../src/features/learning/evaluate';
import type { Activity } from '../src/services/content/types';

const activity: Activity = {
  id: 'a1',
  type: 'listen-and-select',
  narratesTarget: true,
  prompt: { key: 'k/p', text: 'toque na figura' },
  correctOptionId: 'certa',
  options: [
    { id: 'certa', label: 'CERTA' },
    { id: 'errada', label: 'ERRADA' },
  ],
  hints: [],
};

describe('evaluateSelection', () => {
  it('acerto na opção correta', () => {
    expect(evaluateSelection(activity, 'certa', true).correct).toBe(true);
  });

  it('erro na opção errada', () => {
    expect(evaluateSelection(activity, 'errada', true).correct).toBe(false);
  });

  it('resposta com alvo narrado não é leitura independente', () => {
    expect(evaluateSelection(activity, 'certa', true).independentRead).toBe(false);
  });

  it('ouvir o alvo pelo botão também desqualifica, mesmo sem narração automática', () => {
    const w2m: Activity = { ...activity, type: 'word-to-meaning', narratesTarget: false };
    // usuário tocou 🔉 na palavra → targetWasNarrated = true
    expect(evaluateSelection(w2m, 'certa', true).independentRead).toBe(false);
    expect(evaluateSelection(w2m, 'certa', false).independentRead).toBe(true);
  });
});

describe('computeIndependentRead', () => {
  it('certa + sem alvo narrado + sem dicas = independente', () => {
    expect(computeIndependentRead(true, false, 0)).toBe(true);
  });
  it('alvo narrado desqualifica', () => {
    expect(computeIndependentRead(true, true, 0)).toBe(false);
  });
  it('dica usada desqualifica', () => {
    expect(computeIndependentRead(true, false, 2)).toBe(false);
  });
  it('resposta errada nunca é independente', () => {
    expect(computeIndependentRead(false, false, 0)).toBe(false);
  });
});

describe('compose-word', () => {
  const compose: Activity = {
    id: 'c1',
    type: 'compose-word',
    narratesTarget: true,
    prompt: { key: 'k/p', text: 'monte casa' },
    target: 'CASA',
    pieces: ['CA', 'SA'],
    distractors: ['MA'],
    hints: [],
  };

  it('prefixo correto é aceito', () => {
    expect(isComposePrefix(compose, ['CA'])).toBe(true);
    expect(isComposePrefix(compose, ['MA'])).toBe(false);
    expect(isComposePrefix(compose, ['SA'])).toBe(false);
  });

  it('palavra completa na ordem certa está correta', () => {
    expect(evaluateCompose(compose, ['CA', 'SA'], true).correct).toBe(true);
  });

  it('ordem errada está incorreta', () => {
    expect(evaluateCompose(compose, ['SA', 'CA'], true).correct).toBe(false);
  });

  it('palavra com distrator está incorreta', () => {
    expect(evaluateCompose(compose, ['CA', 'MA'], true).correct).toBe(false);
  });
});

describe('computeHelpUsed', () => {
  it('soma repetições, áudios de opção e dicas', () => {
    expect(computeHelpUsed({ promptReplays: 2, optionListens: 1, hintsUsed: 1 })).toBe(4);
  });
  it('zero sem ajuda', () => {
    expect(computeHelpUsed({ promptReplays: 0, optionListens: 0, hintsUsed: 0 })).toBe(0);
  });
});
