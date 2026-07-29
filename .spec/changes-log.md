# Histórico de Alterações do Projeto

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
