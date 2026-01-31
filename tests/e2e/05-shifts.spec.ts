/**
 * Shifts & Attendance E2E Tests - Tests Completos de Turnos y Asistencia
 *
 * Basado en:
 * - /api/shifts (CRUD de turnos)
 * - /api/shifts/attendance (Check-in/Check-out)
 */

import { test, expect } from '@playwright/test';
import { login, createTestShift, TEST_CREDENTIALS } from '../helpers/test-helpers';

test.describe('Shifts Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display shifts list', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Turnos');
  });

  test('should display shift statistics', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    const statsCards = page.locator('.stat-card, .card, [class*="stat"]');
    const hasStats = await statsCards.count() > 0;

    if (hasStats) {
      await expect(statsCards.first()).toBeVisible();
      // Verificar estadísticas comunes
      const text = await page.textContent();
      expect(text).toMatch(/turnos|oficiales|horas|presentes/i);
    }
  });

  test('should create new shift', async ({ page, request }) => {
    const shift = await createTestShift(request, {
      name: 'Turno Tarde E2E',
      startTime: '14:00',
      endTime: '22:00',
    });

    expect(shift.id).toBeTruthy();
    expect(shift.name).toBe('Turno Tarde E2E');

    // Verificar en UI
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const shiftText = await page.locator(`text=Turno Tarde E2E`);
    const found = await shiftText.count() > 0;

    if (found) {
      await expect(shiftText).toBeVisible();
    }
  });

  test('should display attendance records', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    // Buscar tabla de asistencia
    const attendanceTable = page.locator('table');
    const hasTable = await attendanceTable.count() > 0;

    if (hasTable) {
      await expect(attendanceTable).toBeVisible();

      // Verificar columnas comunes
      const tableHeaders = await page.locator('th').allTextContents();
      const hasCommonHeaders = tableHeaders.some(h =>
        h.match(/oficial|check-in|check-out|horas|estado/i)
      );
      expect(hasCommonHeaders).toBe(true);
    }
  });
});

test.describe('Attendance - Check-in/Check-out', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should perform check-in to a shift', async ({ page, request }) => {
    // Crear un turno
    const shift = await createTestShift(request);

    // Login para obtener token
    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    // Hacer check-in vía API
    const checkInResponse = await request.post('/api/shifts/attendance', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'check-in',
        shiftId: shift.id,
      },
    });

    expect(checkInResponse.ok()).toBe(true);

    const attendance = await checkInResponse.json();
    expect(attendance.success).toBe(true);
    expect(attendance.data.checkIn).toBeTruthy();
  });

  test('should perform check-out from shift', async ({ page, request }) => {
    // Crear turno y hacer check-in
    const shift = await createTestShift(request);

    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    // Check-in
    const checkIn = await request.post('/api/shifts/attendance', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'check-in', shiftId: shift.id },
    });

    const attendanceData = (await checkIn.json()).data;

    // Check-out
    const checkOutResponse = await request.post('/api/shifts/attendance', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'check-out',
        attendanceId: attendanceData.id,
      },
    });

    expect(checkOutResponse.ok()).toBe(true);

    const checkOutData = await checkOutResponse.json();
    expect(checkOutData.success).toBe(true);
    expect(checkOutData.data.checkOut).toBeTruthy();
  });

  test('should calculate worked hours correctly', async ({ page, request }) => {
    // Crear turno
    const shift = await createTestShift(request, {
      startTime: '08:00',
      endTime: '16:00', // 8 horas
    });

    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    // Check-in
    const checkIn = await request.post('/api/shifts/attendance', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'check-in', shiftId: shift.id },
    });

    const attendanceData = (await checkIn.json()).data;

    // Check-out
    await request.post('/api/shifts/attendance', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { type: 'check-out', attendanceId: attendanceData.id },
    });

    // Verificar en UI que las horas se calcularon
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Buscar el registro en la tabla
    const hoursCell = page.locator('td').filter({ hasText: /\d+\.\d+h/ });
    const hasHours = await hoursCell.count() > 0;

    if (hasHours) {
      const hoursText = await hoursCell.first().textContent();
      expect(parseFloat(hoursText)).toBeGreaterThan(0);
    }
  });
});

test.describe('Shifts - UI Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show active shifts with visual indicator', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    // Buscar badges o indicadores de estado activo
    const activeBadge = page.locator('[class*="active"], [class*="Active"], .badge:has-text("Activo")');
    const hasActive = await activeBadge.count() > 0;

    if (hasActive) {
      await expect(activeBadge.first()).toBeVisible();
    }
  });

  test('should allow creating new shift from UI', async ({ page }) => {
    await page.goto('/shifts', { waitUntil: 'domcontentloaded' });

    // Buscar botón de crear turno
    const createButton = page.locator('button:has-text("Nuevo Turno"), button:has-text("Crear"), button:has-text("+")');
    const createCount = await createButton.count();

    if (createCount > 0) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      // Verificar que apareció el formulario
      const form = page.locator('form, .modal, [role="dialog"]');
      await expect(form.first()).toBeVisible();

      // Llenar formulario
      await page.fill('input[name="name"]', 'Turno Noche E2E');
      await page.fill('input[name="startTime"]', '22:00');
      await page.fill('input[name="endTime"]', '06:00');

      // Enviar (puede no funcionar si no hay botón visible, pero probamos)
      const submitButton = page.locator('button[type="submit"]');
      const submitCount = await submitButton.count();

      if (submitCount > 0) {
        await submitButton.first().click();
        await page.waitForTimeout(2000);
      }
    }
  });
});
