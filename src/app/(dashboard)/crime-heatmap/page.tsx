/**
 * Crime Heatmap Page
 *
 * Mapa de calor delictivo con clustering DBSCAN
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

// Nota: Para usar Mapbox GL JS, instala el paquete:
// npm install mapbox-gl
// import mapboxgl from 'mapbox-gl';

interface Cluster {
  id: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  pointCount: number;
  totalWeight: number;
  dominantCrimeType?: string;
}

interface HeatmapData {
  clusters: Cluster[];
  hotspots: Array<{
    center: { latitude: number; longitude: number };
    density: number;
    pointCount: number;
  }>;
  summary: {
    totalPoints: number;
    totalClusters: number;
    averageClusterSize: number;
    highestDensity: number;
  };
}

export default function CrimeHeatmapPage() {
  const [algorithm, setAlgorithm] = useState<'dbscan' | 'kmeans' | 'density'>('dbscan');
  const [epsilon, setEpsilon] = useState<number>(0.5);
  const [minPts, setMinPts] = useState<number>(5);
  const [k, setK] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [selectedCrimeType, setSelectedCrimeType] = useState<string>('');
 const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Datos mock de incidentes delictivos
  const mockIncidents = generateMockIncidents();

  useEffect(() => {
    // Generar heatmap al montar
    generateHeatmap();
  }, [algorithm, epsilon, minPts, k]);

  const generateHeatmap = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      // Filtrar incidentes si hay filtros activos
      let filteredIncidents = [...mockIncidents];

      if (selectedCrimeType) {
        filteredIncidents = filteredIncidents.filter(
          (i) => i.crimeType === selectedCrimeType
        );
      }

      if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        filteredIncidents = filteredIncidents.filter((i) => {
          const timestamp = new Date(i.timestamp || '').getTime();
          return timestamp >= start && timestamp <= end;
        });
      }

      const response = await fetch('/api/gis/heatmap-advanced', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points: filteredIncidents,
          algorithm,
          epsilon,
          minPts,
          k,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setHeatmapData(data.data);
      }
    } catch (error: any) {
      console.error('Error generating heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Head>
        <title>Mapa de Calor Delictivo - Security Dashboard</title>
      </Head>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mapa de Calor Delictivo</h1>
        <p className="text-gray-600 mt-1">
          Análisis geográfico de incidentes con clustering avanzado
        </p>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración del Análisis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Algoritmo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Algoritmo de Clustering
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="dbscan">DBSCAN (Density-Based)</option>
              <option value="kmeans">K-Means</option>
              <option value="density">Density Grid</option>
            </select>
          </div>

          {/* Epsilon (solo DBSCAN) */}
          {algorithm === 'dbscan' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radio de Vecindad (ε) - km
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={epsilon}
                onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* MinPts (solo DBSCAN) */}
          {algorithm === 'dbscan' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mínimo de Puntos
              </label>
              <input
                type="number"
                min="2"
                max="50"
                value={minPts}
                onChange={(e) => setMinPts(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* K (solo K-Means) */}
          {algorithm === 'kmeans' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Clusters (K)
              </label>
              <input
                type="number"
                min="2"
                max="20"
                value={k}
                onChange={(e) => setK(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Tipo de Delito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Delito
            </label>
            <select
              value={selectedCrimeType}
              onChange={(e) => setSelectedCrimeType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los delitos</option>
              <option value="Robo a transeúnte">Robo a transeúnte</option>
              <option value="Robo a negocio">Robo a negocio</option>
              <option value="Robo de vehículo">Robo de vehículo</option>
              <option value="Homicidio doloso">Homicidio doloso</option>
              <option value="Violación">Violación</option>
              <option value="Narcomenudeo">Narcomenudeo</option>
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Botón Generar */}
          <div className="flex items-end">
            <button
              onClick={generateHeatmap}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Generando...' : 'Generar Heatmap'}
            </button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {heatmapData && !loading && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Resumen del Análisis</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-600">Total de Incidentes</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {heatmapData.summary.totalPoints}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-600">Clusters Detectados</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">
                {heatmapData.summary.totalClusters}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-600">Tamaño Promedio</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {heatmapData.summary.averageClusterSize.toFixed(1)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm font-medium text-red-600">Densidad Máxima</p>
              <p className="text-3xl font-bold text-red-900 mt-1">
                {heatmapData.summary.highestDensity.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mapa Interactivo */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Mapa de Calor</h3>
          <p className="text-sm text-gray-600">
            Visualización interactiva de clusters delictivos
          </p>
        </div>

        <div className="relative" style={{ height: '600px' }}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generando mapa de calor...</p>
              </div>
            </div>
          ) : (
            <InteractiveHeatmapMap
              clusters={heatmapData?.clusters || []}
              hotspots={heatmapData?.hotspots || []}
            />
          )}
        </div>
      </div>

      {/* Lista de Clusters */}
      {heatmapData && heatmapData.clusters.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Clusters Detectados</h3>
          <div className="space-y-3">
            {heatmapData.clusters.slice(0, 10).map((cluster) => (
              <div
                key={cluster.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{cluster.id}</h4>
                    <p className="text-sm text-gray-600">
                      Centro: ({cluster.center.latitude.toFixed(4)}, {cluster.center.longitude.toFixed(4)})
                    </p>
                    <p className="text-sm text-gray-600">
                      Radio: {cluster.radius.toFixed(2)} km
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{cluster.pointCount}</p>
                    <p className="text-sm text-gray-600">incidentes</p>
                    {cluster.dominantCrimeType && (
                      <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        {cluster.dominantCrimeType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente de mapa interactivo simplificado
 * En producción, usar Mapbox GL JS o Leaflet
 */
function InteractiveHeatmapMap({
  clusters,
  hotspots,
}: {
  clusters: Cluster[];
  hotspots: Array<{
    center: { latitude: number; longitude: number };
    density: number;
    pointCount: number;
  }>;
}) {
  if (clusters.length === 0 && hotspots.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-lg font-medium">Sin datos para visualizar</p>
          <p className="text-sm mt-2">Genera un heatmap para ver los resultados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 relative overflow-hidden">
      {/* Fondo simplificado de mapa */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Overlay de clusters */}
      <svg className="absolute inset-0 w-full h-full">
        {clusters.map((cluster) => {
          // Calcular posición relativa (simplificado)
          const x = ((cluster.center.longitude + 100) / 50) * 100; // Normalizado
          const y = ((30 - cluster.center.latitude) / 30) * 100; // Normalizado
          const radius = Math.min(cluster.radius * 20, 150); // Escala visual

          return (
            <g key={cluster.id}>
              {/* Círculo del cluster */}
              <circle
                cx={`${x}%`}
                cy={`${y}%`}
                r={radius}
                fill="rgba(239, 68, 68, 0.3)"
                stroke="rgba(239, 68, 68, 0.8)"
                strokeWidth="2"
              />
              {/* Centro del cluster */}
              <circle
                cx={`${x}%`}
                cy={`${y}%`}
                r="6"
                fill="#dc2626"
                stroke="white"
                strokeWidth="2"
              />
              {/* Etiqueta de conteo */}
              <text
                x={`${x}%`}
                y={`${y - 10}%`}
                fill="white"
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
                stroke="black"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {cluster.pointCount}
              </text>
            </g>
          );
        })}

        {hotspots.map((hotspot, index) => {
          const x = ((hotspot.center.longitude + 100) / 50) * 100;
          const y = ((30 - hotspot.center.latitude) / 30) * 100;
          const intensity = Math.min(hotspot.density / 100, 1);

          return (
            <g key={`hotspot-${index}`}>
              <circle
                cx={`${x}%`}
                cy={`${y}%`}
                r="8"
                fill={`rgba(251, 191, 36, ${0.5 + intensity * 0.5})`}
                stroke="white"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
        <h4 className="font-medium text-gray-900 mb-2">Leyenda</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Cluster (círculo = radio)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-400"></div>
            <span>Hotspot de alta densidad</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-red-500"></div>
            <span>Centro de cluster</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Genera datos mock de incidentes delictivos
 * En producción, estos datos vendrían de la base de datos
 */
function generateMockIncidents(): Array<{
  latitude: number;
  longitude: number;
  weight: number;
  crimeType: string;
  timestamp: string;
}> {
  const incidents = [];
  const crimeTypes = [
    'Robo a transeúnte',
    'Robo a negocio',
    'Robo de vehículo',
    'Homicidio doloso',
    'Violación',
    'Narcomenudeo',
  ];

  // Generar clusters de incidentes (simulando zonas de alta criminalidad)
  const hotzones = [
    { lat: 19.4326, lng: -99.1332, count: 30 }, // Ciudad de México
    { lat: 25.6866, lng: -100.3161, count: 25 }, // Monterrey
    { lat: 20.6597, lng: -103.3496, count: 20 }, // Guadalajara
    { lat: 21.8853, lng: -102.2915, count: 15 }, // Aguascalientes
  ];

  for (const zone of hotzones) {
    for (let i = 0; i < zone.count; i++) {
      const latOffset = (Math.random() - 0.5) * 0.05;
      const lngOffset = (Math.random() - 0.5) * 0.05;
      const daysAgo = Math.floor(Math.random() * 90);

      incidents.push({
        latitude: zone.lat + latOffset,
        longitude: zone.lng + lngOffset,
        weight: Math.floor(Math.random() * 5) + 1,
        crimeType: crimeTypes[Math.floor(Math.random() * crimeTypes.length)],
        timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  // Agregar algunos incidentes dispersos (ruido)
  for (let i = 0; i < 20; i++) {
    const lat = 19 + Math.random() * 10;
    const lng = -100 + Math.random() * 10;
    const daysAgo = Math.floor(Math.random() * 90);

    incidents.push({
      latitude: lat,
      longitude: lng,
      weight: 1,
      crimeType: crimeTypes[Math.floor(Math.random() * crimeTypes.length)],
      timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return incidents;
}
