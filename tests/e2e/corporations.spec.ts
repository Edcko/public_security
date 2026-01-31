/**
 * Corporations E2E Tests
 * Tests basados en la UI REAL de /corporations
 */

import { test, expect } from '@playwright/test';

test.describe('Corporations Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display corporations page', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText('Corporaciones');
    await expect(page.locator('text=Gestión de corporaciones policiales')).toBeVisible();
  });

  test('should display new corporation button', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('button:has-text("+ Nueva Corporación")')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    // Esperar a que carguen las estadísticas
    await expect(page.locator('text=Total').first()).toBeVisible();
    await expect(page.locator('text=Federal').first()).toBeVisible();
    await expect(page.locator('text=Estatal').first()).toBeVisible();
    await expect(page.locator('text=Municipal').first()).toBeVisible();
    await expect(page.locator('text=Nivel Superior')).toBeVisible();
  });

  test('should display filters', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('input[placeholder*="Buscar por nombre"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });

  test('should display corporations table', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Nombre")')).toBeVisible();
    await expect(page.locator('th:has-text("Tipo")')).toBeVisible();
  });
});

test.describe('Corporations Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should have search input', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    const searchInput = page.locator('input[placeholder*="Buscar por nombre"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('type', 'text');
  });

  test('should have type filter', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    const typeSelect = page.locator('select').first();
    await expect(typeSelect).toBeVisible();
    // Las opciones no son visibles hasta hacer click, solo verificar que existen
    await expect(page.locator('option[value="all"]')).toHaveCount(1);
    await expect(page.locator('option[value="federal"]')).toHaveCount(1);
    await expect(page.locator('option[value="estatal"]')).toHaveCount(1);
    await expect(page.locator('option[value="municipal"]')).toHaveCount(1);
  });
});

test.describe('Corporations Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display corporations in table', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    // Verificar que la tabla existe y tiene la estructura correcta
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('thead')).toBeVisible();
    await expect(page.locator('tbody')).toBeVisible();
    // Los datos pueden variar, solo verificar estructura
  });

  test('should have action buttons in table', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    // Verificar que existe la columna de acciones
    await expect(page.locator('th:has-text("Acciones")')).toBeVisible();
    // La tabla tiene la columna de acciones incluso si no hay datos
  });
});

test.describe('Corporations Stats', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display total count', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.bg-white.rounded-lg.shadow.p-6').first().locator('text=Total')).toBeVisible();
  });

  test('should display federal count', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    const statsCards = page.locator('.bg-white.rounded-lg.shadow.p-6');
    await expect(statsCards.nth(1).locator('text=Federal')).toBeVisible();
  });

  test('should display estad count', async ({ page }) => {
    await page.goto('/corporations', { waitUntil: 'domcontentloaded' });

    const statsCards = page.locator('.bg-white.rounded-lg.shadow.p-6');
    await expect(statsCards.nth(2).locator('text=Estatal')).toBeVisible();
  });
});
