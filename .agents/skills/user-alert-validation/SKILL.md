---
name: "user-alert-validation"
description: "Validação obrigatória ao implementar ou alterar alertas, toasts, modais, banners ou mensagens de feedback para o usuário nos frontends do ecossistema Solutis Agile (solutis-agile-frontend e solutis-flow). Garante que NENHUM dado sensível, token JWT, segredo de integração ou detalhe técnico interno seja exposto na UI."
---

# Validação de Alertas e Mensagens ao Usuário (Prevenção de Exposição de Dados Sensíveis)

Esta skill orienta a criação, revisão e validação de alertas de informação, mensagens de sucesso, banners de erro, modais e notificações nos frontends do monorepo **Solutis Agile**:
- **`solutis-agile-frontend/`** (Frontend principal: React 19, TypeScript, Mantine UI com `@mantine/notifications`).
- **`solutis-flow/`** (Frontend de governança operacional: React, TypeScript, Tailwind CSS com hook `useToast()`).

---

## 📌 Quando Usar

Sempre que você for:
1. Criar, modificar ou revisar qualquer notificação, toast, modal, alert ou banner nos portais frontend (`solutis-agile-frontend/` ou `solutis-flow/`).
2. Manipular respostas de endpoints de API dos microsserviços (`solutis_manager_back`, `solutis_flow_back`, `solutis_procurement`, `solutis_report`, `solutis-sync`).
3. Tratar fluxos de autenticação (login, refresh de token, permissões), integrações externas (Clicksign, ERP TOTVS) ou fluxos com dados de fornecedores, colaboradores e demandas.

---

## 🚫 Regra Fundamental de Segurança

> **NUNCA expor tokens, credenciais, segredos, chaves de API, dados sensíveis ou stack traces técnicos em mensagens exibidas na UI do usuário final.**

### Itens Estritamente Proibidos em Mensagens ao Usuário (Alerts / Toasts / Modais):
- ❌ Tokens de autenticação ou autorização (`access_token`, `refresh_token`, Bearer tokens, JWT headers/payloads).
- ❌ Credenciais ou chaves de serviços integrados (Clicksign API tokens, credenciais de conexão do ERP TOTVS, senhas de banco de dados, chaves Redis).
- ❌ Senhas, PINs ou hashes criptográficos (`password_hash`, secrets de sessão).
- ❌ Stack traces, tracebacks Python (FastAPI/Django/SQLAlchemy/SQLModel) ou dumps de erros brutos de banco de dados (ex: `IntegrityError`, queries SQL expostas, schemas de tabelas).
- ❌ Respostas de exceção não tratadas (ex: payloads 500 crus contendo detalhes de rede, URLs internas de containers ou portas de serviços).

---

## 🛠️ Diretrizes por Componente do Monorepo

### 1. `solutis-agile-frontend` (Mantine UI)
- Utilize sempre `@mantine/notifications` com mensagens claras, resumidas e amigáveis:
  ```tsx
  import { notifications } from '@mantine/notifications'

  // ✅ Sucesso amigável
  notifications.show({
    title: 'Sucesso',
    message: 'Colaborador cadastrado com sucesso!',
    color: 'teal',
  })
  ```
- Para tratamento de erros da API, utilize o utilitário padronizado `normalizeApiErrors` (`src/lib/api-errors.ts`) para extrair mensagens tratadas e nunca exibir objetos de erro brutos ou mensagens genéricas com dumps de requisição:
  ```tsx
  import { normalizeApiErrors } from '@/lib/api-errors'

  try {
    await api.post('/employees', payload)
  } catch (err: any) {
    const errors = normalizeApiErrors(err.response?.data)
    const friendlyMessage = errors[0]?.error || 'Não foi possível salvar o colaborador. Tente novamente mais tarde.'

    notifications.show({
      title: 'Erro ao salvar',
      message: friendlyMessage,
      color: 'red',
    })
  }
  ```

### 2. `solutis-flow` (`useToast` & Modais)
- Utilize o hook `useToast` (`toastSuccess`, `toastError`, `toastWarning`, `toastInfo`) fornecendo textos legíveis e objetivos:
  ```tsx
  import { useToast } from './Toast'

  const { success: toastSuccess, error: toastError } = useToast()

  // ✅ Sucesso seguro
  toastSuccess(`Demanda #${demand.id} criada com sucesso!`)

  // ✅ Erro amigável
  toastError('Falha ao atualizar o status da demanda. Verifique sua conexão ou tente novamente.')
  ```

---

## 🔍 Checklist de Validação Obrigatória

Antes de finalizar qualquer implementação com mensagens/alertas ao usuário:

1. **Inspeção de Template Literals e Interpolações**:
   - Inspecione variáveis interpoladas em `notifications.show({ message: ... })`, `toastError(...)`, `toastSuccess(...)` e modais.
   - Certifique-se de que variáveis como `${token}`, `${authResponse.access_token}`, `${apiKey}`, `${err.stack}` ou `${err.message}` não vazem segredos ou erros brutos para a tela.

2. **Exemplo Incorreto (VULNERÁVEL - EXPÕE TOKEN / DADO TÉCNICO)**:
   ```tsx
   // ❌ ERRADO: Expõe token de autenticação e detalhes de infraestrutura
   notifications.show({
     title: 'Autenticado',
     message: `Bem-vindo! Seu token é ${res.access_token}`,
     color: 'green',
   })

   // ❌ ERRADO: Expõe erro interno e stack trace da API
   toastError(`Erro 500 no solutis_manager_back: ${error.response?.data?.detail?.traceback}`)
   ```

3. **Exemplo Correto (SEGURO - SANITIZADO)**:
   ```tsx
   // ✅ CORRETO: Mensagem acolhedora e segura
   notifications.show({
     title: 'Sucesso',
     message: 'Login realizado com sucesso!',
     color: 'teal',
   })

   // ✅ CORRETO: Erro amigável com logging seguro no console para depuração
   console.error('[Flow] Erro ao sincronizar demandas:', error)
   toastError('Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.')
   ```

4. **Separação de Responsabilidades (UI vs Logging)**:
   - Respostas de erro detalhadas e exceções devem ser registradas nos logs do backend (ex: `logger.error(...)` nos serviços Python) ou via `console.error` em ambiente de desenvolvimento.
   - A interface do usuário final deve receber apenas mensagens acionáveis, concisas e livres de dados de infraestrutura ou segurança.
