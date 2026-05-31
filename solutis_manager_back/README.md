# ⚙️ Solutis Manager Backend

> API Core do ecossistema **Solutis Agile**, responsável pelo gerenciamento de ativos, comodatos, controle de acesso, geração de documentos/relatórios e integrações de terceiros.

---

## 📋 Sobre o Projeto

O **Solutis Manager Backend** é a API principal do ecossistema, servindo como a espinha dorsal de dados e regras de negócio para a interface web. Ele gerencia fluxos críticos como:
- Autenticação e controle de privilégios de usuários (RBAC).
- Inventário físico de ativos de TI e infraestrutura.
- Fluxo completo de empréstimo/devolução de ativos (Comodatos).
- Integração com a API do Clicksign para assinatura eletrônica de contratos.
- Geração de relatórios em múltiplos formatos (Excel, PDF, Word).

---

## 🏗️ Arquitetura e Estrutura de Pastas

O projeto utiliza o framework FastAPI estruturado de forma modular e orientado a domínio em `src/`:

```text
solutis_manager_back/
├── src/                    # Código-fonte principal da aplicação
│   ├── auth/               # Serviços de autenticação e tokens (JWT, Bcrypt)
│   ├── asset/              # Domínio de gerenciamento de patrimônios/ativos
│   ├── clicksign_api/      # Integração e webhooks da API Clicksign
│   ├── document/           # Gerenciamento de contratos, termos e uploads
│   ├── inventory/          # Controle físico e auditoria de inventário
│   ├── lending/            # Fluxo de comodato e empréstimos de máquinas
│   ├── main.py             # Instanciação do app FastAPI (`appAPI`) e middlewares
│   ├── database.py         # Configuração de sessionmaker do SQLAlchemy
│   ├── backends.py         # Lógica e regras de backend customizadas
│   └── utils.py            # Helpers globais
├── alembic/                # Arquivos e scripts de versionamento do banco de dados
├── templates/              # Modelos HTML/CSS para renderização de PDF (WeasyPrint)
├── Dockerfile              # Dockerfile otimizado de produção
├── docker-compose.yaml     # Composição Docker isolada do backend
├── pyproject.toml          # Dependências do Python e ferramentas de qualidade
└── README.md               # Este arquivo de documentação
```

---

## 🚀 Tecnologias Utilizadas

- **Linguagem**: Python 3.13
- **Framework Web**: FastAPI
- **ORM**: SQLAlchemy 2.0+
- **Versionamento de Banco**: Alembic
- **Geração de Documentos**: WeasyPrint, ReportLab, XlsxWriter, Python-Docx (geração e manipulação avançada de PDF/XLS/Word)
- **Gerenciador de Dependências**: [uv](https://github.com/astral-sh/uv)

---

## ⚙️ Variáveis de Ambiente

Copie o arquivo de exemplo e altere os valores para o seu ambiente local:

```bash
cp .env.example .env
```

Configurações importantes:
- `SECRET_KEY`: Chave secreta de criptografia para tokens JWT.
- `MYSQL_*`: Credenciais de acesso ao banco MySQL.
- `SQLSERVE_*`: Credenciais de acesso e leitura do TOTVS (SQL Server).
- `PASSWORD_SUPER_USER`: Senha inicial para o usuário administrador padrão.

---

## 🛠️ Instalação e Execução Local

### Pré-requisitos
*   **Python 3.13**
*   Gerenciador de pacotes **`uv`** instalado no sistema operacional.

### Passo a Passo

1. **Instalar dependências e criar o ambiente virtual:**
   ```bash
   uv sync
   ```

2. **Ativar o ambiente virtual:**
   ```bash
   # Linux/macOS
   source .venv/bin/activate

   # Windows
   .venv\Scripts\activate
   ```

3. **Executar a aplicação em modo de desenvolvimento:**
   ```bash
   uv run uvicorn src.main:appAPI --reload --port 8080
   ```
   A documentação do Swagger UI estará acessível em `http://127.0.0.1:8080/docs`.

---

## 🗄️ Versionamento de Banco de Dados (Alembic)

Para criar ou aplicar alterações na estrutura do banco de dados (MySQL):

### Executando Localmente

*   **Criar uma nova migration automaticamente baseada nos modelos:**
    ```bash
    alembic revision --autogenerate -m "[nome_da_migration]"
    ```

*   **Aplicar todas as migrations pendentes no banco:**
    ```bash
    alembic upgrade head
    ```

### Executando dentro do Docker

*   **Criar uma nova migration dentro do container:**
    ```bash
    docker-compose run --user 1000 [app-service] sh -c 'alembic revision --autogenerate -m "[nome_da_migration]"'
    ```

*   **Aplicar migrations dentro do container:**
    ```bash
    docker-compose run --user 1000 [app-service] sh -c 'alembic upgrade head'
    ```

---

## 🐳 Comandos de Manutenção Docker (Limpeza de Ambiente)

Para limpar o cache e camadas órfãs de build locais do Docker, você pode utilizar os seguintes comandos utilitários:

*   **Limpar layers do Docker (imagens não utilizadas, cache de build):**
    ```bash
    docker system prune -a -f
    ```

*   **Remover todos os containers que pararam de executar:**
    ```bash
    docker rm -v $(docker ps -a -q -f status=exited)
    ```

*   **Remover volumes órfãos (dangling volumes):**
    ```bash
    docker volume ls -qf dangling=true | xargs -r docker volume rm
    ```
