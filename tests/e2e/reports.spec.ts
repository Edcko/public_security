/**
 * Reports Generation E2E Tests
 * Tests basados en la UI REAL de /reports
 */

import { test, expect } from '@playwright/test';

test.describe('Reports Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display reports dashboard', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText('Reportes y Analytics');
    await expect(page.locator('text=Generación y exportación de reportes')).toBeVisible();
  });

  test('should display report generator form', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    // Verificar selector de tipo de reporte
    await expect(page.locator('text=Tipo de Reporte')).toBeVisible();
    const reportSelect = page.locator('select').first();
    await expect(reportSelect).toBeVisible();

    // Verificar opciones de tipo de reporte (en DOM, no necesariamente visibles)
    await expect(page.locator('option[value="incidents"]')).toHaveCount(1);
    await expect(page.locator('option[value="arrests"]')).toHaveCount(1);
    await expect(page.locator('option[value="personnel"]')).toHaveCount(1);
    await expect(page.locator('option[value="inventory"]')).toHaveCount(1);
  });

  test('should display format selector', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Formato de Exportación')).toBeVisible();
    const formatSelect = page.locator('select').nth(1);
    await expect(formatSelect).toBeVisible();

    // Verificar opciones de formato (en DOM)
    await expect(page.locator('option[value="pdf"]')).toHaveCount(1);
    await expect(page.locator('option[value="excel"]')).toHaveCount(1);
    await expect(page.locator('option[value="csv"]')).toHaveCount(1);
    await expect(page.locator('option[value="json"]')).toHaveCount(1);
  });

  test('should display date range inputs', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Rango de Fechas')).toBeVisible();
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);
  });

  test('should have generate button', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('button:has-text("Generar Reporte")')).toBeVisible();
  });

  test('should have schedule recurring report button', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('button:has-text("Agendar Reporte Recurrente")')).toBeVisible();
  });

  test('should display recent reports section', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Reportes Recientes')).toBeVisible();
    // Las tarjetas de reportes se renderizan dinámicamente
    const reportCards = page.locator('.border.rounded-lg.p-4');
    const count = await reportCards.count();
    expect(count).toBeGreaterThan(0);
  });
});
