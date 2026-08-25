# Histórico de Alterações do Projeto

## [2026-08-25] - Refatoração do `solutis-flow` (SOLID, React TS Vite Best Practices & Integração `solutis_flow_back`)
- **Descrição**: Refatoração arquitetural do projeto frontend `solutis-flow` aplicando os princípios SOLID da skill `react-ts-vite-best-practices` (Context Splitting, Custom Hooks, utilitário `cn`, State Colocation) e integração completa aos endpoints do microsserviço `solutis_flow_back` via API Gateway.
- **Arquivos afetados**:
  - `solutis-flow/src/utils/cn.ts`
  - `solutis-flow/src/types.ts`
  - `solutis-flow/src/services/api.ts`
  - `solutis-flow/src/hooks/useAuth.ts`
  - `solutis-flow/src/hooks/useDemands.ts`
  - `solutis-flow/src/hooks/useProjects.ts`
  - `solutis-flow/src/hooks/useDashboardMetrics.ts`
  - `solutis-flow/src/hooks/useSSE.ts`
  - `solutis-flow/src/context/FlowContext.tsx`
  - `solutis-flow/src/App.tsx`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **Context Splitting**: Implementado `FlowContext` dividindo estado (`FlowStateContext`) e ações (`FlowDispatchContext`) para eliminar Prop Drilling e otimizar re-renders.
  - **Arquitetura de Custom Hooks**: Lógica de negócios centralizada nos hooks `useAuth`, `useDemands`, `useProjects`, `useDashboardMetrics` e `useSSE`.
  - **Integração Backend Completa**: `api.ts` atualizado para integrar com `/demands`, `/demands/{id}/status`, `/demands/{id}/transfer`, `/demands/{id}/feedback`, `/areas`, `/cost-centers`, `/projects`, `/dashboard/metrics` e `/events/stream` do `solutis_flow_back`.
  - **Validação Estrita de Evidência**: Trata a obrigatoriedade de descrição de evidência/anexo exigida pelo backend ao alterar o status para `CONCLUIDO`.

## [2026-08-25] - Adição de Boas Práticas do Tailwind CSS na Skill `react-ts-vite-best-practices`
- **Descrição**: Ampliação da skill `react-ts-vite-best-practices` incluindo guia de boas práticas para Tailwind CSS (utilitário `cn()`, CVA para gerenciamento de variantes, mapeamento estático no JIT, dark mode com variáveis CSS) e atualização do template de componentes.
- **Arquivos afetados**:
  - `.agents/skills/react-ts-vite-best-practices/SKILL.md`
  - `.agents/skills/react-ts-vite-best-practices/references/tailwind-best-practices.md`
  - `.agents/skills/react-ts-vite-best-practices/templates/component-solid-template.tsx`
  - `.agents/skills/react-ts-vite-best-practices/templates/utils/cn.ts`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - Adicionado guia de boas práticas em Tailwind CSS cobrindo prevenção de conflitos de especificidade, suporte a CVA e organização de estilos.

## [2026-08-25] - Criação da Skill `react-ts-vite-best-practices`
- **Descrição**: Criação de uma skill completa de desenvolvimento para aplicações ReactJS com TypeScript e Vite, focada nos princípios SOLID, otimização de Custom Hooks e Context API, State Colocation e eliminação de Prop Drilling.
- **Arquivos afetados**:
  - `.agents/skills/react-ts-vite-best-practices/SKILL.md`
  - `.agents/skills/react-ts-vite-best-practices/references/solid-in-react.md`
  - `.agents/skills/react-ts-vite-best-practices/references/state-and-context.md`
  - `.agents/skills/react-ts-vite-best-practices/references/custom-hooks-architecture.md`
  - `.agents/skills/react-ts-vite-best-practices/references/vite-performance-optimization.md`
  - `.agents/skills/react-ts-vite-best-practices/templates/component-solid-template.tsx`
  - `.agents/skills/react-ts-vite-best-practices/templates/custom-hook-template.ts`
  - `.agents/skills/react-ts-vite-best-practices/templates/context-template.tsx`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **Skill de Agente**: Disponibilizado guia completo de boas práticas, padrões arquiteturais SOLID, templates reutilizáveis e referências detalhadas para acelerar e padronizar o desenvolvimento frontend React/TS no repositório.

