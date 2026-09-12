# Módulo 1 — Primeiras palavras

> **RASCUNHO PARA REVISÃO PEDAGÓGICA.** Este plano é uma proposta de projeto, não um método validado. Decisões sobre sequência fonema–grafema, escolha de palavras e evidências de aprendizagem precisam de revisão por educadores de alfabetização de adultos (EJA) e teste com pessoas do público-alvo antes de qualquer afirmação de eficácia.

Progressão proposta: consciência de sons → vogais → consoantes frequentes → sílabas CV → palavra escrita → significado → composição por sílabas → composição por letras → revisão com itens novos. Não presume relação 1:1 som-letra nem usa só memorização de imagem como evidência.

## Tabela das lições

| # | Lição | Objetivo observável | Pré-requisitos | Duração est. | Tipos de atividade |
| --- | --- | --- | --- | --- | --- |
| 1 | Ouvir e encontrar | Ouvir palavra conhecida e tocar na figura correspondente (4 opções) | — | ~5 min | ouvir-e-selecionar |
| 2 | Os sons das vogais | Ouvir som de vogal e tocar na letra correspondente | L1 | ~5 min | ouvir-e-selecionar (letras) |
| 3 | Consoantes que abrem palavras | Ouvir nome comum de M/S/P/L e tocar na letra | L2 | ~5 min | ouvir-e-selecionar (letras) |
| 4 | Juntando letras em sílabas | Ouvir sílaba CV e tocar na sílaba escrita | L2, L3 | ~5 min | ouvir-e-selecionar (sílabas) |
| 5 | Palavra e figura | Ler palavra conhecida e tocar na figura do significado | L1 | ~6 min | palavra→significado |
| 6 | Palavras da rua | Ler palavras de placas (PARE, SAÍDA, PERIGO) e tocar no significado | L5 | ~6 min | palavra→significado |
| 7 | Montando por sílabas | Ouvir palavra e montar tocando nas sílabas em ordem | L4 | ~6 min | montar palavra |
| 8 | Mais palavras por sílabas | Montar palavras novas por sílabas com distrator | L7 | ~6 min | montar palavra |
| 9 | Montando letra por letra | Ouvir palavra curta e montar letra a letra | L8 | ~6 min | montar palavra (letras) |
| 10 | Revisão do módulo | Resolver os três formatos com a palavra nova ESCOLA | L9 | ~7 min | misto |

Total estimado: ~57 min de conteúdo, pensado para sessões de 3–7 min. **Não é um curso completo de alfabetização** — é o recorte mínimo para validar usabilidade e sinais iniciais.

## Roteiro tipo de cada atividade

Toda atividade declara no JSON: objetivo observável (na lição), instrução em áudio (`prompt`), opções/peças, dicas graduais (`hints`), feedback e se a narração do alvo conta como ajuda (`narratesTarget`). Ajuda usada é registrada na `Attempt` sem penalizar; resposta com alvo narrado não conta como leitura independente.

## Três lições desenvolvidas (amostra)

### Lição 1 — Ouvir e encontrar

- **Objetivo**: ouvir "toque na figura do ônibus" e tocar na figura certa entre 4.
- **Roteiro de áudio**: intro explica o formato sem exigir leitura ("não precisa saber ler; se errar, tente de novo"); cada atividade narra a instrução; opções têm 🔉 que narra (conta como ajuda).
- **Elementos visuais**: grade 2×2 com pictograma grande (placeholder emoji → substituir por ilustração) + palavra em caixa alta.
- **Dicas**: nível 1 = âncora semântica ("é o que usamos para abrir a porta"); nível 2 = elimina 2 opções.
- **Feedback**: áudio de acerto/erro, ✓/✗ visual além da cor.
- **Evidência**: `Attempt` com resposta, ajuda usada e `hint_level`; conclusão ≠ domínio (medir com itens novos).
- **Revisão**: palavras reaparecem como distratores nas lições 5, 6 e 10.

### Lição 5 — Palavra e figura

- **Objetivo**: ler CASA/BOLA/SAPO escrita e tocar na figura do significado.
- **Roteiro de áudio**: intro explica a novidade; prompt nunca narra a palavra-alvo; botão 🔉 ao lado da palavra narra — registrar como ajuda (`optionListens` + `targetNarrated`).
- **Elementos visuais**: card com a palavra em caixa alta + grade de figuras.
- **Dicas**: nível 1 = pista sublexical ("as duas primeiras letras fazem bó"); nível 2 = elimina 2 figuras.
- **Evidência**: resposta sem `targetNarrated` = leitura independente candidata.
- **Revisão**: palavras da lição 1 viram distratores; ESCOLA chega na lição 10 como item novo.

### Lição 7 — Montando por sílabas

- **Objetivo**: ouvir "casa" e montar CA-SA tocando nas partes em ordem, com distrator.
- **Roteiro de áudio**: intro explica o gesto de tocar (não arrastar); prompt decompõe a palavra em sílabas; peça errada volta sozinha com feedback gentil.
- **Elementos visuais**: área de encaixe tracejada no topo + peças grandes na base; ⌫ remove última peça.
- **Dicas**: nível 1 = primeira sílaba; nível 2 = esconde o distrator.
- **Evidência**: `Attempt.selectedOption` guarda a sequência montada; prefixo errado também é registrado.
- **Limite declarado**: montar na tela não comprova escrita à mão — prática manual fica para atividades fora da tela (futuras).

## Regras de avaliação do módulo

- Correção considera resposta **e** ajuda usada; tocar aleatoriamente não comprova domínio.
- Aprendizagem se mede com itens novos (lição 10 introduz ESCOLA em todos os formatos), não só com repetição.
- Conclusão de lição reconhece esforço, nunca afirma domínio.

## Pendências para revisão pedagógica

- [ ] Sons isolados de letras/consoantes gravados por profissional — `say` do macOS produz nomes de letras (ême, ésse), não fonemas; validar se o ponto de partida é nome ou som.
- [ ] Validar ordem de introdução de consoantes (M/S/P/L é hipótese de saliência, não consenso).
- [ ] Substituir emojis por ilustrações consistentes e testadas com o público.
- [ ] Definir critério de "item novo" equivalente para pré/pós-teste.
