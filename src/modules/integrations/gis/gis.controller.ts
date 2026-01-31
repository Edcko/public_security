/**
 * GIS & Mapping Controller
 *
 * Endpoints para mapas, geocoding y ubicaciones
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import {
  geocodeAddress,
  reverseGeocode,
  generateStaticMapURL,
  generateRoute,
  calculateDistance,
  searchNearbyPlaces,
  generateHeatmapOverlay,
} from './gis.service';

/**
 * POST /api/integrations/gis/geocode
 * Convierte dirección en coordenadas
 */
export async function POST_GEOCODE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { address, city, state } = body;

      if (!address) {
        return NextResponse.json(
          { success: false, error: 'address is required' },
          { status: 400 }
        );
      }

      const result = await geocodeAddress(address, city, state);

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Geocoding error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/gis/reverse-geocode
 * Convierte coordenadas en dirección
 */
export async function POST_REVERSE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { latitude, longitude } = body;

      if (!latitude || !longitude) {
        return NextResponse.json(
          { success: false, error: 'latitude and longitude are required' },
          { status: 400 }
        );
      }

      const result = await reverseGeocode(
        parseFloat(latitude),
        parseFloat(longitude)
      );

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Reverse geocoding error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/gis/distance
 * Calcula distancia entre dos puntos
 */
export async function POST_DISTANCE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { origin, destination } = body;

      if (!origin || !destination) {
        return NextResponse.json(
          { success: false, error: 'origin and destination are required' },
          { status: 400 }
        );
      }

      const distance = calculateDistance(origin, destination);

      return NextResponse.json({
        success: true,
        data: {
          distance: distance, // kilómetros
          unit: 'km',
        },
      });
    } catch (error: any) {
      console.error('Distance calculation error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/gis/route
 * Genera ruta entre dos puntos
 */
export async function POST_ROUTE(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { origin, destination } = body;

      if (!origin || !destination) {
        return NextResponse.json(
          { success: false, error: 'origin and destination are required' },
          { status: 400 }
        );
      }

      const routeURL = generateRoute(origin, destination);

      return NextResponse.json({
        success: true,
        data: {
          routeURL,
        },
      });
    } catch (error: any) {
      console.error('Route generation error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/gis/static-map
 * Genera imagen estática de mapa con marcadores
 */
export async function POST_STATIC_MAP(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { locations, width, height, zoom } = body;

      if (!locations || !Array.isArray(locations) || locations.length === 0) {
        return NextResponse.json(
          { success: false, error: 'locations array is required' },
          { status: 400 }
        );
      }

      const mapURL = generateStaticMapURL(
        locations,
        width || 600,
        height || 400,
        zoom || 12
      );

      return NextResponse.json({
        success: true,
        data: {
          mapURL,
        },
      });
    } catch (error: any) {
      console.error('Static map generation error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/gis/nearby
 * Busca lugares cercanos
 */
export async function POST_NEARBY(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { latitude, longitude, searchQuery, radius } = body;

      if (!latitude || !longitude || !searchQuery) {
        return NextResponse.json(
          { success: false, error: 'latitude, longitude, and searchQuery are required' },
          { status: 400 }
        );
      }

      const result = await searchNearbyPlaces(
        parseFloat(latitude),
        parseFloat(longitude),
        searchQuery,
        radius || 1000
      );

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Search nearby error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/integrations/gis/heatmap
 * Genera heatmap de incidentes delictivos
 */
export async function POST_HEATMAP(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const body = await req.json();
      const { incidents } = body;

      if (!incidents || !Array.isArray(incidents) || incidents.length === 0) {
        return NextResponse.json(
          { success: false, error: 'incidents array is required' },
          { status: 400 }
        );
      }

      const heatmapURL = generateHeatmapOverlay(incidents);

      return NextResponse.json({
        success: true,
        data: {
          heatmapURL,
        },
      });
    } catch (error: any) {
      console.error('Heatmap generation error:', error);
      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
