/**
 * Clustering Service
 *
 * Algoritmos de agrupamiento para análisis de incidentes delictivos
 * DBSCAN: Density-Based Spatial Clustering of Applications with Noise
 */

/**
 * Punto geográfico con atributos
 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
  weight?: number;
  incidentId?: string;
  crimeType?: string;
  timestamp?: string;
}

/**
 * Cluster de puntos
 */
export interface Cluster {
  id: string;
  points: GeoPoint[];
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // en kilómetros
  pointCount: number;
  totalWeight: number;
  dominantCrimeType?: string;
}

/**
 * Resultado del clustering DBSCAN
 */
export interface ClusteringResult {
  clusters: Cluster[];
  noise: GeoPoint[];
  totalPoints: number;
  clusteredPoints: number;
  noisePoints: number;
}

/**
 * Calcula distancia entre dos puntos (Haversine formula)
 * Retorna distancia en kilómetros
 */
function haversineDistance(
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
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 *
 * @param points - Array de puntos geográficos
 * @param epsilon - Radio de vecindad en kilómetros (default: 0.5 km)
 * @param minPts - Mínimo de puntos para formar un cluster (default: 5)
 * @returns Resultado del clustering con clusters y ruido
 */
export function dbscan(
  points: GeoPoint[],
  epsilon: number = 0.5,
  minPts: number = 5
): ClusteringResult {
  if (points.length === 0) {
    return {
      clusters: [],
      noise: [],
      totalPoints: 0,
      clusteredPoints: 0,
      noisePoints: 0,
    };
  }

  const visited = new Set<number>();
  const noise: GeoPoint[] = [];
  const clusterPoints: Map<number, GeoPoint[]> = new Map();
  let clusterId = 0;

  /**
   * Encuentra puntos vecinos dentro del radio epsilon
   */
  function regionQuery(pointIndex: number): number[] {
    const neighbors: number[] = [];
    for (let i = 0; i < points.length; i++) {
      if (i === pointIndex) continue;

      const distance = haversineDistance(
        points[pointIndex],
        points[i]
      );

      if (distance <= epsilon) {
        neighbors.push(i);
      }
    }
    return neighbors;
  }

  /**
   * Expande un cluster desde un punto semilla
   */
  function expandCluster(
    pointIndex: number,
    neighbors: number[],
    clusterId: number
  ): void {
    const cluster: GeoPoint[] = [points[pointIndex]];
    clusterPoints.set(clusterId, cluster);

    // Procesar vecinos
    const queue = [...neighbors];

    while (queue.length > 0) {
      const currentIdx = queue.shift()!;

      if (!visited.has(currentIdx)) {
        visited.add(currentIdx);
        const currentNeighbors = regionQuery(currentIdx);

        if (currentNeighbors.length >= minPts) {
          queue.push(...currentNeighbors);
        }
      }

      // Si no está asignado a ningún cluster, agregarlo
      const assignedToCluster = Array.from(clusterPoints.values()).some(
        (c) => c.includes(points[currentIdx])
      );

      if (!assignedToCluster) {
        clusterPoints.get(clusterId)!.push(points[currentIdx]);
      }
    }
  }

  // Procesar cada punto
  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;

    visited.add(i);
    const neighbors = regionQuery(i);

    if (neighbors.length < minPts) {
      // Es ruido
      noise.push(points[i]);
    } else {
      // Nuevo cluster
      expandCluster(i, neighbors, clusterId);
      clusterId++;
    }
  }

  // Construir clusters con metadata
  const clusters: Cluster[] = [];

  for (const [id, clusterPoints] of clusterPoints.entries()) {
    if (clusterPoints.length === 0) continue;

    // Calcular centro del cluster (promedio de coordenadas)
    const center = {
      latitude:
        clusterPoints.reduce((sum, p) => sum + p.latitude, 0) /
        clusterPoints.length,
      longitude:
        clusterPoints.reduce((sum, p) => sum + p.longitude, 0) /
        clusterPoints.length,
    };

    // Calcular radio del cluster (máxima distancia al centro)
    let maxDistance = 0;
    for (const point of clusterPoints) {
      const distance = haversineDistance(center, point);
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }

    // Calcular peso total
    const totalWeight = clusterPoints.reduce(
      (sum, p) => sum + (p.weight || 1),
      0
    );

    // Encontrar tipo de delito dominante
    const crimeTypeCount = new Map<string, number>();
    for (const point of clusterPoints) {
      if (point.crimeType) {
        crimeTypeCount.set(
          point.crimeType,
          (crimeTypeCount.get(point.crimeType) || 0) + 1
        );
      }
    }

    const dominantCrimeType =
      crimeTypeCount.size > 0
        ? Array.from(crimeTypeCount.entries()).sort(
            (a, b) => b[1] - a[1]
          )[0][0]
        : undefined;

    clusters.push({
      id: `cluster-${id}`,
      points: clusterPoints,
      center,
      radius: maxDistance,
      pointCount: clusterPoints.length,
      totalWeight,
      dominantCrimeType,
    });
  }

  const totalPoints = points.length;
  const clusteredPoints = clusters.reduce((sum, c) => sum + c.pointCount, 0);

  return {
    clusters: clusters.sort((a, b) => b.pointCount - a.pointCount), // Ordenar por tamaño
    noise,
    totalPoints,
    clusteredPoints,
    noisePoints: noise.length,
  };
}

/**
 * K-Means Clustering
 *
 * @param points - Array de puntos geográficos
 * @param k - Número de clusters
 * @param maxIterations - Máximo de iteraciones (default: 100)
 * @returns Resultado del clustering
 */
