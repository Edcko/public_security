# 🔍 INVENTARIO COMPLETO - FUNCIONALIDADES FALTANTES

**Fecha**: 30 de Enero de 2026
**Estado del Proyecto**: 75% Completado
**Misión**: Completar todas las funcionalidades pendientes

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Completado | Faltante | Total | % Completado |
|-----------|-----------|----------|-------|--------------|
| **Frontend UI** | 7 páginas | CRUD ops | - | 70% |
| **Backend API** | 46+ endpoints | 10+ endpoints | 60+ | 77% |
| **Tests E2E** | 17 tests | 14 tests | 31 | 55% |
| **Integraciones** | 2/5 | 3/5 | 5 | 40% |
| **OVERALL** | - | - | - | **75%** |

---

## 🎨 FRONTEND - FUNCIONALIDADES FALTANTES

### 🔐 **AUTENTICACIÓN (2 items)**

#### 1. Password Reset Flow ⚠️ ALTA PRIORIDAD
- [ ] **UI**: Formulario de solicitar reset de contraseña
- [ ] **UI**: Formulario de nueva contraseña
- [ ] **UX**: Validación de token
- [ ] **Backend**: Guardar token en base de datos
- [ ] **Backend**: Enviar email con token
- [ ] **Backend**: Verificar token y expiración
- [ ] **Archivos**:
  - `src/app/api/auth/password-reset/route.ts` ❌ Incompleto
  - `src/modules/authentication/controllers/password-reset.controller.ts` ❌ Múltiples TODOs

**Estado**: Endpoint creado pero lógica NO implementada
**Estimado**: 4-6 horas

#### 2. MFA (Multi-Factor Authentication) 🔵 MEDIA PRIORIDAD
- [ ] **UI**: Pantalla de setup de MFA
- [ ] **UI**: Pantalla de escanear QR code
- [ ] **UI**: Input de código de verificación
- [ ] **Backend**: Guardar secreto TOTP en DB
- [ ] **Backend**: Generar backup codes
- [ ] **UX**: Mostrar backup codes
- [ ] **Archivos**:
  - `src/app/api/auth/mfa/route.ts` ✅ Existe
  - `src/modules/authentication/services/mfa.service.ts` ⚠️ TODOs pendientes

**Estado**: Parcialmente implementado
**Estimado**: 6-8 horas

---

### 📊 **DASHBOARD (2 items)**

#### 3. Date Range Filter 🟢 BAJA PRIORIDAD
- [ ] **UI**: DatePicker para rango de fechas
- [ ] **Backend**: Filtrar dashboard por fecha
- [ ] **UX**: Botón "Aplicar filtro"
- [ ] **Archivos**:
  - `src/app/(dashboard)/dashboard/page.tsx` ❌ No existe filtro
  - `src/modules/gis/controllers/mapping.controller.ts` ⚠️ TODO: Parse search params

**Estado**: NO implementado
**Estimado**: 3-4 horas

#### 4. Refresh Button 🟢 BAJA PRIORIDAD
- [ ] **UI**: Botón de refresh manual
- [ ] **UX**: Spinner mientras carga
- [ ] **Backend**: Re-fetch datos de dashboard
- [ ] **Archivos**:
  - `src/app/(dashboard)/dashboard/page.tsx` ❌ No existe botón

**Estado**: NO implementado
**Estimado**: 1-2 horas

---

### 👮 **PERSONNEL (6 items)** ⚠️ ALTA PRIORIDAD

#### 5. Create Officer ⚠️ ALTA PRIORIDAD
- [ ] **UI**: Modal/formulario de crear oficial
- [ ] **UI**: Campos: CURP, nombre, rango, corporación, etc.
- [ ] **UX**: Validación de CURP en tiempo real
- [ ] **Backend**: POST `/api/personnel` con validación completa
- [ ] **Archivos**:
  - `src/app/(dashboard)/personnel/page.tsx` ❌ Solo lista, sin create
  - `src/app/api/personnel/route.ts` ⚠️ Existe POST pero UI no lo usa

**Estado**: Backend existe, UI NO implementada
**Estimado**: 4-6 horas

