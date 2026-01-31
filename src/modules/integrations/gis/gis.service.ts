/**
 * GIS & Mapping Service
 *
 * Integración con Mapbox para mapas y geocoding
 */

/**
 * Información de ubicación
 */
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

/**
 * Respuesta de geocoding
 */
export interface GeocodingResponse {
  success: boolean;
  location?: Location;
  error?: string;
}

/**
 * Respuesta de geocoding inverso
 */
export interface ReverseGeocodingResponse {
  success: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  error?: string;
}

/**
 * Geocoding: Convierte dirección en coordenadas
 *
 * NOTA: Requiere Mapbox Access Token
 * 1. Crear cuenta en https://www.mapbox.com/
 * 2. Obtener Access Token
 * 3. Configurar en .env.local: MAPBOX_ACCESS_TOKEN=your_token
 */
export async function geocodeAddress(
  address: string,
  city?: string,
  state?: string,
  country: string = 'México'
): Promise<GeocodingResponse> {
  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

  if (!MAPBOX_TOKEN) {
    return {
      success: false,
      error: 'Mapbox no configurado. Se requiere MAPBOX_ACCESS_TOKEN en .env.local',
    };
  }

  try {
    // Construir query de búsqueda
    const query = encodeURIComponent(
      `${address}, ${city || ''} ${state || ''} ${country}`
    );

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return {
        success: false,
        error: 'Dirección no encontrada',
      };
    }

    const feature = data.features[0];
    const center = feature.center;

    return {
      success: true,
      location: {
        latitude: center[1],
        longitude: center[0],
        address: feature.place_name || address,
        city: feature.context?.find((c: any) => c.id.includes('place'))?.text,
        state: feature.context?.find((c: any) => c.id.includes('region'))?.text,
        country: feature.context?.find((c: any) => c.id.includes('country'))?.text,
        postalCode: feature.context?.find((c: any) => c.id.includes('postcode'))?.text,
      },
    };
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: 'Error al geocodificar dirección',
    };
  }
}

/**
 * Geocoding inverso: Convierte coordenadas en dirección
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodingResponse> {
  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

  if (!MAPBOX_TOKEN) {
    return {
      success: false,
      error: 'Mapbox no configurado',
    };
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return {
        success: false,
        error: 'Ubicación no encontrada',
      };
    }

    const feature = data.features[0];

    return {
      success: true,
      address: feature.place_name,
      city: feature.context?.find((c: any) => c.id.includes('place'))?.text,
      state: feature.context?.find((c: any) => c.id.includes('region'))?.text,
      country: feature.context?.find((c: any) => c.id.includes('country'))?.text,
      postalCode: feature.context?.find((c: any) => c.id.includes('postcode'))?.text,
    };
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    return {
      success: false,
      error: 'Error al obtener dirección desde coordenadas',
    };
  }
}

/**
 * Genera una URL de mapa estático con marcadores
 */
export function generateStaticMapURL(
  locations: Array<{ latitude: number; longitude: number; label?: string }>,
  width: number = 600,
  height: number = 400,
  zoom: number = 12
): string {
  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';

  if (!MAPBOX_TOKEN) {
    console.error('Mapbox no configurado');
    return '';
  }

  // Crear estilo del mapa
  const style = 'mapbox://styles/mapbox/streets-v11';

  // Construir URL estática
  // Usar la primera ubicación como centro del mapa
  const centerLocation = locations[0];
  const url = `https://api.mapbox.com/styles/v1/${style}/static/${centerLocation.longitude},${centerLocation.latitude},${zoom},0,${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;

  return url;
}

/**
 * Genera una ruta entre dos puntos para mostrar en el mapa
 */
export function generateRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): string {
  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';

  if (!MAPBOX_TOKEN) {
    return '';
  }

  return `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`;
}

/**
 * Calcula distancia entre dos puntos (en kilómetros)
 */
export function calculateDistance(
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
 * Busca lugares cercanos a una ubicación
 */
export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  searchQuery: string,
  radius: number = 1000 // metros
): Promise<{ success: boolean; places?: Array<any>; error?: string }> {
  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

  if (!MAPBOX_TOKEN) {
    return {
      success: false,
      error: 'Mapbox no configurado',
    };
  }

  try {
    const proximity = `proximity:${longitude},${latitude}`;
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchQuery}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&proximity=${proximity}&radius=${radius}`
    );

    if (!response.ok) {
      throw new Error(`Mapbox search failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      places: data.features || [],
    };
  } catch (error: any) {
    console.error('Search nearby places error:', error);
    return {
      success: false,
      error: 'Error al buscar lugares cercanos',
    };
  }
}

/**
 * Genera un heatmap de incidentes delictivos
 */
export function generateHeatmapOverlay(
  incidents: Array<{ latitude: number; longitude: number; weight?: number }>
): string {
  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';

  if (!MAPBOX_TOKEN || incidents.length === 0) {
    return '';
  }

  // Formato GeoJSON para heatmap
  const geojson = {
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

  // Generar URL del heatmap
  const encodedGeoJSON = encodeURIComponent(JSON.stringify(geojson));
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/geojson/${encodedGeoJSON}?access_token=${MAPBOX_TOKEN}`;
}
