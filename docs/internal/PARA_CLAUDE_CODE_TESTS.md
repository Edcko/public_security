# 🤖 Hola Claude Code! Tests E2E para producción
## Sistema de Seguridad Pública

---

## ⚡ EJECUTAR TESTS (UN COMANDO)

```bash
# Si la app está en http://localhost:3000
./scripts/run-tests.sh

# Si la app está en dominio (producción)
export BASE_URL="https://seguridad.gob.mx"
./scripts/run-tests.sh
```

---

## 📋 QUÉ HACEN LOS TESTS

**52 tests** que prueban:
- ✅ Login, logout, tokens JWT
- ✅ CRUD completo (Personnel, Vehicles, Weapons)
- ✅ Turnos y Check-in/Check-out
- ✅ Generación de reportes
- ✅ Dashboard y navegación
- ✅ Flujos completos multi-modulo

---

## 🎯 REQUISITOS

- ✅ App corriendo (verificar con `curl http://localhost:3000/api/health`)
- ✅ Node.js + npm instalados
- ✅ Usuario admin existe: `admin@seguridad.gob.mx` / `Admin123!`

---

## 📊 RESULTADOS ESPERADOS

**Tiempo**: 5-8 minutos
**Coverage**: ~85% del sistema
**Navegador**: Chromium (el más ligero)

**Reporte**: `npx playwright show-report`

---

## 🔧 SI ALGO FALLA

```bash
# Ver logs
docker-compose logs app

# Verificar health check
curl http://localhost:3000/api/health

# Re-ejecutar tests
./scripts/run-tests.sh
```

---

## 📚 MÁS INFO

- `tests/README.md` - Guía completa
- `tests/QUICK_START.md` - Guía rápida
- `RESUMEN_TESTS.md` - Resumen técnico

---

**LISTO PARA PROBAR** 🚀
