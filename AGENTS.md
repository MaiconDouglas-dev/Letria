# Passo a Palavra — regras do projeto

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

---

App de alfabetização para adultos e idosos falantes de português brasileiro que ainda não leem. A UX é guiada por áudio: **nenhuma ação essencial pode exigir leitura prévia** — navegação, erros, ajuda e configurações também são falados/demonstrados.

A especificação completa do produto está em `docs/ESPECIFICACAO.md`. Consulte-a antes de decisões de escopo, pedagogia, dados ou segurança. Este projeto é uma proposta a validar com educadores de EJA e usuários reais — não apresente hipóteses pedagógicas como fatos comprovados.

## Stack fixa

- React Native + Expo SDK 57 (development builds) + TypeScript + Expo Router.
- `expo-audio` para reprodução, `expo-sqlite` para progresso local, `expo-secure-store` apenas para pequenos segredos futuros.
- **Sem backend, sem login, sem permissão de microfone, sem analytics/ads no MVP.**
- 100% offline desde a instalação: todo áudio/imagem essencial empacotado no app.
- Conteúdo como dados versionados (JSON em `content/`), separado do código, com ids estáveis e validação de schema + existência dos assets.
- Verifique versões estáveis e compatibilidade na documentação oficial antes de fixar dependências. Não invente números de versão.

## Regras de UX (não negociáveis)

- pt-BR, voz adulta acolhedora, frases curtas. Nunca infantilizar, humilhar ou prometer alfabetização em prazo fixo.
- Botão de ouvir/ajuda sempre na mesma posição; alvos de toque ≥ 48dp; contraste verificável.
- Repetição ilimitada sem punição. Sem cronômetro, vidas, streak, ranking, publicidade ou compras.
- Feedback nunca depende só de cor, som ou animação.
- Ícones sempre acompanhados de explicação sonora — não presumir que são universais.
- TalkBack/VoiceOver: labels, ordem de foco, sem falas sobrepostas com o áudio do app.

## Regras de engenharia

- **AudioController central** (`src/services/audio/`): impede sobreposição, cancela fala ao trocar de tela, permite repetir, lida com interrupções. Apenas reprodução — permissões de gravação/background desabilitadas no plugin `expo-audio`.
- **Progresso**: salvo após cada resposta relevante; reflete tentativas reais (não abertura de tela); migrações SQLite testadas; falha de storage nunca mostra sucesso falso.
- **Modelos mínimos**: Lesson, Activity, Asset, Attempt (com resultado e ajuda usada), LessonProgress, Preferences.
- **Ajuda vs. pista**: registrar uso de ajuda na Attempt sem penalizar; leitura narrada não conta como leitura independente.
- **Áudio placeholder**: gerar arquivos reais com `say`/`afconvert` do macOS (voz pt-BR) via `scripts/gen-audio.sh`, marcados para substituição por gravação profissional. O fluxo principal nunca pode depender de URLs, assets ausentes ou segredos embutidos.

## Privacidade (MVP)

- Não coletar nome, CPF, nascimento, contatos, foto, localização ou voz. Não gravar voz.
- Logs e relatórios de crash sem dados de aprendizagem. Exclusão de progresso com confirmação acessível.

## Verificação obrigatória antes de concluir qualquer tarefa

1. `npx tsc --noEmit` sem erros.
2. `npm test` (jest) passando.
3. `npx expo export` gera bundle sem erros.
4. Reportar: arquivos criados/alterados, como rodar, testes executados e o que exige validação manual em dispositivo. **Não afirmar teste que não executou.**