#### 6. Edit Officer ⚠️ ALTA PRIORIDAD
- [ ] **UI**: Modal de editar oficial
- [ ] **UX**: Pre-popular con datos existentes
- [ ] **Backend**: PATCH `/api/personnel/[id]`
- [ ] **Archivos**:
  - `src/app/(dashboard)/personnel/page.tsx` ❌ No existe edit
  - `src/app/api/personnel/[id]/route.ts` ⚠️ Existe PATCH

**Estado**: Backend existe, UI NO implementada
**Estimado**: 3-4 horas

#### 7. Officer Details Page 🟡 MEDIA PRIORIDAD
- [ ] **UI**: Página de detalles del oficial
- [ ] **UI**: Mostrar foto, documentos, historial
- [ ] **Backend**: GET `/api/personnel/[id]` con datos completos
- [ ] **Archivos**:
  - `src/app/(dashboard)/personnel/[id]/page.tsx` ❌ No existe
  - `src/modules/personnel/controllers/personnel.advanced.controller.ts` ⚠️ TODO: Tabla personnel_history

**Estado**: NO implementado
**Estimado**: 4-5 horas

#### 8. Delete Officer ⚠️ ALTA PRIORIDAD
- [ ] **UI**: Botón de eliminar con confirmación
- [ ] **UX**: Modal "¿Estás seguro?"
- [ ] **Backend**: DELETE `/api/personnel/[id]`
- [ ] **Backend**: Soft delete (no borrar real, solo marcar inactivo)
- [ ] **Archivos**:
  - `src/app/(dashboard)/personnel/page.tsx` ❌ No existe delete
  - `src/app/api/personnel/[id]/route.ts` ⚠️ Existe DELETE

**Estado**: Backend existe, UI NO implementada
**Estimado**: 2-3 horas

#### 9. Personnel Statistics Cards 🟢 BAJA PRIORIDAD
- [ ] **UI**: Cards con estadísticas (total, por rango, activos, etc.)
- [ ] **Backend**: GET `/api/personnel/stats`
- [ ] **Archivos**:
  - `src/app/(dashboard)/personnel/page.tsx` ❌ No hay cards

**Estado**: NO implementado
**Estimado**: 2-3 horas

#### 10. Personnel Rank Chart 🟢 BAJA PRIORIDAD
- [ ] **UI**: Gráfico de personal por rango
- [ ] **UX**: Usar Chart.js o Recharts
- [ ] **Backend**: GET `/api/personnel/by-rank`
- [ ] **Archivos**:
  - `src/app/(dashboard)/personnel/page.tsx` ❌ No hay gráfico

**Estado**: NO implementado
**Estimado**: 3-4 horas

---

### 🚗 **VEHICLES (4 items)** ⚠️ ALTA PRIORIDAD

#### 11. Create Vehicle ⚠️ ALTA PRIORIDAD
- [ ] **UI**: Modal/formulario de crear vehículo
- [ ] **UX**: Campos: placa, tipo, estado, asignación
- [ ] **Backend**: POST `/api/vehicles` con validación
- [ ] **Archivos**:
  - `src/app/(dashboard)/vehicles/page.tsx` ❌ Solo lista estática, sin create
  - `src/app/api/vehicles/route.ts` ⚠️ Existe POST

**Estado**: Backend existe, UI NO implementada
**Estimado**: 3-4 horas

#### 12. Edit Vehicle ⚠️ ALTA PRIORIDAD
- [ ] **UI**: Modal de editar vehículo
- [ ] **Backend**: PATCH `/api/vehicles/[id]`
- [ ] **Archivos**:
  - `src/app/(dashboard)/vehicles/page.tsx` ❌ No existe edit
  - `src/app/api/vehicles/[id]/route.ts` ⚠️ Existe PATCH

**Estado**: Backend existe, UI NO implementada
**Estimado**: 2-3 horas

#### 13. Update Vehicle Status ⚠️ ALTA PRIORIDAD
- [ ] **UI**: Dropdown de estado (activo, taller, baja)
- [ ] **UX**: Cambio en línea sin modal
- [ ] **Backend**: PATCH `/api/vehicles/[id]` solo status
- [ ] **Archivos**:
  - `src/app/(dashboard)/vehicles/page.tsx` ❌ No existe