## [2026-08-25] - Criação do Microsserviço `solutis_flow_back` (Governança Operacional, Event-Driven SSE & ACL Independente)
- **Descrição**: Criação completa do novo microsserviço backend `solutis_flow_back` (Python 3.13 + FastAPI + SQLModel + Dramatiq + SSE), com banco de dados isolado, controle de ACL local independente do `manager_back`, referências a usuários via IDs inteiros indexados, integração ao API Gateway do `solutis_manager_back` e conexões em tempo real para o frontend `solutis-flow`.
- **Arquivos afetados**:
  - `solutis_flow_back/pyproject.toml`
  - `solutis_flow_back/.pre-commit-config.yaml`
  - `solutis_flow_back/Dockerfile`
  - `solutis_flow_back/src/config.py`
  - `solutis_flow_back/src/database.py`
  - `solutis_flow_back/src/security.py`
  - `solutis_flow_back/src/models/` (`demand.py`, `area.py`, `cost_center.py`, `project.py`, `demand_observer.py`, `transfer_request.py`, `feedback.py`, `alert.py`, `sop.py`, `recurring_task.py`, `attachment.py`, `comment.py`, `acl.py`)
  - `solutis_flow_back/src/schemas/demand.py`
  - `solutis_flow_back/src/events/` (`broker.py`, `sse_manager.py`, `actors.py`)
  - `solutis_flow_back/src/worker.py`
  - `solutis_flow_back/src/api/v1/` (`demands.py`, `events.py`, `areas.py`, `projects.py`, `dashboard.py`, `acl.py`)
  - `solutis_flow_back/src/main.py`
  - `solutis_flow_back/src/tests/` (`conftest.py`, `test_demands.py`, `test_events.py`, `test_security.py`, `test_acl.py`)
  - `solutis_manager_back/src/proxy/config.py`
  - `solutis_manager_back/src/proxy/routes.py`
  - `solutis_manager_back/src/tests/test_proxy_gateway.py`
  - `docker-compose.dev.yml`
  - `solutis-flow/src/services/api.ts`
  - `solutis-flow/src/hooks/useSSE.ts`
  - `solutis-flow/src/App.tsx`
  - `.spec/project-overview.md`
  - `.spec/architecture.md`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **Novo Microsserviço**: `solutis_flow_back` criado e estruturado com suporte a TDD.
  - **Arquitetura Baseada em Eventos**: Fila assíncrona gerenciada via Dramatiq worker com broker Redis e fallback `StubBroker` para testes.
  - **Notificações SSE**: Transmissão em tempo real via Server-Sent Events (`/api/v1/events/stream`) com filtragem de permissões por usuário.
  - **Validação Estrita de Evidências**: Bloqueio no backend que impede transição para status `CONCLUIDO` se não houver descrição de justificativa/evidência de prova (retorna HTTP 400).
  - **Gateway Roteado**: Configurado o `solutis_manager_back` como Auth Proxy Gateway para todas as rotas `/v1/flow/...`.
  - **Banco de Dados Desacoplado**: Banco isolado do `solutis_flow_back` com campos `user_id` inteiros indexados sem FKs inter-bancos.

