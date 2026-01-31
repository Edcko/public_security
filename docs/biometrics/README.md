# Biometrics Integration Guide

## 🔬 Overview

Integración biométrica completa para el Sistema Nacional de Gestión Policial:
- Validación de CURP (API externa)
- Reconocimiento facial (SAFR o similar)
- Huellas digitales (Llave MX o similar)

## 📋 Índice

1. [CURP Validation](#curp-validation)
2. [Facial Recognition](#facial-recognition)
3. [Fingerprint Integration](#fingerprint-integration)
4. [Storage de Datos Biométricos](#storage-de-datos-biométricos)

---

## 🪪 CURP Validation

### 1. Integración con API Externa

#### Opciones de API:

1. **Verificamex** (https://verificamex.com)
   - Costo: ~$2-5 MXN por consulta
   - API REST
   - Respuesta en segundos

2. **Tu Identidad** (https://tuidentidad.com)
   - Costo: ~$3-6 MXN por consulta
   - API REST + GraphQL
   - Datos adicionales (INE, RFC)

3. **API RENAPO** (Gobierno)
   - Solo para instituciones gubernamentales
   - Gratuita
   - Proceso de registro complejo

### 2. Configuración de Verificamex

```bash
# .env.local
VERIFICAMEX_API_KEY=tu_api_key_aqui
VERIFICAMEX_API_URL=https://api.verificamex.com/api/v1
```

### 3. Servicio de CURP (Ya implementado)

```typescript
// src/modules/integrations/curp/curp.service.ts

// Ya existe este archivo con:
// - validateCURPSyntax()
// - validateCURPChecksum()
// - validateCURPWithAPI()
// - fullCURPValidation()
// - findPersonByCURP()
```

### 4. API Endpoint

```typescript
// src/app/api/integrations/curp/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fullCURPValidation } from '@/modules/integrations/curp/curp.service';

export async function POST(request: NextRequest) {
  try {
    const { curp } = await request.json();

    const validation = await fullCURPValidation(curp);

    return NextResponse.json(validation);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to validate CURP' },
      { status: 500 }
    );
  }
}
```

---

## 👤 Facial Recognition

### 1. Opciones de Software

1. **SAFR (RealNetworks)**
   - Costo: ~$500-2000 USD/año
   - Reconocimiento facial en tiempo real
   - API REST + SDK
   - Alta precisión (>99%)

2. **AWS Rekognition**
   - Costo: Pay-per-use ($1 por 1000 búsquedas)
   - Fácil integración
   - Almacenamiento de face templates

3. **Azure Face API**
   - Costo: Pay-per-use
   - Datos adicionales (edad, género, emociones)

4. **Face++ (Megvii)**
   - Costo: Gratuito hasta 10k llamadas/mes
   - API China, alta precisión

### 2. Configuración de SAFR

```bash
# .env.local
SAFR_API_KEY=tu_safr_api_key
SAFR_API_URL=https://api.safr.realnetworks.com/v1
SAFR_PROJECT_ID=tu_project_id
```

### 3. Servicio de Reconocimiento Facial

```typescript
// src/modules/biometrics/services/facial.service.ts

interface FaceEnrollmentResponse {
  success: boolean;
  faceId?: string;
  error?: string;
}

interface FaceVerificationResponse {
  success: boolean;
  match: boolean;
  confidence: number;
  error?: string;
}

export class FacialRecognitionService {
  /**
   * Enrolar rostro de una persona
   */
  static async enrollFace(personId: string, imageBase64: string): Promise<FaceEnrollmentResponse> {
    const API_KEY = process.env.SAFR_API_KEY;
    const API_URL = process.env.SAFR_API_URL;

    if (!API_KEY) {
      return { success: false, error: 'SAFR API key not configured' };
    }

    try {
      const response = await fetch(`${API_URL}/faces/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          personId,
          image: imageBase64,
          projectId: process.env.SAFR_PROJECT_ID,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          faceId: data.faceId,
        };
      }

      return {
        success: false,
        error: data.error || 'Failed to enroll face',
      };
    } catch (error: any) {
      console.error('Face enrollment error:', error);
      return {
        success: false,
        error: 'Failed to connect to SAFR API',
      };
    }
  }

  /**
   * Verificar rostro contra base de datos
   */
  static async verifyFace(imageBase64: string): Promise<FaceVerificationResponse> {
    const API_KEY = process.env.SAFR_API_KEY;
    const API_URL = process.env.SAFR_API_URL;

    if (!API_KEY) {
      return { success: false, match: false, confidence: 0, error: 'SAFR API key not configured' };
    }

    try {
      const response = await fetch(`${API_URL}/faces/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          image: imageBase64,
          projectId: process.env.SAFR_PROJECT_ID,
          threshold: 0.75, // 75% confidence
        }),
      });

      const data = await response.json();

      return {
        success: true,
        match: data.match || false,
        confidence: data.confidence || 0,
      };
    } catch (error: any) {
      console.error('Face verification error:', error);
      return {
        success: false,
        match: false,
        confidence: 0,
        error: 'Failed to verify face',
      };
    }
  }

  /**
   * Identificar rostro (buscar en toda la base de datos)
   */
  static async identifyFace(imageBase64: string): Promise<{
    success: boolean;
    matches: Array<{ personId: string; confidence: number }>;
    error?: string;
  }> {
    const API_KEY = process.env.SAFR_API_KEY;
    const API_URL = process.env.SAFR_API_URL;

    try {
      const response = await fetch(`${API_URL}/faces/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          image: imageBase64,
          projectId: process.env.SAFR_PROJECT_ID,
          maxResults: 5,
          threshold: 0.70,
        }),
      });

      const data = await response.json();

      return {
        success: true,
        matches: data.matches || [],
      };
    } catch (error: any) {
      return {
        success: false,
        matches: [],
        error: 'Failed to identify face',
      };
    }
  }

  /**
   * Eliminar rostro de la base de datos
   */
  static async deleteFace(faceId: string): Promise<{ success: boolean; error?: string }> {
    const API_KEY = process.env.SAFR_API_KEY;
    const API_URL = process.env.SAFR_API_URL;

    try {
      await fetch(`${API_URL}/faces/${faceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to delete face',
      };
    }
  }
}
```

### 4. Componente de Captura de Foto

```typescript
// src/components/biometrics/PhotoCapture.tsx
'use client';

import { useState, useRef } from 'react';

export function PhotoCapture({
  onCapture,
}: {
  onCapture: (imageBase64: string) => void;
}) {
  const [image, setImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setImage(imageData);
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="space-y-4">
      <video
        ref={videoRef}
        className="w-full rounded-lg"
        autoPlay
        playsInline
        muted
      />

      <canvas ref={canvasRef} className="hidden" />

      {image && (
        <div>
          <img src={image} alt="Captured" className="w-full rounded-lg" />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={startCamera}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Iniciar Cámara
        </button>
        <button
          onClick={capturePhoto}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Capturar Foto
        </button>
      </div>
    </div>
  );
}
```

---

## 🖐️ Fingerprint Integration

### 1. Opciones de Software

1. **Llave MX (Gobierno Mexicano)**
   - Gratuito para instituciones
   - AFIS completo
   - Integración con RENAPO

2. **Neurotechnology MegaMatcher**
   - Costo: ~$5000 USD
   - AFIS completo
   - SDK multiplataforma

3. **VeriFinger**
   - Costo: ~$2000 USD
   - Alta precisión
   - Fácil integración

### 2. Configuración de Llave MX

```bash
# .env.local
LLAVEMX_API_URL=https://api.llavemx.gob.mx/v1
LLAVEMX_API_KEY=tu_api_key
LLAVEMX_CERT_PATH=/path/to/certificate.pem
```

### 3. Servicio de Huellas Digitales

```typescript
// src/modules/biometrics/services/fingerprint.service.ts

interface FingerprintEnrollmentResponse {
  success: boolean;
  templateId?: string;
  error?: string;
}

interface FingerprintVerificationResponse {
  success: boolean;
  match: boolean;
  score: number;
  error?: string;
}

export class FingerprintService {
  /**
   * Enrolar huella digital
   */
  static async enrollFingerprint(
    personId: string,
    fingerprintTemplate: string
  ): Promise<FingerprintEnrollmentResponse> {
    const API_KEY = process.env.LLAVEMX_API_KEY;

    if (!API_KEY) {
      return { success: false, error: 'Llave MX not configured' };
    }

    try {
      const response = await fetch(`${process.env.LLAVEMX_API_URL}/fingerprints/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          personId,
          template: fingerprintTemplate,
          fingers: ['thumb_left', 'index_left', 'thumb_right', 'index_right'],
        }),
      });

      const data = await response.json();

      return {
        success: true,
        templateId: data.templateId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Failed to enroll fingerprint',
      };
    }
  }

  /**
   * Verificar huella digital
   */
  static async verifyFingerprint(
    personId: string,
    fingerprintTemplate: string
  ): Promise<FingerprintVerificationResponse> {
    try {
      const response = await fetch(`${process.env.LLAVEMX_API_URL}/fingerprints/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LLAVEMX_API_KEY}`,
        },
        body: JSON.stringify({
          personId,
          template: fingerprintTemplate,
        }),
      });

      const data = await response.json();

      return {
        success: true,
        match: data.match,
        score: data.score,
      };
    } catch (error: any) {
      return {
        success: false,
        match: false,
        score: 0,
        error: 'Failed to verify fingerprint',
      };
    }
  }
}
```

### 4. Escáner de Huellas Digitales

```typescript
// src/components/biometrics/FingerprintScanner.tsx
'use client';

