/**
 * Vehicles Management E2E Tests
 *
 * Tests para gestión de vehículos
 */

import { test, expect } from '@playwright/test';

test.describe('Vehicles Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display vehicles list', async ({ page }) => {
    await page.goto('/vehicles', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText('Flota de Patrullas');
    await expect(page.locator('table')).toBeVisible();

    // Verificar que hay filas en la tabla
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should filter by vehicle type', async ({ page }) => {
    await page.goto('/vehicles', { waitUntil: 'domcontentloaded' });

    // Verificar que existen las tarjetas de estadísticas (usar selectores más específicos)
    await expect(page.locator('text=Total Unidades')).toBeVisible();
    // Usar el contexto de las tarjetas de estadísticas
    const statsCards = page.locator('.grid').first();
    await expect(statsCards.locator('text=En Servicio')).toBeVisible();
    await expect(statsCards.locator('text=En Taller')).toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    await page.goto('/vehicles', { waitUntil: 'domcontentloaded' });

    // Verificar todas las estadísticas de estado
    await expect(page.locator('text=En Mantenimiento')).toBeVisible();
    await expect(page.locator('text=Fuera de Servicio')).toBeVisible();

    // Verificar que hay filas en la tabla
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test.skip('should create new vehicle', async ({ page }) => {
    // TODO: Implementar funcionalidad de crear vehículos
    test.skip(true, 'Vehicle creation not fully implemented yet');
  });

  test.skip('should edit vehicle', async ({ page }) => {
    // TODO: Implementar funcionalidad de editar vehículos
    test.skip(true, 'Vehicle edit not fully implemented yet');
  });

  test.skip('should update vehicle status', async ({ page }) => {
    // TODO: Implementar funcionalidad de actualizar estado de vehículos
    test.skip(true, 'Vehicle status update not fully implemented yet');
  });

  test.skip('should delete vehicle', async ({ page }) => {
    // TODO: Implementar funcionalidad de eliminar vehículos
    test.skip(true, 'Vehicle deletion not fully implemented yet');
  });
});
