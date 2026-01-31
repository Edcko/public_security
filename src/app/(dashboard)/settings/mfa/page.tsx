/**
 * MFA Settings Page
 *
 * Página de configuración de autenticación de dos factores
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MFASetupData {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

interface MFAStatus {
  mfaEnabled: boolean;
  mfaRequired: boolean;
  mfaMandatory: boolean;
}

export default function MFASettingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupStep, setSetupStep] = useState<'idle' | 'scan' | 'verify' | 'enabled'>('idle');
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/mfa', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.data);

        if (data.data.mfaEnabled) {
          setSetupStep('enabled');
        }
      }
    } catch (error) {
      console.error('Error fetching MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupMFA = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setSetupData({
          secret: data.data.secret,
          qrCodeDataUrl: data.data.qrCodeDataUrl,
          backupCodes: data.data.backupCodes,
        });
        setSetupStep('scan');
      } else {
        setError(data.error || 'Error al configurar MFA');
      }
    } catch (error) {
      setError('Error al configurar MFA');
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!token || token.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }

    try {
      setError(null);
      setVerifying(true);

      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/mfa', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setSetupStep('enabled');
        setSuccess('MFA habilitado correctamente. Guarda tus códigos de respaldo.');
        setStatus({ ...status!, mfaEnabled: true });
      } else {
        setError(data.error || 'Código inválido');
      }
    } catch (error) {
      setError('Error al verificar código');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!password) {
      setError('Ingresa tu contraseña para deshabilitar MFA');
      return;
    }

    try {
      setError(null);
      setDisabling(true);

      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/mfa', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setSetupStep('idle');
        setSuccess('MFA deshabilitado correctamente');
        setStatus({ ...status!, mfaEnabled: false });
        setPassword('');
      } else {
        setError(data.error || 'Error al deshabilitar MFA');
      }
    } catch (error) {
      setError('Error al deshabilitar MFA');
    } finally {
      setDisabling(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const text = setupData.backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mfa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Autenticación de Dos Factores</h1>
        <p className="text-gray-600 mt-2">
          Protege tu cuenta con autenticación de dos factores (MFA)
        </p>
      </div>

      {/* Status Card */}
      {status && (
        <div className={`bg-white rounded-lg shadow p-6 mb-6 border-l-4 ${
          status.mfaEnabled ? 'border-green-500' : 'border-yellow-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Estado de MFA: {status.mfaEnabled ? 'Habilitado' : 'Deshabilitado'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {status.mfaEnabled
                  ? 'Tu cuenta está protegida con autenticación de dos factores'
                  : 'Te recomendamos habilitar MFA para mayor seguridad'}
              </p>
            </div>
            <div className={`text-4xl ${status.mfaEnabled ? '✓' : '⚠️'}`} />
          </div>
        </div>
      )}

      {/* Setup Flow */}
      {setupStep === 'idle' && !status?.mfaEnabled && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Configurar MFA</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <p>Escanea el código QR con Google Authenticator, Authy, o cualquier app TOTP</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <p>Ingresa el código de 6 dígitos de la app para verificar</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <p>Guarda tus códigos de respaldo en un lugar seguro</p>
            </div>

            <button
              onClick={handleSetupMFA}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Comenzar Configuración
            </button>
          </div>
        </div>
      )}

      {setupStep === 'scan' && setupData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Escanea el Código QR</h3>

          <div className="flex flex-col items-center mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <img src={setupData.qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              O ingresa este código manualmente en tu app TOTP:
            </p>
            <code className="mt-2 px-4 py-2 bg-gray-100 rounded text-sm font-mono select-all">
              {setupData.secret}
            </code>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de 6 dígitos
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setSetupStep('idle')}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleVerifyAndEnable}
              disabled={verifying || token.length !== 6}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verificando...' : 'Verificar y Habilitar'}
            </button>
          </div>
        </div>
      )}

      {setupStep === 'enabled' && setupData && (
        <div className="space-y-6">
          {/* Backup Codes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Códigos de Respaldo</h3>
            <p className="text-sm text-yellow-800 mb-4">
              Guarda estos códigos en un lugar seguro. Solo se mostrarán una vez.
              Úsalos si pierdes acceso a tu app de autenticación.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {setupData.backupCodes.map((code, i) => (
                <code key={i} className="px-3 py-2 bg-white rounded border text-sm font-mono select-all">
                  {code}
                </code>
              ))}
            </div>
            <button
              onClick={handleDownloadBackupCodes}
              className="w-full px-4 py-2 bg-yellow-100 text-yellow-900 rounded-lg hover:bg-yellow-200 font-medium transition-colors"
            >
              📥 Descargar Códigos
            </button>
          </div>

          {/* Disable MFA */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Deshabilitar MFA</h3>
            <p className="text-sm text-gray-600 mb-4">
              Deshabilitar MFA reduce la seguridad de tu cuenta
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              onClick={handleDisableMFA}
              disabled={disabling || !password}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {disabling ? 'Deshabilitando...' : 'Deshabilitar MFA'}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
    </div>
  );
}
