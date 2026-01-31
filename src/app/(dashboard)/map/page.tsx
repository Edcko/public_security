/**
 * Map Page
 * Mapa interactivo con GPS tracking y alertas
 */

'use client';

import { useState } from 'react';

export default function MapPage() {
  const [selectedLayer, setSelectedLayer] = useState<'patrols' | 'incidents' | 'alerts' | 'heatmaps'>('patrols');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mapa Operativo</h1>
          <p className="text-gray-600 mt-1">Vista en tiempo real de unidades y eventos</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            📍 Centrar en mi ubicación
          </button>
          <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold">
            ⚙️ Configurar
          </button>
        </div>
      </div>

      {/* Map Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Layer Selector */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Capas del Mapa</h3>
          <div className="space-y-3">
            <LayerButton
              icon="🚗"
              label="Patrullas Activas"
              count={67}
              active={selectedLayer === 'patrols'}
              onClick={() => setSelectedLayer('patrols')}
            />
            <LayerButton
              icon="⚠️"
              label="Incidentes"
              count={23}
              active={selectedLayer === 'incidents'}
              onClick={() => setSelectedLayer('incidents')}
            />
            <LayerButton
              icon="🚨"
              label="Alertas Activas"
              count={3}
              active={selectedLayer === 'alerts'}
              onClick={() => setSelectedLayer('alerts')}
            />
            <LayerButton
              icon="🔥"
              label="Heatmap Delictivo"
              count={1}
              active={selectedLayer === 'heatmaps'}
              onClick={() => setSelectedLayer('heatmaps')}
            />
          </div>
        </div>

        {/* Map View */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-900 h-[600px] relative">
              {/* Simulated Map */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{
                    backgroundImage: `
                      linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                  }}></div>
                </div>

                {/* Map elements based on selected layer */}
                {selectedLayer === 'patrols' && <PatrolMarkers />}
                {selectedLayer === 'incidents' && <IncidentMarkers />}
                {selectedLayer === 'alerts' && <AlertMarkers />}
                {selectedLayer === 'heatmaps' && <HeatmapOverlay />}
              </div>

              {/* Map Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur p-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-700">67 Patrullas Activas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">23 Incidentes Hoy</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-700">3 Alertas Activas</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Última actualización: {new Date().toLocaleTimeString('es-MX')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Alertas Activas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LayerButton({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-xl">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      <span className={`text-sm font-semibold px-2 py-1 rounded ${
        active ? 'bg-white/20' : 'bg-gray-200'
      }`}>
        {count}
      </span>
    </button>
  );
}

function PatrolMarkers() {
  const patrols = [
    { id: 1, top: '20%', left: '30%', status: 'active' },
    { id: 2, top: '35%', left: '60%', status: 'active' },
    { id: 3, top: '55%', left: '40%', status: 'active' },
    { id: 4, top: '70%', left: '70%', status: 'active' },
    { id: 5, top: '40%', left: '20%', status: 'idle' },
  ];

  return (
    <>
      {patrols.map((patrol) => (
        <div
          key={patrol.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          style={{ top: patrol.top, left: patrol.left }}
        >
          <div className={`w-8 h-8 rounded-full border-4 ${
            patrol.status === 'active' ? 'bg-green-500 border-green-600' : 'bg-yellow-500 border-yellow-600'
          } animate-pulse`}></div>
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            PAT-{String(patrol.id).padStart(3, '0')}
          </div>
        </div>
      ))}
    </>
  );
}

function IncidentMarkers() {
  const incidents = [
    { id: 1, top: '25%', left: '45%', type: 'robbery' },
    { id: 2, top: '45%', left: '55%', type: 'assault' },
    { id: 3, top: '65%', left: '35%', type: 'theft' },
  ];

  return (
    <>
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{ top: incident.top, left: incident.left }}
        >
          <div className="text-3xl">⚠️</div>
        </div>
      ))}
    </>
  );
}

function AlertMarkers() {
  const alerts = [
    { id: 1, top: '30%', left: '50%', type: 'SOS' },
    { id: 2, top: '60%', left: '25%', type: 'geofence' },
    { id: 3, top: '75%', left: '65%', type: 'speeding' },
  ];

  return (
    <>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ top: alert.top, left: alert.left }}
        >
          <div className="relative">
            <div className="text-4xl animate-bounce">🚨</div>
            <div className="absolute top-0 left-1/2 w-16 h-16 bg-red-500 rounded-full opacity-20 animate-ping"></div>
          </div>
        </div>
      ))}
    </>
  );
}

function HeatmapOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔥</div>
        <p className="text-white text-xl font-semibold">Heatmap de Incidencia Delictiva</p>
        <p className="text-gray-400 text-sm mt-2">Últimos 30 días</p>
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: { id: number; title: string; description: string; time: string; icon: string; severity: 'critical' | 'high' | 'medium' } }) {
  const severityColors: { [key: string]: string } = {
    critical: 'bg-red-50 border-red-200',
    high: 'bg-orange-50 border-orange-200',
    medium: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <div className={`border ${severityColors[alert.severity]} rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{alert.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{alert.title}</h4>
            <p className="text-sm text-gray-600">{alert.time}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded ${
          alert.severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
        }`}>
          {alert.severity.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-gray-700">{alert.description}</p>
      <div className="mt-3 pt-3 border-t border-gray-200 flex space-x-2">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Ver en mapa</button>
        <button className="text-sm text-green-600 hover:text-green-800 font-medium">Atender</button>
      </div>
    </div>
  );
}

const activeAlerts = [
  {
    id: 1,
    title: '¡ALERTA SOS!',
    description: 'Oficial GN-004 activó botón de pánico',
    time: 'Hace 5 min',
    icon: '🚨',
    severity: 'critical' as const,
  },
  {
    id: 2,
    title: 'Patrulla fuera de geofence',
    description: 'PAT-002 ha salido de zona asignada',
    time: 'Hace 12 min',
    icon: '📍',
    severity: 'high' as const,
  },
  {
    id: 3,
    title: 'Exceso de velocidad detectado',
    description: 'PAT-007: 120 km/h en zona urbana',
    time: 'Hace 25 min',
    icon: '⚡',
    severity: 'medium' as const,
  },
];