**Estado**: NO implementado
**Estimado**: 2-3 horas

#### 14. Delete Vehicle ⚠️ ALTA PRIORIDAD
- [ ] **UI**: Botón de eliminar con confirmación
- [ ] **Backend**: DELETE `/api/vehicles/[id]`
- [ ] **Archivos**:
  - `src/app/(dashboard)/vehicles/page.tsx` ❌ No existe delete
  - `src/app/api/vehicles/[id]/route.ts` ⚠️ Existe DELETE

**Estado**: Backend existe, UI NO implementada
**Estimado**: 2 horas

---

### 🔫 **WEAPONS/INVENTORY**
- [ ] **Estado**: Solo lectura, NO hay CRUD de armas
- [ ] **Backend**: POST/PATCH/DELETE `/api/weapons` ❌ NO implementados
- [ ] **UI**: `src/app/(dashboard)/inventory/page.tsx` ❌ Solo display
- **Estimado**: 6-8 horas para CRUD completo

---

### 🏢 **CORPORATIONS** (2 items)
- [x] **Lista de corporaciones** ✅ Implementada
- [ ] **Edit corporations** ⚠️ TODO en `src/app/corporations/page.tsx:234`
- [ ] **Delete corporations** ⚠️ TODO en `src/app/corporations/page.tsx:248`

---

## 🔧 BACKEND - FUNCIONALIDADES FALTANTES

### 📧 **EMAIL & NOTIFICACIONES**

#### 15. Email Service 🔵 MEDIA PRIORIDAD
- [ ] **Configurar** SMTP (Gmail, Sendgrid, AWS SES)
- [ ] **Implementar** Nodemailer o similar
- [ ] **Templates**: HTML para emails de:
  - [ ] Password reset
  - [ ] MFA activation
  - [ ] Reportas generados
- [ ] **Archivos**:
  - `src/modules/reports/controllers/pdf.controller.ts` ⚠️ TODO: Implementar nodemailer
  - `src/modules/authentication/controllers/password-reset.controller.ts` ⚠️ TODO: Enviar email

**Estado**: NO implementado
**Estimado**: 4-6 horas

---

### 📊 **REPORTS**

#### 16. PDF Generation 🔵 MEDIA PRIORIDAD
- [ ] **Backend**: Usar jsPDF o PDFKit
- [ ] **UX**: Descargar PDF de reportes
- [ ] **Archivos**:
  - `src/app/api/reports/pdf/route.ts` ❌ Placeholder
  - `src/modules/reports/controllers/pdf.controller.ts` ⚠️ TODO

**Estado**: NO implementado
**Estimado**: 6-8 horas

#### 17. Email Reports 🔵 MEDIA PRIORIDAD
- [ ] **UI**: Checkbox "Enviar por email"
- [ ] **Backend**: Cola de jobs para enviar reportes
- [ ] **UX**: Notificar cuando reporte está listo
- [ ] **Archivos**:
  - `src/app/api/reports/email/route.ts` ❌ Placeholder
  - `src/app/api/reports/schedule/route.ts` ❌ Placeholder

**Estado**: NO implementado
**Estimado**: 8-10 horas

#### 18. Scheduled Reports 🟢 BAJA PRIORIDAD
- [ ] **UI**: Configurar reportes recurrentes (diario, semanal, mensual)
- [ ] **Backend**: Cron jobs para generar reportes
- [ ] **UX**: Lista de reportes programados
- [ ] **Archivos**:
  - `src/app/api/reports/schedule/route.ts` ❌ NO implementado

**Estado**: NO implementado
**Estimado**: 6-8 horas

---

### 🗺️ **GIS & MAPAS**

#### 19. Incidentes en Mapa 🔵 MEDIA PRIORIDAD
- [ ] **Backend**: Obtener incidentes de DB real
- [ ] **UX**: Mostrar incidentes como marcadores en mapa
- [ ] **Archivos**:
  - `src/modules/gis/controllers/mapping.controller.ts` ⚠️ TODO: Obtener incidentes
  - `src/modules/gis/services/mapping.service.ts` ⚠️ TODO: Consultar incidentes

**Estado**: Datos mockeados
**Estimado**: 4-5 horas

