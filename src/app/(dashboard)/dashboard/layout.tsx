/**
 * Dashboard Layout
 * Layout principal para todas las páginas autenticadas
 */

import { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">🚔 Seguridad Pública</h1>
          <p className="text-sm text-gray-400 mt-1">Sistema Nacional de Gestión</p>
        </div>

        <nav className="mt-6">
          <ul className="space-y-2 px-4">
            <li>
              <a
                href="/dashboard"
                className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                📊 Dashboard
              </a>
            </li>
            <li>
              <a
                href="/personnel"
                className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                👮 Personal
              </a>
            </li>
            <li>
              <a
                href="/inventory"
                className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                🔫 Inventario
              </a>
            </li>
            <li>
              <a
                href="/vehicles"
                className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                🚗 Vehículos
              </a>
            </li>
            <li>
              <a
                href="/shifts"
                className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                🕐 Turnos
              </a>
            </li>
            <li>
              <a
                href="/reports"
                className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                📈 Reportes
              </a>
            </li>
            <li>
              <a
                href="/map"
                className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                🗺️ Mapa
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Panel de Control
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Corporación: Guardia Nacional
              </span>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
