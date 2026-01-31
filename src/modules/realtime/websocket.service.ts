/**
 * WebSocket Service
 *
 * Servicio para comunicación en tiempo real con clientes
 * Usa Socket.IO para WebSocket
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

/**
 * Tipos de eventos en tiempo real
 */
export enum RealTimeEventType {
  GPS_UPDATE = 'gps:update',
  VEHICLE_STATUS = 'vehicle:status',
  ALERT_SOS = 'alert:sos',
  ALERT_GEOFENCE = 'alert:geofence',
  INCIDENT_CREATED = 'incident:created',
  ARREST_CREATED = 'arrest:created',
  OFFICER_STATUS = 'officer:status',
  SYSTEM_ANNOUNCEMENT = 'system:announcement',
}

/**
 * Evento en tiempo real
 */
export interface RealTimeEvent {
  type: RealTimeEventType;
  data: any;
  corporationId?: string;
  timestamp: Date;
  userId?: string;
}

/**
 * Cliente conectado
 */
interface ConnectedClient {
  id: string;
  userId?: string;
  corporationId?: string;
  rooms: string[];
  connectedAt: Date;
}

/**
 * Servicio WebSocket (Singleton)
 */
class WebSocketService {
  private io: SocketIOServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();

  /**
   * Inicializa el servidor WebSocket
   */
  initialize(httpServer: HTTPServer) {
    if (this.io) {
      console.warn('WebSocket server already initialized');
      return;
    }

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('WebSocket server initialized');
  }

