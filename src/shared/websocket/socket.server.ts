/**
 * Real-Time WebSocket Server
 *
 * Servidor WebSocket para actualizaciones en tiempo real de:
 * - Ubicaciones de vehículos GPS
 * - Alertas y notificaciones
 * - Incidentes en tiempo real
 */

import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { gpsService } from '@/modules/gis/services/gps.service';

let io: Server | null = null;

/**
 * Inicializa el servidor WebSocket
 */
export function initWebSocketServer(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    path: '/api/ws',
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.APP_URL
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Unirse a room de corporación (para multi-tenancy en WebSockets)
    const corporationId = socket.handshake.auth.corporationId;

    if (corporationId) {
      socket.join(`corporation:${corporationId}`);
      console.log(`Client ${socket.id} joined corporation:${corporationId}`);
    }

    // Suscribir a actualizaciones GPS de vehículos específicos
    socket.on('subscribe:vehicle', (vehicleId: string) => {
      socket.join(`vehicle:${vehicleId}`);
      console.log(`Client ${socket.id} subscribed to vehicle ${vehicleId}`);

      // Enviar ubicación actual inmediatamente
      sendVehicleLocation(socket, vehicleId);
    });

    // Desuscribir de vehículo
    socket.on('unsubscribe:vehicle', (vehicleId: string) => {
      socket.leave(`vehicle:${vehicleId}`);
      console.log(`Client ${socket.id} unsubscribed from vehicle ${vehicleId}`);
    });

    // Suscribir a todas las actualizaciones de una corporación
    socket.on('subscribe:corporation', (corpId: string) => {
      socket.join(`corporation:${corpId}`);
      console.log(`Client ${socket.id} subscribed to corporation ${corpId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  console.log('WebSocket server initialized');

  return io;
}

/**
 * Envía la ubicación actual de un vehículo a un cliente específico
 */
async function sendVehicleLocation(socket: any, vehicleId: string) {
  try {
    const location = await gpsService.getVehicleLocation(vehicleId);

    if (location) {
      socket.emit('vehicle:update', {
        vehicleId,
        ...location,
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error('Error sending vehicle location:', error);
  }
}

/**
 * Broadcastea actualización de ubicación a todos los suscriptores de un vehículo
 */
export async function broadcastVehicleUpdate(vehicleId: string, data: any) {
  if (!io) {
    return;
  }

  io.to(`vehicle:${vehicleId}`).emit('vehicle:update', {
    vehicleId,
    ...data,
    timestamp: new Date(),
  });
}

/**
 * Broadcastea alerta a todos los clientes de una corporación
 */
export async function broadcastAlert(corporationId: string, alert: any) {
  if (!io) {
    return;
  }

  io.to(`corporation:${corporationId}`).emit('alert', {
    ...alert,
    timestamp: new Date(),
  });
}

/**
 * Broadcastea nuevo incidente a todos los clientes de una corporación
 */
export async function broadcastIncident(corporationId: string, incident: any) {
  if (!io) {
    return;
  }

  io.to(`corporation:${corporationId}`).emit('incident:new', {
    ...incident,
    timestamp: new Date(),
  });
}

/**
 * Obtiene el número de clientes conectados
 */
export function getConnectedClients(): number {
  return io ? io.sockets.sockets.size : 0;
}

/**
 * Obtiene el servidor WebSocket (para testing)
 */
export function getWebSocketServer(): Server | null {
  return io;
}
