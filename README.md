# Passo a Palavra

Aplicativo de alfabetização guiado por áudio para adultos e idosos falantes de português brasileiro que ainda não leem ou têm dificuldade com textos simples.

> **Status:** protótipo/MVP em validação. Esta é uma proposta de produto, não um método de alfabetização comprovado. A sequência pedagógica, os áudios e as atividades precisam ser revisados por educadores de EJA e testados com pessoas do público-alvo antes de qualquer afirmação de eficácia.

## Visão geral

O Passo a Palavra foi pensado para permitir que a pessoa use o app desde a primeira abertura sem depender de leitura prévia. A navegação, as instruções, os erros, a ajuda e as configurações essenciais são acompanhados por áudio e demonstrações visuais.

O MVP oferece:

- onboarding com demonstração de ouvir, repetir e avançar;
- dez microlições sobre sons, letras, sílabas, palavras e significados;
- atividades de ouvir e selecionar, relacionar palavra e significado e montar palavras;
- pistas graduais e repetição ilimitada, sem punição;
- revisão de conteúdos anteriores e retomada do ponto salvo;
- progresso local em SQLite;
- áudios e conteúdo essenciais empacotados para uso offline;
- ajustes de som, ritmo, tamanho visual e exclusão do progresso;
- foco em alvos de toque grandes, feedback visual e sonoro e labels para leitores de tela.

O app não exige conta, login, internet, microfone ou gravação de voz. Não há ranking, streak, publicidade, compras, reconhecimento de fala ou tutor de IA.

## Limites importantes

- O módulo inicial não é um curso completo de alfabetização.
- Concluir uma lição não significa domínio do conteúdo.
- Montar palavras na tela não comprova escrita à mão.
- A voz atual é um placeholder gerado durante o desenvolvimento e deve ser substituída por gravações revisadas.
- Sons isolados de letras ainda precisam de revisão pedagógica e fonética; a síntese atual pode pronunciar nomes de letras em vez de fonemas.
- Ilustrações e alguns elementos visuais ainda são placeholders.
- Acessibilidade não é considerada comprovada apenas pelos testes automatizados: TalkBack, VoiceOver, fontes ampliadas e uso em aparelhos reais ainda precisam ser avaliados.

## Stack

- React Native
- Expo SDK 57 com development builds
- TypeScript
- Expo Router
- `expo-audio` para reprodução local
- `expo-sqlite` para progresso local
- Jest e `jest-expo` para testes

O projeto não possui backend no MVP. O conteúdo é versionado como JSON em `content/`, separado da implementação, e os assets essenciais ficam em `assets/`.

## Pré-requisitos

- Node.js compatível com a versão do Expo SDK 57 usada no projeto;
- npm;
- Android Studio/emulador Android ou Xcode/simulador iOS para executar o app;
- development build para validar o comportamento nativo real. Expo Go pode ser usado apenas para experimentos rápidos.

As versões e os requisitos da plataforma devem ser conferidos na documentação oficial do Expo antes de atualizar dependências ou preparar uma distribuição.

## Instalação e execução

```bash
npm install
npm run start
```

No terminal do Expo, escolha a plataforma ou use os atalhos:

```bash
npm run android
npm run ios
npm run web
```

Para gerar novamente os áudios placeholder depois de alterar o conteúdo:

```bash
npm run gen:audio
```

O fluxo principal foi desenhado para funcionar sem chamadas de rede. Em development build, o bundle e os assets ficam no aplicativo instalado.

## Testes e validação

Verificações automatizadas do projeto:

```bash
npx tsc --noEmit
npm test
npx expo export
```

Os testes cobrem avaliação de respostas, sessões e retomada, schema e assets do conteúdo, migrações e operações do banco, revisão e progressão da trilha.

Para uma verificação offline manual:

1. Instale o app e conclua o onboarding.
2. Feche o app completamente.
3. Ative o modo avião no aparelho ou emulador.
4. Abra novamente e entre em **Continuar aprendendo**.
5. Confirme que a lição 1 abre, reproduz os áudios, aceita respostas e salva o progresso.

Ainda exigem validação manual em aparelho físico: TalkBack/VoiceOver, interrupções e fones, volume baixo, telas pequenas, fonte ampliada, toque com dificuldade motora, baixo armazenamento e compreensão das instruções pelo público-alvo.

## Estrutura do projeto

```text
app/                     Telas e rotas do Expo Router
assets/audio/            Áudios locais do app e das lições
content/                 Conteúdo versionado em JSON
src/features/            Aprendizagem, revisão e trilha
src/services/audio/      AudioController central
src/services/content/    Loader e schema do conteúdo
src/services/db/         Driver, migrações e repositório SQLite
src/shared/              Tema e componentes reutilizáveis
__tests__/               Testes unitários e de integração
docs/                    Especificação, módulo e estratégia de testes
scripts/                 Geração dos áudios placeholder
```

O `AudioController` evita sobreposição, permite repetição, cancela o áudio da tela anterior e trata interrupções. O progresso é salvo após respostas relevantes e registra tentativas, resultado e ajuda utilizada.

## Conteúdo do módulo inicial

O Módulo 1, **Primeiras palavras**, contém dez lições curtas, estimadas em sessões de aproximadamente 3 a 7 minutos:

1. Ouvir e encontrar
2. Os sons das vogais
3. Consoantes que abrem palavras
4. Juntando letras em sílabas
5. Palavra e figura
6. Palavras da rua
7. Montando por sílabas
8. Mais palavras por sílabas
9. Montando letra por letra
10. Revisão do módulo

Cada atividade declara objetivo, áudio, opções ou peças, pistas, feedback e regras de resposta. A ajuda é registrada sem penalizar a pessoa; uma resposta com a palavra narrada é diferenciada de uma leitura independente candidata.

## Privacidade

No MVP, o app não coleta nome, CPF, nascimento, contatos, foto, localização ou voz. O progresso permanece local e não há analytics, anúncios ou compartilhamento automático com familiares, cuidadores ou educadores.

Progresso local ainda pode revelar informações sobre o uso do app. Sem conta também significa que não há recuperação garantida após perda ou desinstalação do aparelho. A exclusão do progresso deve ser confirmada de forma compreensível e acessível.

## Documentação

- [Especificação do produto](docs/ESPECIFICACAO.md)
- [Plano do Módulo 1](docs/MODULO-1.md)
- [Estratégia e cobertura de testes](docs/TESTES.md)
- [Configuração do projeto](AGENTS.md)

## Próximos passos

- revisar sequência e fonemas com educadores de alfabetização de adultos;
- substituir placeholders por áudio e ilustrações produzidos e revisados;
- testar a primeira atividade com pessoas do público-alvo;
- validar acessibilidade e funcionamento offline em aparelhos físicos modestos;
- definir evidências de aprendizagem com itens novos, sem confundir uso ou conclusão com alfabetização;
- só então avaliar novos módulos, distribuição e necessidades futuras de sincronização.

## Licença

Consulte [LICENSE](LICENSE).