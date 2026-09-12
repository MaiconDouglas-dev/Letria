# Especificação — Passo a Palavra

Aplicativo de alfabetização guiado por áudio. Público inicial: adultos e idosos falantes de português brasileiro. **Proposta de produto a validar com usuários e educadores — não é um método de alfabetização comprovado.** Decisões pedagógicas marcadas como "a validar" exigem revisão de educadores de alfabetização de adultos.

## 1. Contexto e objetivo

Pessoas que não sabem ler ou escrever, ou têm dificuldade com textos simples, mas já usam celular por áudios, imagens e memorização da posição dos botões. O app ensina leitura e escrita progressivamente, partindo da comunicação oral e conectando sons, letras, palavras e significados.

- Uso autônomo desde a primeira abertura: navegação, erros, orientações e configurações essenciais compreensíveis por voz e demonstrações visuais.
- Não presumir que dificuldade de leitura significa dificuldade intelectual. Evitar infantilização, humilhação, comparações públicas e promessas de prazo fixo.
- Piloto em comunidade de São Paulo, buscando colaboração de educadores de EJA e organizações locais (sem presumir parcerias). Útil em outras cidades; sem depender de geolocalização. Crianças e outros idiomas são expansões com projeto próprio.
- Resultado desejado: avanços observáveis em leitura/escrita de situações cotidianas, complementando educação presencial. Diferenciar acesso ao conteúdo, engajamento e aprendizagem efetiva.

## 2. Decisão técnica

- **React Native + Expo + TypeScript**, código compartilhado entre Android e iOS. Development builds para validar o app real; Expo Go só para experimentos.
- Expo Router (navegação), `expo-audio` (áudios), `expo-sqlite` (progresso local), `expo-secure-store` (apenas pequenos segredos se houver autenticação futura). SQLite não é criptografado por padrão; SecureStore não é backup de progresso.
- Justificativa: equipe pequena, uma codebase, ecossistema maduro de áudio/acessibilidade. Alternativas: Flutter (performance e tooling fortes, curva Dart, acessibilidade comparável) e nativo Kotlin/Swift (máximo controle, dobro de manutenção). Nenhuma é universalmente melhor; a escolha privilegia velocidade de iteração com equipe enxuta.
- **MVP sem backend.** Sem autenticação, serviços de IA, microserviços, Redis, filas ou Kubernetes sem necessidade demonstrada. Se sincronização/distribuição remota surgir, backend simples (Java + Spring Boot é opção adequada ao conhecimento do desenvolvedor, não exigência).
- Verificar versões estáveis, compatibilidade e requisitos de loja na documentação oficial no momento da implementação. Não inventar versões, preços ou requisitos.

## 3. Escopo do MVP

- Entrada sem conta, e-mail, telefone ou digitação obrigatória.
- Um perfil local por instalação — não equivale a conta recuperável; aparelho compartilhado exige cuidado (aviso acessível).
- Acolhimento por áudio + demonstração de tocar, ouvir, repetir e avançar.
- Botão de ajuda sempre na mesma posição; retorno simples à atividade.
- Home com uma ação principal: continuar aprendendo. Revisão e ajustes em segundo plano.
- Módulo inicial de ~10–12 microlições, sessões de 3–7 min (ajustável após testes). Não é um curso completo.
- Três formatos reutilizáveis: (a) ouvir e selecionar opção; (b) relacionar palavra escrita a significado; (c) montar palavra com letras/sílabas por toque. Arrastar é adicional, nunca a única alternativa.
- Revisão de conteúdos anteriores, pistas graduais, repetição sem punição.
- Progresso salvo após cada resposta relevante; retomada após fechar o app.
- Áudios, imagens e atividades essenciais disponíveis sem internet desde a instalação.
- Ajustes de som, repetição, tamanho visual e apagar progresso — explicados também em áudio.
- Encerramento de sessão que reconhece esforço sem afirmar domínio não demonstrado.

