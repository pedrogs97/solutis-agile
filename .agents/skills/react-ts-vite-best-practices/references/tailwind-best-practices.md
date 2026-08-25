# Tailwind CSS em React + TypeScript + Vite: Boas Práticas e Padrões

O **Tailwind CSS** é uma ferramenta potente baseada em utilitários CSS. Para manter componentes legíveis, desacoplados e livres de conflitos de especificidade, siga as diretrizes abaixo.

---

## 1. O Utilitário `cn()` (`clsx` + `tailwind-merge`)

Ao aceitar uma prop `className` em componentes de UI reutilizáveis, **NUNCA concatene strings diretamente** com `${props.className}`. Isso causa conflitos de especificidade do Tailwind (por exemplo: `px-4` passado via prop não sobrescreve `px-2` padrão do componente).

### Solução: Utilitário `cn` em `src/utils/cn.ts`

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- **`clsx`**: Permite condicionais limpas em objetos e arrays (`{ 'opacity-50': disabled }`).
- **`twMerge`**: Resolve conflitos de classes Tailwind, garantindo que as últimas classes declaradas tenham precedência.

---

## 2. Padrão CVA (Class Variance Authority)

Para componentes com múltiplas variantes (ex: `variant="primary" | "secondary"`, `size="sm" | "md" | "lg"`), o **CVA** é a solução padrão do mercado para organizar variantes com suporte a TypeScript.

### Exemplo com CVA + `cn()`:

```tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

// 1. Definição das variantes estilizadas
const buttonVariants = cva(
  // Classes Base aplicadas a todos os botões
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? <span className="animate-spin mr-2">⏳</span> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

---

## 3. Regra Crítica: Interpolação Dinâmica de Classes no Tailwind JIT

O compilador do Tailwind funciona por varredura estática de código fonte regex. **Ele não executa expressões JavaScript em tempo de execução.**

### ❌ Anti-padrão (Classes quebradas / não compiladas no build):

```tsx
// NÃO FUNCIONA: O Tailwind não detectará "bg-blue-500", "bg-red-500" no build
function Badge({ color }: { color: 'blue' | 'red' }) {
  return <span className={`bg-${color}-500 text-white`}>Status</span>;
}
```

### ✅ Forma Correta (Mapeamento Estático Explícito):

```tsx
const colorMap: Record<'blue' | 'red', string> = {
  blue: 'bg-blue-500 text-blue-100',
  red: 'bg-red-500 text-red-100',
};

function Badge({ color }: { color: 'blue' | 'red' }) {
  return <span className={cn('px-2 py-1 rounded', colorMap[color])}>Status</span>;
}
```

---

## 4. Organização e Ordem Recomendada de Classes

Para manter a leitura consistente dos arquivos JSX/TSX, siga a ordem lógica ao escrever classes:

1. **Layout / Display**: `flex`, `grid`, `block`, `hidden`, `absolute`, `relative`, `inset-0`
2. **Dimensionamento / Espaçamento**: `w-full`, `max-w-md`, `h-12`, `m-4`, `p-6`, `gap-2`
3. **Tipografia**: `text-sm`, `font-bold`, `text-center`, `tracking-wide`, `truncate`
4. **Cores & Fundos**: `bg-white`, `text-slate-900`, `dark:bg-slate-800`, `dark:text-white`
5. **Bordas & Sombras**: `border`, `border-gray-200`, `rounded-lg`, `shadow-md`
6. **Estados Interativos**: `hover:bg-gray-100`, `focus:ring-2`, `disabled:opacity-50`
7. **Animações / Transições**: `transition-all`, `duration-200`, `animate-fade-in`

---

## 5. Suporte a Dark Mode com CSS Variables

Utilize variáveis CSS no `index.css` mapeadas para o `tailwind.config.js` para garantir suporte nativo a temas (Light/Dark mode) sem duplicação de classes.

### Em `src/index.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --border: 214.3 31.8% 91.4%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --border: 217.2 32.6% 17.5%;
  }
}
```

### No `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
      },
    },
  },
  plugins: [],
};
```
