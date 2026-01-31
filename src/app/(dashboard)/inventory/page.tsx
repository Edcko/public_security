/**
 * Inventory/Weapons Page
 * Gestión de armamento y equipo
 */

'use client';

import { useState, useEffect } from 'react';

interface Weapon {
  id: string;
  corporationId: string;
  serialNumber: string;
  weaponType: 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'sniper';
  make?: string;
  model?: string;
  caliber?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'decommissioned';
  assignedTo?: string;
  createdAt: string;
}

interface Corporation {
  id: string;
  name: string;
  type: 'federal' | 'estatal' | 'municipal';
}

interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  badgeNumber: string;
}

interface CreateWeaponData {
  corporationId: string;
  serialNumber: string;
  weaponType: 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'sniper';
  make?: string;
  model?: string;
  caliber?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'decommissioned';
  assignedTo?: string;
}

interface UpdateWeaponData {
  corporationId: string;
  weaponType: 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'sniper';
  make?: string;
  model?: string;
  caliber?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'decommissioned';
  assignedTo?: string;
}

export default function InventoryPage() {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState<Weapon | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateWeaponData>({
    corporationId: '',
    weaponType: 'pistol',
    make: '',
    model: '',
    caliber: '',
    status: 'available',
  });
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWeapon, setDeletingWeapon] = useState<Weapon | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateWeaponData>({
    corporationId: '',
    serialNumber: '',
    weaponType: 'pistol',
    make: '',
    model: '',
    caliber: '',
    status: 'available',
  });

  // Cregar datos al montar
  useEffect(() => {
    fetchWeapons();
    fetchCorporations();
    fetchPersonnel();
  }, []);

  const fetchWeapons = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/weapons', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setWeapons(data.data);
      }
    } catch (error) {
      console.error('Error fetching weapons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCorporations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/corporations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCorporations(data.data);
      }
    } catch (error) {
      console.error('Error fetching corporations:', error);
    }
  };

  const fetchPersonnel = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/personnel', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPersonnel(data.data);
      }
    } catch (error) {
      console.error('Error fetching personnel:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/weapons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear arma');
      }

      // Cerrar modal y recargar
      setShowCreateModal(false);
      fetchWeapons();

      // Reset form
      setFormData({
        corporationId: '',
        serialNumber: '',
        weaponType: 'pistol',
        make: '',
        model: '',
        caliber: '',
        status: 'available',
      });
    } catch (error: any) {
      setCreateError(error instanceof Error ? error.message : 'Error al crear arma');
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (weapon: Weapon) => {
    setEditingWeapon(weapon);
    setEditFormData({
      corporationId: weapon.corporationId,
      weaponType: weapon.weaponType,
      make: weapon.make || '',
      model: weapon.model || '',
      caliber: weapon.caliber || '',
      status: weapon.status,
      assignedTo: weapon.assignedTo,
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWeapon) return;

    setUpdating(true);
    setEditError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/weapons/${editingWeapon.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar arma');
      }

      // Cerrar modal y recargar
      setShowEditModal(false);
      setEditingWeapon(null);
      fetchWeapons();
    } catch (error: any) {
      setEditError(error instanceof Error ? error.message : 'Error al actualizar arma');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickStatusChange = async (weaponId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/weapons/${weaponId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      fetchWeapons();
    } catch (error: any) {
      alert(error instanceof Error ? error.message : 'Error al actualizar estado');
    }
  };

  const handleDeleteClick = (weapon: Weapon) => {
    setDeletingWeapon(weapon);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingWeapon) return;

    setDeleting(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/weapons/${deletingWeapon.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar arma');
      }

      // Cerrar modal y recargar
      setShowDeleteModal(false);
      setDeletingWeapon(null);
      fetchWeapons();
    } catch (error: any) {
      setDeleteError(error instanceof Error ? error.message : 'Error al eliminar arma');
    } finally {
      setDeleting(false);
    }
  };

  const getWeaponTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pistol: 'Pistola',
      rifle: 'Rifle',
      shotgun: 'Escopeta',
      smg: 'Subfusil',
      sniper: 'Francotirador',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Disponible',
      assigned: 'Asignada',
      maintenance: 'Mantenimiento',
      decommissioned: 'Dada de Baja',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      assigned: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      decommissioned: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Stats calculations
  const stats = {
    total: weapons.length,
    assigned: weapons.filter(w => w.status === 'assigned').length,
    available: weapons.filter(w => w.status === 'available').length,
    maintenance: weapons.filter(w => w.status === 'maintenance').length,
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
          <h1 className="text-3xl font-bold text-gray-900">Inventario de Armamento</h1>
          <p className="text-gray-600 mt-1">Control de armas y municiones</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          + Nueva Arma
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard title="Total Armas" value={stats.total.toString()} icon="🔫" color="blue" />
        <SummaryCard title="Asignadas" value={stats.assigned.toString()} icon="✅" color="green" />
        <SummaryCard title="Disponibles" value={stats.available.toString()} icon="📦" color="yellow" />
        <SummaryCard title="En Mantenimiento" value={stats.maintenance.toString()} icon="🔧" color="red" />
      </div>

      {/* Weapons Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Número Serial
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Marca/Modelo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Calibre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Asignada a
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Corporación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {weapons.map((weapon) => (
              <tr key={weapon.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                  {weapon.serialNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getWeaponTypeLabel(weapon.weaponType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {weapon.make && weapon.model ? `${weapon.make} ${weapon.model}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {weapon.caliber || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={weapon.status}
                    onChange={(e) => handleQuickStatusChange(weapon.id, e.target.value)}
                    className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full border-0 cursor-pointer ${getStatusColor(weapon.status)} hover:opacity-80 transition-opacity`}
                  >
                    <option value="available">Disponible</option>
                    <option value="assigned">Asignada</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="decommissioned">Dada de Baja</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {weapon.assignedTo
                    ? personnel.find(p => p.id === weapon.assignedTo)?.badgeNumber || '-'
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {corporations.find(c => c.id === weapon.corporationId)?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEditClick(weapon)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(weapon)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {weapons.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  No hay armas registradas
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
              <h2 className="text-2xl font-bold mb-4">Registrar Nueva Arma</h2>

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

                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número Serial *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="Ej: GLOCK19-001234"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weapon Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Arma *
                    </label>
                    <select
                      required
                      value={formData.weaponType}
                      onChange={(e) => setFormData({ ...formData, weaponType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pistol">Pistola</option>
                      <option value="rifle">Rifle</option>
                      <option value="shotgun">Escopeta</option>
                      <option value="smg">Subfusil</option>
                      <option value="sniper">Francotirador</option>
                    </select>
                  </div>

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
                      <option value="available">Disponible</option>
                      <option value="assigned">Asignada</option>
                      <option value="maintenance">Mantenimiento</option>
                      <option value="decommissioned">Dada de Baja</option>
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
                      placeholder="Ej: Glock"
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
                      placeholder="Ej: Gen 5"
                    />
                  </div>

                  {/* Caliber */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calibre
                    </label>
                    <input
                      type="text"
                      value={formData.caliber}
                      onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 9mm"
                    />
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignar a Oficial
                  </label>
                  <select
                    value={formData.assignedTo || ''}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No asignada</option>
                    {personnel.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.badgeNumber} - {person.firstName} {person.lastName}
                      </option>
                    ))}
                  </select>
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
                    {creating ? 'Registrando...' : 'Registrar Arma'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingWeapon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Editar Arma</h2>

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

                {/* Serial Number - READ ONLY */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número Serial
                  </label>
                  <input
                    type="text"
                    value={editingWeapon.serialNumber}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">El número serial no se puede modificar</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weapon Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Arma *
                    </label>
                    <select
                      required
                      value={editFormData.weaponType}
                      onChange={(e) => setEditFormData({ ...editFormData, weaponType: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pistol">Pistola</option>
                      <option value="rifle">Rifle</option>
                      <option value="shotgun">Escopeta</option>
                      <option value="smg">Subfusil</option>
                      <option value="sniper">Francotirador</option>
                    </select>
                  </div>

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
                      <option value="available">Disponible</option>
                      <option value="assigned">Asignada</option>
                      <option value="maintenance">Mantenimiento</option>
                      <option value="decommissioned">Dada de Baja</option>
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
                      value={editFormData.make}
                      onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Glock"
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
                      placeholder="Ej: Gen 5"
                    />
                  </div>

                  {/* Caliber */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calibre
                    </label>
                    <input
                      type="text"
                      value={editFormData.caliber}
                      onChange={(e) => setEditFormData({ ...editFormData, caliber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 9mm"
                    />
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignar a Oficial
                  </label>
                  <select
                    value={editFormData.assignedTo || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, assignedTo: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No asignada</option>
                    {personnel.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.badgeNumber} - {person.firstName} {person.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingWeapon(null);
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
      {showDeleteModal && deletingWeapon && (
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
                  Eliminar Arma
                </h2>
              </div>

              {deleteError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {deleteError}
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás seguro de que deseas eliminar el arma con serial <strong>{deletingWeapon.serialNumber}</strong>?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="text-gray-600"><strong>Tipo:</strong> {getWeaponTypeLabel(deletingWeapon.weaponType)}</p>
                  {deletingWeapon.make && deletingWeapon.model && (
                    <p className="text-gray-600"><strong>Marca/Modelo:</strong> {deletingWeapon.make} {deletingWeapon.model}</p>
                  )}
                  {deletingWeapon.caliber && (
                    <p className="text-gray-600"><strong>Calibre:</strong> {deletingWeapon.caliber}</p>
                  )}
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
                    setDeletingWeapon(null);
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
                  {deleting ? 'Eliminando...' : 'Eliminar Arma'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
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