**Fora do MVP:** reconhecimento de fala, correção de pronúncia, escrita manual com reconhecimento, tutor de IA, chat, ranking, rede social, painel de professor, múltiplos perfis, contas, sincronização, notificações, biblioteca extensa. Não pedir permissão de microfone só para reproduzir áudio.

## 4. Proposta pedagógica (a validar)

- Progressão revisável combinando consciência dos sons da fala, relação grafema↔fonema, composição e leitura de palavras, escrita e compreensão contextual. Não confundir nome da letra com seu som; a escrita portuguesa não é relação 1:1 som-letra.
- Palavras e situações relevantes para adultos: transporte, trabalho, alimentação, família, mensagens curtas, placas. Não usar só memorização de imagens nem reconhecimento de logotipos como prova de leitura.
- Cada microlição declara: objetivo observável, pré-requisitos, duração estimada, roteiro de áudio, elementos visuais, tarefa, feedback, pistas, revisão e evidência de aprendizagem. `docs/MODULO-1.md` mantém a tabela das 10–12 lições e três lições desenvolvidas integralmente — rascunhos para revisão pedagógica.
- Separar ajuda de navegação de pistas que entregam a resposta. Leitura com palavra narrada não conta como leitura independente. Registrar uso de ajuda sem penalizar; medir aprendizagem com itens novos, não só repetidos.
- Escrita por composição de letras na tela — não comprova escrita à mão. Futuramente, atividades fora da tela sem exigir impressora/outro dispositivo.
- Sem reconhecimento de fala como juiz: sotaque, ruído, gagueira e diferenças de fala não geram classificação de incapacidade. Avanço e revisão transparentes, sem diagnóstico automatizado.

## 5. Experiência sem leitura prévia

Cada tela documenta: objetivo, conteúdo visível, áudio exato, gesto esperado, resposta do sistema, ajuda e estados de falha. Telas: abertura, tutorial, home, atividade, feedback, revisão, progresso, configurações.

- Caminho completo da primeira abertura à conclusão da primeira aula sem precisar ler. Demonstração curta do botão de ouvir; avaliar com usuários se saudação única inicial é adequada. Sem narração automática interminável; pausa imediata.
- Alvos de toque ≥ 48dp, espaçamento, contraste verificável, foco visível quando aplicável, ícones com rótulo simples + explicação sonora. Ícones precisam ser aprendidos — não são universais. Feedback nunca só por cor/som/animação.
- Repetir instruções, ajustar ritmo quando não distorce o objetivo didático, interromper atividade. Sem cronômetro, vidas, streak punitivo, publicidade ou compras no caminho de aprendizagem.
- TalkBack e VoiceOver: ordem de foco, rótulos, ações, feedback, sem falas sobrepostas. Narração própria do app coexiste com leitor de tela. Alternativa à seleção visual; adaptações pedagógicas para pessoas cegas exigem projeto específico — não prometer equivalência antes dos testes.
- Texto acompanha áudios, mas pessoas surdas que ainda não leem podem precisar de Libras e adaptação adicional — limite declarado, trabalho com especialistas para ampliar acesso.
- Considerar: local barulhento, volume zerado, fone desconectado, chamada recebida, telas pequenas, fontes ampliadas, tremor, dificuldade motora, pouca familiaridade digital.

## 6. Áudio e conteúdo

- Áudios gravados/produzidos previamente e revisados por pessoas qualificadas (placeholders locais no desenvolvimento, marcados para substituição). Licenças de voz, imagem, fonte e efeitos identificadas. Voz adulta acolhedora, pt-BR, frases curtas. Sons isolados de alfabetização exigem revisão específica — TTS genérico pode não reproduzi-los.
- Não depender de TTS do aparelho para conteúdo essencial. Síntese de voz ≠ reconhecimento de fala. Sem chamadas a serviços pagos de IA por exercício.
- AudioController: sem sobreposição, cancela fala de tela anterior, libera recursos, repete sob demanda, lida com interrupções. Primeira lição funciona em modo avião. Só reprodução — sem permissões de gravação/background desnecessárias.
- Conteúdo separado de código: lição/atividade com id estável, versão, objetivos, pré-requisitos, referências de áudio/imagem, alternativas, regras de resposta e pistas. Validar schema e existência dos arquivos antes de publicar.

