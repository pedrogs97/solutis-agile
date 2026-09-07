---
name: log-investigator
description: Extrai e analisa logs de containers Docker e das pastas de logs de cada microsserviço (localmente ou remotamente via SSH no servidor Solutis) para identificação, diagnóstico e investigação de erros, exceções e anomalias.
---

# Log Investigator - Investigação de Logs e Diagnóstico de Erros

Esta skill capacita o agente e o desenvolvedor a extrair, filtrar, correlacionar e analisar logs de containers Docker e das pastas de logs de cada microsserviço do monorepo Solutis Agile, tanto em ambiente **local** quanto **remoto** (servidor `Solutis` - `172.21.3.225`).

---

## 🎯 Capacidades da Tool (`extract_logs.py`)

A tool está localizada em [extract_logs.py](./scripts/extract_logs.py) e oferece:

1. **Extração Unificada de Arquivos de Logs**:
   - Vascula automaticamente as pastas `logs/` de cada microsserviço (`YYYY-MM-DD.log`).
   - Mantém blocos de **Tracebacks multilinhas completos** vinculados ao evento de erro original (sem fragmentar a pilha da exceção).
2. **Extração de Logs de Containers Docker**:
   - Inspeciona containers locais ou remotos via `docker logs` com suporte a contagem de linhas (`--tail`), período (`--since`) e captura de stdout/stderr.
3. **Extração Remota Segura via SSH**:
   - Conecta ao servidor `Solutis` (`172.21.3.225`) lendo configurações de `~/.ssh/config`.
   - **Diagnóstico Automático de VPN**: Detecta falhas de timeout ou recusa de rede e instrui a verificação da VPN corporativa.
   - **Sigilo Estrito de Credenciais**: Mascara qualquer ocorrência de senhas em tempo real (`[PROTECTED_PASSWORD]`).
4. **Diagnóstico e Resumo Analítico de Erros (`--summary`)**:
   - Sumariza total de erros, alertas e a distribuição por serviço.
   - Agrupa as principais exceções e falhas por tipo (ex: `OperationalError`, `ConnectionRefusedError`, `HTTP 500`, etc.) com contadores de ocorrência.
5. **Formatos de Saída**:
   - Relatório visual formatado para terminal ou console.
   - Saída estruturada em JSON (`--json`) para consumo programático pelo agente.

---

## 🗺️ Serviços e Containers Mapeados

| Chave (`--service`) | Nome do Microsserviço | Pasta de Logs | Containers Docker | Porta Padrão |
| :--- | :--- | :--- | :--- | :--- |
| **`manager_back`** | Backend Manager Core | `solutis_manager_back/logs/` | `solutis-manager-back-prod`, `agile-back` | 8080 |
| **`procurement`** | Procurement Service | `solutis_procurement/logs/` | `solutis-procurement-prod`, `solutis-procurement` | 8001 |
| **`report`** | Report Service v2 | `solutis_report/logs/` | `solutis-report-prod`, `solutis-report` | 8002 |
| **`sync`** | Sync Service (TOTVS) | `solutis-sync/logs/` | `solutis-sync-prod`, `solutis-sync` | 8003 |
| **`flow_back`** | Solutis Flow Backend | `solutis_flow_back/logs/` | `solutis-flow-back`, `solutis-flow-worker` | 8004 |
| **`frontend_agile`** | Portal Frontend Agile | - | `solutis-agile-frontend-prod`, `agile-front` | 3000 |
| **`frontend_flow`** | Frontend Flow | - | `solutis-flow` | 3000 |
| **`redis`** | Redis Broker & Cache | - | `redis` | 6379 |
| **`all`** | Todos os serviços acima | Todas as pastas | Todos os containers | - |

---

## 💻 Guia de Uso Rápido (Comandos do Agente)

### 1. Investigar apenas erros recentes em todos os serviços (Local)
Extrai erros e tracebacks recentes de todas as pastas de logs e containers:
```bash
python3 .agents/skills/log-investigator/scripts/extract_logs.py --errors-only --summary
```

### 2. Investigar logs de um serviço específico
Para focar a investigação no `solutis_manager_back`:
```bash
python3 .agents/skills/log-investigator/scripts/extract_logs.py --service manager_back --tail 150
```
Para focar no `solutis_procurement`:
```bash
python3 .agents/skills/log-investigator/scripts/extract_logs.py --service procurement --tail 150
```

### 3. Investigar apenas logs de containers Docker
Útil para checar falhas de inicialização, migrations e requisições HTTP:
```bash
python3 .agents/skills/log-investigator/scripts/extract_logs.py --source containers --errors-only
```

### 4. Investigar logs no Servidor Remoto de Produção (`Solutis` - 172.21.3.225)
Conecta via SSH e extrai os logs do host remoto:
```bash
SOLUTIS_SSH_PASSWORD="<SENHA>" uv run --with paramiko python3 .agents/skills/log-investigator/scripts/extract_logs.py --remote --errors-only --summary
```
> ⚠️ **Atenção**: Nunca exponha ou repita a senha do servidor em mensagens, logs ou relatórios.

### 5. Buscar por uma palavra-chave ou termo específico (ex: "timeout", "mysql", "token")
```bash
python3 .agents/skills/log-investigator/scripts/extract_logs.py --search "mysql" --tail 50
```

### 6. Filtrar logs de uma data específica
```bash
python3 .agents/skills/log-investigator/scripts/extract_logs.py --date 2026-09-07 --errors-only
```

### 7. Exportar relatório completo em JSON
Ideal para processamento automatizado pelo agente:
```bash
python3 .agents/skills/log-investigator/scripts/extract_logs.py --errors-only --json > relatorio_erros.json
```

---

## 🛡️ Tratamento de Falhas e Diagnóstico de VPN

- **Timeout ou Falha de Conexão Remota (Exit code 2)**:
  O script identifica que o servidor `172.21.3.225` está inacessível e emite um alerta amigável orientando o usuário a verificar se a **VPN corporativa da Solutis** está conectada.
- **Falha de Autenticação SSH (Exit code 3)**:
  O script alerta que a senha fornecida foi recusada pelo servidor sem expor a credencial.
- **Container Inativo ou Não Encontrado**:
  A tool faz fallback gracioso entre nomes de containers de produção (`*-prod`) e desenvolvimento.

---

## 🧪 Testes Automatizados

A suíte de testes unitários garante a estabilidade da tool com execução ultrarrápida:
```bash
pytest .agents/skills/log-investigator/tests/test_extract_logs.py -v
```
