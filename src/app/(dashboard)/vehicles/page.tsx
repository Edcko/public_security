/**
 * Vehicles Page
 * Gestión de flota de patrullas
 */

'use client';

import { useState, useEffect } from 'react';

interface Vehicle {
  id: string;
  corporationId: string;
  plateNumber: string;
  vehicleType: 'patrol' | 'motorcycle' | 'truck' | 'van' | 'helicopter';
  make?: string;
  model?: string;
  year?: number;
  status: 'active' | 'maintenance' | 'decommissioned';
  currentMileage: number;
  createdAt: string;
}

interface Corporation {
  id: string;
  name: string;
  type: 'federal' | 'estatal' | 'municipal';
}

interface CreateVehicleData {
  corporationId: string;
  plateNumber: string;
  vehicleType: 'patrol' | 'motorcycle' | 'truck' | 'van' | 'helicopter';
  make?: string;
  model?: string;
  year?: number;
  status: 'active' | 'maintenance' | 'decommissioned';
  currentMileage: number;
}

interface UpdateVehicleData {
  corporationId: string;
  vehicleType: 'patrol' | 'motorcycle' | 'truck' | 'van' | 'helicopter';
  make?: string;
  model?: string;
  year?: number;
  status: 'active' | 'maintenance' | 'decommissioned';
  currentMileage: number;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateVehicleData>({
    corporationId: '',
    vehicleType: 'patrol',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    status: 'active',
    currentMileage: 0,
  });
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [quickUpdateStatus, setQuickUpdateStatus] = useState<{ vehicleId: string; status: string } | null>(null);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateVehicleData>({
    corporationId: '',
    plateNumber: '',
    vehicleType: 'patrol',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    status: 'active',
    currentMileage: 0,
  });