export function kMeans(
  points: GeoPoint[],
  k: number,
  maxIterations: number = 100
): ClusteringResult {
  if (points.length === 0 || k <= 0) {
    return {
      clusters: [],
      noise: [],
      totalPoints: 0,
      clusteredPoints: 0,
      noisePoints: 0,
    };
  }

  if (k >= points.length) {
    k = points.length;
  }

  // Inicializar centroides aleatoriamente
  let centroids = points
    .sort(() => Math.random() - 0.5)
    .slice(0, k)
    .map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  let assignments: number[] = new Array(points.length).fill(-1);
  let iterations = 0;

  while (iterations < maxIterations) {
    let changed = false;

    // Asignar cada punto al centroide más cercano
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      let minDistance = Infinity;
      let closestCentroid = 0;

      for (let j = 0; j < centroids.length; j++) {
        const distance = haversineDistance(point, centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = j;
        }
      }

      if (assignments[i] !== closestCentroid) {
        assignments[i] = closestCentroid;
        changed = true;
      }
    }

    if (!changed) break;

    // Recalcular centroides
    for (let j = 0; j < k; j++) {
      const assignedPoints = points.filter((_, i) => assignments[i] === j);

      if (assignedPoints.length > 0) {
        centroids[j] = {
          latitude:
            assignedPoints.reduce((sum, p) => sum + p.latitude, 0) /
            assignedPoints.length,
          longitude:
            assignedPoints.reduce((sum, p) => sum + p.longitude, 0) /
            assignedPoints.length,
        };
      }
    }

    iterations++;
  }

  // Construir clusters
  const clustersMap = new Map<number, GeoPoint[]>();

  for (let i = 0; i < points.length; i++) {
    const clusterId = assignments[i];
    if (!clustersMap.has(clusterId)) {
      clustersMap.set(clusterId, []);
    }
    clustersMap.get(clusterId)!.push(points[i]);
  }

  const clusters: Cluster[] = [];

  for (const [id, clusterPoints] of clustersMap.entries()) {
    if (clusterPoints.length === 0) continue;

    const centroid = centroids[id] || {
      latitude: clusterPoints[0].latitude,
      longitude: clusterPoints[0].longitude,
    };

    // Calcular radio
    let maxDistance = 0;
    for (const point of clusterPoints) {
      const distance = haversineDistance(centroid, point);
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }

    const totalWeight = clusterPoints.reduce(
      (sum, p) => sum + (p.weight || 1),
      0
    );

    clusters.push({
      id: `cluster-${id}`,
      points: clusterPoints,
      center: centroid,
      radius: maxDistance,
      pointCount: clusterPoints.length,
      totalWeight,
    });
  }

  return {
    clusters: clusters.sort((a, b) => b.pointCount - a.pointCount),
    noise: [],
    totalPoints: points.length,
    clusteredPoints: points.length,
    noisePoints: 0,
  };
}

/**
 * Analiza densidad de incidentes en un área
 *
 * @param points - Puntos geográficos
 * @param center - Centro del área
 * @param radius - Radio en kilómetros
 * @returns Estadísticas de densidad
 */
export function calculateDensity(
  points: GeoPoint[],
  center: { latitude: number; longitude: number },
  radius: number
): {
  pointsInArea: number;
  totalWeight: number;
  density: number; // puntos por km²
  weightedDensity: number;
} {
  const pointsInArea = points.filter((p) => {
    const distance = haversineDistance(center, p);
    return distance <= radius;
  });

  const area = Math.PI * radius * radius; // km²
  const totalWeight = pointsInArea.reduce((sum, p) => sum + (p.weight || 1), 0);

  return {
    pointsInArea: pointsInArea.length,
    totalWeight,
    density: pointsInArea.length / area,
    weightedDensity: totalWeight / area,
  };
}

/**
 * Encuentra "hotspots" (áreas de alta densidad)
 *
 * @param points - Puntos geográficos
 * @param gridSize - Tamaño de grilla en kilómetros
 * @param threshold - Umbral de densidad para considerar hotspot
 * @returns Array de hotspots
 */
export function findHotspots(
  points: GeoPoint[],
  gridSize: number = 0.5,
  threshold: number = 10
): Array<{
  center: { latitude: number; longitude: number };
  density: number;
  pointCount: number;
}> {
  if (points.length === 0) return [];

  // Encontrar límites del área
  const minLat = Math.min(...points.map((p) => p.latitude));
  const maxLat = Math.max(...points.map((p) => p.latitude));
  const minLon = Math.min(...points.map((p) => p.longitude));
  const maxLon = Math.max(...points.map((p) => p.longitude));

  const hotspots: Array<{
    center: { latitude: number; longitude: number };
    density: number;
    pointCount: number;
  }> = [];

  // Crear grilla y evaluar cada celda
  for (let lat = minLat; lat < maxLat; lat += gridSize / 111) {
    for (let lon = minLon; lon < maxLon; lon += gridSize / (111 * Math.cos(toRad(lat)))) {
      const cellCenter = { latitude: lat, longitude: lon };
      const stats = calculateDensity(points, cellCenter, gridSize);

      if (stats.pointsInArea >= threshold) {
        hotspots.push({
          center: cellCenter,
          density: stats.density,
          pointCount: stats.pointsInArea,
        });
      }
    }
  }

  // Ordenar por densidad
  return hotspots.sort((a, b) => b.density - a.density);
}

/**
 * Servicio de clustering
 */
export const clusteringService = {
  dbscan,
  kMeans,
  calculateDensity,
  findHotspots,
};
