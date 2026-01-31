# Load Testing - Guía Segura

## ⚠️ ADVERTENCIA: NO ejecutar tests de 5,000 usuarios en tu máquina local

### Por qué es PELIGROSO:
- ❌ Sobrecarga tu CPU (al 100% por minutos)
- ❌ Agota tu memoria RAM
- ❌ Puede colapsar tu sistema operativo
- ❌ Sobrecalienta el hardware
- ❌ NO es representativo de producción (infraestructura diferente)

---

## ✅ Estrategia CORRECTA

### Fase 1: Test Local (Development) - SEGURO
- **Máximo**: 50 usuarios concurrentes
- **Duración**: 5 minutos
- **Objetivo**: Smoke test, verificar bugs básicos

### Fase 2: Test en Staging (Cloud/VPS) - REALISTA
- **Máximo**: 5,000 usuarios concurrentes
- **Infraestructura**: Servidor en la nube (DigitalOcean, AWS, Azure)
- **Objetivo**: Performance testing realista

---

## 🚀 Cómo Ejecutar Test Local (SEGURO)

### Paso 1: Instalar k6

```bash
# macOS
brew install k6

# Verificar instalación
k6 version
```

### Paso 2: Levantar el Sistema

```bash
# En una terminal
npm run dev
```

### Paso 3: Ejecutar Test Ligero

```bash
# En otra terminal
k6 run tests/load/light-load-test.js
```

### Resultados Esperados (Test Local):

```
✅健康 checks: 100% success rate
✅ Login attempts: 100% attempted
✅ Response time p95: < 1000ms
✅ Zero crashes
```

---

## 📊 Interpretación de Resultados Locales

### ✅ Buenos Resultados:
```
http_req_duration: p(95)=450ms
http_req_failed: rate=0%
```
→ Sistema funcionando correctamente en desarrollo

### ⚠️ Resultados con Preocupación:
```
http_req_duration: p(95)=2000ms
http_req_failed: rate=5%
```
→ Revisar código para optimizaciones antes de staging

### ❌ Malos Resultados:
```
http_req_duration: p(95)=5000ms
http_req_failed: rate=20%
```
→ Hay bugs serios que arreglar antes de continuar

---

## 🌩️ Cómo Ejecutar Test en Staging (Producción Real)

### Requisitos:
1. VPS o Cloud Server (DigitalOcean, AWS, Azure, GCP)
2. Mínimo: 2 CPU, 4GB RAM
3. PostgreSQL, Redis configurados
4. Sistema deployado en staging

### Script de Test Realista (5,000 usuarios):

```bash
# Ejecutar DESDE el servidor de staging
k6 run --stage 2m:100,5m:1000,10m:5000,5m:1000,2m:0 \
  tests/load/heavy-load-test.js
```

**NO ejecutar esto en tu máquina local**

---

## 📈 Test Scripts Disponibles

### `light-load-test.js` (LOCAL - SEGURO)
- Usuarios: 50 máximo
- Duración: 5 minutos
- Uso: Desarrollo local

### `heavy-load-test.js` (STAGING - PRODUCCIÓN)
- Usuarios: 5,000 máximo
- Duración: 30 minutos
- Uso: Servidor en la nube solamente

---

## 🔧 Solución de Problemas

### Problema: "Connection refused"
```bash
# Verificar que el servidor está corriendo
npm run dev

# Verificar puerto
lsof -i :3000
```

### Problema: "Too many open files"
```bash
# macOS: Aumentar límite de archivos
ulimit -n 4096
```

### Problema: "k6: command not found"
```bash
# Reinstalar k6
brew install k6

# O usar Docker
docker pull grafana/k6
docker run --rm -v "$(pwd):/loadtest" grafana/k6 run /loadtest/tests/load/light-load-test.js
```

---

## ✅ Checklist Antes de Test de Producción

- [ ] Test local (50 usuarios) pasado
- [ ] Bugs de desarrollo corregidos
- [ ] Sistema deployado en staging
- [ ] Monitoring configurado (Prometheus/Grafana)
- [ ] Logs centralizados
- [ ] Rollback plan preparado

---

## 📚 Recursos

- [k6 Documentation](https://k6.io/docs/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-execution/)

---

**¿Preguntas? Consulta la documentación oficial de k6** 🚀
