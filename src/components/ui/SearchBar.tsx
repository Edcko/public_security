/**
 * Search Bar Component
 * Barra de búsqueda con filtros
 */

'use client';

import { useState } from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: FilterOption[];
}

interface SearchBarProps {
  onSearch: (query: string, filters: Record<string, string>) => void;
  filters?: FilterConfig[];
  placeholder?: string;
}

export function SearchBar({ onSearch, filters = [], placeholder = 'Buscar...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onSearch(query, newFilters);
  };

  const handleSearch = () => {
    onSearch(query, activeFilters);
  };

  const clearFilters = () => {
    setQuery('');
    setActiveFilters({});
    onSearch('', {});
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {filters.map((filter) => (
          <div key={filter.key}>
            {filter.type === 'select' ? (
              <select
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{filter.label}</option>
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : filter.type === 'date' ? (
              <input
                type="date"
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <input
                type="text"
                placeholder={filter.label}
                value={activeFilters[filter.key] || ''}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        ))}

        {/* Search Button */}
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Buscar
          </button>
          {(query || Object.keys(activeFilters).length > 0) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