#### 20. Heatmap Delictivo 🟢 BAJA PRIORIDAD
- [ ] **Backend**: Algoritmo de clustering (DBSCAN)
- [ ] **UX**: Superponer heatmap en mapa
- [ ] **Archivos**:
  - `src/modules/gis/services/mapping.service.ts` ⚠️ TODO: Implementar clustering

**Estado**: NO implementado
**Estimado**: 8-10 horas

---

### 🔐 **BIOMETRICS**

#### 21. Facial Recognition 🔵 MEDIA PRIORIDAD
- [ ] **Integración**: SAFR o Rekognition AWS
- [ ] **Backend**: Endpoint para comparar fotos
- [ ] **UX**: Subir foto y comparar con DB
- [ ] **Archivos**:
  - `src/app/api/biometrics/face/route.ts` ❌ Placeholder
  - `src/modules/integrations/biometrics/biometric.service.ts` ⚠️ TODO: Llamar a API real

**Estado**: NO implementado
**Estimado**: 12-16 horas

---

### 📈 **ANALYTICS & SNSP**

#### 22. Estadísticas Delictivas 🔵 MEDIA PRIORIDAD
- [ ] **Backend**: Tabla de estadísticas
- [ ] **Backend**: Query de tendencias
- [ ] **UX**: Dashboard de analytics
- [ ] **Archivos**:
  - `src/modules/reports/services/snsp.service.ts` ⚠️ 3 TODOs

**Estado**: NO implementado
**Estimado**: 10-12 horas

---

### 🔄 **SHIFTS & ATTENDANCE**

#### 23. Payroll Calculation 🔵 MEDIA PRIORIDAD
- [ ] **Backend**: Calcular nómina por horas trabajadas
- [ ] **Backend**: Bonificaciones, horas extra, etc.
- [ ] **UX**: Reporte de nómina
- [ ] **Archivos**:
  - `src/modules/shifts/controllers/payroll.controller.ts` ⚠️ TODO: Implementar cálculo

**Estado**: NO implementado
**Estimado**: 12-15 horas

---

### 📡 **REALTIME & WEBSOCKETS**

#### 24. Dashboard Realtime Updates ⚠️ ALTA PRIORIDAD
- [ ] **Backend**: WebSocket para actualizaciones en vivo
- [ ] **UX**: Dashboard se actualiza solo cuando hay cambios
- [ ] **Archivos**:
  - `src/app/api/realtime/dashboard/route.ts` ⚠️ Existe pero NO implementado
  - `src/modules/realtime/` ❌ Servicios NO implementados

**Estado**: Parcialmente implementado
**Estimado**: 10-12 horas

---

### 📱 **PWA & OFFLINE**

#### 25. Offline Mode Completo 🔵 MEDIA PRIORIDAD
- [ ] **Service Worker**: Estrategia de cache completo
- [ ] **UX**: Indicador visual de modo offline
- [ ] **Backend**: Background sync cuando vuelve online
- [ ] **Archivos**:
  - `public/sw.js` ⚠️ Básico, sin sync completo

**Estado**: Básico implementado
**Estimado**: 6-8 horas

---

## 🔬 INTEGRACIONES EXTERNAS

### 🏛️ **SNSP (Sistema Nacional de Seguridad Pública)**

#### 26. Import de Datos SNSP ⚠️ ALTA PRIORIDAD
- [ ] **Backend**: CSV parser para importar datos
- [ ] **Backend**: Mapeo de campos a schema local
- [ ] **UX**: UI para subir archivo CSV
- [ ] **Archivos**:
  - `src/app/api/snsp/import/route.ts` ❌ NO implementado
  - `src/modules/reports/services/snsp.service.ts` ⚠️ TODOs

**Estado**: NO implementado
**Estimado**: 8-10 horas

#### 27. Estadísticas SNSP 🔵 MEDIA PRIORIDAD
- [ ] **Backend**: API de estadísticas oficiales
- [ ] **Backend**: Comparativa con datos locales
- [ ] **UX**: Dashboard de comparativa SNSP
- [ ] **Archivos**:
  - `src/app/api/snsp/stats/route.ts` ❌ NO implementado
  - `src/app/api/snsp/trends/route.ts` ❌ NO implementado

