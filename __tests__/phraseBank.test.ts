import { getGentleErrorPhrase, getPraisePhrase, getRandomPhrase, PHRASE_BANK } from '../src/features/phrases/phraseBank';

describe('Banco de Frases — Letria', () => {
  it('contém categorias essenciais do banco de frases pedagógico', () => {
    expect(PHRASE_BANK.comecando.length).toBeGreaterThan(5);
    expect(PHRASE_BANK.acertouSimples.length).toBeGreaterThan(5);
    expect(PHRASE_BANK.acertouReforco.length).toBeGreaterThan(5);
    expect(PHRASE_BANK.acertouCombo.length).toBeGreaterThan(5);
    expect(PHRASE_BANK.erroLeve.length).toBeGreaterThan(5);
    expect(PHRASE_BANK.erroRecorrente.length).toBeGreaterThan(5);
    expect(PHRASE_BANK.conclusaoLicao.length).toBeGreaterThan(3);
    expect(PHRASE_BANK.sequenciaDiaria.length).toBeGreaterThan(5);
  });

  it('retorna frase aleatória não vazia para cada categoria', () => {
    const categories = ['comecando', 'acertouSimples', 'acertouReforco', 'acertouCombo', 'erroLeve', 'erroRecorrente'] as const;
    for (const cat of categories) {
      const phrase = getRandomPhrase(cat);
      expect(typeof phrase).toBe('string');
      expect(phrase.length).toBeGreaterThan(2);
    }
  });

  it('seleciona elogio adequado baseado na sequência de acertos', () => {
    const p1 = getPraisePhrase(1);
    expect(PHRASE_BANK.acertouSimples).toContain(p1);

    const p2 = getPraisePhrase(2);
    expect(PHRASE_BANK.acertouReforco).toContain(p2);

    const p3 = getPraisePhrase(3);
    expect(PHRASE_BANK.acertouCombo).toContain(p3);
  });

  it('oferece acolhimento suave ao errar sem tom punitivo', () => {
    const err1 = getGentleErrorPhrase(1);
    expect(PHRASE_BANK.erroLeve).toContain(err1);

    const err2 = getGentleErrorPhrase(2);
    expect(PHRASE_BANK.erroRecorrente).toContain(err2);
  });

  it('possui marcos comemorativos definidos', () => {
    expect(PHRASE_BANK.marcos.primeiraPalavra).toBeDefined();
    expect(PHRASE_BANK.marcos.primeiraLicao).toBeDefined();
    expect(PHRASE_BANK.marcos.cemPalavras).toBeDefined();
  });
});
