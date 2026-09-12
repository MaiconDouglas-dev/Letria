# Passo a Palavra — roteiro de prompts para Devin CLI

App de alfabetização guiado por áudio para adultos e idosos (pt-BR). Proposta de produto a validar com usuários e educadores — não um método comprovado.

## Estrutura deste projeto

| Arquivo | Papel |
| --- | --- |
| `AGENTS.md` | Regras permanentes. O Devin CLI carrega automaticamente em toda sessão — não precisa colar. |
| `docs/ESPECIFICACAO.md` | Especificação completa do produto (contexto, escopo, pedagogia, segurança, testes). |
| Este arquivo | Prompts incrementais para colar em cada sessão. |

## Como usar

1. `cd` nesta pasta e rode `devin` (modo sugerido: `/accept-edits` ou `/smart`; para revisar a abordagem antes, use `/plan`).
2. Cole o **PROMPT 1**. Ao final, teste o app com `npx expo start` em emulador ou aparelho via development build.
3. Siga para o próximo prompt na mesma sessão ou retome depois com `devin -c` — o contexto permanente está em `AGENTS.md` + `docs/`.
4. One-shot sem REPL: `devin -p -- "cole o prompt aqui"`. Para delegar à nuvem: `/handoff`.

Os prompts assumem que `AGENTS.md` já foi carregado. Cada um é autocontido e produz um incremento funcional verificável — não peça o app inteiro de uma vez.

---

## PROMPT 1 — Fundação + primeira lição offline (fluxo vertical)

```
Leia docs/ESPECIFICACAO.md antes de começar.

Tarefa: criar o projeto Expo (TypeScript, Expo Router) nesta pasta e implementar o fluxo vertical inicial do "Passo a Palavra":

1. Scaffold do app com estrutura por features (onboarding, learning, review, progress, settings). Verifique a versão estável atual do Expo na documentação oficial.
2. Tela de abertura com acolhimento em áudio e demonstração de tocar/ouvir/repetir/avançar — nada exige leitura.
3. Home com uma ação principal (continuar aprendendo) e botão de ajuda em posição fixa.
4. Uma microlição completa no formato "ouvir e selecionar": instrução em áudio, 3-4 opções com imagem + texto grande, feedback em áudio, pistas graduais, repetição ilimitada sem punição.
5. AudioController central conforme AGENTS.md.
6. Conteúdo da lição em JSON versionado (schema da seção 7 da especificação) com validação de schema e de existência dos assets.
7. Persistência em expo-sqlite (Lesson, Activity, Asset, Attempt, LessonProgress, Preferences): salvar após cada resposta, retomar ao reabrir, migração inicial testada.
8. scripts/gen-audio.sh gerando placeholders de áudio reais com `say`/`afconvert` (voz pt-BR), saída em assets/audio/, marcados para substituição.
9. Testes unitários (jest) para avaliação de resposta, progressão e persistência.

Antes de concluir, rode as verificações do AGENTS.md e reporte: arquivos criados, como executar, testes rodados e o que exige validação manual em dispositivo.
```

## PROMPT 2 — Módulo inicial completo

```
Expanda para o módulo inicial (10-12 microlições) conforme seções 3, 4 e 6 de docs/ESPECIFICACAO.md:

1. Os três formatos de atividade: ouvir-e-selecionar, palavra↔significado e montar palavra por letras/sílabas via toque (arrastar opcional, nunca a única forma).
2. docs/MODULO-1.md com a tabela das lições (objetivo observável, pré-requisitos, duração, roteiro de áudio, elementos visuais, tarefa, feedback, pistas, revisão, evidência) — marcado como rascunho para revisão pedagógica.
3. Progressão fonema-grafema revisável, com palavras do cotidiano adulto (transporte, trabalho, alimentação, família, mensagens, placas).
4. Pistas separadas da ajuda de navegação; uso de ajuda registrado na Attempt sem penalizar.
5. Encerramento de sessão que reconhece esforço sem afirmar domínio.
6. Placeholders de áudio e imagem para todas as lições, com schema validado no build/testes.

Verificação: tsc + testes + `npx expo export` limpos; documentar em docs/TESTES.md como confirmar que a lição 1 funciona em modo avião.
```

## PROMPT 3 — Revisão, progresso e configurações

```
Implemente revisão, progresso e ajustes conforme seções 3 e 5 da especificação:

1. Revisão de conteúdos anteriores misturando itens novos (não só repetidos); distinguir leitura independente de resposta guiada nos registros.
2. Tela de progresso compreensível sem leitura (ícones + áudio). Sem ranking nem exposição pública.
3. Configurações: som, repetição, tamanho visual e "apagar progresso" — tudo explicado em áudio; exclusão com confirmação compreensível e proteção contra toque acidental.
4. Aviso acessível de que, sem conta, o progresso não é recuperável após desinstalação ou perda do aparelho.
5. Testes para regras de revisão e para o fluxo de exclusão de dados.

Rode as verificações do AGENTS.md antes de concluir.
```

## PROMPT 4 — Acessibilidade e robustez offline

```
Rodada de acessibilidade e robustez conforme seções 5, 9 e 10 da especificação:

1. Auditoria TalkBack/VoiceOver: labels, ordem de foco, ações, sem fala sobreposta entre leitor de tela e áudio do app. Corrija o que encontrar.
2. Fonte ampliada e telas pequenas não escondem ações; contraste verificado; alvos ≥ 48dp; estados de falha descritos em áudio.
3. Interrupções: chamada, fone desconectado, volume zero, app em background — áudio pausa/retoma corretamente.
4. Baixo armazenamento: aviso acessível, progresso preservado.
5. Testes de integração para migrações SQLite e AudioController; teste e2e da jornada principal (Maestro ou similar) se viável no ambiente.
6. docs/TESTES.md atualizado: o que foi verificado automaticamente vs. o que exige teste manual em aparelho modesto real. Não afirme acessibilidade comprovada só por testes automatizados.
```

## PROMPT 5 — Privacidade, segurança e preparação do piloto

```
Prepare a documentação e o app para o piloto conforme seções 8 e 11 da especificação:

1. docs/SEGURANCA.md: tabela de ameaças (risco, cenário, impacto, mitigação, risco residual, teste) cobrindo todos os cenários da seção 8.
2. docs/PRIVACIDADE.md: inventário de dados, finalidades, retenção, canal de pedidos; aviso de privacidade em linguagem simples + áudio dentro do app.
3. eas.json para development builds Android/iOS.
4. docs/PUBLICACAO.md: checklist das lojas (políticas, data safety, classificação etária, licenças, acessibilidade, distribuição de testes), marcando como "a verificar" o que depender de confirmação em fonte oficial.
5. docs/CUSTOS.md: faixas de esforço por disciplina e custos pontuais vs. recorrentes, com valores marcados como pendentes quando não verificados.
6. Revisão final das verificações do AGENTS.md.

Sem backend nesta fase. Não afirme conformidade LGPD ou políticas de loja como garantidas — marque como trabalho a verificar na operação real.
```

---

## Regras de trabalho (valem para todos os prompts)

- Incrementos funcionais e verificáveis; cada entrega informa arquivos, instalação, execução, testes realizados e limitações conhecidas.
- Distinguir recomendação, hipótese, requisito e fato verificado; citar documentação oficial para capacidades e requisitos atuais.
- Não depender de URLs fictícias, assets ausentes ou segredos embutidos para o fluxo principal funcionar.
- Não apresentar hipóteses pedagógicas como fatos; sinalizar o que exige revisão de educadores de EJA e validação com o público-alvo.
