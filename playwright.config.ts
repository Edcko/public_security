import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration - Optimizado para Producción
 *
 * Solo Chromium (más ligero en recursos)
 * Tests completos de E2E basados en funcionalidad real del sistema
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Ejecutar en serie para evitar conflictos de datos
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Un solo worker para usar menos recursos
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000, // 30 segundos para acciones (más tiempo para operaciones reales)
    navigationTimeout: 60000, // 60 segundos para navegación
  },

  // SOLO Chromium - el navegador más ligero y rápido
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Reducir recursos para producción
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-sandbox',
          ],
        },
      },
    },
  ],

  // NO iniciar servidor web automáticamente en producción
  // Asumimos que el servidor ya está corriendo
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Timeout global para tests
  timeout: 120 * 1000, // 2 minutos por test
});
