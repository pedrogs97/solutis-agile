# 💻 Solutis Agile - Frontend

> Interface de usuário moderna, rápida e responsiva construída em React, TypeScript e Vite para gerenciamento ágil de processos da Solutis.

---

## 📋 Sobre o Projeto

Este diretório contém a aplicação frontend do ecossistema **Solutis Agile**. A interface foi desenvolvida seguindo as melhores práticas de Single Page Applications (SPA), com forte tipagem estática, roteamento baseado em arquivos de alto desempenho, estados de servidor sincronizados e componentização robusta com biblioteca de design moderna.

---

## 🚀 Pilha Tecnológica (Tech Stack)

As principais ferramentas e bibliotecas que compõem o ecossistema do frontend são:

- **Núcleo**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Build Tool / Bundler**: [Vite](https://vite.dev/) (utilizando o motor [Rolldown](https://github.com/rolldown/rolldown))
- **Design System / Componentes**: [Mantine UI v8](https://mantine.dev/) (Mantine Core, Dates, Dropzone, Modals, Notifications)
- **Roteamento**: [TanStack Router v1](https://tanstack.com/router) (roteamento declarativo e baseado em arquivos)
- **Sincronização de Estado de Servidor**: [TanStack Query v5 (React Query)](https://tanstack.com/query)
- **Gerenciamento de Estado Local**: [Zustand](https://zustand.docs.pmnd.rs/)
- **Formulários**: [React Hook Form](https://react-hook-form.com/) integrado com validações [Zod](https://zod.dev/) via `@hookform/resolvers`
- **Controle de Acesso / Permissões**: [CASL](https://casl.js.org/) (`@casl/ability` & `@casl/react`)
- **Geração de Código Automática**: [Kubb CLI](https://kubb.dev/) (geração de clientes de API tipados e queries do React Query diretamente de esquemas OpenAPI/Swagger)

---

## 📂 Estrutura de Diretórios

A organização interna do código segue os padrões do ecossistema TanStack:

```text
solutis-agile-frontend/
├── public/                 # Assets estáticos globais (imagens, ícones)
├── src/                    # Código-fonte principal da aplicação
│   ├── components/         # Componentes compartilhados e reutilizáveis da UI
│   ├── hooks/              # Hooks customizados do React
│   ├── routes/             # Definição e componentes das rotas (mapeados por TanStack Router)
│   ├── services/           # Clientes HTTP, chamadas e queries de API (gerados pelo Kubb)
│   ├── store/              # Gerenciamento de estado global com Zustand
│   ├── theme/              # Customização de tema, cores e variantes do Mantine UI
│   ├── utils/              # Funções utilitárias comuns e helpers
│   ├── main.tsx            # Ponto de entrada da aplicação React
│   └── routeTree.gen.ts    # Árvore de rotas auto-gerada pelo TanStack Router
├── tests/                  # Testes automatizados (Playwright e Vitest)
├── openapi/                # Especificação de APIs OpenAPI para geração com Kubb
├── .env.example            # Modelo de arquivo de configuração do ambiente
├── eslint.config.js        # Configuração modular do ESLint
├── kubb.config.ts          # Configurações do gerador de código Kubb
├── playwright.config.ts    # Configurações de testes E2E do Playwright
├── tsconfig.json           # Configurações de compilação TypeScript
├── vite.config.ts          # Configurações de build do Vite/Rolldown
└── package.json            # Script e dependências do Node.js
```

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` ou `.env.local` na raiz do diretório do frontend com a seguinte variável:

```env
VITE_BASE_API_URL=http://127.0.0.1:8080
```

- **`VITE_BASE_API_URL`**: URL base de acesso à API principal (`agile-back`).

---

## 🛠️ Instalação e Execução

### Pré-requisitos
- **Node.js** (v18.0 ou superior recomendado)
- **npm** ou outro gerenciador de pacotes compatível.

### Passos para Rodar Localmente

1. **Instalar as dependências**:
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   A aplicação estará acessível em `http://localhost:3000` (ou na porta especificada no console).

3. **Compilar para produção**:
   ```bash
   npm run build
   ```
   Os arquivos compilados de alta performance serão gerados no diretório `dist/`.

4. **Visualizar a build de produção localmente**:
   ```bash
   npm run preview
   ```

---

## 🧪 Testes e Qualidade de Código

### Testes Unitários e de Componente (Vitest)
```bash
npm run test:unit
```

### Testes de Integração e Ponta-a-Ponta (Playwright)
Antes de rodar os testes, certifique-se de que os navegadores do Playwright estão instalados:
```bash
npx playwright install
```

Para rodar os testes E2E:
```bash
npm run test:e2e
```

Para abrir a interface gráfica interativa do Playwright:
```bash
npm run test:e2e:ui
```

### Linters e Formatação de Código
O projeto utiliza **ESLint** e **Prettier** para garantir a consistência do código, integrados com o **Lefthook** para validar no momento dos commits do Git.

```bash
# Validar erros de linting e tipos
npm run lint

# Corrigir erros de estilização do lint
npm run lint:fix

# Formatar todos os arquivos com Prettier
npm run format
```

---

## 🔄 Geração Automática de Cliente de API (Kubb)

Caso existam modificações nas rotas do backend (`agile-back`) ou novas especificações OpenAPI em `./openapi`, você pode regenerar os hooks do React Query, tipos do TypeScript e clientes do Axios automaticamente:

```bash
npm run api:generate
```
Este comando lerá as definições e atualizará os arquivos na pasta `src/services/` automaticamente.
