/**
 * Payroll Page
 *
 * Gestión de nómina del personal
 */

'use client';

import { useState, useEffect } from 'react';

interface PayrollRecord {
  id: string;
  personnelId: string;
  personnelName: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  benefits: number;
  bonuses: number;
  deductions: number;
  totalPay: number;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  paymentDate?: string;
}

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchPayrollRecords();
  }, [selectedPeriod]);

  const fetchPayrollRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        startDate: selectedPeriod.start,
        endDate: selectedPeriod.end,
      });

      const response = await fetch(`/api/payroll?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payroll records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedPeriod),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Nómina generada: ${data.data.created} registros creados, ${data.data.errors} errores`);
        fetchPayrollRecords();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error al generar nómina');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkAsPaid = async (recordId: string) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`/api/payroll/${recordId}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        fetchPayrollRecords();
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch('/api/reports/pdf/payroll', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedPeriod),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nomina-${selectedPeriod.start}-${selectedPeriod.end}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const totalPending = records
    .filter(r => r.paymentStatus === 'pending')
    .reduce((sum, r) => sum + r.totalPay, 0);

  const totalPaid = records
    .filter(r => r.paymentStatus === 'paid')
    .reduce((sum, r) => sum + r.totalPay, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nómina</h1>
        <p className="text-gray-600 mt-2">Gestión de pagos al personal</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Seleccionar Periodo</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={selectedPeriod.start}
              onChange={(e) => setSelectedPeriod({ ...selectedPeriod, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={selectedPeriod.end}
              onChange={(e) => setSelectedPeriod({ ...selectedPeriod, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGeneratePayroll}
              disabled={generating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? 'Generando...' : 'Generar Nómina'}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
            >
              <span>📄</span> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Registros</p>
          <p className="text-3xl font-bold mt-2">{records.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <p className="text-sm text-blue-600">Pendientes de Pago</p>
          <p className="text-3xl font-bold mt-2 text-blue-900">
            ${totalPending.toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <p className="text-sm text-green-600">Pagados</p>
          <p className="text-3xl font-bold mt-2 text-green-900">
            ${totalPaid.toFixed(2)}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-6">
          <p className="text-sm text-purple-600">Total Periodo</p>
          <p className="text-3xl font-bold mt-2 text-purple-900">
            ${(totalPending + totalPaid).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sueldo Base
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beneficios
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deducciones
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Neto a Pagar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No hay registros de nómina para este periodo
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.personnelName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.periodStart).toLocaleDateString()} - {new Date(record.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${record.baseSalary.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                      ${record.benefits.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-right">
                      ${record.bonuses.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                      ${record.deductions.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      ${record.totalPay.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : record.paymentStatus === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.paymentStatus === 'paid' ? 'Pagado' : record.paymentStatus === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.paymentStatus === 'pending' && (
                        <button
                          onClick={() => handleMarkAsPaid(record.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Marcar Pagado
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
