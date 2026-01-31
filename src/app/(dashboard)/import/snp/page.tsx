/**
 * SNSP Import Page
 *
 * Importar datos del Sistema Nacional de Seguridad Pública
 */

'use client';

import { useState, useRef } from 'react';

interface ColumnMapping {
  snsField: string;
  localField: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  message: string;
}

export default function SNSPImportPage() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importType, setImportType] = useState<'personnel' | 'vehicles' | 'weapons'>('personnel');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapeo de campos SNSP a locales
  const fieldMappings = {
    personnel: [
      { snsField: 'numero_placa', localField: 'badgeNumber', label: 'Número de Placa' },
      { snsField: 'curp', localField: 'curp', label: 'CURP' },
      { snsField: 'nombre', localField: 'firstName', label: 'Nombre' },
      { snsField: 'apellido_paterno', localField: 'lastName', label: 'Apellido Paterno' },
      { snsField: 'apellido_materno', localField: 'lastName', label: 'Apellido Materno' },
      { snsField: 'rango', localField: 'rank', label: 'Rango' },
      { snsField: 'corporacion', localField: 'corporationId', label: 'Corporación' },
      { snsField: 'fecha_ingreso', localField: 'createdAt', label: 'Fecha de Ingreso' },
    ],
    vehicles: [
      { snsField: 'numero_placa', localField: 'plateNumber', label: 'Número de Placa' },
      { snsField: 'tipo_vehiculo', localField: 'vehicleType', label: 'Tipo de Vehículo' },
      { snsField: 'marca', localField: 'make', label: 'Marca' },
      { snsField: 'modelo', localField: 'model', label: 'Modelo' },
      { snsField: 'anio', localField: 'year', label: 'Año' },
      { snsField: 'corporacion', localField: 'corporationId', label: 'Corporación' },
    ],
    weapons: [
      { snsField: 'numero_serie', localField: 'serialNumber', label: 'Número de Serie' },
      { snsField: 'tipo_arma', localField: 'weaponType', label: 'Tipo de Arma' },
      { snsField: 'marca', localField: 'make', label: 'Marca' },
      { snsField: 'modelo', localField: 'model', label: 'Modelo' },
      { snsField: 'calibre', localField: 'caliber', label: 'Calibre' },
      { snsField: 'corporacion', localField: 'corporationId', label: 'Corporación' },
    ],
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar que sea CSV o XML
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xml')) {
      setError('Solo se permiten archivos CSV o XML');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Leer archivo para previsualización
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;

      if (selectedFile.name.endsWith('.csv')) {
        // Parsear CSV
        const lines = content.split('\n').slice(0, 10); // Primeras 10 filas
        const data = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
        setPreview(data);

        // Auto-mapear columnas
        autoMapColumns(data[0] || []);
      } else {
        // Parsear XML (básico)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        // TODO: Parsear XML correctamente
        setError('Parsing XML aún no implementado. Usa CSV por ahora.');
      }
    };
    reader.readAsText(selectedFile);
  };

  const autoMapColumns = (headers: string[]) => {
    const mappings = fieldMappings[importType];
    const autoMappings: ColumnMapping[] = [];

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().replace(/ /g, '_');
      const mapping = mappings.find(m => m.snsField === normalizedHeader);
      if (mapping) {
        autoMappings.push({
          snsField: header,
          localField: mapping.localField,
        });
      }
    });

    setColumnMapping(autoMappings);
  };

  const handleProceedToMapping = () => {
    if (!file) return;
    setStep('mapping');
  };

  const handleStartImport = async () => {
    if (!file) return;

    setStep('importing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', importType);
      formData.append('mapping', JSON.stringify(columnMapping));

      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/import/snp', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar');
      }

      // Simular progreso
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setImportResult(data.data);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar');
      setStep('upload');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setColumnMapping([]);
    setImportProgress(0);
    setImportResult(null);
    setError(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Importar Datos del SNSP</h1>
        <p className="text-gray-600 mt-2">
          Importa personal, vehículos y armamento desde el Sistema Nacional de Seguridad Pública
        </p>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Paso 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">1. Seleccionar Archivo</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Importación
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setImportType('personnel')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  importType === 'personnel'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👮 Personal
              </button>
              <button
                onClick={() => setImportType('vehicles')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  importType === 'vehicles'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🚗 Vehículos
              </button>
              <button
                onClick={() => setImportType('weapons')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  importType === 'weapons'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔫 Armamento
              </button>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Arrastra un archivo CSV o XML aquí, o haz clic para seleccionar
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xml"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Seleccionar Archivo
            </button>
          </div>

          {file && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                📄 {file.name}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Vista Previa (primeras 10 filas)</h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview[0]?.map((header, i) => (
                        <th key={i} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.slice(1, 6).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-2 text-sm text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleProceedToMapping}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Continuar →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paso 2: Mapping */}
      {step === 'mapping' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">2. Mapeo de Campos</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Campo SNSP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Campo Local
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fieldMappings[importType].map((field, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-sm text-gray-900">{field.label}</td>
                    <td className="px-4 py-3">
                      <select
                        value={columnMapping.find(m => m.localField === field.localField)?.snsField || ''}
                        onChange={(e) => {
                          const newMapping = [...columnMapping];
                          const existingIndex = newMapping.findIndex(m => m.localField === field.localField);
                          if (existingIndex >= 0) {
                            newMapping[existingIndex] = {
                              snsField: e.target.value,
                              localField: field.localField,
                            };
                          } else {
                            newMapping.push({
                              snsField: e.target.value,
                              localField: field.localField,
                            });
                          }
                          setColumnMapping(newMapping);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Ignorar --</option>
                        {preview[0]?.map((header, j) => (
                          <option key={j} value={header}>{header}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep('upload')}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              ← Volver
            </button>
            <button
              onClick={handleStartImport}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Iniciar Importación →
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Importing */}
      {step === 'importing' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Importando Datos...</h3>
            <p className="text-gray-600 mb-4">Por favor espera, esto puede tomar varios minutos</p>

            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{importProgress}% completado</p>
          </div>
        </div>
      )}

      {/* Paso 4: Complete */}
      {step === 'complete' && importResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">¡Importación Completada!</h3>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-600">Importados</p>
                <p className="text-2xl font-bold text-green-900">{importResult.imported}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm font-medium text-red-600">Errores</p>
                <p className="text-2xl font-bold text-red-900">{importResult.errors}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-900">
                  {importResult.imported + importResult.errors}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Importar Otro Archivo
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
