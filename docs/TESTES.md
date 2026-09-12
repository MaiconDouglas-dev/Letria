# Testes — Passo a Palavra

O que é verificado automaticamente vs. o que exige validação manual em aparelho. **Não afirmar acessibilidade comprovada só por testes automatizados.**

## Verificações automatizadas (rodar antes de concluir qualquer sessão)

```bash
npx tsc --noEmit     # typecheck
npm test             # jest: avaliação, sessão, conteúdo, db (node:sqlite), revisão
npx expo export      # bundle com todos os assets — prova que o app carrega offline
npm run gen:audio    # regenera placeholders de áudio após editar content/
```

Cobertura atual dos testes:

- **Avaliação** (`evaluate.test.ts`): acerto/erro, prefixo de composição, leitura independente (alvo narrado ou dica desqualifica).
- **Sessão** (`session.test.ts`): retomada por posição, avanço sem punição.
- **Conteúdo** (`content.test.ts`): schema das 10 lições, assets de áudio referenciados existem, dica obrigatória, peças compõem o alvo.
- **Banco** (`db.test.ts`): migrações v1→v2 preservando dados, seq de attempts, upsert de progresso, stats por atividade, exclusão completa.
- **Revisão** (`review.test.ts`): vazio sem tentativas, priorização de erros/guiadas, mistura de itens novos, teto de tamanho.

## Como confirmar que a lição 1 funciona em modo avião

Todo o fluxo da lição 1 é local: conteúdo em JSON empacotado, áudios `.m4a` em `assets/audio/` dentro do bundle, progresso em SQLite local. Para confirmar:

1. Instale/abra o app no emulador ou aparelho (`npx expo start` → `a`, ou development build).
2. Passe pelo onboarding até a home carregar.
3. **Ative o modo avião** no aparelho/emulador (Android: `adb shell cmd connectivity airplane-mode on` — não funciona em todos os builds; no emulador use o painel rápido, ou desligue o Wi-Fi do Mac para simular).
4. Feche o app completamente e reabra (no Expo Go, o bundle já estará em cache).
5. Toque em "Continuar aprendendo" → a lição 1 deve abrir, a intro deve **tocar em áudio**, as atividades devem responder com feedback falado.
6. Prove que está offline de verdade: o `expo export` mostra os `.m4a` dentro do bundle — nenhuma URL remota é usada no fluxo.

Em development build (não Expo Go), o app não precisa de rede nem para abrir — o bundle fica embutido no binário.

## O que exige validação manual em aparelho real

Não verificado automaticamente — testar em celular físico modesto:

- Qualidade/velocidade da voz `say` (placeholder), volume em ambiente barulhento, fone desconectado no meio do áudio.
- TalkBack/VoiceOver: ordem de foco, sobreposição entre leitor de tela e narração do app.
- Interrupções: chamada recebida, app em background (áudio para; retomada manual).
- Fonte ampliada do sistema + "Letras grandes" ligadas não escondem botões em tela pequena.
- Baixo armazenamento: aviso e progresso preservado.
- Toque com tremor/dificuldade motora; alvos ≥ 48dp na prática.
- "Apagar progresso": confirmar que a dupla confirmação é compreensível para quem não lê.
- Piloto: compreensão das instruções faladas por pessoas do público-alvo (rodada com ~5–8 adultos, conforme seção 10 da especificação).

## Limitações conhecidas

- Voz placeholder do macOS: sons de letras saem como **nomes** ("ême", "ésse"), não fonemas — pendência pedagógica registrada em `docs/MODULO-1.md`.
- Emojis são placeholders visuais.
- Progresso numérico falado usa frases pré-gravadas 0–50; acima disso a tela limita em 50 (não mente, mas deixa de incrementar a fala).
