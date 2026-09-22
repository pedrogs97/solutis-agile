# Arquitetura do Sistema - Solutis Agile Monorepo

Este documento detalha a arquitetura técnica, os serviços conteinerizados via Docker, os fluxos de rede, os mecanismos de roteamento via Nginx com destaque para o **TaskView**, bem como os bancos de dados, filas, mensageria e integrações do ecossistema **Solutis Agile**.

---

## 🗺️ Diagrama de Arquitetura dos Serviços

```mermaid
flowchart TB
    %% ==========================================================
    %% CLIENTES & INGRESS / PROVIMENTO WEB (NGINX)
    %% ==========================================================
    CLIENT["👤 Usuário / Navegador Web"]

    subgraph INGRESS_LAYER ["🌐 Camada Web & Roteamento (Nginx)"]
        NGINX_ROUTER{"Nginx (Host / Borda)<br/>Porta 80 / 443"}
        AGILE_FRONT["🐳 Container: solutis-agile-frontend-prod<br/>Frontend Principal (Agile)<br/>Nginx Alpine + React 19 / Mantine<br/>Porta Host: 3000 | Container: 80"]
        TASKVIEW_FRONT["🐳 Container: solutis-taskview-prod<br/>TaskView Frontend (Solutis Flow)<br/>Nginx Alpine + React / Vite (base: /taskview/)<br/>Porta Host: 3001 | Container: 80"]
    end

    %% ==========================================================
    %% CORE BACKEND & API GATEWAY
    %% ==========================================================
    subgraph BACKEND_SERVICES ["⚙️ Microsserviços Backend (Containers Docker)"]
        MANAGER_BACK["🐳 Container: solutis-manager-back-prod<br/>Manager Backend & Auth Gateway<br/>FastAPI + Python 3.13<br/>Porta: 8080"]
        PROCUREMENT_BACK["🐳 Container: solutis-procurement-prod<br/>Procurement Service<br/>Django + NinjaAPI + Uvicorn<br/>Porta: 8001"]
        REPORT_BACK["🐳 Container: solutis-report-prod<br/>Report Service v2<br/>FastAPI + SQLModel + OpenPyXL<br/>Porta: 8002"]
        SYNC_BACK["🐳 Container: solutis-sync-prod<br/>Sync Service<br/>FastAPI + APScheduler<br/>Porta: 8003"]
        FLOW_BACK["🐳 Container: solutis-flow-back-prod<br/>Solutis Flow Backend<br/>FastAPI + SQLModel + SSE Engine<br/>Porta: 8004"]
    end

    %% ==========================================================
    %% FILAS, WORKERS & CACHE / BROKER
    %% ==========================================================
    subgraph ASYNC_LAYER ["📨 Filas, Background Jobs & Cache (Containers Docker)"]
        FLOW_REDIS[("🐳 Container: solutis-flow-redis-prod<br/>Redis 7 Alpine<br/>Message Broker & Cache<br/>Porta: 6379")]
        FLOW_WORKER["🐳 Container: solutis-flow-worker-prod<br/>Dramatiq Worker<br/>Processamento Assíncrono de Eventos"]
    end

    %% ==========================================================
    %% BANCOS DE DADOS
    %% ==========================================================
    subgraph DATABASE_LAYER ["🛢️ Persistência de Dados"]
        MYSQL_DB[("🛢️ MySQL 8.0<br/>Banco Principal da Aplicação<br/>Ativos, Comodatos, Usuários, Fornecedores")]
        FLOW_DB[("🐳 Container: solutis-flow-db-prod<br/>PostgreSQL 16 Alpine<br/>Banco Isolado do Solutis Flow<br/>Porta: 5432")]
        PROC_SQLITE[("📁 SQLite / Arquivos<br/>db.sqlite3 / Volumes")]
    end

    %% ==========================================================
    %% INTEGRAÇÕES EXTERNAS
    %% ==========================================================
    subgraph EXTERNAL_SERVICES ["☁️ Serviços & Sistemas Externos"]
        TOTVS_ERP[("🏢 ERP TOTVS (SQL Server)<br/>Base Corporativa")]
        AZURE_SSO["☁️ Microsoft Entra ID<br/>SSO / Microsoft Graph"]
        CLICKSIGN["✍️ Clicksign API<br/>Assinatura Digital de Documentos"]
    end

    %% ==========================================================
    %% RELAÇÕES E FLUXOS
    %% ==========================================================
    %% Fluxo de Acesso Web e Redirecionamentos
    CLIENT -->|Acesso Web| NGINX_ROUTER
    NGINX_ROUTER -->|"Requisição padrão '/'"| AGILE_FRONT
    NGINX_ROUTER ==>|"Roteamento / Redirecionamento '/taskview'"| TASKVIEW_FRONT
    AGILE_FRONT -.->|"Link / Redirecionamento de UI (Card TaskView)"| TASKVIEW_FRONT

    %% Frontends para API Gateway / Backends
    AGILE_FRONT -->|"Chamadas REST / JWT Auth"| MANAGER_BACK
    TASKVIEW_FRONT -->|"Autenticação via Gateway / Proxy"| MANAGER_BACK
    FLOW_BACK ==>|"SSE (Server-Sent Events) Tempo Real"| TASKVIEW_FRONT

    %% Roteamento do API Gateway
    MANAGER_BACK -->|"Auth Proxy: /v1/procurement"| PROCUREMENT_BACK
    MANAGER_BACK -->|"Auth Proxy: /v1/report"| REPORT_BACK
    MANAGER_BACK -->|"Auth Proxy: /v1/flow"| FLOW_BACK

    %% Persistência & Cache
    MANAGER_BACK -->|"Leitura / Escrita"| MYSQL_DB
    REPORT_BACK -->|"Leitura (Read-Only)"| MYSQL_DB
    PROCUREMENT_BACK -->|"Leitura / Escrita"| MYSQL_DB
    PROCUREMENT_BACK -.->|"Fallback local"| PROC_SQLITE
    FLOW_BACK -->|"Leitura / Escrita (Isolado)"| FLOW_DB

    %% Eventos & Filas
    FLOW_BACK -->|"Publica Eventos / Jobs"| FLOW_REDIS
    FLOW_REDIS -->|"Consome Tarefas"| FLOW_WORKER
    FLOW_WORKER -->|"Persiste Estado de Processamento"| FLOW_DB

    %% Sincronização
    SYNC_BACK -->|"Extração Agendada (APScheduler)"| TOTVS_ERP
    SYNC_BACK -->|"Upsert de Registros Atualizados"| MYSQL_DB

    %% Integrações Externas
    MANAGER_BACK -->|"OAuth2 / Troca de Token SSO"| AZURE_SSO
    MANAGER_BACK -->|"Criação de Envelopes & Assinaturas"| CLICKSIGN
```

