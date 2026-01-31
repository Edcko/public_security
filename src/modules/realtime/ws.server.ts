/**
 * WebSocket Server
 *
 * Servidor WebSocket personalizado para Next.js
 * Este archivo debe ser ejecutado como un proceso separado
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { wsService } from './websocket.service';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Crear app Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Parsear URL
      const parsedUrl = parse(req.url!, true);

      // Manejar requests de Next.js
      await handle(req, res, parsedUrl);
    } catch (err: any) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Inicializar WebSocket server
  wsService.initialize(server);

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> WebSocket server initialized`);
    });
});
