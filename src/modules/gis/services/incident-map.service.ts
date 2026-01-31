/**
 * Incident Maps Service
 *
 * Obtiene incidentes reales de la BD y los geolocaliza para mostrar en el mapa
 */

import { db } from '@/shared/database/connection';
import { arrests } from '@/shared/database/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { geocodeAddress } from '@/modules/integrations/gis/gis.service';

/**
 * Incidente con coordenadas
 */
export interface Incident {
  id: string;
  type: 'arrest'; // Se puede extender a otros tipos
  date: Date;
  location: string;
  latitude?: number;
  longitude?: number;
  description: string;
  officerId?: string;
  corporationId: string;
  metadata?: Record<string, any>;
}

/**
 * Obtiene incidentes para mostrar en el mapa
 *
 * @param corporationId - ID de la corporación (opcional, si es admin trae todas)
 * @param startDate - Fecha de inicio del filtro (opcional)
 * @param endDate - Fecha de fin del filtro (opcional)
 * @param limit - Límite de incidentes a retornar (default: 100)
 * @returns Array de incidentes con coordenadas
 */
export async function getMapIncidents(
  corporationId?: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<Incident[]> {
  try {
    // Construir condiciones WHERE
    const conditions = [];

    if (corporationId) {
      conditions.push(eq(arrests.corporationId, corporationId));
    }

    if (startDate) {
      conditions.push(gte(arrests.arrestDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(arrests.arrestDate, endDate));
    }

    // Usar todas las condiciones con AND, o undefined si no hay condiciones
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Obtener arrests de la base de datos
    const arrestsData = await db
      .select({
        id: arrests.id,
        arrestDate: arrests.arrestDate,
        location: arrests.location,
        charges: arrests.charges,
        detaineeName: arrests.detaineeName,
        officerId: arrests.officerId,
        corporationId: arrests.corporationId,
        incidentReport: arrests.incidentReport,
      })
      .from(arrests)
      .where(whereClause)
      .limit(limit)
      .orderBy(arrests.arrestDate);

    // Convertir a formato de incidentes
    const incidents: Incident[] = await Promise.all(
      arrestsData.map(async (arrest) => {
        let latitude: number | undefined;
        let longitude: number | undefined;

        // Geocodificar la ubicación si tiene texto
        if (arrest.location) {
          try {
            const geoResult = await geocodeAddress(arrest.location);
            if (geoResult.success && geoResult.location) {
              latitude = geoResult.location.latitude;
              longitude = geoResult.location.longitude;
            }
          } catch (error) {
            console.error(`Error geocoding location "${arrest.location}":`, error);
          }
        }

        return {
          id: arrest.id,
          type: 'arrest',
          date: arrest.arrestDate,
          location: arrest.location || 'Ubicación desconocida',
          latitude,
          longitude,
          description: arrest.charges,
          officerId: arrest.officerId,
          corporationId: arrest.corporationId,
          metadata: {
            detaineeName: arrest.detaineeName,
            incidentReport: arrest.incidentReport,
          },
        };
      })
    );

    // Filtrar incidentes que tienen coordenadas válidas
    const incidentsWithCoords = incidents.filter(
      (incident) => incident.latitude && incident.longitude
    );

    console.log(
      `[Map Service] Retrieved ${incidents.length} incidents, ${incidentsWithCoords.length} with coordinates`
    );

    return incidentsWithCoords;
  } catch (error: any) {
    console.error('Error fetching map incidents:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de incidentes para el mapa
 *
 * @param corporationId - ID de la corporación (opcional)
 * @returns Estadísticas de incidentes
 */
export async function getIncidentStats(
  corporationId?: string
): Promise<{
  total: number;
  byType: Record<string, number>;
  byMonth: Record<string, number>;
  recent: number;
}> {
  try {
    const conditions = corporationId ? [eq(arrests.corporationId, corporationId)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total de arrests
    const allArrests = await db
      .select()
      .from(arrests)
      .where(whereClause);

    // Arrests recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentArrests = await db
      .select()
      .from(arrests)
      .where(
        whereClause
          ? and(whereClause, gte(arrests.arrestDate, thirtyDaysAgo))
          : gte(arrests.arrestDate, thirtyDaysAgo)
      );

    // Por mes
    const byMonth: Record<string, number> = {};
    allArrests.forEach((arrest) => {
      const month = arrest.arrestDate.toISOString().slice(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] || 0) + 1;
    });

    return {
      total: allArrests.length,
      byType: {
        arrest: allArrests.length,
      },
      byMonth,
      recent: recentArrests.length,
    };
  } catch (error: any) {
    console.error('Error fetching incident stats:', error);
    return {
      total: 0,
      byType: {},
      byMonth: {},
      recent: 0,
    };
  }
}

/**
 * Servicio de mapas de incidentes
 */
export const incidentMapService = {
  getMapIncidents,
  getIncidentStats,
};
