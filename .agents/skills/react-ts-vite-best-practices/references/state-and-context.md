# Gestão de Estados, Otimização de Context API e Redução de Prop Drilling

Gerenciar estados de maneira eficiente é o pilar de uma aplicação React limpa e performática. Nesta seção, abordamos técnicas para evitar re-renderizações desnecessárias e como eliminar o **Prop Drilling**.

---

## 1. Princípio de State Colocation (Colocação de Estado)

> **Regra de Ouro**: *Mantenha o estado o mais próximo possível do local onde ele é consumido.*

Não eleve o estado (`lifting state up`) para componentes pai ou contexto global a menos que múltiplos componentes distantes realmente precisem compartilhar esse estado em tempo real.

---

## 2. Redução de Prop Drilling sem Usar Contexto (Component Composition)

Muitas vezes, a Context API é usada precocemente apenas para passar props 3 ou 4 níveis abaixo na árvore de componentes. É possível resolver isso com **Composição de Componentes**.

### ❌ Anti-padrão (Prop Drilling por 4 níveis):

```tsx
// Page -> Header -> Navigation -> UserMenu -> Avatar
function Page({ user }: { user: User }) {
  return <Header user={user} />;
}

function Header({ user }: { user: User }) {
  return <Navigation user={user} />;
}

function Navigation({ user }: { user: User }) {
  return <UserMenu user={user} />;
}

function UserMenu({ user }: { user: User }) {
  return <Avatar src={user.avatarUrl} name={user.name} />;
}
```

### ✅ Forma Correta (Composição com `children`):

```tsx
function Page({ user }: { user: User }) {
  return (
    <Header>
      <Navigation>
        <UserMenu>
          <Avatar src={user.avatarUrl} name={user.name} />
        </UserMenu>
      </Navigation>
    </Header>
  );
}

function Header({ children }: { children: React.ReactNode }) {
  return <header className="header">{children}</header>;
}

function Navigation({ children }: { children: React.ReactNode }) {
  return <nav className="nav">{children}</nav>;
}

function UserMenu({ children }: { children: React.ReactNode }) {
  return <div className="user-menu">{children}</div>;
}
```

---

## 3. Padrão Compound Components (Componentes Compostos)

O padrão Compound Components permite criar componentes flexíveis que compartilham estado implicitamente sem requerer prop drilling.

### Exemplo: Componente de Accordion

```tsx
import React, { createContext, useContext, useState } from 'react';

interface AccordionContextType {
  openIndex: number | null;
  toggleIndex: (index: number) => void;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

export function Accordion({ children }: { children: React.ReactNode }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <AccordionContext.Provider value={{ openIndex, toggleIndex }}>
      <div className="accordion-root">{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ index, children }: { index: number; children: React.ReactNode }) {
  return <div className="accordion-item">{children}</div>;
}

export function AccordionHeader({ index, children }: { index: number; children: React.ReactNode }) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionHeader deve ser usado dentro de Accordion');

  return (
    <button onClick={() => context.toggleIndex(index)} className="accordion-header">
      {children}
    </button>
  );
}

export function AccordionContent({ index, children }: { index: number; children: React.ReactNode }) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionContent deve ser usado dentro de Accordion');

  if (context.openIndex !== index) return null;
  return <div className="accordion-content">{children}</div>;
}

// Uso Limpo e Declarativo:
export function FAQ() {
  return (
    <Accordion>
      <AccordionItem index={0}>
        <AccordionHeader index={0}>O que é o Vite?</AccordionHeader>
        <AccordionContent index={0}>Vite é um build tool de alta performance para projetos web.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

---

## 4. Otimização de Context API: Divisão de State e Dispatch

Ao criar um React Context, se o estado e as funções de alteração ficarem no mesmo objeto de contexto, **todos os componentes que consomem o contexto serão re-renderizados sempre que qualquer propriedade do estado mudar**, mesmo que precisem apenas disparar uma ação!

### ❌ Anti-padrão (Context Único causando Re-renders em toda a árvore):

```tsx
// VIOLAÇÃO: Re-renderiza o componente Button de salvar toda vez que o input muda!
const UserContext = createContext<{ user: User; setUser: React.Dispatch<React.SetStateAction<User>> } | undefined>(undefined);
```

### ✅ Forma Correta (Divisão em `StateContext` e `DispatchContext`):

```tsx
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

interface UserState {
  name: string;
  email: string;
  theme: 'light' | 'dark';
}

interface UserDispatch {
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  toggleTheme: () => void;
}

const UserStateContext = createContext<UserState | undefined>(undefined);
const UserDispatchContext = createContext<UserDispatch | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState>({ name: '', email: '', theme: 'light' });

  const setName = useCallback((name: string) => {
    setUser((prev) => ({ ...prev, name }));
  }, []);

  const setEmail = useCallback((email: string) => {
    setUser((prev) => ({ ...prev, email }));
  }, []);

  const toggleTheme = useCallback(() => {
    setUser((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  }, []);

  // Memoiza as ações para manter referência estável
  const dispatch = useMemo(() => ({ setName, setEmail, toggleTheme }), [setName, setEmail, toggleTheme]);

  return (
    <UserStateContext.Provider value={user}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserStateContext.Provider>
  );
}

// Custom Hooks Seguros
export function useUserState() {
  const context = useContext(UserStateContext);
  if (!context) throw new Error('useUserState deve ser usado dentro de um UserProvider');
  return context;
}

export function useUserDispatch() {
  const context = useContext(UserDispatchContext);
  if (!context) throw new Error('useUserDispatch deve ser usado dentro de um UserProvider');
  return context;
}
```