---

## 📦 Serviços Conteinerizados (Docker Containers)

| Container | Imagem Base / Build | Porta Host : Container | Descrição e Papel |
| :--- | :--- | :--- | :--- |
| **`solutis-agile-frontend-prod`** | `nginx:alpine` (build React 19 / Mantine) | `3000:80` | Frontend principal servido via Nginx na raiz (`/`). |
| **`solutis-taskview-prod`** | `nginx:alpine` (build React / Vite) | `3001:80` | Frontend do TaskView (`solutis-flow`) compilado com base `/taskview/` e servido via Nginx. |
| **`solutis-manager-back-prod`** | Python 3.13 / FastAPI | `8080:8080` | API Central, Auth/Authz e Auth Proxy Gateway para os microsserviços. |
| **`solutis-procurement-prod`** | Python / Django / NinjaAPI | `8001:8001` | Gestão de compras, fornecedores e análise comparativa (FO-AD-01). |
| **`solutis-report-prod`** | Python 3.13 / FastAPI / SQLModel | `8002:8002` | Geração de relatórios (v2) em Excel (`.xlsx`) via consulta read-only. |
| **`solutis-sync-prod`** | Python 3.13 / FastAPI / APScheduler | `8003:8003` | Sincronização periódica do ERP TOTVS para o banco da aplicação. |
| **`solutis-flow-back-prod`** | Python 3.13 / FastAPI / SQLModel | `8004:8004` | Backend de governança e demandas com suporte a Server-Sent Events (SSE). |
| **`solutis-flow-worker-prod`** | Python 3.13 / Dramatiq | — (worker) | Worker assíncrono para processamento de eventos do Solutis Flow. |
| **`solutis-flow-redis-prod`** | `redis:7-alpine` | `6379:6379` | Broker de mensagens para o Dramatiq e cache/eventos do Flow. |
| **`solutis-flow-db-prod`** | `postgres:16-alpine` | `5432:5432` | Banco de dados PostgreSQL 16 isolado exclusivamente para o Flow. |

---

## 🔀 Provimento Frontend via Nginx & Roteamento TaskView

1. **Provimento por Nginx em Camadas**:
   - Cada frontend (`solutis-agile-frontend` e `solutis-flow`) é empacotado em uma imagem Docker com servidor web **Nginx (`nginx:alpine`)**, responsável por servir os arquivos estáticos e garantir o fallback SPA (`try_files $uri $uri/ /index.html`).
2. **Roteamento e Redirecionamento para o TaskView**:
   - O TaskView (`solutis-flow`) é compilado com base path `base: '/taskview/'` no `vite.config.ts`.
   - O Nginx de borda/reverso roteia requisições com o prefixo `/taskview` para o container `solutis-taskview-prod` (porta 3001), enquanto a rota raiz `/` vai para `solutis-agile-frontend-prod` (porta 3000).
   - No portal principal (`solutis-agile-frontend`), a variável de ambiente `VITE_FLOW_APP_URL=/taskview` viabiliza o redirecionamento direto dos usuários a partir do card interativo "Acessar Solutis TaskView".

---

## 🛢️ Bancos de Dados, Filas, Cache e Ferramentas do Ecossistema

- **Bancos de Dados**:
  - **MySQL 8.0**: Banco relacional central compartilhado pelo Manager Backend, Procurement, Report Service (leitura) e alvo de escrita do Sync Service.
  - **PostgreSQL 16 (`solutis-flow-db-prod`)**: Banco de dados relacional isolado do Solutis Flow para demandas, históricos e governança operacional.
  - **SQLite (`db.sqlite3`)**: Armazenamento local/fallback para dados operacionais e arquivos de fornecedores.
  - **ERP TOTVS (SQL Server)**: Banco legado corporativo externo acessado pelo Sync Service.
- **Filas & Background Jobs**:
  - **Dramatiq**: Framework de filas em Python executado no container dedicado `solutis-flow-worker-prod`.
  - **APScheduler**: Agendador de tarefas em segundo plano incorporado ao `solutis-sync-prod`.
- **Cache & Message Broker**:
  - **Redis 7 (`solutis-flow-redis-prod`)**: Broker oficial do Dramatiq e mecanismo de armazenamento temporário de eventos.
- **Transmissão em Tempo Real**:
  - **Server-Sent Events (SSE)**: Conexão unidirecional persistente entre `solutis_flow_back` e `solutis-flow` para sincronização em tempo real de cards Kanban, SLAs e notificações.
- **Integrações Externas**:
  - **Microsoft Entra ID (Azure AD)**: Autenticação SSO corporativa e consulta ao Microsoft Graph.
  - **Clicksign API**: Assinatura eletrônica de Termos de Responsabilidade e comodatos.