**Estado**: NO implementado
**Estimado**: 10-12 horas

---

### 🗺️ **GIS EXTERNO**

#### 28. Geocoding Service 🔵 MEDIA PRIORIDAD
- [ ] **Integración**: Google Maps API o Mapbox
- [ ] **Backend**: Geocode dirección → coords
- [ ] **Backend**: Reverse geocode coords → dirección
- [ ] **Archivos**:
  - `src/app/api/gis/geocode/route.ts` ❌ NO implementado
  - `src/app/api/gis/reverse-geocode/route.ts` ❌ NO implementado

**Estado**: NO implementado
**Estimado**: 6-8 horas

#### 29. Routing Engine 🔵 MEDIA PRIORIDAD
- [ ] **Integración**: OSRM, GraphHopper o Google Directions
- [ ] **Backend**: Calcular ruta óptima entre 2 puntos
- [ ] **UX**: Mostrar ruta en mapa
- [ ] **Archivos**:
  - `src/app/api/gis/route/route.ts` ❌ NO implementado

**Estado**: NO implementado
**Estimado**: 8-10 horas

---

### 🎫 **CURP VALIDATION**

#### 30. Validación CURP Completa ⚠️ ALTA PRIORIDAD
- [ ] **Backend**: API RENAPO oficial
- [ ] **Backend**: Validar checksum, formato, existencia
- [ ] **UX**: Validación en tiempo real en formularios
- [ ] **Archivos**:
  - `src/app/api/biometrics/curp/route.ts` ❌ NO implementado
  - `src/modules/integrations/curp/` ❌ NO implementado

**Estado**: NO implementado
**Estimado**: 4-6 horas

---

## 🗄️ BASE DE DATOS

### 📊 **TABLAS FALTANTES**

#### 31. Personnel History Table 🔵 MEDIA PRIORIDAD
- [ ] **Schema**: Tabla de historial de cambios
- [ ] **Backend**: Trigger para loggear cambios
- [ ] **UX**: Ver historial de oficial
- [ ] **Archivos**:
  - `src/modules/personnel/controllers/personnel.advanced.controller.ts` ⚠️ TODO

**Estado**: NO implementada
**Estimado**: 4-5 horas

#### 32. Password Reset Tokens 🔵 MEDIA PRIORIDAD
- [ ] **Schema**: Tabla para tokens de reset
- [ ] **Backend**: Crear, verificar, expirar tokens
- [ ] **Archivos**:
  - `src/modules/authentication/controllers/password-reset.controller.ts` ⚠️ Múltiples TODOs

**Estado**: NO implementada
**Estimado**: 3-4 horas

#### 33. MFA Secrets Table 🔵 MEDIA PRIORIDAD
- [ ] **Schema**: Tabla para secretos TOTP
- [ ] **Backend**: Guardar secretos, backup codes
- [ ] **Archivos**:
  - `src/modules/authentication/services/mfa.service.ts` ⚠️ TODO: Guardar en DB

**Estado**: NO implementada
**Estimado**: 3-4 horas

---

## 🔧 INFRAESTRUCTURA & DEVOPS

### 🐳 **DOCKER & DEPLOYMENT**

#### 34. Docker Production Build 🔵 MEDIA PRIORIDAD
- [ ] **Dockerfile.prod**: Optimizado para producción
- [ ] **Multi-stage build**: Reducir tamaño de imagen
- [ ] **nginx**: Configuración de reverse proxy
- [ ] **Archivos**:
  - `Dockerfile.prod` ✅ Existe pero NO probado
  - `nginx.conf` ✅ Existe pero NO probado

**Estado**: Creado pero NO probado
**Estimado**: 4-6 horas (testing + ajustes)

#### 35. CI/CD Pipeline Completo 🔵 MEDIA PRIORIDAD
- [ ] **GitHub Actions**: Lint, test, build automático
- [ ] **Auto-deploy**: Deploy en push a main
- [ ] **Rollback**: Automático si tests fallan
- [ ] **Archivos**:
  - `.github/workflows/` ⚠️ Parcialmente implementado

**Estado**: Parcialmente implementado
**Estimado**: 8-10 horas

