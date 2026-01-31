/**
 * Reports Page
 * Generación y visualización de reportes
 */

'use client';

import { useState, useEffect } from 'react';

interface ScheduledReport {
  id: string;
  name: string;
  reportType: string;
  frequency: string;
  recipientEmails: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt: string;
}

interface GeneratedReport {
  id: string;
  title: string;
  description: string;
  format: string;
  date: string;
  size: string;
  url?: string;
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [recentReports, setRecentReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    name: '',
    frequency: 'weekly',
    recipientEmails: '',
  });

  useEffect(() => {
    fetchScheduledReports();
  }, []);

  const fetchScheduledReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/reports/scheduled', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setScheduledReports(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedReport) return;

    try {
      setGenerating(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedReport,
          format: selectedFormat,
          filters: {
            startDate,
            endDate,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Download the report
          const reportData = data.data;
          const filename = data.filename || `${selectedReport}-${Date.now()}.${selectedFormat}`;

          if (selectedFormat === 'json') {
            // Download JSON
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            downloadBlob(blob, filename);
          } else {
            // For PDF/Excel/CSV, the data should contain a URL or base64
            if (reportData.url) {
              // Download from URL
              window.open(reportData.url, '_blank');
            } else if (reportData.base64) {
              // Download from base64
              const byteCharacters = atob(reportData.base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: data.mimeType });
              downloadBlob(blob, filename);
            } else {
              alert('Reporte generado exitosamente (sin descarga disponible)');
            }
          }

          // Add to recent reports
          const newReport: GeneratedReport = {
            id: Date.now().toString(),
            title: getReportLabel(selectedReport),
            description: `${startDate} - ${endDate}`,
            format: selectedFormat,
            date: 'Justo ahora',
            size: 'N/A',
          };
          setRecentReports([newReport, ...recentReports.slice(0, 5)]);
        } else {
          alert(`Error: ${data.error}`);
        }
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar reporte');
    } finally {
      setGenerating(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSchedule = async () => {
    if (!selectedReport) return;

    try {
      setGenerating(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: scheduleConfig.name || `${getReportLabel(selectedReport)} - Recurrente`,
          reportType: selectedReport,
          frequency: scheduleConfig.frequency,
          recipientEmails: scheduleConfig.recipientEmails.split(',').map((e) => e.trim()),
          parameters: JSON.stringify({
            format: selectedFormat,
            startDate,
            endDate,
          }),
        }),
      });

      if (response.ok) {
        alert('Reporte agendado exitosamente');
        setShowScheduleModal(false);
        setScheduleConfig({ name: '', frequency: 'weekly', recipientEmails: '' });
        fetchScheduledReports();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error scheduling report:', error);
      alert('Error al agendar reporte');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleScheduled = async (id: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/reports/scheduled/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchScheduledReports();
      }
    } catch (error) {
      console.error('Error toggling report:', error);
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este reporte agendado?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/reports/scheduled/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        fetchScheduledReports();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleSendEmail = async (reportType: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const email = prompt('Enviar reporte a (email):');

      if (!email) return;

      const response = await fetch('/api/reports/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          reportName: getReportLabel(reportType),
          reportUrl: window.location.href,
          startDate,
          endDate,
          recipientEmail: email,
        }),
      });

      if (response.ok) {
        alert('Reporte enviado por email exitosamente');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error al enviar email');
    }
  };

  const getReportLabel = (type: string) => {
    const labels: Record<string, string> = {
      incidents: 'Reporte de Incidentes',
      arrests: 'Reporte de Arrestos',
      personnel: 'Reporte de Personal',
      inventory: 'Reporte de Inventario',
      vehicles: 'Reporte de Vehículos',
      shifts: 'Reporte de Turnos',
      crime_stats: 'Estadísticas Delictivas',
      performance: 'Reporte de Rendimiento',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes y Analytics</h1>
        <p className="text-gray-600 mt-1">Generación y exportación de reportes</p>
      </div>

      {/* Report Generator */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Generar Nuevo Reporte</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar reporte...</option>
              <option value="incidents">Reporte de Incidentes</option>
              <option value="arrests">Reporte de Arrestos</option>
              <option value="personnel">Reporte de Personal</option>
              <option value="inventory">Reporte de Inventario</option>
              <option value="vehicles">Reporte de Vehículos</option>
              <option value="shifts">Reporte de Turnos</option>
              <option value="crime_stats">Estadísticas Delictivas</option>
              <option value="performance">Reporte de Rendimiento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de Exportación
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel (XLSX)</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rango de Fechas
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleGenerate}
            disabled={!selectedReport || generating}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              generating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {generating ? 'Generando...' : 'Generar Reporte'}
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            disabled={!selectedReport}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            📅 Agendar Reporte Recurrente
          </button>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Reportes Agendados</h3>
          <button
            onClick={fetchScheduledReports}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : scheduledReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay reportes agendados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Frecuencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Última Ejecución
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Próxima Ejecución
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduledReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getReportLabel(report.reportType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.frequency === 'daily' ? 'Diario' : report.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.lastRunAt ? new Date(report.lastRunAt).toLocaleDateString('es-MX') : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.nextRunAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          report.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {report.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleToggleScheduled(report.id, report.isActive)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {report.isActive ? 'Pausar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDeleteScheduled(report.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Reportes Recientes</h3>

        {recentReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay reportes recientes. Genera uno arriba.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{report.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      report.format === 'pdf'
                        ? 'bg-red-100 text-red-800'
                        : report.format === 'excel'
                        ? 'bg-green-100 text-green-800'
                        : report.format === 'csv'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {report.format.toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>{report.date}</span>
                  <span>{report.size}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                  <button
                    onClick={() => handleSendEmail(report.title)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    📧 Email
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Categories */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Categorías de Reportes</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportCategoryCard
            icon="📋"
            title="Operacionales"
            count={5}
            reports={['Incidentes', 'Arrestos', 'Actividad', 'Turnos', 'Asistencia']}
          />
          <ReportCategoryCard
            icon="📊"
            title="Estadísticos"
            count={3}
            reports={['Delitos', 'Tendencias', 'Comparativos']}
          />
          <ReportCategoryCard
            icon="💰"
            title="Financieros"
            count={2}
            reports={['Nómina', 'Costos Operativos']}
          />
          <ReportCategoryCard
            icon="📈"
            title="Rendimiento"
            count={4}
            reports={['KPIs', 'Métricas', 'Eficiencia', 'Productividad']}
          />
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Agendar Reporte Recurrente</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Reporte
                </label>
                <input
                  type="text"
                  value={scheduleConfig.name}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`Ej: ${getReportLabel(selectedReport)} Semanal`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia
                </label>
                <select
                  value={scheduleConfig.frequency}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emails Destinatarios (separados por coma)
                </label>
                <input
                  type="text"
                  value={scheduleConfig.recipientEmails}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, recipientEmails: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ejemplo@email.com, otro@email.com"
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleSchedule}
                disabled={!scheduleConfig.recipientEmails}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Agendar
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportCategoryCard({
  icon,
  title,
  count,
  reports,
}: {
  icon: string;
  title: string;
  count: number;
  reports: string[];
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{icon}</span>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
          {count}
        </span>
      </div>
      <ul className="space-y-1">
        {reports.map((report) => (
          <li key={report} className="text-sm text-gray-600 py-1">
            • {report}
          </li>
        ))}
      </ul>
    </div>
  );
}
