/**
 * Personnel Details Page
 *
 * Página de detalles de un oficial con toda su información,
 * historial de cambios y estadísticas
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Officer {
  id: string;
  badgeNumber: string;
  curp?: string;
  firstName: string;
  lastName: string;
  rank: string;
  status: 'active' | 'suspended' | 'retired';
  corporationId: string;
  corporation?: {
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface StatusChange {
  id: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  changedBy: string;
  changedAt: string;
}

export default function PersonnelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const officerId = params.id as string;

  const [officer, setOfficer] = useState<Officer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'assignments'>('overview');

  useEffect(() => {
    fetchOfficerDetails();
  }, [officerId]);

  const fetchOfficerDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/personnel/${officerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Oficial no encontrado');
      }

      const data = await response.json();
      setOfficer(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      jefe: 'bg-purple-100 text-purple-800',
      comandante: 'bg-red-100 text-red-800',
      teniente: 'bg-orange-100 text-orange-800',
      sargento: 'bg-yellow-100 text-yellow-800',
      oficial: 'bg-blue-100 text-blue-800',
      cadete: 'bg-gray-100 text-gray-800',
    };
    return colors[rank] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      retired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Activo',
      suspended: 'Suspendido',
      retired: 'Retirado',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !officer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Oficial no encontrado'}</p>
          <button
            onClick={() => router.push('/personnel')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver a Personal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/personnel')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Detalles del Oficial</h1>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="md:flex">
          {/* Profile Image */}
          <div className="md:flex-shrink-0">
            <div className="h-48 w-full md:h-full md:w-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white bg-opacity-20 text-white text-5xl font-bold">
                  {officer.firstName.charAt(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-8 flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {officer.firstName} {officer.lastName}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRankColor(officer.rank)}`}>
                    {officer.rank.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(officer.status)}`}>
                    {getStatusLabel(officer.status)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/personnel/${officer.id}/edit`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Editar
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Número de Badge</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{officer.badgeNumber}</p>
              </div>

              {officer.curp && (
                <div>
                  <p className="text-sm font-medium text-gray-500">CURP</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900 font-mono">{officer.curp}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500">Corporación</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {officer.corporation?.name || '-'}
                  {officer.corporation && (
                    <span className="text-sm text-gray-500 ml-2">({officer.corporation.type})</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Registro</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {new Date(officer.createdAt).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Última Actualización</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {new Date(officer.updatedAt).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historial de Cambios
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Asignaciones
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-600">Arrestos Realizados</p>
                  <p className="mt-2 text-3xl font-bold text-blue-900">-</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-600">Reportes Generados</p>
                  <p className="mt-2 text-3xl font-bold text-green-900">-</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-600">Servicio Activo</p>
                  <p className="mt-2 text-3xl font-bold text-purple-900">
                    {Math.floor((Date.now() - new Date(officer.createdAt).getTime()) / (1000 * 60 * 60 * 24))} días
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Cambios de Estado</h3>
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">Historial de cambios no disponible aún</p>
                <p className="text-sm">Esta funcionalidad se implementará próximamente</p>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Asignaciones Actuales</h3>
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="mt-2">No hay asignaciones registradas</p>
                <p className="text-sm">Las asignaciones de vehículos y armas se mostrarán aquí</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
