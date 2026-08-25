# Otimizações de Performance e Boas Práticas com Vite + TypeScript

O Vite é um bundler extremamente rápido baseado em ES Modules. Para manter essa velocidade e otimizar o tempo de carregamento no navegador, siga estas práticas.

---

## 1. Estrutura de Pastas Limpa para Projetos Vite

```text
src/
├── assets/          # Imagens, fontes e arquivos estáticos importados
├── components/      # Componentes UI
│   ├── ui/          # Componentes genéricos de UI (Button, Input, Modal, Card)
│   └── features/    # Componentes específicos por regra de negócio (UserList, DemandKanban)
├── context/         # Provedores de Context API (AuthProvider, ThemeProvider)
├── hooks/           # Custom Hooks reutilizáveis (useAuth, useDebounce)
├── services/        # Clientes HTTP, conectores de API e adapters
├── types/           # Definições de tipos e interfaces TypeScript (.ts)
├── utils/           # Funções utilitárias puras (formatters, validators)
├── App.tsx          # Root Component & Rotas
├── main.tsx         # Entry point do React/Vite
└── index.css        # CSS Global / Tailwind / CSS Tokens
```

---

## 2. Configuração de Path Aliases (`@/`)

Evite caminhos relativos confusos como `../../../components/ui/Button`.

### Em `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Em `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 3. Code Splitting e Lazy Loading com `React.lazy`

Evite carregar todas as páginas e rotas no bundle inicial. Use carregamento dinâmico por rota:

```tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';

// Carregamento sob demanda (Lazy Loading)
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="page-loader"><Spinner size="lg" /></div>}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

---

## 4. Guia Prático de Memoização (`useMemo`, `useCallback`, `React.memo`)

> **Cuidado**: A memoização desnecessária adiciona custo de memória. Use-a apenas quando necessário.

### Quando Usar `useMemo`:
- Para evitar recálculos matemáticos ou transformações de grandes arrays a cada renderização.
```tsx
const filteredProducts = useMemo(() => {
  return products.filter((p) => p.price <= maxPrice && p.category === selectedCategory);
}, [products, maxPrice, selectedCategory]);
```

### Quando Usar `useCallback`:
- Quando uma função é passada como prop para um componente filho que utiliza `React.memo`.
```tsx
const handleDelete = useCallback((id: string) => {
  deleteItem(id);
}, [deleteItem]);
```

### Quando Usar `React.memo`:
- Em componentes puros de renderização pesada que recebem as mesmas props com frequência.
```tsx
export const HeavyChartItem = React.memo(function HeavyChartItem({ data }: { data: ChartPoint }) {
  return <path d={computeComplexPath(data)} />;
});
```
