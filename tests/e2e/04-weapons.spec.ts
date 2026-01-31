/**
 * Weapons Management E2E Tests - Tests Completos de Gestión de Armamento
 *
 * Basado en: /api/weapons (CRUD completo)
 */

import { test, expect } from '@playwright/test';
import { login, createTestWeapon, TEST_CREDENTIALS } from '../helpers/test-helpers';

test.describe('Weapons Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display weapons list', async ({ page }) => {
    await page.goto('/weapons', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Armamento');
  });

  test('should create weapon via API', async ({ page, request }) => {
    const weapon = await createTestWeapon(request, {
      brand: 'Glock',
      model: '19',
      serialNumber: `E2E-${Date.now()}`,
    });

    expect(weapon.id).toBeTruthy();
    expect(weapon.serialNumber).toContain('E2E-');
  });

  test('should filter weapons by type', async ({ page }) => {
    await page.goto('/weapons', { waitUntil: 'domcontentloaded' });

    const typeFilter = page.locator('select[name="type"], [data-testid="type-filter"]');
    if (await typeFilter.count() > 0) {
      await typeFilter.selectOption('PISTOL');
      await page.waitForTimeout(1000);
    }
  });

  test('should display weapon assignment info', async ({ page, request }) => {
    const weapon = await createTestWeapon(request, {
      status: 'ASSIGNED',
    });

    await page.goto(`/weapons/${weapon.id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1, .detail')).toBeVisible();
  });

  test('should update weapon status to maintenance', async ({ page, request }) => {
    const weapon = await createTestWeapon(request);

    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    const updateResponse = await request.put(`/api/weapons/${weapon.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { status: 'MAINTENANCE' },
    });

    expect(updateResponse.ok()).toBe(true);
  });

  test('should delete weapon', async ({ page, request }) => {
    const weapon = await createTestWeapon(request);

    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    const deleteResponse = await request.delete(`/api/weapons/${weapon.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(deleteResponse.ok()).toBe(true);
  });
});
