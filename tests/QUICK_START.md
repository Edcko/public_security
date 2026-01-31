# 🧪 TESTS E2E - GUÍA RÁPIDA
## Sistema de Seguridad Pública

---

## ⚡ EJECUTAR EN PRODUCCIÓN (UN COMANDO)

```bash
# En el servidor
export BASE_URL="https://seguridad.gob.mx"
./scripts/run-tests.sh
```

---

## 📋 QUÉ PRUEBAN LOS TESTS

### 8 Archivos - ~50 Tests

1. **01-auth.spec.ts** - Login, logout, tokens, MFA
2. **02-personnel.spec.ts** - CRUD personal, búsquedas, historial
3. **03-vehicles.spec.ts** - CRUD vehículos
4. **04-weapons.spec.ts** - CRUD armamento
5. **05-shifts.spec.ts** - Turnos, check-in/out
6. **06-reports.spec.ts** - Generación, programación
7. **07-dashboard.spec.ts** - Dashboard, navegación
8. **08-critical-flows.spec.ts** - Flujos completos

---

## 🎯 REQUISITOS

### Producción (Servidor)
- ✅ Aplicación corriendo
- ✅ Node.js + npm instalados
- ✅ Usuario admin: `admin@seguridad.gob.mx` / `Admin123!`

### Desarrollo (Local)
- ✅ `npm install` ejecutado
- ✅ `npx playwright install chromium`
- ✅ `npm run dev` corriendo

---

## 🔧 COMANDOS ÚTILES

```bash
# Ejecutar todos los tests
./scripts/run-tests.sh

# Ejecutar archivo específico
npx playwright test 01-auth

# Modo interactivo (ver navegador)
npx playwright test --headed

# Ver reporte HTML
npx playwright show-report

# Modo debug
npx playwright test --debug
```

---

## 📊 RESULTADOS ESPERADOS

**Tiempo**: ~5-8 minutos
**Coverage**: ~85% del sistema
**Tests**: ~52 tests completos

---

## ✅ CHECKLIST PRODUCCIÓN

- [ ] App corriendo: `curl http://localhost:3000/api/health`
- [ ] Usuario existe: `admin@seguridad.gob.mx`
- [ ] Script ejecutable: `chmod +x scripts/run-tests.sh`
- [ ] Exportar URL: `export BASE_URL="https://dominio.gob.mx"`

---

**LISTO PARA PROBAR EN PRODUCCIÓN** 🚀
