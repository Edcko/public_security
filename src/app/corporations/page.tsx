'use client';

/**
 * Corporations Management Page
 *
 * Admin UI para gestionar corporaciones policiales
 */

import { useState, useEffect } from 'react';

interface Corporation {
  id: string;
  name: string;
  type: 'federal' | 'estatal' | 'municipal';
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children?: Corporation[];
}

interface CorporationStats {
  total: number;
  federal: number;
  estatal: number;
  municipal: number;
  withParent: number;
  topLevel: number;
}

interface UpdateCorporationData {
  name: string;
  type: 'federal' | 'estatal' | 'municipal';
  parentId: string | null;
}

export default function CorporationsPage() {
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [stats, setStats] = useState<CorporationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'federal' | 'estatal' | 'municipal'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [_selectedCorporation, _setSelectedCorporation] = useState<Corporation | null>(null);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCorporation, setEditingCorporation] = useState<Corporation | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateCorporationData>({
    name: '',
    type: 'municipal',
    parentId: null,
  });
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCorporation, setDeletingCorporation] = useState<Corporation | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCorporations();
    fetchStats();
  }, []);

  const fetchCorporations = async () => {
    try {
      const response = await fetch('/api/corporations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setCorporations(data.data);
      }
    } catch (error) {
      console.error('Error fetching corporations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/corporations/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleEditClick = (corporation: Corporation) => {
    setEditingCorporation(corporation);
    setEditFormData({
      name: corporation.name,
      type: corporation.type,
      parentId: corporation.parentId,
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCorporation) return;

    setUpdating(true);
    setEditError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/corporations/${editingCorporation.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar corporación');
      }

      // Cerrar modal y recargar
      setShowEditModal(false);
      setEditingCorporation(null);
      fetchCorporations();
      fetchStats();
    } catch (error: any) {
      setEditError(error instanceof Error ? error.message : 'Error al actualizar corporación');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (corporation: Corporation) => {
    setDeletingCorporation(corporation);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingCorporation) return;

    setDeleting(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/corporations/${deletingCorporation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar corporación');
      }

      // Cerrar modal y recargar
      setShowDeleteModal(false);
      setDeletingCorporation(null);
      fetchCorporations();
      fetchStats();
    } catch (error: any) {
      setDeleteError(error instanceof Error ? error.message : 'Error al eliminar corporación');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCorporations = corporations.filter((corp) => {
    const matchesSearch = corp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || corp.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'federal':
        return 'bg-blue-100 text-blue-800';
      case 'estatal':
        return 'bg-green-100 text-green-800';
      case 'municipal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'federal':
        return 'Federal';
      case 'estatal':
        return 'Estatal';
      case 'municipal':
        return 'Municipal';
      default:
        return type;
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
          <h1 className="text-3xl font-bold text-gray-900">Corporaciones</h1>
          <p className="text-gray-600 mt-1">Gestión de corporaciones policiales</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Nueva Corporación
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.federal}</div>
            <div className="text-sm text-gray-600 mt-1">Federal</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">{stats.estatal}</div>
            <div className="text-sm text-gray-600 mt-1">Estatal</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">{stats.municipal}</div>
            <div className="text-sm text-gray-600 mt-1">Municipal</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-600">{stats.topLevel}</div>
            <div className="text-sm text-gray-600 mt-1">Nivel Superior</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="federal">Federal</option>
              <option value="estatal">Estatal</option>
              <option value="municipal">Municipal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Corporations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Padre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha de Creación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCorporations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron corporaciones
                </td>
              </tr>
            ) : (
              filteredCorporations.map((corporation) => (
                <tr key={corporation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{corporation.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(corporation.type)}`}>
                      {getTypeLabel(corporation.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {corporation.parentId ? 'Sí' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(corporation.createdAt).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => _setSelectedCorporation(corporation)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleEditClick(corporation)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(corporation)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Nueva Corporación</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                type: formData.get('type') as 'federal' | 'estatal' | 'municipal',
                parentId: formData.get('parentId') as string || null,
              };

              try {
                const response = await fetch('/api/corporations', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                  },
                  body: JSON.stringify(data),
                });
                if (response.ok) {
                  setShowCreateModal(false);
                  fetchCorporations();
                  fetchStats();
                }
              } catch (error) {
                console.error('Error creating corporation:', error);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    name="type"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="federal">Federal</option>
                    <option value="estatal">Estatal</option>
                    <option value="municipal">Municipal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corporación Padre (opcional)
                  </label>
                  <select
                    name="parentId"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Ninguna</option>
                    {corporations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Crear
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCorporation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Editar Corporación</h2>

            {editError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <select
                  required
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="federal">Federal</option>
                  <option value="estatal">Estatal</option>
                  <option value="municipal">Municipal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Corporación Padre (opcional)
                </label>
                <select
                  value={editFormData.parentId || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, parentId: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Ninguna</option>
                  {corporations
                    .filter(c => c.id !== editingCorporation.id) // No permitir seleccionarse a sí mismo
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCorporation(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {updating ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingCorporation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
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
                Eliminar Corporación
              </h2>
            </div>

            {deleteError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {deleteError}
              </div>
            )}

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que deseas eliminar la corporación <strong>{deletingCorporation.name}</strong>?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="text-gray-600"><strong>Tipo:</strong> {getTypeLabel(deletingCorporation.type)}</p>
                <p className="text-gray-600"><strong>Padre:</strong> {deletingCorporation.parentId ? 'Sí' : 'No'}</p>
                <p className="text-gray-600"><strong>Creada:</strong> {new Date(deletingCorporation.createdAt).toLocaleDateString('es-MX')}</p>
              </div>
              <p className="text-red-600 text-sm mt-4">
                Esta acción no se puede deshacer. Todos los datos asociados (personal, vehículos, etc.) también se eliminarán.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCorporation(null);
                }}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? 'Eliminando...' : 'Eliminar Corporación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
