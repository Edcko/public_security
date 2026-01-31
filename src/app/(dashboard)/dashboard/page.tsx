/**
 * Dashboard Page
 * Página principal con estadísticas y métricas en tiempo real
 */

'use client';

import { useState, useEffect } from 'react';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface DashboardStats {
  totalPersonnel: number;
  activePersonnel: number;
  totalVehicles: number;
  activeVehicles: number;
  todayIncidents: number;
  monthArrests: number;
}

interface PersonnelStatistics {
  total: number;
  available: number;
  newLastMonth: number;
  rankDistribution: Array<{
    rank: string;
    count: number;
    percentage: string;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: string;
  }>;
  personnelByCorporation: Array<{
    corporationId: string;
    corporationName: string;
    count: number;
    percentage: string;
  }>;
}

interface DateFilter {
  preset: 'all' | 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPersonnel: 0,
    activePersonnel: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    todayIncidents: 0,
    monthArrests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [personnelStats, setPersonnelStats] = useState<PersonnelStatistics | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ preset: 'all' });

  // Conectar a actualizaciones en tiempo real
  const { connected, lastUpdate, reconnect } = useRealtimeUpdates({
    enabled: true,
    onMessage: (update) => {
      console.log('Dashboard update received:', update);

      // Actualizar según el tipo de evento
      if (update.type === 'personnel_updated') {
        fetchStats(); // Recargar estadísticas
      } else if (update.type === 'vehicle_updated') {
        fetchStats();
      } else if (update.type === 'arrest_created') {
        // Agregar nueva actividad
        setActivities(prev => [
          {
            id: Date.now(),
            text: update.data?.message || 'Nuevo arresto registrado',
            time: 'Ahora',
          },
          ...prev.slice(0, 9), // Mantener solo las últimas 10
        ]);
      }
    },
    onConnectionChange: (connected) => {
      console.log('SSE connection:', connected ? 'Connected' : 'Disconnected');
    },
  });

  useEffect(() => {
    fetchStats();
    fetchActivities();
    fetchPersonnelStatistics();
  }, []);

  // Recargar datos cuando cambia el filtro de fecha
  useEffect(() => {
    if (dateFilter.preset !== 'all') {
      fetchStats();
      fetchPersonnelStatistics();
    }
  }, [dateFilter]);

  const fetchPersonnelStatistics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();

      // Agregar parámetros de fecha si hay filtro personalizado
      if (dateFilter.preset === 'custom' && dateFilter.startDate && dateFilter.endDate) {
        params.append('startDate', dateFilter.startDate);
        params.append('endDate', dateFilter.endDate);
      }

      const response = await fetch(`/api/personnel/statistics?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonnelStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching personnel statistics:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      // Obtener conteo de personal
      const personnelRes = await fetch('/api/personnel', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const personnelData = await personnelRes.json();

      // Obtener conteo de vehículos
      const vehiclesRes = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const vehiclesData = await vehiclesRes.json();

      if (personnelData.success) {
        const personnel = personnelData.data;
        setStats(prev => ({
          ...prev,
          totalPersonnel: personnel.length,
          activePersonnel: personnel.filter((p: any) => p.status === 'active').length,
        }));
      }

      if (vehiclesData.success) {
        const vehicles = vehiclesData.data;
        setStats(prev => ({
          ...prev,
          totalVehicles: vehicles.length,
          activeVehicles: vehicles.filter((v: any) => v.status === 'active').length,
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    // Por ahora, actividades mock hasta que tengamos endpoint real
    setActivities([
      { id: 1, text: 'Nuevo arresto registrado por Oficial García', time: 'Hace 5 min' },
      { id: 2, text: 'Patrulla #123 inició servicio', time: 'Hace 12 min' },
      { id: 3, text: 'Alerta SOS activada en Zona Centro', time: 'Hace 25 min' },
      { id: 4, text: 'Oficial Rodríguez hizo check-in', time: 'Hace 1 hora' },
      { id: 5, text: 'Reporte #456 generado exitosamente', time: 'Hace 2 horas' },
    ]);
  };

  const handleDateFilterChange = (preset: DateFilter['preset']) => {
    const today = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;

    switch (preset) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
    }

    setDateFilter({ preset, startDate, endDate });
  };

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setDateFilter({
        ...dateFilter,
        preset: 'custom',
        startDate: value,
        endDate: dateFilter.endDate,
      });
    } else {
      setDateFilter({
        ...dateFilter,
        preset: 'custom',
        startDate: dateFilter.startDate,
        endDate: value,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con indicador de conexión */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Vista general del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            connected
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <span className={`relative flex h-3 w-3`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${connected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </span>
            {connected ? 'En vivo' : 'Desconectado'}
          </div>
          {!connected && (
            <button
              onClick={reconnect}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              Reconectar
            </button>
          )}
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Período:</span>

          <button
            onClick={() => handleDateFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter.preset === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todo
          </button>

          <button
            onClick={() => handleDateFilterChange('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter.preset === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoy
          </button>

          <button
            onClick={() => handleDateFilterChange('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter.preset === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Últimos 7 días
          </button>

          <button
            onClick={() => handleDateFilterChange('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateFilter.preset === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Último mes
          </button>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter.startDate || ''}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={dateFilter.endDate || ''}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Personal Activo"
          value={`${stats.activePersonnel} de ${stats.totalPersonnel}`}
          icon="👮"
          subtitle="Oficiales en servicio activo"
        />
        <StatCard
          title="Patrullas Activas"
          value={`${stats.activeVehicles} de ${stats.totalVehicles}`}
          icon="🚗"
          subtitle="Vehículos disponibles"
        />
        <StatCard
          title="Incidentes Hoy"
          value={stats.todayIncidents.toString()}
          icon="⚠️"
          subtitle="Reportados hoy"
        />
        <StatCard
          title="Arrestos Mes"
          value={stats.monthArrests.toString()}
          icon="🔒"
          subtitle="Este mes"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Incidencia Delictiva (Últimos 7 días)"
          type="line"
        />
        <ChartCard
          title="Delitos por Tipo"
          type="bar"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Actividad Reciente</h3>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Última actualización: {new Date(lastUpdate.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        <ActivityList activities={activities} />
      </div>

      {/* Personnel Statistics */}
      {personnelStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-6">Estadísticas de Personal</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-600">Total</p>
              <p className="text-2xl font-bold text-blue-900">{personnelStats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-900">{personnelStats.available}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-600">Nuevos (último mes)</p>
              <p className="text-2xl font-bold text-purple-900">+{personnelStats.newLastMonth}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-600">Ocupación</p>
              <p className="text-2xl font-bold text-yellow-900">
                {personnelStats.total > 0 ? ((personnelStats.available / personnelStats.total) * 100).toFixed(0) : '0'}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distribución por Rango */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Por Rango</h4>
              <div className="space-y-2">
                {personnelStats.rankDistribution.map((item) => (
                  <div key={item.rank} className="flex items-center">
                    <span className="flex-1 text-sm text-gray-600 capitalize">{item.rank}</span>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución por Estado */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Por Estado</h4>
              <div className="space-y-2">
                {personnelStats.statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center">
                    <span className="flex-1 text-sm text-gray-600 capitalize">
                      {item.status === 'active' ? 'Activo' : item.status === 'suspended' ? 'Suspendido' : 'Retirado'}
                    </span>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.status === 'active'
                              ? 'bg-green-600'
                              : item.status === 'suspended'
                              ? 'bg-red-600'
                              : 'bg-gray-600'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personal por Corporación (Top 5) */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Corporaciones por Personal</h4>
            <div className="space-y-2">
              {personnelStats.personnelByCorporation.slice(0, 5).map((item) => (
                <div key={item.corporationId} className="flex items-center">
                  <span className="flex-1 text-sm text-gray-600 truncate">{item.corporationName}</span>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">
                      {item.percentage}%
                    </span>
                    <span className="text-sm text-gray-500 ml-2">({item.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Mapa de Patrullas Activas</h3>
        <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
          <p className="text-gray-500">Mapa interactivo (próximamente)</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  type,
}: {
  title: string;
  type: 'line' | 'bar';
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center">
        <p className="text-gray-500">
          Gráfico {type === 'line' ? 'de línea' : 'de barras'} (próximamente)
        </p>
      </div>
    </div>
  );
}

function ActivityList({ activities }: { activities: any[] }) {
  return (
    <ul className="space-y-3">
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <p className="text-gray-700">{activity.text}</p>
          <span className="text-sm text-gray-500">{activity.time}</span>
        </li>
      ))}
      {activities.length === 0 && (
        <li className="text-center py-8 text-gray-500">
          No hay actividad reciente
        </li>
      )}
    </ul>
  );
}