## [2026-07-29] - Atualização do Departamento na Avaliação do Compliance | Sustentabilidade
- **Descrição**: Alteração do departamento de "Financeiro" para "Compliance e Sustentabilidade" na etapa de "Avaliação do Compliance | Sustentabilidade" do fluxo de aprovação de fornecedores, aplicando a mudança tanto para novos fluxos quanto para os já existentes.
- **Arquivos afetados**:
  - `solutis_procurement/src/supplier/fixtures/approval_steps.json`
  - `solutis_procurement/src/supplier/tests/conftest.py`
  - `solutis_procurement/src/supplier/tests/test_ninja_v1_api.py`
  - `solutis_procurement/src/supplier/migrations/0037_update_compliance_evaluation_department.py`
  - `solutis_procurement/pyproject.toml`
  - `solutis-agile-frontend/src/components/suppliers/form/approval-workflow-tab.tsx`
  - `solutis-agile-frontend/package.json`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **Fixtures e Testes**: Atualizado o departamento do passo `Avaliação do Compliance | Sustentabilidade` em `approval_steps.json` e `conftest.py` para `"Compliance e Sustentabilidade"`. Criado teste unitário dedicado em `test_ninja_v1_api.py`.
  - **Migração do Banco de Dados**: Criada migração Django `0037_update_compliance_evaluation_department.py` em `solutis_procurement` para atualizar os registros existentes de `ApprovalStep` que contêm "Compliance" no nome para o novo departamento.
  - **Exibição no Frontend**: Adicionada regra de fallback em `approval-workflow-tab.tsx` para garantir a exibição do nome `"Compliance e Sustentabilidade"` para a etapa de compliance no frontend.
  - **Versões**: `solutis_procurement` (`2.18.1` ➡️ `2.18.2`), `solutis-agile-frontend` (`2.7.2` ➡️ `2.7.3`).

## [2026-07-29] - Automação da Execução de Migrations no Deploy dos Serviços de Backend
- **Descrição**: Configuração do deploy dos serviços de backend (`solutis_manager_back` e `solutis_procurement`) para executarem automaticamente suas migrations de banco de dados (Alembic e Django Migrations) antes de iniciarem o servidor HTTP ao realizar o deploy de novas versões.
- **Arquivos afetados**:
  - `docker-compose.prod.yml`
  - `docker-compose.dev.yml`
  - `deploy.sh`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **`docker-compose.prod.yml`**: Atualizado o comando de inicialização do container `agile-back` (`solutis_manager_back`) para executar `uv run alembic upgrade head` antes de iniciar o `uvicorn`. Mantida a execução de `python manage.py migrate --noinput` para o `solutis-procurement`.
  - **`docker-compose.dev.yml`**: Atualizada a inicialização do `agile-back` em ambiente dev/local para também rodar `uv run alembic upgrade head` antes de iniciar o servidor com `--reload`.
  - **`deploy.sh`**: Incluídos logs explicativos no fluxo de deploy para sinalizar a execução de migrations do banco de dados quando novas versões dos microsserviços de backend forem implantadas.

## [2026-07-29] - Correção do Erro de Validação de Data na Criação de Colaboradores (`solutis_manager_back` & `solutis-agile-frontend`)
- **Descrição**: Solução do erro de validação `"Input should be a valid date or datetime, invalid character in year"` exibido ao submeter o formulário de cadastro/edição de colaboradores.
- **Arquivos afetados**:
  - `solutis_manager_back/src/people/schemas.py`
  - `solutis_manager_back/src/tests/test_people.py`
  - `solutis_manager_back/pyproject.toml`
  - `solutis-agile-frontend/src/hooks/employee/useEmployee.ts`
  - `solutis-agile-frontend/package.json`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **Tratamento de Datas no Frontend**: Criada a função `formatDateToISO` em `useEmployee.ts` para converter de forma segura qualquer formato de data (`Date` objeto, string no padrão brasileiro `DD/MM/YYYY`, ou timestamp ISO) para o formato padrão ISO `YYYY-MM-DD` antes do envio da requisição.
  - **Parsing Flexível de Datas no Backend**: Adicionado `@field_validator` com `mode="before"` em `NewEmployeeSchema` e `UpdateEmployeeSchema` no backend para aceitar e converter strings de data no formato brasileiro `DD/MM/YYYY`, timestamps ISO (`YYYY-MM-DDTHH:MM:SS`) e strings vazias/indefinidas (`""`, `"undefined"`, `None`) antes da validação do Pydantic.
  - **Cobertura de Testes (TDD)**: Adicionado o teste `test_new_employee_schema_parses_brazilian_dates` em `test_people.py` para garantir a conversão correta de datas no formato `DD/MM/YYYY` sem lançar erro de validação.
  - **Versões**: `solutis_manager_back` (`1.26.2` ➡️ `1.26.3`), `solutis-agile-frontend` (`2.7.1` ➡️ `2.7.2`).
