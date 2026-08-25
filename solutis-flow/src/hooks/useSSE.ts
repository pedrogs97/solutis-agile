import { useEffect } from 'react';

const GATEWAY_SSE_URL = 'http://localhost:8080/proxy/flow/v1/events/stream';

export interface SSEDomainEvent {
  event_type: string;
  demand_id?: number;
  title?: string;
  status?: string;
  message?: string;
  timestamp?: string;
}

export function useSSE(onEventReceived: (event: SSEDomainEvent) => void, token?: string) {
  useEffect(() => {
    const url = token ? `${GATEWAY_SSE_URL}?token=${token}` : GATEWAY_SSE_URL;
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

      eventSource.onerror = (err) => {
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