  // Cargar vehículos y corporaciones al montar
  useEffect(() => {
    fetchVehicles();
    fetchCorporations();
  }, []);

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCorporations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/corporations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCorporations(data.data);
      }
    } catch (error) {
      console.error('Error fetching corporations:', error);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/reports/pdf/vehicles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al generar PDF');
      }

      // Descargar el PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vehiculos-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error al descargar el PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear vehículo');
      }

      // Cerrar modal y recargar lista
      setShowCreateModal(false);
      fetchVehicles();

      // Reset form
      setFormData({
        corporationId: '',
        plateNumber: '',
        vehicleType: 'patrol',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        status: 'active',
        currentMileage: 0,
      });
    } catch (error: any) {
      setCreateError(error instanceof Error ? error.message : 'Error al crear vehículo');
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setEditFormData({
      corporationId: vehicle.corporationId,
      vehicleType: vehicle.vehicleType,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      status: vehicle.status,
      currentMileage: vehicle.currentMileage,
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    setUpdating(true);
    setEditError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/vehicles/${editingVehicle.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar vehículo');
      }

      // Cerrar modal y recargar lista
      setShowEditModal(false);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (error: any) {
      setEditError(error instanceof Error ? error.message : 'Error al actualizar vehículo');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickStatusChange = async (vehicleId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar estado');
      }

      // Recargar lista
      fetchVehicles();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar estado');
    }
  };

  const handleDeleteClick = (vehicle: Vehicle) => {
    setDeletingVehicle(vehicle);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingVehicle) return;

    setDeleting(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/vehicles/${deletingVehicle.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar vehículo');
      }

      // Cerrar modal y recargar lista
      setShowDeleteModal(false);
      setDeletingVehicle(null);
      fetchVehicles();
    } catch (error: any) {
      setDeleteError(error instanceof Error ? error.message : 'Error al eliminar vehículo');
    } finally {
      setDeleting(false);
    }
  };

  const getVehicleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      patrol: 'Patrulla',
      motorcycle: 'Motocicleta',
      truck: 'Camión',
      van: 'Camioneta',
      helicopter: 'Helicóptero',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Activo',
      maintenance: 'Mantenimiento',
      decommissioned: 'Fuera de Servicio',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      decommissioned: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Stats calculations
  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    decommissioned: vehicles.filter(v => v.status === 'decommissioned').length,
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flota de Patrullas</h1>
          <p className="text-gray-600 mt-1">Gestión de vehículos policiales</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF || vehicles.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {downloadingPDF ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar PDF
              </>
            )}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            + Nueva Patrulla
          </button>
        </div>
      </div>

      {/* Vehicle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <VehicleStatCard title="Total Unidades" value={stats.total.toString()} icon="🚗" color="blue" />
        <VehicleStatCard title="Activos" value={stats.active.toString()} icon="✅" color="green" />
        <VehicleStatCard title="En Mantenimiento" value={stats.maintenance.toString()} icon="🔧" color="yellow" />
        <VehicleStatCard title="Fuera de Servicio" value={stats.decommissioned.toString()} icon="❌" color="red" />
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Placa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marca/Modelo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Año
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kilometraje
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Corporación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                  {vehicle.plateNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getVehicleTypeLabel(vehicle.vehicleType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.year || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={vehicle.status}
                    onChange={(e) => handleQuickStatusChange(vehicle.id, e.target.value)}
                    className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full border-0 cursor-pointer ${getStatusColor(vehicle.status)} hover:opacity-80 transition-opacity`}
                  >
                    <option value="active">Activo</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="decommissioned">Fuera de Servicio</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.currentMileage.toLocaleString()} km
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {corporations.find(c => c.id === vehicle.corporationId)?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">Ver GPS</button>
                  <button
                    onClick={() => handleEditClick(vehicle)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(vehicle)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No hay vehículos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Crear Nuevo Vehículo</h2>

              {createError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Corporation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corporación *
                  </label>
                  <select
                    required
                    value={formData.corporationId}
                    onChange={(e) => setFormData({ ...formData, corporationId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona una corporación</option>
                    {corporations.map((corp) => (
                      <option key={corp.id} value={corp.id}>
                        {corp.name} ({corp.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Plate Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Placa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: ABC-123-4"
                    />
                  </div>

                  {/* Vehicle Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Vehículo *
                    </label>
                    <select
                      required
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="patrol">Patrulla</option>
                      <option value="motorcycle">Motocicleta</option>
                      <option value="truck">Camión</option>
                      <option value="van">Camioneta</option>
                      <option value="helicopter">Helicóptero</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Make */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Ford"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Explorer"
                    />
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Activo</option>
                      <option value="maintenance">Mantenimiento</option>
                      <option value="decommissioned">Fuera de Servicio</option>
                    </select>
                  </div>

                  {/* Current Mileage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kilometraje Actual
                    </label>
                    <input
                      type="number"
                      value={formData.currentMileage}
                      onChange={(e) => setFormData({ ...formData, currentMileage: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {creating ? 'Creando...' : 'Crear Vehículo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Editar Vehículo</h2>

              {editError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {editError}
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Corporation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corporación *
                  </label>
                  <select
                    required
                    value={editFormData.corporationId}
                    onChange={(e) => setEditFormData({ ...editFormData, corporationId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona una corporación</option>
                    {corporations.map((corp) => (
                      <option key={corp.id} value={corp.id}>
                        {corp.name} ({corp.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plate Number - READ ONLY */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Placa
                  </label>
                  <input
                    type="text"
                    value={editingVehicle.plateNumber}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">El número de placa no se puede modificar</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vehicle Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Vehículo *
                    </label>
                    <select
                      required
                      value={editFormData.vehicleType}
                      onChange={(e) => setEditFormData({ ...editFormData, vehicleType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="patrol">Patrulla</option>
                      <option value="motorcycle">Motocicleta</option>
                      <option value="truck">Camión</option>
                      <option value="van">Camioneta</option>
                      <option value="helicopter">Helicóptero</option>
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año
                    </label>
                    <input
                      type="number"
                      value={editFormData.year}
                      onChange={(e) => setEditFormData({ ...editFormData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Make */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={editFormData.make}
                      onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Ford"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={editFormData.model}
                      onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Explorer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado *
                    </label>
                    <select
                      required
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Activo</option>
                      <option value="maintenance">Mantenimiento</option>
                      <option value="decommissioned">Fuera de Servicio</option>
                    </select>
                  </div>

                  {/* Current Mileage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kilometraje Actual
                    </label>
                    <input
                      type="number"
                      value={editFormData.currentMileage}
                      onChange={(e) => setEditFormData({ ...editFormData, currentMileage: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingVehicle(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {updating ? 'Actualizando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2 className="ml-3 text-xl font-bold text-gray-900">
                  Eliminar Vehículo
                </h2>
              </div>

              {deleteError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {deleteError}
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás seguro de que deseas eliminar el vehículo con placa <strong>{deletingVehicle.plateNumber}</strong>?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="text-gray-600"><strong>Tipo:</strong> {getVehicleTypeLabel(deletingVehicle.vehicleType)}</p>
                  {deletingVehicle.make && deletingVehicle.model && (
                    <p className="text-gray-600"><strong>Marca/Modelo:</strong> {deletingVehicle.make} {deletingVehicle.model}</p>
                  )}
                  {deletingVehicle.year && (
                    <p className="text-gray-600"><strong>Año:</strong> {deletingVehicle.year}</p>
                  )}
                  <p className="text-gray-600"><strong>Kilometraje:</strong> {deletingVehicle.currentMileage.toLocaleString()} km</p>
                </div>
                <p className="text-red-600 text-sm mt-4">
                  Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingVehicle(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar Vehículo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VehicleStatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg shadow p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
