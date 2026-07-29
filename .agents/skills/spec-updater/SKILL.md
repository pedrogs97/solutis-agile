---
name: spec-updater
description: Captura e atualiza o sumário de alterações e o entendimento do projeto na pasta .spec/ sempre que uma modificação for realizada no código ou na arquitetura.
---

# Spec Updater Skill

Esta skill instrui o agente a documentar alterações e manter atualizado o conhecimento sobre o projeto na pasta `.spec/`.

## Quando executar

Sempre que você (agente) fizer uma alteração no código, refatoração, correção de bug, adição de funcionalidade ou mudança arquitetural no projeto, execute este procedimento de atualização antes de concluir a tarefa.

## Estrutura da pasta `.spec/`

A pasta `.spec/` no diretório raiz do projeto contém a especificação e histórico vivo do sistema:

- **`.spec/project-overview.md`**: Visão geral do projeto, objetivo de negócio, serviços principais, tecnologias utilizadas e convenções.
- **`.spec/architecture.md`**: Detalhamento técnico da arquitetura, fluxo de dados, integrações entre microsserviços e bancos de dados.
- **`.spec/changes-log.md`**: Registro cronológico de alterações realizadas em cada sessão/tarefa.

## Diretrizes de Atualização

### 1. Atualizar `.spec/changes-log.md`
Sempre adicione uma nova entrada no topo da lista com o seguinte formato:

```markdown
## [YYYY-MM-DD] - <Título sucinto da alteração>
- **Descrição**: <Explicação clara do que foi feito e o motivo>
- **Arquivos afetados**:
  - `caminho/do/arquivo1.ext`
  - `caminho/do/arquivo2.ext`
- **Impacto / Mudanças principais**:
  - <Detalhe do impacto nos componentes ou contratos de API>
```

### 2. Atualizar `.spec/project-overview.md` ou `.spec/architecture.md`
Se a alteração adicionar novos serviços, alterar rotas de API, modificar entidades de banco de dados ou alterar o comportamento global:
- Atualize a seção correspondente em `.spec/project-overview.md` ou `.spec/architecture.md`.
- Garanta que o entendimento geral do projeto permaneça sempre alinhado com o estado atual do código.
