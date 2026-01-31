/**
 * Heatmap Service
 *
 * Generación de mapas de calor con clustering avanzado
 */

import { GeoPoint, Cluster, clusteringService } from './clustering.service';

/**
 * Configuración del heatmap
 */
export interface HeatmapConfig {
  algorithm: 'dbscan' | 'kmeans' | 'density';
  epsilon?: number; // Para DBSCAN (km)
  minPts?: number; // Para DBSCAN
  k?: number; // Para K-Means
  gridSize?: number; // Para densidad (km)
  threshold?: number; // Para hotspots
  weightAttribute?: keyof GeoPoint;
}

/**
 * Datos del heatmap
 */
export interface HeatmapData {
  clusters: Cluster[];
  hotspots: Array<{
    center: { latitude: number; longitude: number };
    density: number;
    pointCount: number;
  }>;
  geojson: any; // GeoJSON para visualización
  summary: {
    totalPoints: number;
    totalClusters: number;
    averageClusterSize: number;
    highestDensity: number;
  };
}

/**
 * Genera heatmap con clustering
 *
 * @param points - Array de puntos geográficos
 * @param config - Configuración del clustering
 * @returns Datos del heatmap
 */
export function generateHeatmap(
  points: GeoPoint[],
  config: HeatmapConfig = { algorithm: 'dbscan' }
): HeatmapData {
  if (points.length === 0) {
    return {
      clusters: [],
      hotspots: [],
      geojson: { type: 'FeatureCollection', features: [] },
      summary: {
        totalPoints: 0,
        totalClusters: 0,
        averageClusterSize: 0,
        highestDensity: 0,
      },
    };
  }

  let clusters: Cluster[] = [];
  let hotspots: any[] = [];

  // Aplicar algoritmo seleccionado
  switch (config.algorithm) {
    case 'dbscan':
      const dbscanResult = clusteringService.dbscan(
        points,
        config.epsilon || 0.5,
        config.minPts || 5
      );
      clusters = dbscanResult.clusters;
      break;

    case 'kmeans':
      const kmeansResult = clusteringService.kMeans(
        points,
        config.k || Math.max(3, Math.floor(Math.sqrt(points.length)))
      );
      clusters = kmeansResult.clusters;
      break;

    case 'density':
      hotspots = clusteringService.findHotspots(
        points,
        config.gridSize || 0.5,
        config.threshold || 10
      );
      break;
  }

  // Generar GeoJSON para visualización
  const geojson = generateHeatmapGeoJSON(clusters, hotspots, points);

  // Calcular estadísticas
  const totalPoints = points.length;
  const totalClusters = clusters.length;
  const averageClusterSize =
    totalClusters > 0
      ? totalPoints / totalClusters
      : 0;
  const highestDensity =
    clusters.length > 0
      ? Math.max(...clusters.map((c) => c.totalWeight / (Math.PI * c.radius * c.radius)))
      : hotspots.length > 0
      ? Math.max(...hotspots.map((h) => h.density))
      : 0;

  return {
    clusters,
    hotspots,
    geojson,
    summary: {
      totalPoints,
      totalClusters,
      averageClusterSize,
      highestDensity,
    },
  };
}

/**
 * Genera GeoJSON para el heatmap
 */
