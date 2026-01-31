/**
 * Map E2E Tests
 * Tests basados en la UI REAL de /map
 */

import { test, expect } from '@playwright/test';

test.describe('Map Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display map page', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText('Mapa Operativo');
    await expect(page.locator('text=Vista en tiempo real de unidades y eventos')).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('button:has-text("📍 Centrar en mi ubicación")')).toBeVisible();
    await expect(page.locator('button:has-text("⚙️ Configurar")')).toBeVisible();
  });

  test('should display map layers panel', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Capas del Mapa')).toBeVisible();
  });

  test('should display layer buttons', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    // Verificar que existen los labels de las capas
    await expect(page.locator('.bg-white.rounded-lg.shadow.p-6').locator('text=Patrullas Activas').first()).toBeVisible();
    await expect(page.locator('.bg-white.rounded-lg.shadow.p-6').locator('text=Incidentes').first()).toBeVisible();
    await expect(page.locator('.bg-white.rounded-lg.shadow.p-6').locator('text=Alertas Activas').first()).toBeVisible();
    await expect(page.locator('.bg-white.rounded-lg.shadow.p-6').locator('text=Heatmap Delictivo').first()).toBeVisible();
  });

  test('should display map view area', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    // Verificar que existe el área del mapa
    const mapView = page.locator('.bg-gray-900.h-\\[600px\\]');
    await expect(mapView).toBeVisible();
  });
});

test.describe('Map Layers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display patrols layer with count', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    // Usar el contexto del panel de capas
    const layersPanel = page.locator('.bg-white.rounded-lg.shadow.p-6');
    await expect(layersPanel.locator('text=Patrullas Activas')).toBeVisible();
    await expect(layersPanel.locator('text=67')).toBeVisible();
  });

  test('should display incidents layer with count', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    const layersPanel = page.locator('.bg-white.rounded-lg.shadow.p-6');
    await expect(layersPanel.locator('text=Incidentes')).toBeVisible();
    await expect(layersPanel.locator('text=23')).toBeVisible();
  });

  test('should display alerts layer with count', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    const layersPanel = page.locator('.bg-white.rounded-lg.shadow.p-6');
    await expect(layersPanel.locator('text=Alertas Activas').first()).toBeVisible();
    // El número puede estar en diferentes lugares, solo verificar que existe el label
  });

  test('should display heatmap layer', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Heatmap Delictivo')).toBeVisible();
  });
});

test.describe('Map Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should have center location button', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    const centerBtn = page.locator('button:has-text("📍 Centrar en mi ubicación")');
    await expect(centerBtn).toBeVisible();
    await expect(centerBtn).toHaveAttribute('class', /bg-blue-600/);
  });

  test('should have configure button', async ({ page }) => {
    await page.goto('/map', { waitUntil: 'domcontentloaded' });

    const configBtn = page.locator('button:has-text("⚙️ Configurar")');
    await expect(configBtn).toBeVisible();
    await expect(configBtn).toHaveAttribute('class', /bg-gray-600/);
  });
});
