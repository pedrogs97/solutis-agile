# Solutis Report - Serviço de Geração de Relatórios

Este projeto é um microsserviço desenvolvido para a geração de relatórios. Nesta primeira versão, o serviço foca exclusivamente na geração do **relatório de avaliação de fornecedores**.

## Arquitetura

O projeto segue os princípios da **Arquitetura Hexagonal (Ports and Adapters)**, garantindo um baixo acoplamento entre a lógica de negócio e as dependências externas (como banco de dados e frameworks web). A estrutura de diretórios em `src/` é dividida da seguinte forma:

- **`domain/`**: Contém as regras de negócio centrais, entidades, modelos e as portas (interfaces) que definem contratos.
- **`application/`**: Implementa os casos de uso da aplicação, orquestrando as regras de negócio e utilizando as portas do domínio.
- **`infrastructure/`**: Fornece as implementações concretas (adaptadores) para comunicação externa, como repositórios conectados ao banco de dados MySQL via SQLModel e cache em memória.
- **`api/`**: Camada de apresentação que contém os controladores, rotas do FastAPI, serializadores (schemas) e injeção de dependências HTTP.
- **`core/`**: Configurações transversais, como leitura de variáveis de ambiente e configurações de log.

## Tecnologias Utilizadas

- **Linguagem**: Python 3.13
- **Framework Web**: FastAPI
- **ORM e Banco de Dados**: SQLModel / MySQL (`aiomysql`)
- **Manipulação de Excel**: openpyxl (para exportação dos relatórios)
- **Gerenciamento de Dependências**: [`uv`](https://github.com/astral-sh/uv)
- **Testes e Qualidade**: pytest, pylint, black, isort, pre-commit

## Como Instalar e Rodar Localmente

Este projeto utiliza o gerenciador de pacotes e ambientes `uv`. Caso não tenha o `uv` instalado, consulte a [documentação oficial](https://github.com/astral-sh/uv).

### 1. Clonar o repositório
```bash
git clone https://github.com/pedrogs97/solutis_report.git
cd solutis_report
```

### 2. Sincronizar o ambiente
Utilize o `uv` para criar o ambiente virtual e instalar todas as dependências do projeto, incluindo as de desenvolvimento:
```bash
uv sync
```

### 3. Configurar as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com as credenciais do banco de dados e outras configurações necessárias (você pode verificar o padrão esperado na camada de configurações em `src/core/`). Exemplo de arquivo `.env`:
```env
DATABASE_URL=mysql+aiomysql://usuario:senha@localhost:3306/nome_do_banco
```

### 4. Ativar o ambiente virtual e rodar a aplicação
Ative o ambiente criado (localizado em `.venv/`):
- **Windows**:
  ```bash
  .venv\Scripts\activate
  ```
- **Linux/macOS**:
  ```bash
  source .venv/bin/activate
  ```

Inicie o servidor de desenvolvimento:
```bash
fastapi dev src/main.py
```
A documentação interativa (Swagger UI) estará disponível em `http://127.0.0.1:8000/docs`.

## Testes e Qualidade de Código

Para executar a suíte de testes:
```bash
pytest
```

Recomenda-se instalar o `pre-commit` para rodar os linters e formatadores automaticamente antes de cada commit:
```bash
pre-commit install
```
