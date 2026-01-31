/**
 * Simple E2E Tests - NO LOGIN REQUIRED
 * Tests de UI básicos para verificar que las páginas cargan
 */

import { test, expect } from '@playwright/test';

test.describe('UI Basic Tests - No Auth', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Verificar elementos visibles
    await expect(page.locator('h1')).toContainText('Sistema de Gestión Policial');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display inventory page', async ({ page }) => {
    await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

    // Verificar que carga la página
    await expect(page.locator('h1')).toContainText('Inventario de Armamento');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=Total Armas')).toBeVisible();
  });

  test('should display vehicles page', async ({ page }) => {
    await page.goto('/vehicles', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText('Flota de Patrullas');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=Total Unidades')).toBeVisible();
  });

  test('should display personnel page', async ({ page }) => {
    await page.goto('/personnel', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText('Gestión de Personal');
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text=+ Nuevo Oficial')).toBeVisible();
  });

  test('should display dashboard page', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Personal Activo')).toBeVisible();
    // Usar un selector más específico para evitar ambigüedad
    await expect(page.locator('p:has-text("Patrullas Activas")')).toBeVisible();
  });
});
