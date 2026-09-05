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

4. **Qualidade de Código e Pre-commit (`ruff`)**:
   - Para qualquer microsserviço Python novo ou existente neste repositório, você DEVE incluir/manter o arquivo `.pre-commit-config.yaml` padronizado utilizando `ruff` (linter `ruff --fix` e `ruff-format`).

5. **Segurança e Validação de Alertas e Mensagens na UI (`user-alert-validation`)**:
   - Ao implementar, alterar ou revisar alertas, toasts, notificações, modais ou banners nos frontends (`solutis-agile-frontend` e `solutis-flow`), você DEVE seguir a skill `user-alert-validation`.
   - NUNCA exponha tokens JWT, credenciais de integrações externas (Clicksign, ERP TOTVS), senhas, stack traces de backend ou mensagens técnicas brutas de exceção na UI do usuário final.

6. **Deploy Remoto Seguro e Atualização de Versões (`deploy`)**:
   - Ao realizar deploys para o servidor `Solutis` (`172.21.3.225`), você DEVE seguir obrigatoriamente a skill `deploy`.
   - **Garantia de Versões**: Garanta que o incremento de versões dos serviços modificados foi realizado antes de iniciar o deploy (`remote_deploy.py --check-versions-only` ou `--auto-bump`).
   - **Solicitação Obrigatória de Senha**: NUNCA tente executar o deploy remoto sem antes solicitar de forma explícita a senha do servidor e `sudo` ao usuário no chat.
   - **Sigilo de Credenciais**: NUNCA exponha, versione ou repita a senha recebida nas respostas, logs ou resumos.
   - **Diagnóstico de VPN**: Em caso de falha de conexão ou timeout com o host `Solutis`, oriente imediatamente o usuário a verificar se a VPN corporativa da Solutis está ativa e conectada.

