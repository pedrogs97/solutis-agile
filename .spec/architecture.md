# Arquitetura do Sistema - Solutis Agile

## Diagrama de Microsserviços

```mermaid
graph TD
    %% Frontend
    FE[💻 Frontend - Port: 3000]

    %% APIs / Backends
    MB[⚙️ Manager Backend - Port: 8080]
    PR[🛒 Procurement - Port: 8001]
    RP[📊 Report Service - Port: 8002]
    SY[⚡ Sync Service - Port: 8003]

    %% Databases / External
    DB[(🛢️ MySQL 8.0 Database)]
    TOTVS[(🏢 ERP TOTVS SQL Server)]
    CS[📝 Clicksign API External]

    %% Connections
    FE -->|HTTP Requests| MB
    FE -->|HTTP Requests| PR
    FE -->|HTTP Requests| RP

    MB -->|Read/Write| DB
    MB -->|Sign Documents| CS

    RP -->|Read Only| DB

    SY -->|Periodical Read| TOTVS
    SY -->|Upsert Sync Data| DB

    PR -->|Local SQLite/MySQL| DB
```

## Mapeamento de Portas e Serviços Locais

- **Frontend**: `http://localhost:3000`
- **Manager Backend (Core API)**: `http://localhost:8080` (Docs em `/docs`)
- **Procurement**: `http://localhost:8001` (Admin Django em `/admin`)
- **Report Service**: `http://localhost:8002` (Docs em `/docs`)
- **Sync Service**: `http://localhost:8003` (Docs em `/docs`)

## Fluxos de Dados e Integrações
1. **Manager Backend (Core)**: Gerencia CRUD de ativos e comodatos, integrando com Clicksign para assinatura de documentos e salvando estado no MySQL.
2. **Sync Service**: Executa tarefas agendadas (APScheduler) para puxar dados do ERP TOTVS (SQL Server) e efetuar upsert no MySQL.
3. **Report Service**: Consome o MySQL em modo somente leitura e gera relatórios em planilhas Excel (.xlsx) via arquitetura hexagonal.
4. **Procurement**: Serviço de fornecedores baseado em Django com suporte ASGI e Pydantic.
