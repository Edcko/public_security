/**
 * GPS Mock Consumer para Desarrollo
 *
 * Simula actualizaciones GPS de vehículos para testing
 */

import { broadcastVehicleUpdate } from '@/shared/websocket/socket.server';

export class MockGPSConsumer {
  private interval: NodeJS.Timeout | null = null;
  private baseLocation: { lat: number; lng: number };
  private vehicles = [
    { id: 'veh-001', plate: 'PAT-001' },
    { id: 'veh-002', plate: 'PAT-002' },
    { id: 'veh-003', plate: 'PAT-003' },
  ];

  constructor() {
    // CDMX coordinates para testing
    this.baseLocation = { lat: 19.4326, lng: -99.1332 };
  }

  /**
   * Inicia la simulación de GPS updates
   */
  start() {
    console.log('Starting mock GPS consumer...');

    this.interval = setInterval(() => {
      this.vehicles.forEach((vehicle) => {
        // Simular movimiento aleatorio
        const lat = this.baseLocation.lat + (Math.random() - 0.5) * 0.01;
        const lng = this.baseLocation.lng + (Math.random() - 0.5) * 0.01;
        const speed = Math.floor(Math.random() * 80); // 0-80 km/h
        const heading = Math.floor(Math.random() * 360);

        const update = {
          vehicleId: vehicle.id,
          latitude: lat.toString(),
          longitude: lng.toString(),
          speed,
          heading,
          timestamp: new Date(),
        };

        // Broadcast via WebSocket
        broadcastVehicleUpdate(vehicle.id, update);

        // Store en base de datos
        this.storeLocation(update);
      });
    }, 5000); // Cada 5 segundos
  }

  /**
   * Detiene la simulación
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Store en base de datos (TimescaleDB)
   */
  async storeLocation(data: any) {
    // TODO: Implementar store real en TimescaleDB
    console.log(`[MOCK GPS] ${data.vehicleId}:`, data);
  }
}

// Singleton instance
let mockConsumer: MockGPSConsumer | null = null;

export function getMockGPSConsumer(): MockGPSConsumer {
  if (!mockConsumer) {
    mockConsumer = new MockGPSConsumer();
  }

  return mockConsumer;
}
