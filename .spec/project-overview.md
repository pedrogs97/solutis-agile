# Visão Geral do Projeto - Solutis Agile Monorepo

## Objetivo de Negócio
O **Solutis Agile** é um ecossistema modularizado para gestão, automação de comodatos, controle de ativos, relatórios, gestão de fornecedores e sincronização de dados da Solutis. O monorepo centraliza todos os microsserviços, portais frontend e utilitários associados.

## Componentes do Ecossistema

### ⚙️ `solutis_manager_back` (Backend Manager Core)
Serviço base e coração da solução com toda a lógica de autenticação e autorização. Contém os seguintes módulos e responsabilidades:
- **Autenticação e Autorização**: Gestão centralizada de permissões e controle de acesso.
- **Módulos Core**: Comodato, Colaborador, Ativos, Relatórios (versão antiga/legada), Inventário, Documentos, Notas Fiscais, Manutenção e Melhoria, Termo de Empréstimo, Verificação de Ativo, Logs e Uso da Plataforma.
- **Integrações e Proxy**: Integração com Clicksign para assinatura digital de documentos e Auth Proxy atuando como gateway/proxy de autenticação para os demais microsserviços.

### 🛒 `solutis_procurement` (Procurement Service)
- Módulo de fornecedores da aplicação, responsável pelo cadastro, qualificação e gerenciamento de fornecedores.

### 📊 `solutis_report` (Report Service v2)
- Versão 2 (v2) do serviço de relatórios da aplicação, responsável pela geração de relatórios de avaliação.

### 💻 `solutis-agile-frontend` (Portal Frontend Principal)
- Frontend principal da aplicação. Contempla a interface de todos os módulos e consome todos os microsserviços do ecossistema.

### 🌊 `solutis-flow` & `solutis_flow_back` (Plataforma de Governança Operacional e Gestão de Demandas)
- **`solutis-flow`**: Frontend React/TypeScript de governança operacional, Kanban, acompanhamento de SLAs e alertas.
- **`solutis_flow_back`**: Novo microsserviço backend de governança operacional e orquestração de processos baseada em eventos (Event-Driven com Dramatiq workers e Server-Sent Events - SSE em tempo real), com banco de dados isolado e referências a usuários via IDs inteiros indexados.

### ⚡ `solutis-sync` (Sync Service)
- Serviço de sincronização assíncrona responsável por extrair e atualizar dados do banco do ERP TOTVS para o banco de dados da aplicação.

---

## Tabela Resumo de Componentes

| Componente | Tecnologias Principais | Papel no Sistema |
| :--- | :--- | :--- |
| **`solutis_manager_back`** | Python 3.13, FastAPI, SQLAlchemy, Alembic | Serviço base e coração da solução (Auth/Authz, Auth Proxy, Clicksign, Ativos, Comodatos, etc.) |
| **`solutis_procurement`** | Python, Django, Uvicorn, Pydantic | Módulo de Fornecedores |
| **`solutis_report`** | Python 3.13, FastAPI, SQLModel, OpenPyXL | v2 dos Relatórios da Aplicação |
| **`solutis_flow_back`** | Python 3.13, FastAPI, SQLModel, Dramatiq, Redis, SSE | Backend de Governança Operacional, Demandas e Eventos |
| **`solutis-agile-frontend`** | React 19, TypeScript, Mantine UI, TanStack Router | Frontend principal da aplicação (unifica todos os módulos) |
| **`solutis-flow`** | React / TypeScript | Frontend da aplicação de Gestão de Atividades e Governança Operacional |
| **`solutis-sync`** | Python 3.13, FastAPI, SQLModel, APScheduler | Sincronizador do banco da TOTVS ➡️ Banco da aplicação |

---

## Convenções do Monorepo
- **Gerenciamento de Dependências Python**: Utiliza `uv` e `pyproject.toml` individual em cada microsserviço.
- **Qualidade de Código & Linting**: Utiliza obrigatoriamente `pre-commit` com `ruff` (linter `ruff --fix` e formatador `ruff-format`) em todos os microsserviços Python do repositório (`.pre-commit-config.yaml`).
- **Deploy**: Pipeline automatizado via `deploy.sh` e `docker-compose.prod.yml` com detecção de versão por serviço e execução automática de migrations de banco de dados (`alembic` no `solutis_manager_back` e `django migrate` no `solutis_procurement`).
- **Documentação viva**: Mantida na pasta `.spec/` e atualizada a cada alteração via skills do agente (`spec-updater` e `spec-reader`).
