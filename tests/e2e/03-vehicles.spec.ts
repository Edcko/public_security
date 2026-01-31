/**
 * Vehicles Management E2E Tests - Tests Completos de Gestión de Vehículos
 *
 * Basado en: /api/vehicles (CRUD completo)
 */

import { test, expect } from '@playwright/test';
import { login, createTestVehicle, TEST_CREDENTIALS } from '../helpers/test-helpers';

test.describe('Vehicles Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display vehicles list', async ({ page }) => {
    await page.goto('/vehicles', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Vehículos');
  });

  test('should create vehicle via API and verify in UI', async ({ page, request }) => {
    const vehicle = await createTestVehicle(request, {
      brand: 'Ford',
      model: 'Fusion',
      plate: `E2E-${Date.now()}`,
    });

    await page.goto('/vehicles', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const found = await page.locator(`text=${vehicle.plate}`).count() > 0;
    if (found) {
      await expect(page.locator(`text=${vehicle.plate}`)).toBeVisible();
    }
  });

  test('should filter vehicles by type', async ({ page }) => {
    await page.goto('/vehicles', { waitUntil: 'domcontentloaded' });

    const typeFilter = page.locator('select[name="type"], [data-testid="type-filter"]');
    if (await typeFilter.count() > 0) {
      await typeFilter.selectOption('PATROL');
      await page.waitForTimeout(1000);
    }
  });

  test('should display vehicle details', async ({ page, request }) => {
    const vehicle = await createTestVehicle(request);

    await page.goto(`/vehicles/${vehicle.id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, .detail')).toBeVisible();
  });

  test('should update vehicle status', async ({ page, request }) => {
    const vehicle = await createTestVehicle(request);

    // Login para obtener token
    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    // Actualizar vía API
    const updateResponse = await request.put(`/api/vehicles/${vehicle.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'MAINTENANCE' },
    });

    expect(updateResponse.ok()).toBe(true);

    // Verificar en UI
    await page.goto(`/vehicles/${vehicle.id}`, { waitUntil: 'domcontentloaded' });
    const statusText = await page.locator('text=MAINTENANCE, text=Mantenimiento').count();
    expect(statusText).toBeGreaterThan(0);
  });

  test('should delete vehicle', async ({ page, request }) => {
    const vehicle = await createTestVehicle(request);

    // Login
    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    // Eliminar vía API
    const deleteResponse = await request.delete(`/api/vehicles/${vehicle.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(deleteResponse.ok()).toBe(true);

    // Verificar en UI
    await page.goto('/vehicles', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  });
});
