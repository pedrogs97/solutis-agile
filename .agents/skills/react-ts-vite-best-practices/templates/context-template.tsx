import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

/**
 * Template de Context API Performático:
 * 1. Separação de StateContext e DispatchContext para evitar re-renderizações indesejadas em componentes consumidores.
 * 2. Custom hooks tipados com verificação de nulo (`undefined check`).
 * 3. Ações memoizadas com `useCallback` e `useMemo`.
 */

// 1. Definição das Interfaces de Estado e Ações
export interface FeatureState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notificationsCount: number;
}

export interface FeatureDispatch {
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setNotificationsCount: (count: number) => void;
}

// 2. Criação dos Contextos Isolados
const FeatureStateContext = createContext<FeatureState | undefined>(undefined);
const FeatureDispatchContext = createContext<FeatureDispatch | undefined>(undefined);

// 3. Componente Provider
export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FeatureState>({
    theme: 'light',
    sidebarOpen: true,
    notificationsCount: 0,
  });

  const toggleTheme = useCallback(() => {
    setState((prev: FeatureState) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((prev: FeatureState) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  const setNotificationsCount = useCallback((count: number) => {
    setState((prev: FeatureState) => ({ ...prev, notificationsCount: count }));
  }, []);

  const dispatch = useMemo(
    () => ({
      toggleTheme,
      toggleSidebar,
      setNotificationsCount,
    }),
    [toggleTheme, toggleSidebar, setNotificationsCount]
  );

  return (
    <FeatureStateContext.Provider value={state}>
      <FeatureDispatchContext.Provider value={dispatch}>
        {children}
      </FeatureDispatchContext.Provider>
    </FeatureStateContext.Provider>
  );
}

// 4. Custom Hooks de Consumo Seguro
export function useFeatureState(): FeatureState {
  const context = useContext(FeatureStateContext);
  if (!context) {
    throw new Error('useFeatureState deve ser usado dentro de um FeatureProvider');
  }
  return context;
}

export function useFeatureDispatch(): FeatureDispatch {
  const context = useContext(FeatureDispatchContext);
  if (!context) {
    throw new Error('useFeatureDispatch deve ser usado dentro de um FeatureProvider');
  }
  return context;
}
