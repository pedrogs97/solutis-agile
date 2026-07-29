---
name: spec-reader
description: Lê a pasta .spec/ antes de realizar qualquer ação para carregar o contexto, arquitetura e histórico de alterações do projeto.
---

# Spec Reader Skill

Esta skill instrui o agente a ler os arquivos da pasta `.spec/` antes de iniciar qualquer tarefa ou alteração no código para garantir total alinhamento com a arquitetura e histórico do projeto.

## Quando executar

Execute esta skill obrigatoriamente no início de qualquer nova interação, análise de requisitos, investigação de bug ou implementação de funcionalidade.

## Procedimento de Leitura

1. **Verificar a existência da pasta `.spec/`** no diretório raiz da workspace (`/home/pedroglsa/projects/solutis-agile/.spec/`).
2. **Ler os arquivos principais em `.spec/`**:
   - `.spec/project-overview.md`: Para entender o objetivo geral, tecnologias e contexto de negócio.
   - `.spec/architecture.md`: Para compreender os microsserviços, portas, integrações e dependências de dados.
   - `.spec/changes-log.md`: Para tomar conhecimento das últimas alterações realizadas recentemente.
3. **Analisar restrições e padrões**:
   - Utilize as informações lidas para contextualizar o plano de ação, prevenir quebras de compatibilidade com outros serviços e seguir as convenções estabelecidas.
