import { useEffect } from 'react';

const GATEWAY_SSE_URL =
  (import.meta as any).env?.VITE_FLOW_GATEWAY_SSE_URL || '/api/v1/proxy/flow/v1/events/stream';

export interface SSEDomainEvent {
  event_type: string;
  demand_id?: number;
  title?: string;
  status?: string;
  message?: string;
  timestamp?: string;
}

export function useSSE(onEventReceived: (event: SSEDomainEvent) => void, token?: string | null) {
  useEffect(() => {
    const effectiveToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('flowta_token') ||
          (() => {
            try {
              const raw = localStorage.getItem('auth-store');
              return raw ? JSON.parse(raw)?.state?.accessToken : null;
            } catch (e) {
              return null;
            }
          })()
        : null);

    if (!effectiveToken) {
      return;
    }

    const url = `${GATEWAY_SSE_URL}?token=${encodeURIComponent(effectiveToken)}`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(url);

      eventSource.addEventListener('domain_event', (e: MessageEvent) => {
        try {
          const parsed: SSEDomainEvent = JSON.parse(e.data);
          onEventReceived(parsed);
        } catch (err) {
          console.error('Erro ao processar evento SSE:', err);
        }
      });

      eventSource.onerror = () => {
        // Closed gracefully or retrying
      };
    } catch (e) {
      console.info('Conexão SSE em tempo real indisponível no ambiente local');
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token, onEventReceived]);
}