function generateHeatmapGeoJSON(
  clusters: Cluster[],
  hotspots: any[],
  originalPoints: GeoPoint[]
): any {
  const features: any[] = [];

  // Agregar clusters como polígonos
  for (const cluster of clusters) {
    if (cluster.pointCount < 3) continue;

    // Crear círculo aproximado con polígono
    const coordinates = createCirclePolygon(
      cluster.center.longitude,
      cluster.center.latitude,
      cluster.radius
    );

    features.push({
      type: 'Feature',
      properties: {
        id: cluster.id,
        type: 'cluster',
        pointCount: cluster.pointCount,
        totalWeight: cluster.totalWeight,
        dominantCrimeType: cluster.dominantCrimeType,
        radius: cluster.radius,
        intensity: Math.min(1, cluster.pointCount / 50), // Normalizado 0-1
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
    });
  }

  // Agregar hotspots como puntos
  for (const hotspot of hotspots) {
    features.push({
      type: 'Feature',
      properties: {
        type: 'hotspot',
        density: hotspot.density,
        pointCount: hotspot.pointCount,
        intensity: Math.min(1, hotspot.density / 100), // Normalizado 0-1
      },
      geometry: {
        type: 'Point',
        coordinates: [hotspot.center.longitude, hotspot.center.latitude],
      },
    });
  }

  // Agregar puntos individuales (para heatmap de densidad)
  for (const point of originalPoints) {
    features.push({
      type: 'Feature',
      properties: {
        type: 'point',
        weight: point.weight || 1,
        crimeType: point.crimeType,
      },
      geometry: {
        type: 'Point',
        coordinates: [point.longitude, point.latitude],
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Crea un polígono circular
 */
function createCirclePolygon(
  centerLng: number,
  centerLat: number,
  radiusKm: number,
  segments: number = 32
): Array<[number, number]> {
  const coordinates: Array<[number, number]> = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;

    // Convertir radio km a grados (aproximado)
    const kmToDegLat = radiusKm / 111;
    const kmToDegLng =
      radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));

    const lng = centerLng + kmToDegLng * Math.cos(angle);
    const lat = centerLat + kmToDegLat * Math.sin(angle);

    coordinates.push([lng, lat]);
  }

  return coordinates;
}

/**
 * Genera datos temporales para heatmap (time series)
 *
 * @param points - Puntos con timestamp
 * @param interval - Intervalo de tiempo en horas
 * @returns Array de heatmaps por intervalo
 */
export function generateTemporalHeatmap(
  points: Array<GeoPoint & { timestamp: string }>,
  interval: number = 24 // horas
): Array<{ period: string; heatmap: HeatmapData }> {
  if (points.length === 0) return [];

  // Ordenar por timestamp
  const sortedPoints = [...points].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const startTime = new Date(sortedPoints[0].timestamp).getTime();
  const endTime = new Date(sortedPoints[sortedPoints.length - 1].timestamp).getTime();

  const periodHeatmaps: Array<{ period: string; heatmap: HeatmapData }> = [];

  for (let time = startTime; time < endTime; time += interval * 60 * 60 * 1000) {
    const periodStart = time;
    const periodEnd = time + interval * 60 * 60 * 1000;

    const periodPoints = sortedPoints.filter((p) => {
      const timestamp = new Date(p.timestamp).getTime();
      return timestamp >= periodStart && timestamp < periodEnd;
    });

    if (periodPoints.length > 0) {
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);

      periodHeatmaps.push({
        period: `${startDate.toLocaleDateString()} ${startDate.getHours()}:00 - ${endDate.toLocaleDateString()} ${endDate.getHours()}:00`,
        heatmap: generateHeatmap(periodPoints, { algorithm: 'dbscan' }),
      });
    }
  }

  return periodHeatmaps;
}

/**
 * Filtra puntos por área geográfica (bounding box)
 */
export function filterPointsByBoundingBox(
  points: GeoPoint[],
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): GeoPoint[] {
  return points.filter(
    (p) =>
      p.latitude <= bounds.north &&
      p.latitude >= bounds.south &&
      p.longitude <= bounds.east &&
      p.longitude >= bounds.west
  );
}

/**
 * Analiza correlación entre clusters y atributos
 */
export function analyzeClusterCorrelation(
  clusters: Cluster[],
  attributeName: keyof GeoPoint
): Map<string, number> {
  const correlation = new Map<string, number>();

  for (const cluster of clusters) {
    const valueCounts = new Map<any, number>();

    for (const point of cluster.points) {
      const value = point[attributeName];
      if (value !== undefined) {
        valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
      }
    }

    const dominantValue = Array.from(valueCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    if (dominantValue) {
      correlation.set(
        String(dominantValue[0]),
        (correlation.get(String(dominantValue[0])) || 0) + cluster.pointCount
      );
    }
  }

  return correlation;
}

/**
 * Servicio de heatmap
 */
export const heatmapService = {
  generateHeatmap,
  generateTemporalHeatmap,
  filterPointsByBoundingBox,
  analyzeClusterCorrelation,
};
