# Workspace Agent Rules - Solutis Agile

## Diretrizes Obrigatórias de Contexto e Documentação

1. **Leitura Prévia de Contexto (`spec-reader`)**:
   - Antes de realizar qualquer ação, análise ou alteração no código deste repositório, você DEVE ler o conteúdo da pasta `.spec/` (`project-overview.md`, `architecture.md` e `changes-log.md`).
   - Use o entendimento contido em `.spec/` para guiar o planejamento e as implementações.

2. **Registro e Atualização Pós-Alteração (`spec-updater`)**:
   - Sempre que fizer uma alteração no código (funcionalidade, bugfix, refatoração ou configuração), você DEVE atualizar a pasta `.spec/`.
   - Adicione o registro da alteração em `.spec/changes-log.md`.
   - Atualize a visão geral (`.spec/project-overview.md`) e a arquitetura (`.spec/architecture.md`) caso a mudança afete o escopo ou contrato dos componentes do projeto.

3. **Desenvolvimento Orientado a Testes e Performance de Testes (`tdd`)**:
   - Sempre use a abordagem TDD (Test-Driven Development) ao implementar novas funcionalidades ou realizar correções de bugs neste repositório.
   - Garanta que a suíte de testes seja otimizada e possua alta performance de execução.

