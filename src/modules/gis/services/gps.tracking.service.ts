/**
 * GPS Tracking Service
 *
 * Servicio para tracking en tiempo real de patrullas y vehículos
 * Usa TimescaleDB para almacenamiento eficiente de datos time-series
 */

import { client } from '@/shared/database/connection';

/**
 * Actualización de ubicación GPS
 */
export interface GPSUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed?: number; // km/h
  heading?: number; // grados (0-359)
  altitude?: number; // metros
  accuracy?: number; // metros
  timestamp?: Date;
  officerId?: string; // Oficial asignado al vehículo
  status?: 'active' | 'idle' | 'pursuit' | 'sos';
}

/**
 * Ubicación GPS
 */
export interface GPSLocation {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude: number;
  accuracy: number;
  timestamp: Date;
  officerId?: string;
  status: string;
}

/**
 * Trail de un vehículo (histórico de ubicaciones)
 */
export interface VehicleTrail {
  vehicleId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

/**
 * Resultado de búsqueda de vehículos cercanos
 */
export interface NearbyVehiclesResult {
  vehicles: Array<{
    vehicleId: string;
    latitude: number;
    longitude: number;
    distance: number; // kilómetros
    status: string;
    officerId?: string;
  }>;
  total: number;
}

/**
 * Registra una actualización de ubicación GPS
 *
 * NOTA: Requiere tabla gps_tracking en TimescaleDB:
 * CREATE TABLE gps_tracking (
 *   time TIMESTAMPTZ NOT NULL,
 *   vehicle_id UUID NOT NULL REFERENCES vehicles(id),
 *   latitude DOUBLE PRECISION NOT NULL,
 *   longitude DOUBLE PRECISION NOT NULL,
 *   speed DOUBLE PRECISION,
 *   heading DOUBLE PRECISION,
 *   altitude DOUBLE PRECISION,
 *   accuracy DOUBLE PRECISION,
 *   officer_id UUID REFERENCES personnel(id),
 *   status VARCHAR(20),
 *   corporation_id UUID NOT NULL REFERENCES corporations(id)
 * );
 *
 * CREATE INDEX idx_gps_vehicle_id ON gps_tracking(vehicle_id, time DESC);
 * CREATE INDEX idx_gps_time ON gps_tracking(time DESC);
 * SELECT add_continuous_aggregate_policy('gps_tracking_hourly',
 *   start_offset => INTERVAL '1 month',
 *   end_offset => INTERVAL '1 hour',
 *   schedule_interval => INTERVAL '1 hour');
 */
export async function recordGPSUpdate(update: GPSUpdate): Promise<boolean> {
  try {
    // En desarrollo, simulamos el registro
    if (process.env.NODE_ENV === 'development') {
      console.log('GPS Update (simulado):', {
        vehicle: update.vehicleId,
        lat: update.latitude,
        lng: update.longitude,
        speed: update.speed || 0,
        status: update.status || 'active',
      });
      return true;
    }

    // En producción, insertar en TimescaleDB
    await client`
      INSERT INTO gps_tracking (
        time,
        vehicle_id,
        latitude,
        longitude,
        speed,
        heading,
        altitude,
        accuracy,
        officer_id,
        status,
        corporation_id
      ) VALUES (
        ${update.timestamp || new Date()},
        ${update.vehicleId},
        ${update.latitude},
        ${update.longitude},
        ${update.speed || 0},
        ${update.heading || 0},
        ${update.altitude || 0},
        ${update.accuracy || 0},
        ${update.officerId || null},
        ${update.status || 'active'},
        (SELECT corporation_id FROM vehicles WHERE id = ${update.vehicleId})
      )
    `;

    return true;
  } catch (error: any) {
    console.error('Error recording GPS update:', error);
    return false;
  }
}

/**
 * Obtiene la ubicación más reciente de un vehículo
 */
export async function getVehicleLocation(vehicleId: string): Promise<GPSLocation | null> {
  try {
    // En desarrollo, retornar datos simulados
    if (process.env.NODE_ENV === 'development') {
      return {
        vehicleId,
        latitude: 19.4326 + (Math.random() - 0.5) * 0.01,
        longitude: -99.1332 + (Math.random() - 0.5) * 0.01,
        speed: Math.floor(Math.random() * 80),
        heading: Math.floor(Math.random() * 360),
        altitude: 2240,
        accuracy: 10,
        timestamp: new Date(),
        status: 'active',
      };
    }

    // En producción, consultar TimescaleDB
    const [location] = await client`
      SELECT
        vehicle_id as "vehicleId",
        latitude,
        longitude,
        COALESCE(speed, 0) as speed,
        COALESCE(heading, 0) as heading,
        COALESCE(altitude, 0) as altitude,
        COALESCE(accuracy, 0) as accuracy,
        time as timestamp,
        officer_id as "officerId",
        COALESCE(status, 'active') as status
      FROM gps_tracking
      WHERE vehicle_id = ${vehicleId}
      ORDER BY time DESC
      LIMIT 1
    ` as GPSLocation[];

    return location || null;
  } catch (error: any) {
    console.error('Error getting vehicle location:', error);
    return null;
  }
}

/**
 * Obtiene el trail histórico de un vehículo
 */
export async function getVehicleTrail(
  vehicleId: string,
  startDate: Date,
  endDate: Date
): Promise<VehicleTrail[]> {
  try {
    // En desarrollo, retornar datos simulados
    if (process.env.NODE_ENV === 'development') {
      const trail: VehicleTrail[] = [];
      const currentTime = new Date();

      // Generar un punto cada 5 minutos
      for (let i = 0; i < 100; i++) {
        const time = new Date(currentTime.getTime() - i * 5 * 60 * 1000);
        trail.push({
          vehicleId,
          latitude: 19.4326 + (Math.random() - 0.5) * 0.01,
          longitude: -99.1332 + (Math.random() - 0.5) * 0.01,
          timestamp: time,
        });
      }

      return trail;
    }

    // En producción, consultar TimescaleDB
    const trail = await client`
      SELECT
        vehicle_id as "vehicleId",
        latitude,
        longitude,
        time as timestamp
      FROM gps_tracking
      WHERE vehicle_id = ${vehicleId}
        AND time BETWEEN ${startDate} AND ${endDate}
      ORDER BY time ASC
    ` as VehicleTrail[];

    return trail;
  } catch (error: any) {
    console.error('Error getting vehicle trail:', error);
    return [];
  }
}

/**
 * Busca vehículos cercanos a una ubicación
 */
export async function findNearbyVehicles(
  latitude: number,
  longitude: number,
  radius: number = 1, // kilómetros
  corporationId?: string
): Promise<NearbyVehiclesResult> {
  try {
    // En desarrollo, retornar datos simulados
    if (process.env.NODE_ENV === 'development') {
      const vehicles = [];
      const count = Math.floor(Math.random() * 10);

      for (let i = 0; i < count; i++) {
        const lat = latitude + (Math.random() - 0.5) * radius / 100;
        const lng = longitude + (Math.random() - 0.5) * radius / 100;

        vehicles.push({
          vehicleId: `vehicle-${i + 1}`,
          latitude: lat,
          longitude: lng,
          distance: Math.random() * radius,
          status: Math.random() > 0.3 ? 'active' : 'idle',
        });
      }

      return {
        vehicles,
        total: count,
      };
    }

    // En producción, consultar TimescaleDB con búsqueda geográfica
    // Usar PostGIS para búsquedas espaciales eficientes
    let query = client`
      SELECT DISTINCT ON (vehicle_id)
        vehicle_id as "vehicleId",
        latitude,
        longitude,
        time as timestamp,
        COALESCE(status, 'active') as status,
        officer_id as "officerId"
      FROM gps_tracking
      WHERE time > NOW() - INTERVAL '10 minutes'
    `;

    if (corporationId) {
      query = client`
        ${query}
        AND corporation_id = ${corporationId}
      `;
    }

    const locations = await query;

    // Calcular distancia y filtrar por radio
    const vehicles = locations
      .map((loc: any) => {
        const distance = calculateDistance(
          { latitude, longitude },
          { latitude: loc.latitude, longitude: loc.longitude }
        );

        return {
          ...loc,
          distance,
        };
      })
      .filter((v: any) => v.distance <= radius)
      .sort((a: any, b: any) => a.distance - b.distance);

    return {
      vehicles,
      total: vehicles.length,
    };
  } catch (error: any) {
    console.error('Error finding nearby vehicles:', error);
    return { vehicles: [], total: 0 };
  }
}

/**
 * Obtiene todas las ubicaciones activas (últimos 10 minutos)
 */
export async function getAllActiveLocations(
  corporationId?: string
): Promise<GPSLocation[]> {
  try {
    // En desarrollo, retornar datos simulados
    if (process.env.NODE_ENV === 'development') {
      const locations: GPSLocation[] = [];
      const count = Math.floor(Math.random() * 20) + 10;

      for (let i = 0; i < count; i++) {
        locations.push({
          vehicleId: `vehicle-${i + 1}`,
          latitude: 19.4326 + (Math.random() - 0.5) * 0.1,
          longitude: -99.1332 + (Math.random() - 0.5) * 0.1,
          speed: Math.floor(Math.random() * 80),
          heading: Math.floor(Math.random() * 360),
          altitude: 2240,
          accuracy: 10,
          timestamp: new Date(),
          status: Math.random() > 0.2 ? 'active' : 'idle',
        });
      }

      return locations;
    }

    // En producción, consultar TimescaleDB
    const locations = await client`
      SELECT DISTINCT ON (vehicle_id)
        vehicle_id as "vehicleId",
        latitude,
        longitude,
        COALESCE(speed, 0) as speed,
        COALESCE(heading, 0) as heading,
        COALESCE(altitude, 0) as altitude,
        COALESCE(accuracy, 0) as accuracy,
        time as timestamp,
        officer_id as "officerId",
        COALESCE(status, 'active') as status
      FROM gps_tracking
      WHERE time > NOW() - INTERVAL '10 minutes'
        ${corporationId ? client`AND corporation_id = ${corporationId}` : client``}
    ` as GPSLocation[];

    return locations;
  } catch (error: any) {
    console.error('Error getting all active locations:', error);
    return [];
  }
}

/**
 * Calcula distancia entre dos puntos (Haversine formula)
 * Retorna distancia en kilómetros
 */
function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convierte grados a radianes
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Limpia datos antiguos de GPS (retención policy)
 * Por defecto, elimina datos mayores a 90 días
 */
export async function cleanupOldGPSData(daysToKeep: number = 90): Promise<number> {
  try {
    // En desarrollo, solo loggear
    if (process.env.NODE_ENV === 'development') {
      console.log(`Limpieza GPS: eliminar datos mayores a ${daysToKeep} días (simulado)`);
      return 0;
    }

    // En producción, eliminar datos antiguos
    const result = await client`
      DELETE FROM gps_tracking
      WHERE time < NOW() - INTERVAL '${daysToKeep} days'
    `;

    return result.count || 0;
  } catch (error: any) {
    console.error('Error cleaning up GPS data:', error);
    return 0;
  }
}

/**
 * Verifica si un vehículo ha excedido un geofence
 */
export async function checkGeofence(
  vehicleId: string,
  geofence: {
    center: { latitude: number; longitude: number };
    radius: number; // kilómetros
  }
): Promise<{ inside: boolean; distance: number }> {
  try {
    const location = await getVehicleLocation(vehicleId);

    if (!location) {
      return { inside: false, distance: -1 };
    }

    const distance = calculateDistance(
      geofence.center,
      { latitude: location.latitude, longitude: location.longitude }
    );

    return {
      inside: distance <= geofence.radius,
      distance,
    };
  } catch (error: any) {
    console.error('Error checking geofence:', error);
    return { inside: false, distance: -1 };
  }
}

/**
 * Obtiene estadísticas de actividad de un vehículo
 */
export async function getVehicleStats(
  _vehicleId: string,
  _startDate: Date,
  _endDate: Date
): Promise<{
  totalDistance: number; // kilómetros
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  activeTime: number; // minutos
  idleTime: number; // minutos
}> {
  try {
    // En desarrollo, retornar datos simulados
    if (process.env.NODE_ENV === 'development') {
      return {
        totalDistance: Math.floor(Math.random() * 500) + 50,
        averageSpeed: Math.floor(Math.random() * 40) + 20,
        maxSpeed: Math.floor(Math.random() * 60) + 80,
        activeTime: Math.floor(Math.random() * 300) + 60,
        idleTime: Math.floor(Math.random() * 120) + 30,
      };
    }

    // En producción, calcular desde TimescaleDB
    // Esto requeriría queries más complejas con agregaciones
    return {
      totalDistance: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      activeTime: 0,
      idleTime: 0,
    };
  } catch (error: any) {
    console.error('Error getting vehicle stats:', error);
    return {
      totalDistance: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      activeTime: 0,
      idleTime: 0,
    };
  }
}
