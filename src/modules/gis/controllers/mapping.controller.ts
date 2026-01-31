/**
 * GIS & Mapping Controller
 *
 * Endpoints para mapas, geocoding y rutas
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { gisService } from '../services/mapping.service';
import { incidentMapService } from '../services/incident-map.service';

/**
 * POST /api/gis/geocode
 * Geocodifica una dirección a coordenadas
 */
export async function POST_GEOCODE(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const body = await req.json();

      if (!body.address) {
        return NextResponse.json(
          { success: false, error: 'Address is required' },
          { status: 400 }
        );
      }

      const result = await gisService.geocodeAddress(body.address);

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Address not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Geocoding error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/gis/reverse-geocode
 * Coordenadas a dirección
 */
export async function POST_REVERSE(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const body = await req.json();

      if (!body.longitude || !body.latitude) {
        return NextResponse.json(
          { success: false, error: 'Longitude and latitude are required' },
          { status: 400 }
        );
      }

      const address = await gisService.reverseGeocode(
        body.longitude,
        body.latitude
      );

      if (!address) {
        return NextResponse.json(
          { success: false, error: 'Address not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { address },
      });
    } catch (error) {
      console.error('Reverse geocoding error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/gis/route
 * Calcula ruta entre dos puntos
 */
export async function POST_ROUTE(req: NextRequest) {
  return withAuth(async (_req) => {
    try {
      const body = await req.json();

      if (!body.origin || !body.destination) {
        return NextResponse.json(
          { success: false, error: 'Origin and destination are required' },
          { status: 400 }
        );
      }

      const route = await gisService.getRoute(body.origin, body.destination);

      if (!route) {
        return NextResponse.json(
          { success: false, error: 'Route not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: route,
      });
    } catch (error) {
      console.error('Route calculation error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/gis/heatmap
 * Genera heatmap de incidencia delictiva con datos reales
 */
export async function GET_HEATMAP(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { searchParams } = new URL(req.url);

      // Parse search params
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');
      const limit = parseInt(searchParams.get('limit') || '100');

      const startDate = startDateParam ? new Date(startDateParam) : undefined;
      const endDate = endDateParam ? new Date(endDateParam) : undefined;

      // Obtener incidentes reales de la base de datos con geocodificación
      const incidents = await incidentMapService.getMapIncidents(
        user.corporationId, // Filtrar por corporación del usuario (admin ve todas)
        startDate,
        endDate,
        limit
      );

      // Convertir incidentes a formato esperado por el heatmap service
      const heatmapPoints = incidents
        .filter((i) => i.latitude && i.longitude)
        .map((incident) => ({
          latitude: incident.latitude!,
          longitude: incident.longitude!,
          weight: 1, // Se puede calcular basado en severidad del incidente
        }));

      const heatmap = await gisService.generateCrimeHeatmap(heatmapPoints);

      return NextResponse.json({
        success: true,
        data: heatmap,
        meta: {
          totalIncidents: incidents.length,
          incidentsWithCoords: heatmapPoints.length,
          startDate,
          endDate,
        },
      });
    } catch (error) {
      console.error('Heatmap generation error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * GET /api/gis/map-data
 * Obtiene datos de mapa para visualización con incidentes reales
 */
export async function GET_MAP_DATA(req: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { searchParams } = new URL(req.url);

      const bounds = {
        minLon: parseFloat(searchParams.get('minLon') || '-180'),
        minLat: parseFloat(searchParams.get('minLat') || '-90'),
        maxLon: parseFloat(searchParams.get('maxLon') || '180'),
        maxLat: parseFloat(searchParams.get('maxLat') || '90'),
      };

      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');
      const limit = parseInt(searchParams.get('limit') || '100');

      const startDate = startDateParam ? new Date(startDateParam) : undefined;
      const endDate = endDateParam ? new Date(endDateParam) : undefined;

      // Obtener incidentes reales de la base de datos
      const incidents = await incidentMapService.getMapIncidents(
        user.corporationId,
        startDate,
        endDate,
        limit
      );

      // Filtrar por bounds si se proporcionaron
      const filteredIncidents = incidents.filter((incident) => {
        if (!incident.latitude || !incident.longitude) return false;
        return (
          incident.longitude >= bounds.minLon &&
          incident.longitude <= bounds.maxLon &&
          incident.latitude >= bounds.minLat &&
          incident.latitude <= bounds.maxLat
        );
      });

      // Obtener estadísticas
      const stats = await incidentMapService.getIncidentStats(user.corporationId);

      return NextResponse.json({
        success: true,
        data: {
          incidents: filteredIncidents,
          stats,
          bounds,
        },
      });
    } catch (error) {
      console.error('Map data fetch error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
