/**
 * GIS & Mapping Service
 *
 * Integración con Mapbox GL JS para mapas, geocoding y visualización
 */

import axios from 'axios';

const MAPBOX_GEOCODING_API = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const MAPBOX_DIRECTIONS_API = 'https://api.mapbox.com/directions/v5/mapbox';

export interface GeocodingResult {
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  placeName: string;
}

export interface RouteResult {
  distance: number; // metros
  duration: number; // segundos
  geometry: any; // GeoJSON
}

/**
 * Geocodifica una dirección a coordenadas
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      console.warn('MAPBOX_ACCESS_TOKEN not set');
      return null;
    }

    const response = await axios.get(
      `${MAPBOX_GEOCODING_API}/${encodeURIComponent(address)}.json`,
      {
        params: {
          access_token: accessToken,
          limit: 1,
          country: 'MX',
        },
        timeout: 10000,
      }
    );

    if (response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];

      return {
        coordinates: feature.center,
        address: feature.place_name,
        placeName: feature.text,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocoding: coordenadas a dirección
 */
export async function reverseGeocode(
  longitude: number,
  latitude: number
): Promise<string | null> {
  try {
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      return null;
    }

    const response = await axios.get(
      `${MAPBOX_GEOCODING_API}/${longitude},${latitude}.json`,
      {
        params: {
          access_token: accessToken,
          types: 'address',
        },
      }
    );

    if (response.data.features && response.data.features.length > 0) {
      return response.data.features[0].place_name;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Calcula ruta entre dos puntos
 */
export async function getRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<RouteResult | null> {
  try {
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      return null;
    }

    const response = await axios.get(
      `${MAPBOX_DIRECTIONS_API}/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}`,
      {
        params: {
          access_token: accessToken,
          geometries: 'geojson',
        },
      }
    );

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];

      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
      };
    }

    return null;
  } catch (error) {
    console.error('Route calculation error:', error);
    return null;
  }
}

/**
 * Genera un heatmap de incidencia delictiva
 */
export async function generateCrimeHeatmap(
  incidents: Array<{ latitude: number; longitude: number; weight?: number }>
): Promise<any> {
  // Retorna datos en formato GeoJSON para heatmap
  return {
    type: 'FeatureCollection',
    features: incidents.map((incident) => ({
      type: 'Feature',
      properties: {
        weight: incident.weight || 1,
      },
      geometry: {
        type: 'Point',
        coordinates: [incident.longitude, incident.latitude],
      },
    })),
  };
}

/**
 * Genera clusters de incidentes
 */
export async function generateIncidentClusters(_incidents: any[]): Promise<any> {
  // TODO: Implementar clustering algorithm (DBSCAN o similar)
  return {
    type: 'FeatureCollection',
    features: [],
  };
}

/**
 * Obtiene datos de mapa para mostrar incidentes en un mapa
 */
export async function getMapData(
  _bounds?: {
    minLon: number;
    minLat: number;
    maxLon: number;
    maxLat: number;
  }
): Promise<any> {
  // TODO: Consultar incidentes y generar GeoJSON
  return {
    type: 'FeatureCollection',
    features: [],
  };
}

/**
 * Servicio GIS completo
 */
export const gisService = {
  geocodeAddress,
  reverseGeocode,
  getRoute,
  generateCrimeHeatmap,
  generateIncidentClusters,
  getMapData,
};
