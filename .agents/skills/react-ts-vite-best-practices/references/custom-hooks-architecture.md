# Arquitetura de Custom Hooks no React com TypeScript

Custom Hooks são o principal mecanismo no React para encapsular lógica de estado, efeitos colaterais e integração com APIs externas, permitindo reutilização e testabilidade.

---

## 1. Diretrizes Principais para Custom Hooks

1. **Nomeação**: Todo hook DEVE começar com o prefixo `use` (ex: `useFetch`, `useAuth`, `useDebounce`).
2. **Encapsulamento de Efeitos**: Componentes visuais não devem conter `useEffect` para requisições HTTP; essa responsabilidade é do Custom Hook.
3. **Retorno Previsível**:
   - Para 2 ou 3 valores onde o consumidor precisa renomear os retornos: use **Tuplas com `as const`**.
   - Para múltiplos valores/ações: use **Objetos com propriedades nomeadas**.

---

## 2. Padrão de Objeto vs Padrão de Tupla

### Retorno como Objeto (Recomendado para casos gerais):

```tsx
interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
```

### Retorno como Tupla com `as const`:

```tsx
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((prev) => !prev), []);
  
  return [value, toggle] as const; // 'as const' preserva os tipos exatos da tupla [boolean, () => void]
}
```

---

## 3. Prevenção de Race Conditions e Cleanup em Hooks Async

Ao realizar buscas assíncronas em um hook, **sempre utilize uma flag de cancelamento ou o `AbortController`** para evitar vazamento de memória e *race conditions* (quando uma requisição antiga retorna depois de uma nova).

```tsx
export function useAsyncData<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: any[] = []) {
  const [state, setState] = useState<{ data: T | null; isLoading: boolean; error: Error | null }>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    fetcher(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ data, isLoading: false, error: null });
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && !controller.signal.aborted) {
          setState({ data: null, isLoading: false, error });
        }
      });

    return () => {
      controller.abort(); // Limpa/Cancela a requisição se o componente for desmontado ou as deps mudarem
    };
  }, deps);

  return state;
}
```
