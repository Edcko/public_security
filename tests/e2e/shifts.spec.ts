/**
 * Shifts Management E2E Tests
 * Tests basados en la UI REAL de /shifts
 */

import { test, expect } from '@playwright/test';

test.describe('Shifts Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display shifts page', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('h1')).toContainText('Gestión de Turnos');
    await expect(page.locator('text=Control de asistencia y nómina')).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('button:has-text("✓ Check-In")')).toBeVisible();
    await expect(page.locator('button:has-text("✕ Check-Out")')).toBeVisible();
    await expect(page.locator('button:has-text("+ Nuevo Turno")')).toBeVisible();
  });

  test('should display shift statistics cards', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Oficiales en Turno')).toBeVisible();
    await expect(page.locator('text=Horas Extra Hoy')).toBeVisible();
    await expect(page.locator('text=Ausencias Hoy')).toBeVisible();
    await expect(page.locator('text=Nómina Mes Actual')).toBeVisible();
  });

  test('should display active shifts section', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Turnos Activos')).toBeVisible();
    // Verificar que se muestra la fecha
    await expect(page.locator('text=Fecha:')).toBeVisible();
  });

  test('should display shift cards', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    // Verificar que hay tarjetas de turnos
    const shiftCards = page.locator('.border.rounded-lg.p-4');
    const count = await shiftCards.count();
    expect(count).toBeGreaterThan(0);

    // Verificar contenido de la primera tarjeta
    await expect(shiftCards.first()).toBeVisible();
  });
});

test.describe('Shift Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should have check-in button', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    const checkInBtn = page.locator('button:has-text("✓ Check-In")');
    await expect(checkInBtn).toBeVisible();
    await expect(checkInBtn).toHaveAttribute('class', /bg-green-600/);
  });

  test('should have check-out button', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    const checkOutBtn = page.locator('button:has-text("✕ Check-Out")');
    await expect(checkOutBtn).toBeVisible();
    await expect(checkOutBtn).toHaveAttribute('class', /bg-red-600/);
  });

  test('should have new shift button', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    const newShiftBtn = page.locator('button:has-text("+ Nuevo Turno")');
    await expect(newShiftBtn).toBeVisible();
    await expect(newShiftBtn).toHaveAttribute('class', /bg-blue-600/);
  });
});

test.describe('Shift Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#email', 'admin@policia.gob.mx');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display shift details in cards', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    // Verificar que las tarjetas de turno tienen la información esperada
    const shiftCards = page.locator('.border.rounded-lg.p-4');
    const firstCard = shiftCards.first();

    // Verificar elementos en la tarjeta
    await expect(firstCard.locator('h4')).toBeVisible();
    // Verificar que existen estos elementos dentro de las tarjetas
    await expect(page.locator('.border.rounded-lg.p-4').first().locator('text=Supervisor:')).toBeVisible();
    await expect(page.locator('.border.rounded-lg.p-4').first().locator('text=Oficiales:')).toBeVisible();
    await expect(page.locator('.border.rounded-lg.p-4').first().locator('text=Zona:')).toBeVisible();
  });

  test('should have view details button', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    // Verificar botón de ver detalles
    await expect(page.locator('text=Ver detalles').first()).toBeVisible();
  });
});
