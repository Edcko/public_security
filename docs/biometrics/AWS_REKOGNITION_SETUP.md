# AWS Rekognition Setup Guide

## Configuración de Credenciales AWS

Para habilitar el reconocimiento facial con AWS Rekognition, necesitas configurar las siguientes variables de entorno:

### Variables de Entorno Requeridas

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
AWS_REGION=us-east-1  # o tu región preferida
```

## Pasos de Configuración

### 1. Crear Cuenta AWS

Si no tienes una cuenta de AWS, regístrate en: https://aws.amazon.com/

### 2. Crear Usuario IAM

1. Ve a la consola de IAM: https://console.aws.amazon.com/iam/
2. Click en "Users" → "Add users"
3. Nombre de usuario: `rekognition-user`
4. Selecciona "Access key - Programmatic access"
5. Click en "Next: Permissions"

### 3. Asignar Permisos

Crea una política inline o adjunta una política existente con los siguientes permisos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:CompareFaces",
        "rekognition:DetectFaces",
        "rekognition:IndexFaces",
        "rekognition:SearchFacesByImage",
        "rekognition:CreateCollection",
        "rekognition:DeleteCollection",
        "rekognition:ListCollections"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4. Obtener Credenciales

1. Después de crear el usuario, AWS mostrará las credenciales (Access Key ID y Secret Access Key)
2. **IMPORTANTE**: Copia y guarda estas credenciales en un lugar seguro. No volverás a ver el Secret Access Key.

### 5. Configurar Variables de Entorno

Agrega las credenciales a tu archivo `.env.local`:

```bash
# Archivo: .env.local

AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
```

⚠️ **NUNCA** commitees el archivo `.env.local` a git. Ya está en `.gitignore`.

## Crear una Colección de Rekognition

Opcionalmente, puedes crear una colección para almacenar rostros indexados:

### Usando AWS CLI:

```bash
aws rekognition create-collection \
  --collection-id security-personnel \
  --region us-east-1
```

### Usando el SDK (desde tu app):

```typescript
import { RekognitionClient, CreateCollectionCommand } from '@aws-sdk/client-rekognition';

const client = new RekognitionClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

await client.send(new CreateCollectionCommand({
  CollectionId: 'security-personnel',
}));
```

## Costos de AWS Rekognition

AWS Rekognition tiene un modelo de precios de pago por uso:

- **CompareFaces**: $0.001 por 1,000 comparaciones
- **IndexFaces**: $0.001 por 1,000 imágenes indexadas
- **DetectFaces**: $0.001 por 1,000 imágenes procesadas
- **SearchFacesByImage**: $0.001 por 1,000 búsquedas

Consulta los precios actualizados en: https://aws.amazon.com/rekognition/pricing/

## Modo Desarrollo (Mock)

Si no configuras las credenciales de AWS, el sistema funcionará en modo mock:
- Las operaciones de comparación devolverán resultados simulados
- Útil para desarrollo y testing sin incurrir en costos

## Testing

Una vez configurado, puedes probar el servicio desde la UI:
1. Ve a `/biometrics`
2. Prueba la pestaña "Comparar Rostros"
3. Sube dos imágenes para comparar
4. Revisa el resultado de similitud

## Troubleshooting

### Error: "AWS credentials not configured"
- Verifica que `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` estén en `.env.local`
- Reinicia el servidor de desarrollo

### Error: "No se detectó ningún rostro"
- Asegúrate de que las imágenes contengan rostros claramente visibles
- Usa imágenes de buena calidad y resolución
- Evita imágenes borrosas o con mala iluminación

### Error: "Access Denied"
- Verifica que el usuario IAM tenga los permisos necesarios
- Revisa que la clave de acceso esté activa

## Seguridad

- Nunca expongas tus credenciales de AWS en el frontend
- Usa variables de entorno para credenciales sensibles
- Considera usar AWS Secrets Manager en producción
- Rotar las credenciales periódicamente

## Recursos Adicionales

- [Documentación oficial de AWS Rekognition](https://docs.aws.amazon.com/rekognition/)
- [SDK de JavaScript para AWS Rekognition](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/rekognition/)
- [Best Practices for Rekognition](https://docs.aws.amazon.com/rekognition/latest/dg/best-practices.html)
