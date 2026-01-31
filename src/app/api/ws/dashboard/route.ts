/**
 * Realtime Dashboard Updates - Server-Sent Events (SSE)
 *
 * Endpoint para actualizaciones en tiempo real del dashboard
 * Los clientes se conectan y reciben updates cuando hay cambios
 */

import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ws/dashboard
 * Establece conexión SSE con el cliente
 */
export async function GET(req: NextRequest) {
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Deshabilitar buffering en nginx
  });

  const encoder = new TextEncoder();

  // Crear readable stream
  const stream = new ReadableStream({
    async start(controller) {
      // Función para enviar eventos al cliente
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Enviar evento de conexión exitosa
      sendEvent({
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Conectado al dashboard en tiempo real',
      });

      // Simular actualizaciones periódicas para demo
      // En producción, esto sería reemplazado por eventos reales de la base de datos
      const intervalId = setInterval(() => {
        // Enviar heartbeat para mantener conexión viva
        sendEvent({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        });
      }, 30000); // Cada 30 segundos

      // Escuchar cuando el cliente se desconecta
      req.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}

/**
 * Broadcast de actualizaciones a todos los clientes conectados
 *
 * NOTA: En una implementación real, necesitarías:
 * 1. Un sistema de pub/sub (Redis, NATS, etc.)
 * 2. WebSockets server separado
 * 3. O polling periódico desde el cliente
 *
 * Para este ejemplo, usamos SSE unidireccional
 */

// Ejemplo de cómo se usaría desde otros endpoints:
/*
async function broadcastUpdate(type: string, data: any) {
  // En un sistema real, esto publicaría a Redis o similar
  // y los clientes SSE recibirían el evento
}
*/
