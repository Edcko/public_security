/**
 * Next.js API Route para WebSocket
 *
 * Esta ruta inicializa el servidor WebSocket para Next.js
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { initWebSocketServer } from '@/shared/websocket/socket.server';

let httpServer: HTTPServer | null = null;

/**
 * Handler principal de WebSocket
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!httpServer) {
    // Crear servidor HTTP si no existe
    const { createServer } = await import('http');

    httpServer = createServer();

    // Inicializar WebSocket server
    initWebSocketServer(httpServer);

    res.status(200).json({
      success: true,
      message: 'WebSocket server initialized',
      connectedClients: 0,
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'WebSocket server running',
      connectedClients: 0,
    });
  }
}

/**
 * Configuración para habilitar WebSocket en Next.js
 */
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
