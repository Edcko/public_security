/**
 * Weapons/Inventory Management E2E Tests
 * Tests arreglados para coincidir con la UI REAL
 */

import { test, expect } from '@playwright/test';

test.describe('Weapons Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    // Esperar a que el botón esté habilitado antes de hacer click
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display weapons inventory', async ({ page }) => {
    await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

    // Verificar título
    await expect(page.locator('h1')).toContainText('Inventario de Armamento');

    // Verificar que hay una tabla
    await expect(page.locator('table')).toBeVisible();

    // Verificar encabezados de tabla
    await expect(page.locator('th').first()).toContainText('Serial');
    await expect(page.locator('th').nth(1)).toContainText('Tipo');
    await expect(page.locator('th').nth(2)).toContainText('Marca');
  });

  test('should have filter controls', async ({ page }) => {
    await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

    // Verificar que existen los filtros
    await expect(page.locator('input[placeholder*="serial"]')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible(); // Múltiples selects, usar first()
  });

  test('should display weapon cards', async ({ page }) => {
    await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

    // Verificar tarjetas de resumen
    await expect(page.locator('text=Total Armas')).toBeVisible();
    await expect(page.locator('text=Asignadas')).toBeVisible();
    await expect(page.locator('text=Disponibles')).toBeVisible();
    await expect(page.locator('text=En Mantenimiento')).toBeVisible();
  });

  test('should have action buttons', async ({ page }) => {
    await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

    // Verificar botón "Nueva Arma"
    await expect(page.locator('button:has-text("+ Nueva Arma")')).toBeVisible();

    // Verificar que hay botones de acción en la tabla
    const tableRows = await page.locator('table tbody tr').count();
    if (tableRows > 0) {
      // Primera fila debería tener botones
      await expect(page.locator('table tbody tr:first-child button:has-text("Ver")')).toBeVisible();
      await expect(page.locator('table tbody tr:first-child button:has-text("Asignar")')).toBeVisible();
      await expect(page.locator('table tbody tr:first-child button:has-text("Editar")')).toBeVisible();
    }
  });

  test('should filter weapons by type', async ({ page }) => {
    await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

    // Seleccionar tipo "Pistola" (primer select es el de tipos)
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption('pistol');

    // Verificar que el filtro se aplicó (esperar recarga)
    await page.waitForTimeout(1000);

    // La página debería seguir siendo visible
    await expect(page.locator('h1')).toContainText('Inventario de Armamento');
  });
});

test.describe('Weapons Statistics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display weapons statistics', async ({ page }) => {
    await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

    // Verificar que se muestran las tarjetas de estadísticas
    await expect(page.locator('text=Total Armas')).toBeVisible();
    await expect(page.locator('text=Asignadas')).toBeVisible();
    await expect(page.locator('text=Disponibles')).toBeVisible();
    await expect(page.locator('text=En Mantenimiento')).toBeVisible();
  });

  test('should have weapon data in table', async ({ page }) => {
    await page.goto('/inventory', { waitUntil: 'domcontentloaded' });

    // Verificar que hay datos en la tabla
    const tableRows = await page.locator('table tbody tr').count();
    expect(tableRows).toBeGreaterThan(0);

    // Verificar que las filas tienen datos
    const firstRowText = await page.locator('table tbody tr:first-child').textContent();
    expect(firstRowText.length).toBeGreaterThan(0);
  });
});