  /**
   * Maneja una nueva conexión
   */
  private handleConnection(socket: any) {
    const client: ConnectedClient = {
      id: socket.id,
      connectedAt: new Date(),
      rooms: [],
    };

    this.clients.set(socket.id, client);

    console.log(`Client connected: ${socket.id}`);

    // Autenticación
    socket.on('authenticate', (data: { token?: string; corporationId?: string }) => {
      if (data.corporationId) {
        client.corporationId = data.corporationId;

        // Unir a sala de la corporación
        const room = `corporation:${data.corporationId}`;
        socket.join(room);
        client.rooms.push(room);

        console.log(`Client ${socket.id} joined room: ${room}`);
      }

      // Enviar confirmación
      socket.emit('authenticated', {
        success: true,
        clientId: socket.id,
      });
    });

    // Unirse a sala específica
    socket.on('join-room', (room: string) => {
      socket.join(room);
      client.rooms.push(room);

      console.log(`Client ${socket.id} joined room: ${room}`);
      socket.emit('room-joined', { room });
    });

    // Salir de sala
    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      client.rooms = client.rooms.filter((r) => r !== room);

      console.log(`Client ${socket.id} left room: ${room}`);
      socket.emit('room-left', { room });
    });

    // Suscribirse a actualizaciones GPS de un vehículo
    socket.on('subscribe:vehicle', (vehicleId: string) => {
      const room = `vehicle:${vehicleId}`;
      socket.join(room);
      client.rooms.push(room);

      console.log(`Client ${socket.id} subscribed to vehicle: ${vehicleId}`);
      socket.emit('subscribed', { type: 'vehicle', id: vehicleId });
    });

    // Desuscribirse de actualizaciones GPS de un vehículo
    socket.on('unsubscribe:vehicle', (vehicleId: string) => {
      const room = `vehicle:${vehicleId}`;
      socket.leave(room);
      client.rooms = client.rooms.filter((r) => r !== room);

      console.log(`Client ${socket.id} unsubscribed from vehicle: ${vehicleId}`);
      socket.emit('unsubscribed', { type: 'vehicle', id: vehicleId });
    });

    // Desconexión
    socket.on('disconnect', () => {
      this.clients.delete(socket.id);
      console.log(`Client disconnected: ${socket.id}`);
    });

    // Enviar mensaje de bienvenida
    socket.emit('connected', {
      clientId: socket.id,
      timestamp: new Date(),
    });
  }

  /**
   * Envía un evento a todos los clientes
   */
  broadcast(event: RealTimeEvent) {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.emit(event.type, {
      ...event.data,
      timestamp: event.timestamp,
    });
  }

  /**
   * Envía un evento a una corporación específica
   */
  broadcastToCorporation(corporationId: string, event: RealTimeEvent) {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(`corporation:${corporationId}`).emit(event.type, {
      ...event.data,
      timestamp: event.timestamp,
    });
  }

  /**
   * Envía un evento a una sala específica
   */
  broadcastToRoom(room: string, event: RealTimeEvent) {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(room).emit(event.type, {
      ...event.data,
      timestamp: event.timestamp,
    });
  }

  /**
   * Envía actualización de GPS de un vehículo
   */
  broadcastGPSUpdate(vehicleId: string, data: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    status: string;
  }) {
    const event: RealTimeEvent = {
      type: RealTimeEventType.GPS_UPDATE,
      data: {
        vehicleId,
        ...data,
      },
      timestamp: new Date(),
    };

    this.broadcastToRoom(`vehicle:${vehicleId}`, event);
  }

  /**
   * Envía alerta SOS
   */
  broadcastSOSAlert(data: {
    officerId: string;
    vehicleId?: string;
    location: { latitude: number; longitude: number };
    timestamp: Date;
  }) {
    const event: RealTimeEvent = {
      type: RealTimeEventType.ALERT_SOS,
      data,
      timestamp: new Date(),
    };

    this.broadcast(event);
  }

  /**
   * Envía alerta de geofence
   */
  broadcastGeofenceAlert(data: {
    vehicleId: string;
    geofenceId: string;
    location: { latitude: number; longitude: number };
    outside: boolean;
  }) {
    const event: RealTimeEvent = {
      type: RealTimeEventType.ALERT_GEOFENCE,
      data,
      timestamp: new Date(),
    };

    this.broadcast(event);
  }

  /**
   * Envía notificación de nuevo incidente
   */
  broadcastIncidentCreated(data: {
    incidentId: string;
    type: string;
    location: { latitude: number; longitude: number };
    officerId: string;
  }) {
    const event: RealTimeEvent = {
      type: RealTimeEventType.INCIDENT_CREATED,
      data,
      timestamp: new Date(),
    };

    this.broadcast(event);
  }

  /**
   * Envía notificación de nuevo arresto
   */
  broadcastArrestCreated(data: {
    arrestId: string;
    officerId: string;
    location: { latitude: number; longitude: number };
  }) {
    const event: RealTimeEvent = {
      type: RealTimeEventType.ARREST_CREATED,
      data,
      timestamp: new Date(),
    };

    this.broadcast(event);
  }

  /**
   * Obtiene estadísticas de conexiones
   */
  getStats() {
    return {
      totalClients: this.clients.size,
      clients: Array.from(this.clients.values()).map((client) => ({
        id: client.id,
        corporationId: client.corporationId,
        rooms: client.rooms.length,
        connectedAt: client.connectedAt,
      })),
    };
  }

  /**
   * Desconecta un cliente
   */
  disconnectClient(clientId: string) {
    if (!this.io) {
      return;
    }

    const socket = this.io.sockets.sockets.get(clientId);
    if (socket) {
      socket.disconnect();
      this.clients.delete(clientId);
    }
  }

  /**
   * Desconecta todos los clientes de una corporación
   */
  disconnectCorporationClients(corporationId: string) {
    const clientsToDisconnect: string[] = [];

    this.clients.forEach((client, clientId) => {
      if (client.corporationId === corporationId) {
        clientsToDisconnect.push(clientId);
      }
    });

    clientsToDisconnect.forEach((clientId) => {
      this.disconnectClient(clientId);
    });

    console.log(`Disconnected ${clientsToDisconnect.length} clients from corporation: ${corporationId}`);
  }
}

// Exportar singleton
export const wsService = new WebSocketService();

/**
 * Hook para usar WebSocket en el cliente
 */
export function useWebSocket() {
  if (typeof window === 'undefined') {
    return {
      socket: null,
      connected: false,
    };
  }

  // Importar dinámicamente solo en el cliente
  let socket: any = null;

  const connect = () => {
    const io = require('socket.io-client');

    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return socket;
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };

  const joinRoom = (room: string) => {
    if (socket) {
      socket.emit('join-room', room);
    }
  };

  const leaveRoom = (room: string) => {
    if (socket) {
      socket.emit('leave-room', room);
    }
  };

  const subscribeToVehicle = (vehicleId: string) => {
    if (socket) {
      socket.emit('subscribe:vehicle', vehicleId);
    }
  };

  const unsubscribeFromVehicle = (vehicleId: string) => {
    if (socket) {
      socket.emit('unsubscribe:vehicle', vehicleId);
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  return {
    socket,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    subscribeToVehicle,
    unsubscribeFromVehicle,
    on,
    off,
    connected: socket?.connected || false,
  };
}
