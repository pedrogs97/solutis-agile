import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Template de Custom Hook com TypeScript:
 * 1. Tratamento seguro de requisições assíncronas com AbortController (previne race condition e vazamento de memória).
 * 2. Desacoplamento da chamada de API.
 * 3. Objeto de retorno com estado claro e ações memoizadas.
 */

export interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: () => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: (signal: AbortSignal) => Promise<T>,
  immediate = true
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    isLoading: immediate,
    error: null,
  });

  // Referência para guardar a função atual sem disparar novos renders desnecessários
  const asyncFuncRef = useRef(asyncFunction);
  useEffect(() => {
    asyncFuncRef.current = asyncFunction;
  }, [asyncFunction]);

  const execute = useCallback(async () => {
    const controller = new AbortController();
    
    setState((prev: UseAsyncState<T>) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFuncRef.current(controller.signal);
      if (!controller.signal.aborted) {
        setState({ data: result, isLoading: false, error: null });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError' && !controller.signal.aborted) {
        setState({ data: null, isLoading: false, error: err as Error });
      }
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
}