## 7. Arquitetura e modelo de dados

- Estrutura por features: `onboarding`, `learning`, `review`, `progress`, `settings` + componentes compartilhados e serviços de áudio, conteúdo e persistência. Separação simples e testável, sem camadas sem função.
- Modelos mínimos: `Lesson`, `Activity`, `Asset`, `Attempt` (id, versão do conteúdo, resultado, ajuda usada, sequência local), `LessonProgress`, `Preferences`. Não salvar eventos detalhados indefinidamente sem finalidade.
- Gravações transacionais, migrações SQLite, retomada após falha, atualização de conteúdo, recuperação de banco incompatível sem apagar dados silenciosamente. Progresso reflete tentativas reais, não abertura de tela.
- Futura sincronização: ids idempotentes, fila persistente, retentativas limitadas, resolução de conflitos sem depender só do relógio do aparelho, exclusão não revertida por reenvio de dados antigos.
- Serviço remoto (se/quando necessário): contrato de API só para a fase correspondente, com autenticação, autorização por proprietário, paginação e validação. Sem endpoints artificiais para funcionalidades locais.

## 8. Segurança e privacidade

Tabela de ameaças (risco, cenário, impacto, mitigação, risco residual, teste) em `docs/SEGURANCA.md`, cobrindo: aparelho perdido/compartilhado e exposição do histórico; coleta excessiva de identidade/voz/localização/contatos; vazamento em logs, crash reports, analytics e SDKs; chaves privadas no app e engenharia reversa; acesso ao progresso de outra pessoa em API futura; pacotes de conteúdo adulterados e downloads interrompidos; dependências vulneráveis e updates maliciosos; perda de progresso por desinstalação/falha/migração/troca de aparelho; exposição por notificações, backups e exportações; acesso indevido por familiares/educadores.

- MVP não exige nome completo, CPF, nascimento, contatos, fotos, localização ou voz. Progresso local também revela informação privada — proteção proporcional. Sem login não significa anonimato absoluto.
- Sem gravação de voz no MVP. Futura gravação: finalidade, necessidade, base legal, permissão contextual, indicador visível, retenção, exclusão; preferir processamento local. Não enviar voz a terceiros nem usar para treinamento sem análise e autorização.
- Aviso de privacidade em linguagem simples + áudio, além do texto. Permissão do SO ≠ autorização do usuário ≠ base legal. Inventário de dados, finalidade, retenção e canal acessível para pedidos. Adequação à LGPD é trabalho a verificar na operação real.
- Apagar progresso: confirmação compreensível + prevenção de toque acidental. Limites honestos de exclusão em backups/retenções. Sem conta, avisar que recuperação após desinstalação/perda não é garantida.
- Futuras contas: comparar entrada/recuperação acessíveis e limites de SMS/e-mail. Sem senha visual fraca. Tokens em armazenamento adequado, TLS, autorização no servidor, rate limiting, credenciais admin separadas.
- Sem compartilhamento automático com cuidadores — escopo, autorização e revogação. Sem anúncios comportamentais, venda de dados de aprendizagem ou classificação pública de usuários como analfabetos.

## 9. Portabilidade, desempenho e offline

- Android e iOS obrigatórios; tablets com layout adaptável. Web futura possível, sem prometer reaproveitamento integral (persistência, áudio, acessibilidade, instalação e restrições do navegador exigem revisão).
- Matriz de compatibilidade por plataforma, versão de SO, memória, tela e recurso. Sistemas mínimos só após verificar a stack e os aparelhos do piloto. Testar celulares físicos modestos, não só simuladores/aparelhos recentes.
- Metas iniciais de engenharia (a validar, com método de medição documentado): primeira tela interativa ≤ 3s no aparelho de referência; resposta visual ao toque ≤ 150ms; início de áudio local ≤ 500ms; pacote inicial preferencialmente ≤ 100MB por plataforma. Não apresentar como desempenho já obtido.
- Núcleo sem conexão; conteúdos adicionais baixáveis depois com: tamanho visível antes do download, adiar, retomar, verificação de integridade e ativação atômica mantendo o último pacote íntegro. Hash de origem autenticada — checksum sozinho não comprova autenticidade.
- Baixo armazenamento: aviso acessível + progresso preservado. Remover módulos não remove tentativas sem autorização. Backup/exportação/importação são decisões explícitas de versões futuras, com esquema versionado e proteção. Portabilidade de código ≠ portabilidade de dados do usuário.

