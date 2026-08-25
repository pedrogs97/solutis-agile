---
name: react-ts-vite-best-practices
description: >-
  Guia essencial e boas práticas para desenvolvimento em ReactJS com TypeScript e Vite.
  Cobre padrões de projeto SOLID, arquitetura de Hooks e Context API otimizada,
  estratégias de estado para eliminar Prop Drilling, otimizações de performance e uso avançado do Tailwind CSS com CVA e cn().
---

# ReactJS + TypeScript + Vite: Guia de Boas Práticas e Padrões de Arquitetura

Esta skill fornece diretrizes arquiteturais, padrões de design e convenções de código para criar aplicações React modernas, escaláveis, testáveis e performáticas utilizando **TypeScript**, **Vite** e **Tailwind CSS**.

---

## 📑 Índice da Skill

1. [Checklist Rápido de Desenvolvimento](#-checklist-rápido-de-desenvolvimento)
2. [Guia SOLID no React](./references/solid-in-react.md)
3. [Gestão de Estados, Context API e Redução de Prop Drilling](./references/state-and-context.md)
4. [Arquitetura de Custom Hooks](./references/custom-hooks-architecture.md)
5. [Boas Práticas de Tailwind CSS, CVA e Utilitário cn()](./references/tailwind-best-practices.md)
6. [Otimizações e Boas Práticas com Vite](./references/vite-performance-optimization.md)
7. [Templates de Código Reutilizáveis](#-templates-disponíveis)

---

## ⚡ Checklist Rápido de Desenvolvimento

Ao criar ou refatorar componentes e recursos no React, certifique-se de seguir estes princípios:

### 1. SOLID & Arquitetura
- [ ] **Single Responsibility (SRP)**: O componente renderiza UI visual? A lógica de negócio está em um Custom Hook (`useX`) e as chamadas de API estão na camada de serviços (`/services`)?
- [ ] **Open/Closed (OCP)**: O componente aceita `children` ou prop de composição/slots para novos comportamentos sem modificar o código original?
- [ ] **Liskov Substitution (LSP)**: Ao criar wrappers de elementos HTML (ex: Button, Input), ele estende as props nativas via `React.ComponentPropsWithRef<'button'>` sem quebrar o comportamento padrão?
- [ ] **Interface Segregation (ISP)**: O componente exige apenas as propriedades de que realmente precisa em sua `Props` interface, em vez de receber objetos inteiros e inflados?
- [ ] **Dependency Inversion (DIP)**: As dependências externas (APIs, bibliotecas de terceiros) são injetadas ou abstraídas através de hooks/contextos em vez de instanciadas diretamente dentro da árvore de componentes?

### 2. Estilização & Tailwind CSS
- [ ] **Utilitário `cn()`**: Utiliza o ajudante `cn(...)` (`clsx` + `tailwind-merge`) ao mesclar a prop `className` para evitar conflitos de especificidade do Tailwind?
- [ ] **CVA para Variantes**: Utiliza **Class Variance Authority (CVA)** para componentes reutilizáveis de UI com múltiplas variantes e tamanhos tipados?
- [ ] **Classes Dinâmicas Estáticas**: Evita interpolação de strings dinâmicas no Tailwind (ex: `` bg-${color} ``) e utiliza dicionários/mapeamentos estáticos para permitir o JIT Purge do Tailwind?

### 3. Estados & Prop Drilling
- [ ] **State Colocation**: O estado local está declarado no componente mais próximo de onde é utilizado, evitando elevação de estado desnecessária (`lifting state up`)?
- [ ] **Component Composition**: Para evitar passar props por 3 ou mais níveis de profundidade (Prop Drilling), foi utilizada composição com `children` ou render props?
- [ ] **Context Splitting**: Quando a Context API é necessária, o estado (`StateContext`) está separado dos métodos de alteração (`DispatchContext`) para evitar re-renders desnecessários na árvore consumidora?

### 4. Custom Hooks & Performance
- [ ] **Efeitos Limpos**: `useEffect` é utilizado exclusivamente para sincronização com sistemas externos, não para transformar dados derivados (prefira `useMemo` ou cálculos diretos)?
- [ ] **Clean Retorno de Hooks**: Hooks retornam objetos desestruturáveis com estados claros (`data`, `isLoading`, `error`, `actions`)?
- [ ] **Code Splitting**: Páginas ou componentes pesados utilizam `React.lazy()` + `Suspense` para otimizar o bundle do Vite?

---

## 📦 Templates Disponíveis

- [Template de Componente SOLID com Tailwind + CVA + cn()](./templates/component-solid-template.tsx)
- [Template de Custom Hook Robusto em TS](./templates/custom-hook-template.ts)
- [Template de React Context Otimizado](./templates/context-template.tsx)
