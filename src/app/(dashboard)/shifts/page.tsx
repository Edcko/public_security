/**
 * Shifts Page
 * Gestión de turnos y asistencia
 */

'use client';

import { useState, useEffect } from 'react';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string;
  isActive: boolean;
  corporationId: string;
}

interface AttendanceRecord {
  id: string;
  officerId: string;
  shiftId: string;
  checkIn?: string;
  checkOut?: string;
  date: string;
  notes?: string;
  officer?: {
    id: string;
    firstName: string;
    lastName: string;
    badgeNumber: string;
  };
  shift?: {
    id: string;
    name: string;
  };
}

interface Officer {
  id: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showNewShiftModal, setShowNewShiftModal] = useState(false);
  const [newShift, setNewShift] = useState({
    name: '',
    startTime: '',
    endTime: '',
    daysOfWeek: '1,2,3,4,5',
  });

  useEffect(() => {
    fetchShifts();
    fetchTodayAttendance();
    fetchOfficers();
  }, []);

  const fetchShifts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/shifts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const today = new Date().toISOString().split('T')[0];

      // Fetch attendance records for today
      const response = await fetch(`/api/shifts/attendance?date=${today}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAttendance(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/personnel', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOfficers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching officers:', error);
    }
  };

  const handleCheckIn = async (shiftId: string) => {
    try {
      setActionLoading('checkin');
      const token = localStorage.getItem('accessToken');

      const response = await fetch('/api/shifts/attendance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'check-in',
          shiftId,
        }),
      });

      if (response.ok) {
        alert('Check-In registrado exitosamente');
        fetchTodayAttendance();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error al hacer Check-In');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      setActionLoading('checkout');
      const token = localStorage.getItem('accessToken');

      const response = await fetch('/api/shifts/attendance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'check-out',
          attendanceId,
        }),
      });

      if (response.ok) {
        alert('Check-Out registrado exitosamente');
        fetchTodayAttendance();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error al hacer Check-Out');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateShift = async () => {
    try {
      setActionLoading('create');
      const token = localStorage.getItem('accessToken');

      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newShift),
      });

      if (response.ok) {
        alert('Turno creado exitosamente');
        setShowNewShiftModal(false);
        setNewShift({ name: '', startTime: '', endTime: '', daysOfWeek: '1,2,3,4,5' });
        fetchShifts();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error al crear turno');
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate stats
  const activeShifts = shifts.filter((s) => s.isActive).length;
  const todayAttendance = attendance.filter((a) => {
    const today = new Date().toISOString().split('T')[0];
    return a.date.startsWith(today);
  });
  const presentToday = todayAttendance.filter((a) => a.checkIn).length;
  const lateToday = todayAttendance.filter((a) => {
    if (!a.checkIn) return false;
    const checkInTime = new Date(a.checkIn).getHours();
    return checkInTime >= 9; // Late if after 9 AM
  }).length;

  // Format time for display
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    return timeStr;
  };

  // Calculate hours worked
  const calculateHours = (checkIn?: string, checkOut?: string) => {
    if (!checkIn) return '0';
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const hours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);
    return hours;
  };

  // Get attendance status
  const getAttendanceStatus = (record: AttendanceRecord) => {
    if (!record.checkIn) return { status: 'absent', label: 'Ausente' };
    if (!record.checkOut) {
      const checkInHour = new Date(record.checkIn).getHours();
      if (checkInHour >= 9) return { status: 'late', label: 'Tarde' };
      return { status: 'present', label: 'Presente' };
    }
    return { status: 'completed', label: 'Completado' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Turnos</h1>
          <p className="text-gray-600 mt-1">Control de asistencia y nómina</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewShiftModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            + Nuevo Turno
          </button>
        </div>
      </div>

      {/* Shift Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Turnos Activos"
          value={activeShifts.toString()}
          subtitle="Configurados"
          icon="📋"
          color="green"
        />
        <StatCard
          title="Presentes Hoy"
          value={presentToday.toString()}
          subtitle="Oficiales"
          icon="✓"
          color="blue"
        />
        <StatCard
          title="Tardanzas Hoy"
          value={lateToday.toString()}
          subtitle="Oficiales"
          icon="⚠️"
          color="yellow"
        />
        <StatCard
          title="Total Registros"
          value={todayAttendance.length.toString()}
          subtitle="Hoy"
          icon="📊"
          color="purple"
        />
      </div>

      {/* Current Shifts */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Turnos Configurados</h3>
          <span className="text-sm text-gray-500">{shifts.length} turnos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div key={shift.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{shift.name}</h4>
                  <p className="text-sm text-gray-500">
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    shift.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {shift.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Días:</span>
                  <span className="font-medium text-gray-900">{shift.daysOfWeek}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleCheckIn(shift.id)}
                  disabled={actionLoading === 'checkin'}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  {actionLoading === 'checkin' ? 'Procesando...' : 'Check-In a este turno'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Registro de Asistencia</h3>
          <button
            onClick={fetchTodayAttendance}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay registros de asistencia hoy</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Oficial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Turno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Check-In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Check-Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Horas Trabajadas
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
                {attendance.map((record) => {
                  const officer = officers.find((o) => o.id === record.officerId);
                  const shift = shifts.find((s) => s.id === record.shiftId);
                  const { status, label } = getAttendanceStatus(record);

                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {officer ? `${officer.firstName} ${officer.lastName}` : 'Desconocido'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {officer?.badgeNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shift?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {calculateHours(record.checkIn, record.checkOut)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : status === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.checkIn && !record.checkOut && (
                          <button
                            onClick={() => handleCheckOut(record.id)}
                            disabled={actionLoading === 'checkout'}
                            className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
                          >
                            {actionLoading === 'checkout' ? 'Procesando...' : 'Check-Out'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Shift Modal */}
      {showNewShiftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo Turno</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newShift.name}
                  onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Matutino"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                <input
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Días (1-7)</label>
                <input
                  type="text"
                  value={newShift.daysOfWeek}
                  onChange={(e) => setNewShift({ ...newShift, daysOfWeek: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 1,2,3,4,5 (Lunes-Viernes)"
                />
                <p className="text-xs text-gray-500 mt-1">1=Lunes, 2=Martes, ..., 7=Domingo</p>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleCreateShift}
                disabled={actionLoading === 'create' || !newShift.name || !newShift.startTime || !newShift.endTime}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {actionLoading === 'create' ? 'Creando...' : 'Crear'}
              </button>
              <button
                onClick={() => setShowNewShiftModal(false)}
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

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'green' | 'blue' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg shadow p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-xs mt-1 opacity-75">{subtitle}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