## 10. Testes e critérios de aceite

Histórias de usuário com critérios Dado/Quando/Então, incluindo no mínimo:

- Pessoa sem leitura inicia e conclui atividade sem digitar nem depender de instruções escritas.
- Primeira instalação permite a primeira lição sem internet após instalado.
- Fechar e reabrir preserva a última resposta confirmada.
- Repetir instrução não sobrepõe áudios nem troca resposta acidentalmente.
- Sem permissão de microfone, todas as funções do MVP funcionam.
- Fonte ampliada não esconde ações; TalkBack e VoiceOver percorrem o fluxo principal.
- Falha de armazenamento não mostra sucesso falso nem apaga histórico.
- Exclusão exige confirmação compreensível e remove os dados locais previstos.
- Atualização de app e conteúdo mantém compatibilidade ou aplica migração testada.
- Correção considera resposta e ajuda utilizada; tocar aleatoriamente não comprova domínio.

Níveis: unitários (progressão, avaliação, persistência), integração (migrações, áudio), ponta a ponta (jornada principal), manuais em dispositivos reais. Acessibilidade não se comprova só com testes automatizados.

Pesquisa: duas rodadas exploratórias com ~5–8 adultos cada, participação informada, sem constrangimento, revisão de educadores — proposta qualitativa, não amostra de eficácia. Registrar ajuda necessária, erros de navegação, conclusão e entendimento das instruções. Gravação de pesquisa opcional e justificada.

Medição: aprendizagem inicial e posterior com tarefas equivalentes e itens novos, distinguindo leitura independente de guiada. Tempo de tela, streak e cliques não substituem aprendizagem. O primeiro MVP valida usabilidade e sinais iniciais — não certifica alfabetização.

## 11. Entrega, custos e evolução

Marcos com dependências e critérios de conclusão:

1. Escuta de usuários e educadores; recorte e conteúdo.
2. Protótipo de navegação por áudio; validação da primeira atividade.
3. Fluxo vertical real: iniciar, ouvir, responder, feedback, salvar, retomar.
4. Módulo inicial com os três tipos de atividade.
5. Testes offline, acessibilidade, privacidade, falhas e aparelhos físicos.
6. Piloto limitado, correções, preparação das lojas.
7. Decisão baseada em evidências sobre novos módulos, contas e sincronização.

Esforço estimado em faixas, declarando equipe e disponibilidade. Separar programação, produção/revisão pedagógica, gravação, design e pesquisa — não esconder custo de conteúdo. Custos pontuais vs. recorrentes: contas de desenvolvedor, dispositivos, builds, distribuição, domínio, suporte, infraestrutura. Verificar valores em fontes oficiais ou marcar como pendentes.

Código compartilhado não elimina builds, assinatura, testes e aprovação independentes em Google Play e App Store: políticas vigentes, declarações de dados dos SDKs, classificação etária, licenças, acessibilidade e distribuição de testes. Com contas futuras, verificar requisitos de exclusão e recuperação antes de publicar.

Sustentabilidade sem cobrar acesso básico no piloto: editais, patrocínios sem exploração de dados, parcerias institucionais — hipóteses a investigar, não fatos.

## Referências técnicas (consultadas em 12/09/2026)

- Expo development builds: https://docs.expo.dev/develop/development-builds/introduction/
- Expo Audio: https://docs.expo.dev/versions/latest/sdk/audio/
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Expo SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/
- React Native — acessibilidade: https://reactnative.dev/docs/accessibility

Versões e políticas devem ser verificadas novamente durante a implementação.
