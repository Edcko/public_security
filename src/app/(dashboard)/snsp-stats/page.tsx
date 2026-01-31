/**
 * SNSP Statistics Page
 *
 * Dashboard de estadísticas del SNSP (Sistema Nacional de Seguridad Pública)
 */

'use client';

import { useState, useEffect } from 'react';

interface CrimeStatistic {
  year: number;
  month: number;
  stateCode: string;
  stateName: string;
  crimeType: string;
  crimeSubtype?: string;
  count: number;
}

interface CrimeTrend {
  current: CrimeStatistic[];
  previous: CrimeStatistic[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
}

interface Corporation {
  id: string;
  name: string;
}

export default function SNSPStatisticsPage() {
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [selectedCorporation, setSelectedCorporation] = useState<string>('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [stateCode, setStateCode] = useState<string>('');
  const [crimeType, setCrimeType] = useState<string>('');
  const [statistics, setStatistics] = useState<CrimeStatistic[]>([]);
  const [trends, setTrends] = useState<CrimeTrend | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'statistics' | 'trends' | 'comparison'>('statistics');

  const states = [
    { code: 'AS', name: 'Aguascalientes' },
    { code: 'BC', name: 'Baja California' },
    { code: 'BS', name: 'Baja California Sur' },
    { code: 'CC', name: 'Campeche' },
    { code: 'CL', name: 'Coahuila' },
    { code: 'CM', name: 'Colima' },
    { code: 'CS', name: 'Chiapas' },
    { code: 'CH', name: 'Chihuahua' },
    { code: 'DF', name: 'Ciudad de México' },
    { code: 'DG', name: 'Durango' },
    { code: 'GT', name: 'Guanajuato' },
    { code: 'GR', name: 'Guerrero' },
    { code: 'HG', name: 'Jalisco' },
    { code: 'MC', name: 'México' },
    { code: 'MN', name: 'Michoacán' },
    { code: 'MS', name: 'Morelos' },
    { code: 'NT', name: 'Nayarit' },
    { code: 'NL', name: 'Nuevo León' },
    { code: 'OC', name: 'Oaxaca' },
    { code: 'PL', name: 'Puebla' },
    { code: 'QT', name: 'Querétaro' },
    { code: 'QR', name: 'Quintana Roo' },
    { code: 'SP', name: 'San Luis Potosí' },
    { code: 'SL', name: 'Sinaloa' },
    { code: 'TJ', name: 'Tlaxcala' },
    { code: 'TM', name: 'Tamaulipas' },
    { code: 'TL', name: 'Tlaxcala' },
    { code: 'VZ', name: 'Veracruz' },
    { code: 'YN', name: 'Yucatán' },
    { code: 'ZS', name: 'Zacatecas' },
  ];

  const crimeTypes = [
    'Homicidio doloso',
    'Homicidio culposo',
    'Lesiones dolosas',
    'Lesiones culposas',
    'Feminicidio',
    'Robo a transeúnte en vía pública',
    'Robo a negocio',
    'Robo de vehículo',
    'Secuestro',
    'Extorsión',
    'Fraude',
    'Violación',
    'Abuso sexual',
    'Narcomenudeo',
  ];

  useEffect(() => {
    fetchCorporations();
  }, []);

  useEffect(() => {
    if (selectedCorporation) {
      if (activeTab === 'statistics') {
        fetchStatistics();
      } else if (activeTab === 'trends') {
        fetchTrends();
      }
    }
  }, [selectedCorporation, year, month, stateCode, crimeType, activeTab]);

  const fetchCorporations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/corporations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCorporations(data.data);
        if (data.data.length > 0 && !selectedCorporation) {
          setSelectedCorporation(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching corporations:', error);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/integrations/snsp/statistics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corporationId: selectedCorporation,
          year,
          month,
          stateCode: stateCode || undefined,
          crimeType: crimeType || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/integrations/snsp/trends', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corporationId: selectedCorporation,
          stateCode: stateCode || undefined,
          crimeType: crimeType || undefined,
          months: 12, // Comparar con año anterior
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTrends(data.data);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar estadísticas por tipo de delito
  const groupedByCrimeType = statistics.reduce((acc, stat) => {
    if (!acc[stat.crimeType]) {
      acc[stat.crimeType] = { count: 0, states: {} };
    }
    acc[stat.crimeType].count += stat.count;
    if (!acc[stat.crimeType].states[stat.stateName]) {
      acc[stat.crimeType].states[stat.stateName] = 0;
    }
    acc[stat.crimeType].states[stat.stateName] += stat.count;
    return acc;
  }, {} as Record<string, { count: number; states: Record<string, number> }>);

  // Agrupar por estado
  const groupedByState = statistics.reduce((acc, stat) => {
    if (!acc[stat.stateName]) {
      acc[stat.stateName] = { count: 0, crimes: {} };
    }
    acc[stat.stateName].count += stat.count;
    if (!acc[stat.stateName].crimes[stat.crimeType]) {
      acc[stat.stateName].crimes[stat.crimeType] = 0;
    }
    acc[stat.stateName].crimes[stat.crimeType] += stat.count;
    return acc;
  }, {} as Record<string, { count: number; crimes: Record<string, number> }>);

  const totalCrimes = statistics.reduce((sum, stat) => sum + stat.count, 0);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-red-600 bg-red-50';
      case 'decreasing': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Estadísticas SNSP</h1>
        <p className="text-gray-600 mt-1">
          Datos del Sistema Nacional de Seguridad Pública
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Corporación
            </label>
            <select
              value={selectedCorporation}
              onChange={(e) => setSelectedCorporation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona...</option>
              {corporations.map((corp) => (
                <option key={corp.id} value={corp.id}>{corp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const y = new Date().getFullYear() - i;
                return (
                  <option key={y} value={y}>{y}</option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                return (
                  <option key={m} value={m}>{monthNames[m - 1]}</option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {states.map((state) => (
                <option key={state.code} value={state.code}>{state.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Delito
            </label>
            <select
              value={crimeType}
              onChange={(e) => setCrimeType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los delitos</option>
              {crimeTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('statistics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statistics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'trends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tendencias
          </button>
        </nav>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && !loading && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Resumen</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-600">Total de Delitos</p>
                <p className="text-3xl font-bold text-blue-900">{totalCrimes}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-600">Tipo de Delito Más Frecuente</p>
                <p className="text-lg font-bold text-purple-900 mt-2">
                  {Object.entries(groupedByCrimeType).sort(([, a], [, b]) => b.count - a.count)[0]?.[0] ||
                    'N/A'}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-600">Estado con Más Delitos</p>
                <p className="text-lg font-bold text-green-900 mt-2">
                  {Object.entries(groupedByState).sort(([, a], [, b]) => b.count - a.count)[0]?.[0] ||
                    'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* By Crime Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Por Tipo de Delito</h3>
            <div className="space-y-3">
              {Object.entries(groupedByCrimeType)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 10)
                .map(([crimeType, data]) => {
                  const percentage = totalCrimes > 0 ? ((data.count / totalCrimes) * 100).toFixed(1) : '0';
                  return (
                    <div key={crimeType} className="flex items-center">
                      <span className="flex-1 text-sm text-gray-700">{crimeType}</span>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12 text-right">{percentage}%</span>
                        <span className="text-sm text-gray-600 w-16 text-right">{data.count}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* By State */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Por Estado</h3>
            <div className="space-y-3">
              {Object.entries(groupedByState)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 10)
                .map(([stateName, data]) => {
                  const percentage = totalCrimes > 0 ? ((data.count / totalCrimes) * 100).toFixed(1) : '0';
                  return (
                    <div key={stateName} className="flex items-center">
                      <span className="flex-1 text-sm text-gray-700">{stateName}</span>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12 text-right">{percentage}%</span>
                        <span className="text-sm text-gray-600 w-16 text-right">{data.count}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && !loading && trends && (
        <div className="space-y-6">
          {/* Trend Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Análisis de Tendencia</h3>
            <div className="flex items-center gap-6">
              <div className={`text-6xl ${getTrendColor(trends.trend).split(' ')[0]}`}>
                {getTrendIcon(trends.trend)}
              </div>
              <div>
                <p className="text-2xl font-bold">{trends.trend === 'increasing' ? 'En Aumento' : trends.trend === 'decreasing' ? 'Disminución' : 'Estable'}</p>
                <p className={`text-lg ${getTrendColor(trends.trend)}`}>
                  {trends.changePercentage > 0 ? '+' : ''}{trends.changePercentage.toFixed(1)}% vs año anterior
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold mb-4">Período Actual</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Total: <span className="font-bold text-gray-900">{trends.current.reduce((sum, t) => sum + t.count, 0)}</span>
                </p>
                {Object.entries(
                  trends.current.reduce((acc, t) => {
                    if (!acc[t.crimeType]) acc[t.crimeType] = 0;
                    acc[t.crimeType] += t.count;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <p key={type} className="text-sm text-gray-700">
                      {type}: <span className="font-medium ml-2">{count}</span>
                    </p>
                  ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold mb-4">Año Anterior</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Total: <span className="font-bold text-gray-900">{trends.previous.reduce((sum, t) => sum + t.count, 0)}</span>
                </p>
                {Object.entries(
                  trends.previous.reduce((acc, t) => {
                    if (!acc[t.crimeType]) acc[t.crimeType] = 0;
                    acc[t.crimeType] += t.count;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <p key={type} className="text-sm text-gray-700">
                      {type}: <span className="font-medium ml-2">{count}</span>
                    </p>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
