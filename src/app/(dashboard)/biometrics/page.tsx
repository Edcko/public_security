/**
 * Biometrics Page
 *
 * Panel de reconocimiento facial usando AWS Rekognition
 */

'use client';

import { useState, useRef } from 'react';

interface FaceDetection {
  facesDetected: number;
  confidence: number;
  emotions?: string[];
  ageRange?: { low: number; high: number };
  gender?: { value: string; confidence: number };
  smile?: { value: boolean; confidence: number };
  error?: string;
}

interface FaceComparison {
  match: boolean;
  confidence: number;
  similarity: number;
  error?: string;
}

interface SearchResult {
  match: boolean;
  confidence: number;
  similarity: number;
  faceId?: string;
  externalImageId?: string;
  error?: string;
}

export default function BiometricsPage() {
  const [activeTab, setActiveTab] = useState<
    'compare' | 'detect' | 'enroll' | 'search'
  >('compare');

  // Estado para comparación
  const [sourceImage, setSourceImage] = useState<string>('');
  const [targetImage, setTargetImage] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<FaceComparison | null>(null);
  const [comparing, setComparing] = useState(false);

  // Estado para detección
  const [detectImage, setDetectImage] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState<FaceDetection | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Estado para enrolamiento
  const [enrollImage, setEnrollImage] = useState<string>('');
  const [collectionId, setCollectionId] = useState<string>('security-personnel');
  const [externalImageId, setExternalImageId] = useState<string>('');
  const [enrollResult, setEnrollResult] = useState<any>(null);
  const [enrolling, setEnrolling] = useState(false);

  // Estado para búsqueda
  const [searchImage, setSearchImage] = useState<string>('');
  const [searchCollectionId, setSearchCollectionId] = useState<string>('security-personnel');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const fileInputRef3 = useRef<HTMLInputElement>(null);
  const fileInputRef4 = useRef<HTMLInputElement>(null);

  // Convertir archivo a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Comparar rostros
  const handleCompare = async () => {
    if (!sourceImage || !targetImage) {
      alert('Por favor selecciona ambas imágenes');
      return;
    }

    setComparing(true);
    setComparisonResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/biometrics/rekognition/compare', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceImage,
          targetImage,
          similarityThreshold: 80,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setComparisonResult(data.data);
      } else {
        alert(data.error || 'Error al comparar rostros');
      }
    } catch (error: any) {
      console.error('Error comparing faces:', error);
      alert('Error al comparar rostros');
    } finally {
      setComparing(false);
    }
  };

  // Detectar rostros
  const handleDetect = async () => {
    if (!detectImage) {
      alert('Por favor selecciona una imagen');
      return;
    }

    setDetecting(true);
    setDetectionResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/biometrics/rekognition/detect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: detectImage,
          attributes: 'ALL',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDetectionResult(data.data);
      } else {
        alert(data.error || 'Error al detectar rostros');
      }
    } catch (error: any) {
      console.error('Error detecting faces:', error);
      alert('Error al detectar rostros');
    } finally {
      setDetecting(false);
    }
  };

  // Enrolar rostro
  const handleEnroll = async () => {
    if (!enrollImage || !externalImageId) {
      alert('Por favor selecciona una imagen y proporciona un ID externo');
      return;
    }

    setEnrolling(true);
    setEnrollResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/biometrics/rekognition/index', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: enrollImage,
          collectionId,
          externalImageId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEnrollResult(data.data);
        alert('Rostro registrado exitosamente');
      } else {
        alert(data.error || 'Error al registrar rostro');
      }
    } catch (error: any) {
      console.error('Error enrolling face:', error);
      alert('Error al registrar rostro');
    } finally {
      setEnrolling(false);
    }
  };

  // Buscar rostros
  const handleSearch = async () => {
    if (!searchImage) {
      alert('Por favor selecciona una imagen');
      return;
    }

    setSearching(true);
    setSearchResults([]);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/biometrics/rekognition/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: searchImage,
          collectionId: searchCollectionId,
          faceMatchThreshold: 80,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
      } else {
        alert(data.error || 'Error al buscar rostros');
      }
    } catch (error: any) {
      console.error('Error searching faces:', error);
      alert('Error al buscar rostros');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reconocimiento Facial</h1>
        <p className="text-gray-600 mt-1">
          AWS Rekognition - Biometría avanzada
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('compare')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'compare'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Comparar Rostros
          </button>
          <button
            onClick={() => setActiveTab('detect')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'detect'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detectar Rostros
          </button>
          <button
            onClick={() => setActiveTab('enroll')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'enroll'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Registrar Rostro
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Buscar Coincidencias
          </button>
        </nav>
      </div>

      {/* Tab: Comparar Rostros */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Comparar Dos Imágenes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Imagen Fuente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen Fuente
                </label>
                {sourceImage ? (
                  <div className="relative">
                    <img
                      src={sourceImage}
                      alt="Source"
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      onClick={() => setSourceImage('')}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-500">Click para subir imagen</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const base64 = await fileToBase64(file);
                          setSourceImage(base64);
                        }
                      }}
                    />
                  </label>
                )}
                {!sourceImage && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Seleccionar Imagen
                  </button>
                )}
              </div>

              {/* Imagen Objetivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen Objetivo
                </label>
                {targetImage ? (
                  <div className="relative">
                    <img
                      src={targetImage}
                      alt="Target"
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      onClick={() => setTargetImage('')}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-500">Click para subir imagen</p>
                    </div>
                    <input
                      ref={fileInputRef2}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const base64 = await fileToBase64(file);
                          setTargetImage(base64);
                        }
                      }}
                    />
                  </label>
                )}
                {!targetImage && (
                  <button
                    onClick={() => fileInputRef2.current?.click()}
                    className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Seleccionar Imagen
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCompare}
                disabled={comparing || !sourceImage || !targetImage}
                className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {comparing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Comparando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Comparar Rostros
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Resultado Comparación */}
          {comparisonResult && (
            <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
              comparisonResult.match ? 'border-green-500' : 'border-red-500'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Resultado</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">¿Coinciden?</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    comparisonResult.match ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparisonResult.match ? 'SÍ' : 'NO'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Similitud</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">
                    {comparisonResult.similarity.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Confianza</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600">
                    {comparisonResult.confidence.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Detectar Rostros */}
      {activeTab === 'detect' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Detectar Rostros en Imagen</h3>
            <div className="max-w-2xl mx-auto">
              {detectImage ? (
                <div className="relative">
                  <img
                    src={detectImage}
                    alt="Detect"
                    className="w-full h-96 object-contain rounded-lg border-2 border-gray-300 bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      setDetectImage('');
                      setDetectionResult(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-96 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">Click para subir imagen</p>
                  </div>
                  <input
                    ref={fileInputRef3}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const base64 = await fileToBase64(file);
                        setDetectImage(base64);
                      }
                    }}
                  />
                </label>
              )}
              {!detectImage && (
                <button
                  onClick={() => fileInputRef3.current?.click()}
                  className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Seleccionar Imagen
                </button>
              )}

              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleDetect}
                  disabled={detecting || !detectImage}
                  className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {detecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Detectando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Detectar Rostros
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Resultado Detección */}
          {detectionResult && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Información Detectada</h3>
              {detectionResult.error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {detectionResult.error}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-600">Rostros Detectados</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{detectionResult.facesDetected}</p>
                  </div>
                  {detectionResult.gender && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-purple-600">Género</p>
                      <p className="text-xl font-bold text-purple-900 mt-1">
                        {detectionResult.gender.value === 'Male' ? 'Masculino' : 'Femenino'}
                      </p>
                      <p className="text-sm text-purple-700">
                        {detectionResult.gender.confidence.toFixed(1)}% confianza
                      </p>
                    </div>
                  )}
                  {detectionResult.ageRange && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-600">Rango de Edad</p>
                      <p className="text-xl font-bold text-green-900 mt-1">
                        {detectionResult.ageRange.low} - {detectionResult.ageRange.high} años
                      </p>
                    </div>
                  )}
                  {detectionResult.emotions && detectionResult.emotions.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-yellow-600">Emociones</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {detectionResult.emotions.map((emotion, i) => (
                          <span key={i} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-sm">
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {detectionResult.smile && (
                    <div className="bg-pink-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-pink-600">Sonriendo</p>
                      <p className="text-xl font-bold text-pink-900 mt-1">
                        {detectionResult.smile.value ? 'Sí' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Registrar Rostro */}
      {activeTab === 'enroll' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Registrar Rostro en Colección</h3>
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID de Colección
                </label>
                <input
                  type="text"
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="security-personnel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Externo (ej: ID de personal)
                </label>
                <input
                  type="text"
                  value={externalImageId}
                  onChange={(e) => setExternalImageId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="12345"
                />
              </div>

              {enrollImage ? (
                <div className="relative">
                  <img
                    src={enrollImage}
                    alt="Enroll"
                    className="w-full h-96 object-contain rounded-lg border-2 border-gray-300 bg-gray-50"
                  />
                  <button
                    onClick={() => setEnrollImage('')}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-96 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">Click para subir imagen</p>
                  </div>
                  <input
                    ref={fileInputRef4}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const base64 = await fileToBase64(file);
                        setEnrollImage(base64);
                      }
                    }}
                  />
                </label>
              )}

              {!enrollImage && (
                <button
                  onClick={() => fileInputRef4.current?.click()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Seleccionar Imagen
                </button>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleEnroll}
                  disabled={enrolling || !enrollImage || !externalImageId}
                  className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {enrolling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Registrar Rostro
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Resultado Enrolamiento */}
          {enrollResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">✓ Registro Exitoso</h3>
              <div className="text-sm text-green-700">
                <p>Face ID: <span className="font-mono">{enrollResult.faceId}</span></p>
                <p>Confianza: {enrollResult.confidence.toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Buscar Coincidencias */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Buscar Coincidencias en Colección</h3>
            <div className="max-w-2xl mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID de Colección
                </label>
                <input
                  type="text"
                  value={searchCollectionId}
                  onChange={(e) => setSearchCollectionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="security-personnel"
                />
              </div>

              {searchImage ? (
                <div className="relative">
                  <img
                    src={searchImage}
                    alt="Search"
                    className="w-full h-96 object-contain rounded-lg border-2 border-gray-300 bg-gray-50"
                  />
                  <button
                    onClick={() => {
                      setSearchImage('');
                      setSearchResults([]);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-96 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">Click para subir imagen</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const base64 = await fileToBase64(file);
                        setSearchImage(base64);
                      }
                    }}
                  />
                </label>
              )}

              {!searchImage && (
                <button
                  onClick={() => document.querySelector('input[type="file"]')?.click()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Seleccionar Imagen
                </button>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchImage}
                  className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {searching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Buscar Coincidencias
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Resultados Búsqueda */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                Coincidencias Encontradas ({searchResults.length})
              </h3>
              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 ${
                      result.similarity > 90
                        ? 'border-green-500 bg-green-50'
                        : result.similarity > 80
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Coincidencia</p>
                        <p className="text-xl font-bold text-gray-900">
                          {result.similarity.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Confianza</p>
                        <p className="text-xl font-bold text-gray-900">
                          {result.confidence.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Face ID</p>
                        <p className="text-sm font-mono text-gray-900 truncate">
                          {result.faceId || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ID Externo</p>
                        <p className="text-sm font-medium text-gray-900">
                          {result.externalImageId || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && !searching && searchImage && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">No se encontraron coincidencias en la colección</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
