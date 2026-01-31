# Real-Time GPS Tracking System

## 📡 Overview

Sistema de tracking GPS en tiempo real para patrullas y vehículos policiales.

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Vehicle GPS    │────▶│  RabbitMQ    │────▶│  GPS Consumer   │
│  (In-Vehicle)   │     │  Exchange    │     │  (Worker)       │
└─────────────────┘     └──────────────┘     └────────┬────────┘
                                                        │
                                                        ▼
                                                ┌───────────────┐
                                                │ TimescaleDB   │
                                                │ (Hypertable)  │
                                                └───────────────┘
                                                        │
                                                        ▼
                                                ┌───────────────┐
                                                │ WebSocket     │
                                                │ (Real-time)   │
                                                └───────────────┘
```

## 🐳 Docker Setup

### 1. Configurar RabbitMQ

```yaml
# docker-compose.yml actualizado
services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: security_mq
    restart: always
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - security_network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  timescaledb:
    image: timescale/timescaledb:latest-pg16
    container_name: timescaledb
    restart: always
    environment:
      POSTGRES_DB: public_security
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - timescaledb_data:/home/postgres/pgdata
    networks:
      - security_network

networks:
  security_network:
    driver: bridge

volumes:
  rabbitmq_data:
  timescaledb_data:
```

## 📊 TimescaleDB Hypertable Setup

### 1. Crear Hypertable para GPS Data

```sql
-- migrations/0004_gps_tracking.sql

-- Extensión de TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Tabla de GPS data
CREATE TABLE IF NOT EXISTS gps_tracking (
    time TIMESTAMPTZ NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    speed FLOAT,
    heading FLOAT,
    altitude FLOAT,
    accuracy FLOAT,
    satellite_count INTEGER,
    battery_level INTEGER,
    status VARCHAR(50),
    metadata JSONB
);

-- Convertir a hypertable (automatically partitioned by time)
SELECT create_hypertable('gps_tracking', 'time', if_not_exists => TRUE);

-- Crear índices
CREATE INDEX idx_gps_vehicle_time ON gps_tracking (vehicle_id, time DESC);
CREATE INDEX idx_gps_time ON gps_tracking (time DESC);

-- Retention policy: mantener datos por 90 días
SELECT add_retention_policy('gps_tracking', INTERVAL '90 days');

-- Compression: comprimir datos mayores a 7 días
ALTER TABLE gps_tracking SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'vehicle_id'
);
SELECT add_compression_policy('gps_tracking', INTERVAL '7 days');

-- Continuous aggregate para última posición
CREATE MATERIALIZED VIEW gps_latest_position
WITH (timescaledb.continuous) AS
SELECT
    vehicle_id,
    time,
    latitude,
    longitude,
    speed,
    heading,
    status
FROM gps_tracking
WHERE time > NOW() - INTERVAL '5 minutes';

-- Refresh continuous aggregate
SELECT add_continuous_aggregate_policy('gps_latest_position',
    start_offset => INTERVAL '5 minutes',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute');
```

## 🔄 RabbitMQ Consumer

### GPS Tracking Consumer

```typescript
// src/modules/gps/workers/gps-consumer.ts
import { connect, Channel, Connection } from 'amqplib';
import { db } from '@/shared/database/connection';
import { gpsTracking } from '@/shared/database/schema';

const QUEUE_NAME = 'gps_updates';
const EXCHANGE_NAME = 'gps';

export class GPSConsumer {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async connect() {
    this.connection = await connect(process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672');
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await this.channel.assertQueue(QUEUE_NAME, { durable: true });
    await this.channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'vehicle.#');

    console.log('GPS Consumer connected to RabbitMQ');
  }

  async start() {
    if (!this.channel) return;

    this.channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const gpsData = JSON.parse(msg.content.toString());

        // Insertar en TimescaleDB
        await db.insert(gpsTracking).values({
          vehicleId: gpsData.vehicleId,
          time: new Date(gpsData.timestamp),
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          speed: gpsData.speed,
          heading: gpsData.heading,
          altitude: gpsData.altitude,
          accuracy: gpsData.accuracy,
          satelliteCount: gpsData.satelliteCount,
          batteryLevel: gpsData.batteryLevel,
          status: gpsData.status,
          metadata: gpsData.metadata || {},
        });

        // Enviar actualización via WebSocket
        const { wsService } = await import('@/modules/realtime/websocket.service');
        wsService.broadcastGPSUpdate(gpsData.vehicleId, {
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          speed: gpsData.speed,
          heading: gpsData.heading,
          status: gpsData.status,
        });

        this.channel?.ack(msg);
      } catch (error) {
        console.error('Error processing GPS message:', error);
        this.channel?.nack(msg, false, true);
      }
    });
  }

  async close() {
    await this.channel?.close();
    await this.connection?.close();
  }
}

// Iniciar consumer
const consumer = new GPSConsumer();
consumer.connect().then(() => consumer.start());
```

## 📡 GPS Data Ingestion API

### Endpoint para recibir GPS data

```typescript
// src/app/api/gps/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { channel } from '@/modules/gps/workers/gps-consumer';

export async function POST(request: NextRequest) {
  try {
    const gpsData = await request.json();

    // Validar datos
    const { vehicleId, latitude, longitude, timestamp, speed, heading } = gpsData;

    if (!vehicleId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, latitude, longitude' },
        { status: 400 }
      );
    }

    // Publicar a RabbitMQ
    await channel.publish(
      'gps',
      `vehicle.${vehicleId}`,
      Buffer.from(JSON.stringify(gpsData))
    );

    return NextResponse.json({ success: true, message: 'GPS data received' });
  } catch (error: any) {
    console.error('Error ingesting GPS data:', error);
    return NextResponse.json(
      { error: 'Failed to process GPS data' },
      { status: 500 }
    );
  }
}
```

## 🗺️ Geofencing System

### 1. Crear Geofences

```sql
-- migrations/0005_geofencing.sql

CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporation_id UUID NOT NULL REFERENCES corporations(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'circle', 'polygon'
    coordinates JSONB NOT NULL, -- { center: {lat, lng}, radius: meters } for circle
    alert_type VARCHAR(50) NOT NULL, -- 'entry', 'exit', 'both'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geofence_corp ON geofences (corporation_id);
```

### 2. Geofence Checker

```typescript
// src/modules/gis/services/geofence.service.ts
import { db } from '@/shared/database/connection';
import { geofences } from '@/shared/database/schema';

export class GeofenceService {
  /**
   * Verificar si un vehículo está dentro de un geofence
   */
  static async checkGeofence(vehicleId: string, latitude: number, longitude: number) {
    const activeGeofences = await db
      .select()
      .from(geofences)
      .where(eq(geofences.active, true));

    const violations = [];

    for (const geofence of activeGeofences) {
      const isInside = this.isPointInGeofence(latitude, longitude, geofence);
      const wasInside = await this.getPreviousState(vehicleId, geofence.id);

      if (!wasInside && isInside && geofence.alertType !== 'exit') {
        violations.push({ geofence, type: 'entry' });
      }

      if (wasInside && !isInside && geofence.alertType !== 'entry') {
        violations.push({ geofence, type: 'exit' });
      }

      await this.saveState(vehicleId, geofence.id, isInside);
    }

    return violations;
  }

  /**
   * Verificar si punto está dentro de un geofence circular
   */
  static isPointInGeofence(
    lat: number,
    lng: number,
    geofence: any
  ): boolean {
    if (geofence.type === 'circle') {
      const center = geofence.coordinates.center;
      const radius = geofence.coordinates.radius;

      const distance = this.getDistanceFromLatLonInKm(
        lat,
        lng,
        center.lat,
        center.lng
      );

      return distance <= radius / 1000; // Convertir a km
    }

    // Para polígonos, usar algoritmo de point-in-polygon
    if (geofence.type === 'polygon') {
      return this.isPointInPolygon([lat, lng], geofence.coordinates.polygon);
    }

    return false;
  }

  /**
   * Calcular distancia entre dos puntos (Haversine formula)
   */
  static getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Verificar si punto está en polígono (Ray casting algorithm)
   */
  static isPointInPolygon(point: number[], polygon: number[][]): boolean {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      const intersect = yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }
}
```

## 🚨 SOS Alert System

```typescript
// src/app/api/sos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { wsService } from '@/modules/realtime/websocket.service';

export async function POST(request: NextRequest) {
  try {
    const { officerId, vehicleId, latitude, longitude } = await request.json();

    // Guardar en base de datos
    await db.insert(sosAlerts).values({
      officerId,
      vehicleId,
      latitude,
      longitude,
      timestamp: new Date(),
      status: 'active',
    });

    // Broadcast via WebSocket
    wsService.broadcastSOSAlert({
      officerId,
      vehicleId,
      location: { latitude, longitude },
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process SOS alert' },
      { status: 500 }
    );
  }
}
```

## 📱 Client-Side GPS Tracking

### JavaScript para enviar GPS desde vehículo

```javascript
// En el vehículo (tablet o dispositivo GPS)
function sendGPSUpdate() {
  navigator.geolocation.watchPosition(
    async (position) => {
      const gpsData = {
        vehicleId: 'vehicle-123',
        timestamp: position.timestamp,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
      };

      try {
        const response = await fetch('/api/gps/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gpsData),
        });

        if (!response.ok) {
          console.error('Failed to send GPS data');
        }
      } catch (error) {
        console.error('Error sending GPS data:', error);
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}

// Enviar cada 30 segundos
setInterval(sendGPSUpdate, 30000);
```

## 🗺️ Mapa en Tiempo Real

### Componente de Mapa con Leaflet

```typescript
// src/components/map/RealtimeMap.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useWebSocket } from '@/hooks/useWebSocket';
import 'leaflet/dist/leaflet.css';

export function RealtimeMap() {
  const [vehicles, setVehicles] = useState<any[]>([]);

  const { on } = useWebSocket();

  useEffect(() => {
    on('gps:update', (data: any) => {
      setVehicles((prev) => {
        const existing = prev.find((v) => v.id === data.vehicleId);
        if (existing) {
          return prev.map((v) =>
            v.id === data.vehicleId
              ? { ...v, latitude: data.latitude, longitude: data.longitude }
              : v
          );
        }
        return [...prev, {
          id: data.vehicleId,
          latitude: data.latitude,
          longitude: data.longitude,
        }];
      });
    });
  }, [on]);

  return (
    <MapContainer center={[19.4326, -99.1332]} zoom={13} style={{ height: '80vh' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.latitude, vehicle.longitude]}
        >
          <Popup>Vehículo {vehicle.id}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

## ✅ Testing GPS System

```bash
# Test de ingesta de GPS data
curl -X POST http://localhost:3000/api/gps/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "test-vehicle-1",
    "latitude": 19.4326,
    "longitude": -99.1332,
    "speed": 60,
    "heading": 90,
    "timestamp": "2026-01-29T15:30:00Z"
  }'
```

---

**Sistema GPS en tiempo real listo!** 🚀
