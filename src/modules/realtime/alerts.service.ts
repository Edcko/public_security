/**
 * Alerts Service
 *
 * Sistema de alertas en tiempo real (SOS, geofence, etc.)
 */

import { wsService, RealTimeEventType } from './websocket.service';

/**
 * Tipos de alertas
 */
export enum AlertType {
  SOS = 'sos',
  GEOFENCE = 'geofence',
  SPEEDING = 'speeding',
  OFFICER_DOWN = 'officer_down',
  VEHICLE_STOLEN = 'vehicle_stolen',
  CHECKPOINT_MISSED = 'checkpoint_missed',
  WEAPON_NOT_CHECKED_IN = 'weapon_not_checked_in',
}

/**
 * Severidad de alertas
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Alerta
 */
export interface Alert {
  id?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  vehicleId?: string;
  officerId?: string;
  corporationId: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Respuesta de creación de alerta
 */
export interface AlertResponse {
  success: boolean;
  alert?: Alert;
  error?: string;
}

/**
 * Reglas de geofence
 */
export interface GeofenceRule {
  id: string;
  name: string;
  vehicleId?: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // kilómetros
  corporationId: string;
  active: boolean;
}

/**
 * Crea una nueva alerta
 */
export async function createAlert(alert: Omit<Alert, 'id' | 'acknowledged' | 'createdAt'>): Promise<AlertResponse> {
  try {
    const newAlert: Alert = {
      ...alert,
      id: generateAlertId(),
      acknowledged: false,
      createdAt: new Date(),
    };

    // En desarrollo, solo loggear
    if (process.env.NODE_ENV === 'development') {
      console.log('Alert created (simulado):', newAlert);

      // Enviar notificación WebSocket
      wsService.broadcastToCorporation(alert.corporationId, {
        type: getEventTypeForAlert(alert.type),
        data: newAlert,
        corporationId: alert.corporationId,
        timestamp: newAlert.createdAt,
      });

      return {
        success: true,
        alert: newAlert,
      };
    }

    // En producción, guardar en base de datos
    // const { db } = await import('@/shared/database/connection');
    // const [inserted] = await db.insert(alerts).values(newAlert).returning();

    // Enviar notificación WebSocket
    wsService.broadcastToCorporation(alert.corporationId, {
      type: getEventTypeForAlert(alert.type),
      data: newAlert,
      corporationId: alert.corporationId,
      timestamp: newAlert.createdAt,
    });

    return {
      success: true,
      alert: newAlert,
    };
  } catch (error: any) {
    console.error('Error creating alert:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Crea una alerta SOS
 */
export async function createSOSAlert(data: {
  officerId: string;
  vehicleId?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  corporationId: string;
  metadata?: Record<string, any>;
}): Promise<AlertResponse> {
  return createAlert({
    type: AlertType.SOS,
    severity: AlertSeverity.CRITICAL,
    title: '¡ALERTA SOS!',
    description: `Oficial ${data.officerId} ha activado alerta SOS`,
    location: data.location,
    vehicleId: data.vehicleId,
    officerId: data.officerId,
    corporationId: data.corporationId,
    metadata: data.metadata,
  });
}

/**
 * Crea una alerta de geofence
 */
export async function createGeofenceAlert(data: {
  vehicleId: string;
  geofenceId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  corporationId: string;
  outside: boolean;
}): Promise<AlertResponse> {
  return createAlert({
    type: AlertType.GEOFENCE,
    severity: AlertSeverity.MEDIUM,
    title: data.outside ? 'Vehículo fuera de geofence' : 'Vehículo dentro de geofence',
    description: `Vehículo ${data.vehicleId} ha ${data.outside ? 'salido' : 'entrado a'} el área permitida`,
    location: data.location,
    vehicleId: data.vehicleId,
    corporationId: data.corporationId,
    metadata: {
      geofenceId: data.geofenceId,
      outside: data.outside,
    },
  });
}

/**
 * Crea una alerta de exceso de velocidad
 */
export async function createSpeedingAlert(data: {
  vehicleId: string;
  speed: number;
  speedLimit: number;
  location: {
    latitude: number;
    longitude: number;
  };
  corporationId: string;
}): Promise<AlertResponse> {
  return createAlert({
    type: AlertType.SPEEDING,
    severity: data.speed > data.speedLimit * 1.5 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
    title: 'Exceso de velocidad detectado',
    description: `Vehículo ${data.vehicleId} excedió el límite de velocidad: ${data.speed} km/h (límite: ${data.speedLimit} km/h)`,
    location: data.location,
    vehicleId: data.vehicleId,
    corporationId: data.corporationId,
    metadata: {
      speed: data.speed,
      speedLimit: data.speedLimit,
    },
  });
}

/**
 * Crea una alerta de oficial caído
 */
export async function createOfficerDownAlert(data: {
  officerId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  corporationId: string;
  metadata?: Record<string, any>;
}): Promise<AlertResponse> {
  return createAlert({
    type: AlertType.OFFICER_DOWN,
    severity: AlertSeverity.CRITICAL,
    title: '¡OFICIAL CAÍDO!',
    description: `Alerta de oficial caído: ${data.officerId}`,
    location: data.location,
    officerId: data.officerId,
    corporationId: data.corporationId,
    metadata: data.metadata,
  });
}

/**
 * Reconoce una alerta
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<boolean> {
  try {
    // En desarrollo, solo loggear
    if (process.env.NODE_ENV === 'development') {
      console.log(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
      return true;
    }

    // En producción, actualizar en base de datos
    // const { db } = await import('@/shared/database/connection');
    // await db.update(alerts)
    //   .set({
    //     acknowledged: true,
    //     acknowledgedBy,
    //     acknowledgedAt: new Date(),
    //   })
    //   .where(eq(alerts.id, alertId));

    return true;
  } catch (error: any) {
    console.error('Error acknowledging alert:', error);
    return false;
  }
}

/**
 * Resuelve una alerta
 */
export async function resolveAlert(alertId: string): Promise<boolean> {
  try {
    // En desarrollo, solo loggear
    if (process.env.NODE_ENV === 'development') {
      console.log(`Alert ${alertId} resolved`);
      return true;
    }

    // En producción, actualizar en base de datos
    // const { db } = await import('@/shared/database/connection');
    // await db.update(alerts)
    //   .set({
    //     resolvedAt: new Date(),
    //   })
    //   .where(eq(alerts.id, alertId));

    return true;
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    return false;
  }
}

/**
 * Obtiene alertas activas
 */
export async function getActiveAlerts(_corporationId: string): Promise<Alert[]> {
  try {
    // En desarrollo, retornar vacío
    if (process.env.NODE_ENV === 'development') {
      return [];
    }

    // En producción, consultar base de datos
    // const { db } = await import('@/shared/database/connection');
    // const activeAlerts = await db
    //   .select()
    //   .from(alerts)
    //   .where(
    //     and(
    //       eq(alerts.corporationId, corporationId),
    //       isNull(alerts.resolvedAt)
    //     )
    //   )
    //   .orderBy(desc(alerts.createdAt));

    return [];
  } catch (error: any) {
    console.error('Error getting active alerts:', error);
    return [];
  }
}

/**
 * Verifica geofences para un vehículo
 */
export async function checkGeofences(
  _vehicleId: string,
  _location: { latitude: number; longitude: number },
  _corporationId: string
): Promise<void> {
  try {
    // En desarrollo, no hacer nada
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    // En producción, obtener geofences activos del vehículo
    // const { db } = await import('@/shared/database/connection');
    // const geofences = await db
    //   .select()
    //   .from(geofences)
    //   .where(
    //     and(
    //       eq(geofences.vehicleId, vehicleId),
    //       eq(geofences.active, true)
    //     )
    //   );

    // Verificar cada geofence
    // for (const geofence of geofences) {
    //   const distance = calculateDistance(
    //     geofence.center,
    //     location
    //   );

    //   if (distance > geofence.radius) {
    //     await createGeofenceAlert({
    //       vehicleId,
    //       geofenceId: geofence.id,
    //       location,
    //       corporationId,
    //       outside: true,
    //     });
    //   }
    // }
  } catch (error: any) {
    console.error('Error checking geofences:', error);
  }
}

/**
 * Genera un ID de alerta
 */
function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtiene el tipo de evento WebSocket para una alerta
 */
function getEventTypeForAlert(alertType: AlertType): RealTimeEventType {
  switch (alertType) {
    case AlertType.SOS:
      return RealTimeEventType.ALERT_SOS;
    case AlertType.GEOFENCE:
      return RealTimeEventType.ALERT_GEOFENCE;
    default:
      return RealTimeEventType.SYSTEM_ANNOUNCEMENT;
  }
}

