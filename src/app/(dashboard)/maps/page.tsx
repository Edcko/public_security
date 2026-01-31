/**
 * Maps & Geocoding Page
 *
 * Herramientas de geocoding, routing y cálculo de distancias
 */

'use client';

import { useState } from 'react';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface RouteResult {
  routeURL: string;
}

export default function MapsPage() {
  const [activeTab, setActiveTab] = useState<'geocode' | 'reverse' | 'distance' | 'route'>('geocode');

  // Estado para geocoding
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null);
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Estado para reverse geocoding
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [reverseResult, setReverseResult] = useState<any>(null);
  const [reverseLoading, setReverseLoading] = useState(false);

  // Estado para distancia
  const [originLat, setOriginLat] = useState('19.4326');
  const [originLon, setOriginLon] = useState('-99.1332');
  const [destLat, setDestLat] = useState('25.6866');
  const [destLon, setDestLon] = useState('-100.3161');
  const [distanceResult, setDistanceResult] = useState<number | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);

  // Estado para ruta
  const [routeOrigin, setRouteOrigin] = useState({ lat: '19.4326', lon: '-99.1332' });
  const [routeDest, setRouteDest] = useState({ lat: '25.6866', lon: '-100.3161' });
  const [routeResult, setRouteResult] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Geocoding
  const handleGeocode = async () => {
    if (!address) {
      alert('Por favor ingresa una dirección');
      return;
    }

    setGeocodingLoading(true);
    setGeocodingResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/integrations/gis/geocode', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, city, state }),
      });

      const data = await response.json();

      if (data.success) {
        setGeocodingResult(data.location);
      } else {
        alert(data.error || 'Error al geocodificar');
      }
    } catch (error: any) {
      console.error('Error geocoding:', error);
      alert('Error al geocodificar');
    } finally {
      setGeocodingLoading(false);
    }
  };

  // Reverse geocoding
  const handleReverseGeocode = async () => {
    if (!latitude || !longitude) {
      alert('Por favor ingresa latitud y longitud');
      return;
    }

    setReverseLoading(true);
    setReverseResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/integrations/gis/reverse-geocode', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      const data = await response.json();

      if (data.success) {
        setReverseResult(data);
      } else {
        alert(data.error || 'Error al obtener dirección');
      }
    } catch (error: any) {
      console.error('Error reverse geocoding:', error);
      alert('Error al obtener dirección');
    } finally {
      setReverseLoading(false);
    }
  };

  // Calcular distancia
  const handleDistance = async () => {
    if (!originLat || !originLon || !destLat || !destLon) {
      alert('Por favor completa origen y destino');
      return;
    }

    setDistanceLoading(true);
    setDistanceResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/integrations/gis/distance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: { latitude: parseFloat(originLat), longitude: parseFloat(originLon) },
          destination: { latitude: parseFloat(destLat), longitude: parseFloat(destLon) },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDistanceResult(data.data.distance);
      } else {
        alert(data.error || 'Error al calcular distancia');
      }
    } catch (error: any) {
      console.error('Error calculating distance:', error);
      alert('Error al calcular distancia');
    } finally {
      setDistanceLoading(false);
    }
  };

  // Generar ruta
  const handleRoute = async () => {
    if (!routeOrigin.lat || !routeOrigin.lon || !routeDest.lat || !routeDest.lon) {
      alert('Por favor completa origen y destino');
      return;
    }

    setRouteLoading(true);
    setRouteResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/integrations/gis/route', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: { latitude: parseFloat(routeOrigin.lat), longitude: parseFloat(routeOrigin.lon) },
          destination: { latitude: parseFloat(routeDest.lat), longitude: parseFloat(routeDest.lon) },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRouteResult(data.data.routeURL);
      } else {
        alert(data.error || 'Error al generar ruta');
      }
    } catch (error: any) {
      console.error('Error generating route:', error);
      alert('Error al generar ruta');
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mapas y Geocoding</h1>
        <p className="text-gray-600 mt-1">
          Herramientas de geocoding, routing y cálculo de distancias
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('geocode')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'geocode'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Geocoding
          </button>
          <button
            onClick={() => setActiveTab('reverse')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reverse'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Geocoding Inverso
          </button>
          <button
            onClick={() => setActiveTab('distance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'distance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Calcular Distancia
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'route'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Generar Ruta
          </button>
        </nav>
      </div>

      {/* Tab: Geocoding */}
      {activeTab === 'geocode' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Convertir Dirección a Coordenadas</h3>
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Reforma 222"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad (opcional)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ciudad de México"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado (opcional)
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="CDMX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGeocode}
                  disabled={geocodingLoading}
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {geocodingLoading ? 'Geocodificando...' : 'Geocodificar'}
                </button>
              </div>
            </div>
          </div>

          {/* Resultado Geocoding */}
          {geocodingResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-800 mb-3">✓ Ubicación Encontrada</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Latitud:</span>{' '}
                  <span className="font-mono">{geocodingResult.latitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Longitud:</span>{' '}
                  <span className="font-mono">{geocodingResult.longitude.toFixed(6)}</span>
                </div>
                {geocodingResult.address && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Dirección:</span>{' '}
                    <span>{geocodingResult.address}</span>
                  </div>
                )}
                {geocodingResult.city && (
                  <div>
                    <span className="font-medium text-gray-700">Ciudad:</span>{' '}
                    <span>{geocodingResult.city}</span>
                  </div>
                )}
                {geocodingResult.state && (
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>{' '}
                    <span>{geocodingResult.state}</span>
                  </div>
                )}
                {geocodingResult.postalCode && (
                  <div>
                    <span className="font-medium text-gray-700">C.P.:</span>{' '}
                    <span>{geocodingResult.postalCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Reverse Geocoding */}
      {activeTab === 'reverse' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Convertir Coordenadas a Dirección</h3>
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="19.4326"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="-99.1332"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleReverseGeocode}
                  disabled={reverseLoading}
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {reverseLoading ? 'Obteniendo...' : 'Obtener Dirección'}
                </button>
              </div>
            </div>
          </div>

          {/* Resultado Reverse Geocoding */}
          {reverseResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-800 mb-3">✓ Dirección Encontrada</h4>
              <div className="space-y-2 text-sm">
                {reverseResult.address && (
                  <div>
                    <span className="font-medium text-gray-700">Dirección:</span>{' '}
                    <span>{reverseResult.address}</span>
                  </div>
                )}
                {reverseResult.city && (
                  <div>
                    <span className="font-medium text-gray-700">Ciudad:</span>{' '}
                    <span>{reverseResult.city}</span>
                  </div>
                )}
                {reverseResult.state && (
                  <div>
                    <span className="font-medium text-gray-700">Estado:</span>{' '}
                    <span>{reverseResult.state}</span>
                  </div>
                )}
                {reverseResult.country && (
                  <div>
                    <span className="font-medium text-gray-700">País:</span>{' '}
                    <span>{reverseResult.country}</span>
                  </div>
                )}
                {reverseResult.postalCode && (
                  <div>
                    <span className="font-medium text-gray-700">C.P.:</span>{' '}
                    <span>{reverseResult.postalCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Calcular Distancia */}
      {activeTab === 'distance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Calcular Distancia entre Dos Puntos</h3>
            <div className="space-y-6 max-w-2xl">
              {/* Origen */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Origen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={originLat}
                      onChange={(e) => setOriginLat(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={originLon}
                      onChange={(e) => setOriginLon(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Destino */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Destino</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={destLat}
                      onChange={(e) => setDestLat(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={destLon}
                      onChange={(e) => setDestLon(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleDistance}
                  disabled={distanceLoading}
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {distanceLoading ? 'Calculando...' : 'Calcular Distancia'}
                </button>
              </div>
            </div>
          </div>

          {/* Resultado Distancia */}
          {distanceResult !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Distancia</p>
              <p className="text-4xl font-bold text-blue-900">{distanceResult.toFixed(2)}</p>
              <p className="text-lg text-gray-700">kilómetros</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Generar Ruta */}
      {activeTab === 'route' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Generar Ruta entre Dos Puntos</h3>
            <div className="space-y-6 max-w-2xl">
              {/* Origen */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Origen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={routeOrigin.lat}
                      onChange={(e) => setRouteOrigin({ ...routeOrigin, lat: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={routeOrigin.lon}
                      onChange={(e) => setRouteOrigin({ ...routeOrigin, lon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Destino */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Destino</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={routeDest.lat}
                      onChange={(e) => setRouteDest({ ...routeDest, lat: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={routeDest.lon}
                      onChange={(e) => setRouteDest({ ...routeDest, lon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRoute}
                  disabled={routeLoading}
                  className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {routeLoading ? 'Generando...' : 'Generar Ruta'}
                </button>
              </div>
            </div>
          </div>

          {/* Resultado Ruta */}
          {routeResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-800 mb-3">✓ Ruta Generada</h4>
              <p className="text-sm text-gray-600 mb-2">URL de la ruta:</p>
              <a
                href={routeResult}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all word-wrap"
              >
                {routeResult}
              </a>
              <p className="text-xs text-gray-500 mt-3">
                Abre el enlace para ver la ruta en Mapbox
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
