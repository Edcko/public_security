/**
 * Personnel Page
 * Gestión de personal policial
 */

'use client';

import { useState, useEffect } from 'react';
import { CURPInput } from '@/components/ui/CURPInput';

interface Officer {
  id: string;
  badgeNumber: string;
  curp?: string;
  firstName: string;
  lastName: string;
  rank: string;
  status: 'active' | 'suspended' | 'retired';
  corporationId: string;
  createdAt: string;
}

interface Corporation {
  id: string;
  name: string;
  type: 'federal' | 'estatal' | 'municipal';
}

interface CreateOfficerData {
  corporationId: string;
  badgeNumber: string;
  curp?: string;
  firstName: string;
  lastName: string;
  rank: 'cadete' | 'oficial' | 'sargento' | 'teniente' | 'comandante' | 'jefe';
  status: 'active' | 'suspended' | 'retired';
}

interface UpdateOfficerData {
  corporationId: string;
  firstName: string;
  lastName: string;
  rank: 'cadete' | 'oficial' | 'sargento' | 'teniente' | 'comandante' | 'jefe';
  status: 'active' | 'suspended' | 'retired';
}

export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState<Officer[]>([]);
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateOfficerData>({
    corporationId: '',
    firstName: '',
    lastName: '',
    rank: 'oficial',
    status: 'active',
  });
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingOfficer, setDeletingOfficer] = useState<Officer | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateOfficerData>({
    corporationId: '',
    badgeNumber: '',
    curp: '',
    firstName: '',
    lastName: '',
    rank: 'oficial',
    status: 'active',
  });

  // Cargar personal y corporaciones al montar
  useEffect(() => {
    fetchPersonnel();
    fetchCorporations();
  }, []);

  const fetchPersonnel = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/personnel', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPersonnel(data.data);
      }
    } catch (error) {
      console.error('Error fetching personnel:', error);
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
      const response = await fetch('/api/reports/pdf/personnel', {
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
      a.download = `personal-policial-${new Date().toISOString().split('T')[0]}.pdf`;
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
      const response = await fetch('/api/personnel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear oficial');
      }

      // Cerrar modal y recargar lista
      setShowCreateModal(false);
      fetchPersonnel();

      // Reset form
      setFormData({
        corporationId: '',
        badgeNumber: '',
        curp: '',
        firstName: '',
        lastName: '',
        rank: 'oficial',
        status: 'active',
      });
    } catch (error: any) {
      setCreateError(error instanceof Error ? error.message : 'Error al crear oficial');
    } finally {
      setCreating(false);
    }
  };

  const handleEditClick = (officer: Officer) => {
    setEditingOfficer(officer);
    setEditFormData({
      corporationId: officer.corporationId,
      firstName: officer.firstName,
      lastName: officer.lastName,
      rank: officer.rank as any,
      status: officer.status,
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;

    setUpdating(true);
    setEditError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/personnel/${editingOfficer.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar oficial');
      }

      // Cerrar modal y recargar lista
      setShowEditModal(false);
      setEditingOfficer(null);
      fetchPersonnel();
    } catch (error: any) {
      setEditError(error instanceof Error ? error.message : 'Error al actualizar oficial');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (officer: Officer) => {
    setDeletingOfficer(officer);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingOfficer) return;

    setDeleting(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/personnel/${deletingOfficer.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar oficial');
      }

      // Cerrar modal y recargar lista
      setShowDeleteModal(false);
      setDeletingOfficer(null);
      fetchPersonnel();
    } catch (error: any) {
      setDeleteError(error instanceof Error ? error.message : 'Error al eliminar oficial');
    } finally {
      setDeleting(false);
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Personal</h1>
          <p className="text-gray-600 mt-1">Administra el efectivo policial</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF || personnel.length === 0}
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
            + Nuevo Oficial
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, badge..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los rangos</option>
            <option value="comandante">Comandante</option>
            <option value="capitan">Capitán</option>
            <option value="teniente">Teniente</option>
            <option value="sargento">Sargento</option>
            <option value="oficial">Oficial</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
            <option value="retired">Retirado</option>
          </select>
          <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Buscar
          </button>
        </div>
      </div>

      {/* Personnel Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Badge
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rango
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CURP
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
            {personnel.map((person) => (
              <tr key={person.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {person.badgeNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {person.firstName.charAt(0)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {person.firstName} {person.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {person.rank}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    person.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : person.status === 'suspended'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {person.status === 'active' ? 'Activo' : person.status === 'suspended' ? 'Suspendido' : 'Retirado'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {person.curp || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {corporations.find(c => c.id === person.corporationId)?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => window.location.href = `/personnel/${person.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleEditClick(person)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(person)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {personnel.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No hay oficiales registrados
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
              <h2 className="text-2xl font-bold mb-4">Crear Nuevo Oficial</h2>

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
                  {/* Badge Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Badge *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.badgeNumber}
                      onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: GN-001"
                    />
                  </div>

                  {/* CURP */}
                  <div>
                    <CURPInput
                      value={formData.curp}
                      onChange={(value) => setFormData({ ...formData, curp: value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Juan"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Pérez García"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rank */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rango *
                    </label>
                    <select
                      required
                      value={formData.rank}
                      onChange={(e) => setFormData({ ...formData, rank: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cadete">Cadete</option>
                      <option value="oficial">Oficial</option>
                      <option value="sargento">Sargento</option>
                      <option value="teniente">Teniente</option>
                      <option value="comandante">Comandante</option>
                      <option value="jefe">Jefe</option>
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
                      <option value="active">Activo</option>
                      <option value="suspended">Suspendido</option>
                      <option value="retired">Retirado</option>
                    </select>
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
                    {creating ? 'Creando...' : 'Crear Oficial'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingOfficer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Editar Oficial</h2>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Badge Number - READ ONLY */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Badge
                    </label>
                    <input
                      type="text"
                      value={editingOfficer.badgeNumber}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">El número de badge no se puede modificar</p>
                  </div>

                  {/* CURP - READ ONLY */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CURP
                    </label>
                    <input
                      type="text"
                      value={editingOfficer.curp || 'No registrado'}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">El CURP no se puede modificar</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Juan"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Pérez García"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rank */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rango *
                    </label>
                    <select
                      required
                      value={editFormData.rank}
                      onChange={(e) => setEditFormData({ ...editFormData, rank: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cadete">Cadete</option>
                      <option value="oficial">Oficial</option>
                      <option value="sargento">Sargento</option>
                      <option value="teniente">Teniente</option>
                      <option value="comandante">Comandante</option>
                      <option value="jefe">Jefe</option>
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
                      <option value="active">Activo</option>
                      <option value="suspended">Suspendido</option>
                      <option value="retired">Retirado</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingOfficer(null);
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
      {showDeleteModal && deletingOfficer && (
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
                  Eliminar Oficial
                </h2>
              </div>

              {deleteError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {deleteError}
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  ¿Estás seguro de que deseas eliminar al oficial <strong>{deletingOfficer.firstName} {deletingOfficer.lastName}</strong>?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="text-gray-600"><strong>Badge:</strong> {deletingOfficer.badgeNumber}</p>
                  <p className="text-gray-600"><strong>Rango:</strong> {deletingOfficer.rank}</p>
                  {deletingOfficer.curp && (
                    <p className="text-gray-600"><strong>CURP:</strong> {deletingOfficer.curp}</p>
                  )}
                </div>
                <p className="text-red-600 text-sm mt-4">
                  Esta acción no se puede deshacer. Se eliminarán todos los registros asociados.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingOfficer(null);
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
                  {deleting ? 'Eliminando...' : 'Eliminar Oficial'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