import { useState } from 'react';

export function FingerprintScanner({
  onScan,
}: {
  onScan: (template: string) => void;
}) {
  const [scanning, setScanning] = useState(false);

  const scanFingerprint = async () => {
    setScanning(true);

    try {
      // Integración con escáner de huellas (requiere dispositivo hardware)
      // Usar WebUSB o WebSerial si el escáner lo soporta

      // Simulación para ejemplo
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockTemplate = 'fingerprint_template_base64_encoded';

      onScan(mockTemplate);
    } catch (error) {
      console.error('Error scanning fingerprint:', error);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          Coloca tu dedo en el escáner
        </p>
      </div>

      <button
        onClick={scanFingerprint}
        disabled={scanning}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {scanning ? 'Escaneando...' : 'Escanear Huella'}
      </button>
    </div>
  );
}
```

---

## 💾 Storage de Datos Biométricos

### Tabla de Datos Biométricos

```sql
-- migrations/0006_biometrics.sql

CREATE TABLE IF NOT EXISTS biometric_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES personnel(id),
    corporation_id UUID NOT NULL REFERENCES corporations(id),

    -- Datos faciales
    face_id VARCHAR(255),
    face_template TEXT,
    face_photo_url TEXT,

    -- Huellas digitales
    fingerprint_template TEXT,
    fingerprint_id VARCHAR(255),

    -- Metadatos
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    enrolled_by UUID REFERENCES users(id),
    verification_count INTEGER DEFAULT 0,
    last_verified_at TIMESTAMPTZ,

    -- Seguridad
    encryption_key_id VARCHAR(255),
    checksum VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_biometric_person ON biometric_data (person_id);
CREATE INDEX idx_biometric_face ON biometric_data (face_id);
CREATE INDEX idx_biometric_fingerprint ON biometric_data (fingerprint_id);
```

---

## ✅ Checklist de Implementación

### CURP Validation
- [ ] Contratar servicio de API (Verificamex, etc.)
- [ ] Configurar API key
- [ ] Probar validación de CURP
- [ ] Integrar con formulario de personal

### Facial Recognition
- [ ] Contratar servicio (SAFR, AWS, etc.)
- [ ] Configurar API key
- [ ] Implementar componente de captura de foto
- [ ] Enrolar rostros de personal existente
- [ ] Implementar verificación en tiempo real

### Fingerprint
- [ ] Adquirir escáner de huellas
- [ ] Configurar software de captura
- [ ] Integrar con API de Llave MX (opcional)
- [ ] Enrolar huellas de personal

### Security & Privacy
- [ ] Encriptar datos biométricos en reposo
- [ ] Encriptar datos biométricos en tránsito
- [ ] Implementar consentimiento
- [ ] Cumplir con LFPDPPP
- [ ] Auditar acceso a datos biométricos

---

**Sistema biométrico completo!** 🔐✅