#### 36. Monitoring & Alerting 🔵 MEDIA PRIORIDAD
- [ ] **Prometheus**: Métricas del sistema
- [ ] **Grafana**: Dashboards de monitoreo
- [ ] **Alertas**: Email/Slack cuando algo falla
- [ ] **Archivos**:
  - No existen configs de monitoring

**Estado**: NO implementado
**Estimado**: 12-16 horas

---

### 🧪 **TESTING**

#### 37. Unit Tests Coverage 🟢 BAJA PRIORIDAD
- [ ] **Estado**: 60% coverage actual
- [ ] **Meta**: 80% coverage mínimo
- [ ] **Tests faltantes**: WebSocket service, algunos controllers
- [ ] **Estimado**: 8-10 horas

#### 38. Integration Tests 🟢 BAJA PRIORIDAD
- [ ] **Crear**: Tests de integración API reales
- [ ] **Mocking**: Usar DB de prueba en Docker
- [ ] **Estimado**: 12-16 horas

---

## 📋 PRIORIZACIÓN - POR DÓNDE EMPESAR

### 🔴 **FASE 1 - CRÍTICO (1-2 semanas)**
**Impacto inmediato en funcionalidad principal**

1. **CRUD Personnel** (items 5, 6, 8) - 10-13 horas
2. **CRUD Vehicles** (items 11, 12, 13, 14) - 9-12 horas
3. **CRUD Corporations Edit/Delete** - 3-4 horas
4. **Password Reset** (item 1) - 4-6 horas
5. **Service Worker Offline** (item 25) - 6-8 horas

**Total Fase 1**: ~32-43 horas (1-1.5 semanas)

---

### 🟡 **FASE 2 - IMPORTANTE (2-3 semanas)**
**Funcionalidad clave pero no crítica**

1. **Email Service** (item 15) - 4-6 horas
2. **PDF Reports** (item 16) - 6-8 horas
3. **Personnel Details** (item 7) - 4-5 horas
4. **Realtime Dashboard** (item 24) - 10-12 horas
5. **CURP Validation** (item 30) - 4-6 horas

**Total Fase 2**: ~28-37 horas (1 semana)

---

### 🟢 **FASE 3 - DESEABLE (3-4 semanas)**
**Nice to have, pero no bloquea**

1. **MFA** (item 2) - 6-8 horas
2. **SNSP Import** (item 26) - 8-10 horas
3. **Dashboard Date Filter** (item 3) - 3-4 horas
4. **Personnel Statistics** (item 9) - 2-3 horas
5. **Payroll Calculation** (item 23) - 12-15 horas

**Total Fase 3**: ~31-40 horas (1 semana)

---

### 🔵 **FASE 4 - MEJORAS (4-6 semanas)**
**Optimizaciones y features avanzadas**

1. **Facial Recognition** (item 21) - 12-16 horas
2. **Heatmap Delictivo** (item 20) - 8-10 horas
3. **Geocoding/Routing** (items 28, 29) - 14-18 horas
4. **SNSP Stats** (item 27) - 10-12 horas
5. **Monitoring** (item 36) - 12-16 horas

**Total Fase 4**: ~56-72 horas (2-3 semanas)

---

## 📊 MÉTRICA FINAL

| Fase | Horas | Semanas | Items | Prioridad |
|------|-------|---------|-------|----------|
| **Fase 1** | 32-43h | 1-1.5 | 5 items | 🔴 ALTA |
| **Fase 2** | 28-37h | 1 | 5 items | 🟡 MEDIA |
| **Fase 3** | 31-40h | 1 | 5 items | 🟢 BAJA |
| **Fase 4** | 56-72h | 2-3 | 5 items | 🔵 OPT |
| **TOTAL** | **147-192h** | **6-8 semanas** | **20 items** | - |

---

## 🎯 RECOMENDACIÓN

**Empezar por FASE 1** - Completa el CRUD básico de las entidades principales:
- Personnel (crear, editar, eliminar)
- Vehicles (crear, editar, eliminar, actualizar estado)
- Corporations (editar, eliminar)
- Password reset
- Offline mode

Esto hará el sistema **90% funcional** para uso diario real.

---

**¿Por dónde querés empezar?** 🚀