- **Descrição**: Resolução do erro 500 ao acessar a tela de fornecedores. Adicionadas as regras de roteamento proxy no `PROXY_ROUTES` do `solutis_manager_back` para os endpoints do microsserviço `procurement` (`/v1/suppliers-list/`, `/v1/suppliers/`, `/v1/domain/`, `/v1/approval/`, `/v1/attachments/`, `/v1/attachment-types/`, `/v1/responsibility-matrix/`, `/v1/evaluation/`).
- **Arquivos afetados**:
  - `solutis_manager_back/src/proxy/routes.py`
  - `solutis_manager_back/src/tests/test_proxy_gateway.py`
  - `solutis_manager_back/pyproject.toml`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **`solutis_manager_back`**: Bump de versão de `1.26.1` ➡️ `1.26.2`.
  - **Proxy Routing**: Corrigida a falha de correspondência em `match_route_rule` que retornava HTTP 403 (provocando o erro 500 no frontend ao renderizar o boundary da rota de fornecedores) por ausência do padrão regex para `/v1/suppliers-list/` e demais endpoints do procurement.
  - **Cobertura de Testes**: Atualizado `test_proxy_gateway.py` para validar a correspondência das novas rotas de fornecedores e domínios no gateway.
- **Descrição**: Atualização incremental das versões dos serviços modificados nos últimos commits seguindo as regras de versionamento semântico.
- **Arquivos afetados**:
  - `solutis-agile-frontend/package.json`
  - `solutis_manager_back/pyproject.toml`
  - `solutis_procurement/pyproject.toml`
  - `solutis_report/pyproject.toml`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **`solutis-agile-frontend`**: `2.7.0` ➡️ `2.7.1`
  - **`solutis_manager_back`**: `1.26.0` ➡️ `1.26.1`
  - **`solutis_procurement`**: `2.18.0` ➡️ `2.18.1`
  - **`solutis_report`**: `1.3.1` ➡️ `1.3.2`

## [2026-07-29] - Atualização do Departamento na Avaliação do Gestor (Fluxo de Aprovação de Fornecedores)
- **Descrição**: Alteração do departamento de "Administrativo" para "Gestor" na etapa de "Avaliação do Gestor" do fluxo de aprovação de fornecedores.
- **Arquivos afetados**:
  - `solutis_procurement/src/supplier/fixtures/approval_steps.json`
  - `solutis_procurement/src/supplier/tests/conftest.py`
  - `solutis_procurement/src/supplier/tests/test_ninja_v1_api.py`
  - `solutis_procurement/src/supplier/migrations/0036_update_manager_evaluation_department.py`
  - `solutis-agile-frontend/src/components/suppliers/form/approval-workflow-tab.tsx`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **Fixtures e Testes**: Atualizado o departamento do passo `Avaliação do Gestor` em `approval_steps.json` e `conftest.py` para `"Gestor"`.
  - **Migração do Banco de Dados**: Criada migração Django `0036_update_manager_evaluation_department.py` em `solutis_procurement` para atualizar os registros existentes de `ApprovalStep` com nome "Avaliação do Gestor" no banco de dados.
  - **Exibição no Frontend**: Ajustada a renderização em `approval-workflow-tab.tsx` para garantir a exibição de `"Gestor"` para o passo "Avaliação do Gestor".

