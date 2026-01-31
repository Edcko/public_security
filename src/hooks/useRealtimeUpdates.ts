/**
 * useRealtimeUpdates Hook
 *
 * Hook personalizado para conectarse a actualizaciones en tiempo real del dashboard
 * usando Server-Sent Events (SSE)
 */

import { useEffect, useState, useCallback, useRef } from 'react';

interface RealtimeUpdate {
  type: 'connected' | 'heartbeat' | 'personnel_updated' | 'vehicle_updated' | 'arrest_created';
  timestamp: string;
  data?: any;
  message?: string;
}

interface UseRealtimeUpdatesOptions {
  enabled?: boolean;
  onMessage?: (update: RealtimeUpdate) => void;
  onConnectionChange?: (connected: boolean) => void;
}

interface UseRealtimeUpdatesReturn {
  connected: boolean;
  lastUpdate: RealtimeUpdate | null;
  error: string | null;
  reconnect: () => void;
}

export function useRealtimeUpdates(
  options: UseRealtimeUpdatesOptions = {}
): UseRealtimeUpdatesReturn {
  const { enabled = true, onMessage, onConnectionChange } = options;

  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Limpiar conexión anterior si existe
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setError(null);

    try {
      const eventSource = new EventSource('/api/ws/dashboard');

      eventSource.onopen = () => {
        setConnected(true);
        setError(null);
        onConnectionChange?.(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: RealtimeUpdate = JSON.parse(event.data);
          setLastUpdate(data);
          onMessage?.(data);
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        setConnected(false);
        setError('Error de conexión');
        onConnectionChange?.(false);

        // Reconexión automática después de 5 segundos
        reconnectTimeoutRef.current = setTimeout(() => {
          if (enabled) {
            connect();
          }
        }, 5000);
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('Error creating EventSource:', err);
      setError('Error al crear conexión');
      setConnected(false);
    }
  }, [enabled, onMessage, onConnectionChange]);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  // Conectar cuando el hook se monta y enabled es true
  useEffect(() => {
    if (enabled) {
      connect();
    }

    // Cleanup cuando el hook se desmonta
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, connect]);

  return {
    connected,
    lastUpdate,
    error,
    reconnect,
  };
}
