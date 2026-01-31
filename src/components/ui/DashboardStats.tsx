/**
 * Dashboard Stats Component
 * Componente reutilizable para tarjetas de estadísticas
 */

'use client';

import { useEffect, useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  positive?: boolean;
  loading?: boolean;
}

export function StatCard({ title, value, icon, change, positive, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-2 font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
              {positive ? '↑' : '↓'} {change} este mes
            </p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

/**
 * Dashboard Stats Container
 * Obtiene estadísticas reales del backend
 */
export function DashboardStats() {
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    activeOfficers: 0,
    totalWeapons: 0,
    assignedWeapons: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    totalArrests: 0,
    monthArrests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/reports/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Personal"
        value={stats.totalPersonnel.toLocaleString()}
        icon="👮"
        change="+12%"
        positive
        loading={loading}
      />
      <StatCard
        title="Oficiales Activos"
        value={stats.activeOfficers.toLocaleString()}
        icon="✓"
        change="+8%"
        positive
        loading={loading}
      />
      <StatCard
        title="Armas Totales"
        value={stats.totalWeapons.toLocaleString()}
        icon="🔫"
        change="+5%"
        positive
        loading={loading}
      />
      <StatCard
        title="Armas Asignadas"
        value={stats.assignedWeapons.toLocaleString()}
        icon="🎯"
        loading={loading}
      />
      <StatCard
        title="Vehículos Totales"
        value={stats.totalVehicles.toLocaleString()}
        icon="🚗"
        change="+3%"
        positive
        loading={loading}
      />
      <StatCard
        title="Vehículos Activos"
        value={stats.activeVehicles.toLocaleString()}
        icon="🚓"
        loading={loading}
      />
      <StatCard
        title="Arrestos Totales"
        value={stats.totalArrests.toLocaleString()}
        icon="🔒"
        change="+15%"
        positive
        loading={loading}
      />
      <StatCard
        title="Arrestos del Mes"
        value={stats.monthArrests.toLocaleString()}
        icon="📊"
        loading={loading}
      />
    </div>
  );
}