## [2026-07-29] - Correção TDD na Criação de Colaboradores e Tratamento de Erros da API
- **Descrição**: Solução dos problemas de criação de colaboradores no formulário (etapa de Endereço) e aprimoramento da normalização de mensagens de erro FastAPI na interface frontend via TDD.
- **Arquivos afetados**:
  - `solutis_manager_back/src/people/schemas.py`
  - `solutis_manager_back/src/tests/test_people.py`
  - `solutis_report/src/core/logging.py`
  - `solutis-agile-frontend/src/lib/api-errors.ts`
  - `solutis-agile-frontend/src/lib/api-errors.test.ts`
  - `solutis-agile-frontend/src/lib/validations/employee.ts`
  - `solutis-agile-frontend/src/hooks/employee/useEmployee.ts`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **Tratamento de Endereço no Frontend**: `useEmployee.ts` agora formata o endereço de maneira nula-segura, prevenindo a injeção da palavra `"UNDEFINED"` na string do endereço caso o complemento seja omitido.
  - **Validação Zod Flexível**: `employeeAddressSchema` atualizado para aceitar `complement` (Complemento) opcional.
  - **Coerção de Strings Vazias no Backend**: Adicionados `@field_validator` em `NewEmployeeSchema` no backend para converter campos opcionais (`role`, `code`, `employer_contract_date`, `employer_end_contract_date`, `employer_number`) vindos como string vazia (`""`) em `None`, prevenindo erros de validação HTTP 422.
  - **Suporte a Erros do FastAPI (`api-errors.ts`)**: `normalizeApiErrors` atualizado para interpretar o padrão `loc` e `msg` das respostas 422 do FastAPI, exibindo a mensagem amigável no toast e apontando o erro diretamente no campo do formulário.
  - **Cobertura de Testes (TDD)**: Criados testes no backend em `test_people.py` (para validar a coerção de campos opcionais com string vazia e montagem de endereço limpo) e no frontend em `api-errors.test.ts` (para validar normalização de erros FastAPI e respostas customizadas).

## [2026-07-29] - Otimização dos Testes do Backend e Correção da Criação de Colaboradores
- **Descrição**: Otimização do tempo de execução da suíte de testes unitários do `solutis_manager_back` (fast-path com SQLite em memória e cache de verificação MySQL) e correção dos erros na criação de colaboradores.
- **Arquivos afetados**:
  - `solutis_manager_back/src/config.py`
  - `solutis_manager_back/conftest.py`
  - `solutis_manager_back/src/tests/base.py`
  - `solutis_manager_back/src/people/schemas.py`
  - `solutis_manager_back/src/people/service.py`
  - `solutis_manager_back/src/tests/test_people.py`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - **Performance de Testes**: A suíte de testes unitários agora roda por padrão com SQLite em memória (`TEST_DATABASE_URL="sqlite:///:memory:"` e `USE_SQLITE_TEST="true"` em `conftest.py`), eliminando o timeout de conexão de 5s por teste quando o MySQL não está rodando localmente.
  - **Correção da Criação de Colaborador**:
    - Truncamento seguro e suporte a RG (`nationalIdentification`) opcional no schema e serviço para evitar erros de validação HTTP 422.
    - `__generate_code` atualizado para tratar banco sem colaboradores anteriores (`last_employee is None`) e nomes vazios sem lançar `AttributeError` ou `IndexError`.
    - Verificação de CPF duplicado (`taxpayer_identification`) agora valida todos os registros da tabela `employees` (independentemente de `legal_person`), retornando HTTP 400 amigável em vez de `IntegrityError` (500).
    - Tolerância a valores nulos em relacionamentos opcionais na serialização de colaboradores.

## [2026-07-29] - Atualização do Detalhamento dos Componentes em Project Overview
- **Descrição**: Atualização detalhada das responsabilidades de cada serviço (`solutis_manager_backend`, `solutis_procurement`, `solutis_report`, `solutis-agile-front`, `solutis-flow` e `solutis-sync`) em `.spec/project-overview.md`.
- **Arquivos afetados**:
  - `.spec/project-overview.md`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - Visão geral enriquecida com a discriminação completa dos módulos de cada serviço (como Auth/Authz, Comodato, Ativos, Clicksign e Auth Proxy no Backend Manager, Flow para gestão de atividades e Report v2).

## [2026-07-29] - Criação do Framework de Especificação (.spec) e Skills do Agente
- **Descrição**: Criação das skills `spec-updater` e `spec-reader`, configuração de regras em `.agents/AGENTS.md` e inicialização da estrutura da pasta `.spec/` para documentação viva do projeto.
- **Arquivos afetados**:
  - `.agents/skills/spec-updater/SKILL.md`
  - `.agents/skills/spec-reader/SKILL.md`
  - `.agents/AGENTS.md`
  - `.spec/project-overview.md`
  - `.spec/architecture.md`
  - `.spec/changes-log.md`
- **Impacto / Mudanças principais**:
  - O agente agora lê a pasta `.spec/` no início de cada ação (`spec-reader`) e atualiza o histórico e entendimento do projeto a cada alteração feita no código (`spec-updater`).
