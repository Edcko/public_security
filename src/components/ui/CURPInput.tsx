/**
 * CURP Input Component
 *
 * Componente de input para CURP con validación en tiempo real
 */

'use client';

import { useState, useEffect } from 'react';

interface CURPInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface CURPInfo {
  birthDate: Date;
  gender: 'H' | 'M';
  stateName: string;
}

export function CURPInput({
  value,
  onChange,
  required = false,
  placeholder = '18 caracteres',
  disabled = false,
  className = '',
}: CURPInputProps) {
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [curpInfo, setCurpInfo] = useState<CURPInfo | null>(null);

  // Validar CURP cuando cambia el valor
  useEffect(() => {
    if (value.length === 0) {
      setIsValid(null);
      setError('');
      setCurpInfo(null);
      return;
    }

    // Solo validar cuando tenga 18 caracteres
    if (value.length !== 18) {
      setIsValid(null);
      setError('');
      setCurpInfo(null);
      return;
    }

    const validate = async () => {
      setValidating(true);
      try {
        const response = await fetch('/api/utils/validate-curp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ curp: value }),
        });

        const data = await response.json();

        if (data.success) {
          setIsValid(true);
          setError('');
          setCurpInfo(data.data as CURPInfo);
        } else {
          setIsValid(false);
          setError(data.error || 'CURP inválido');
          setCurpInfo(null);
        }
      } catch (err) {
        setIsValid(false);
        setError('Error al validar CURP');
        setCurpInfo(null);
      } finally {
        setValidating(false);
      }
    };

    const timeoutId = setTimeout(validate, 500); // Debounce de 500ms
    return () => clearTimeout(timeoutId);
  }, [value]);

  const formatBirthDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-2">
      <label htmlFor="curp" className="block text-sm font-medium text-gray-700">
        CURP (Clave Única de Registro de Población)
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          id="curp"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          disabled={disabled}
          maxLength={18}
          placeholder={placeholder}
          className={`
            block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none
            ${isValid === true ? 'border-green-500 bg-green-50' : ''}
            ${isValid === false ? 'border-red-500 bg-red-50' : ''}
            ${isValid === null ? 'border-gray-300 focus:border-blue-500' : ''}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          style={{ fontFamily: 'monospace' }}
        />

        {validating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}

        {isValid === true && !validating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {isValid === false && !validating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {value.length > 0 && value.length < 18 && (
        <p className="text-sm text-gray-500">{value.length}/18 caracteres</p>
      )}

      {/* Información extraída del CURP */}
      {curpInfo && isValid === true && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-medium text-blue-800 mb-2">Información del CURP:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="font-medium">Fecha de nacimiento:</span>
              <span className="ml-1 text-blue-700"> {formatBirthDate(curpInfo.birthDate)}</span>
            </div>
            <div>
              <span className="font-medium">Género:</span>
              <span className="ml-1 text-blue-700">
                {curpInfo.gender === 'H' ? 'Hombre' : 'Mujer'}
              </span>
            </div>
            <div>
              <span className="font-medium">Estado:</span>
              <span className="ml-1 text-blue-700"> {curpInfo.stateName}</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        La CURP se valida automáticamente. Debe tener 18 caracteres con el formato correcto.
      </p>
    </div>
  );
}
