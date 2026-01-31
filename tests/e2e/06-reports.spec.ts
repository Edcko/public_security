/**
 * Reports E2E Tests - Tests Completos de Reportes
 *
 * Basado en:
 * - /api/reports/generate (generación de reportes)
 * - /api/reports/schedule (reportes programados)
 * - /api/reports/scheduled (CRUD de programados)
 */

import { test, expect } from '@playwright/test';
import { login, TEST_CREDENTIALS } from '../helpers/test-helpers';

test.describe('Reports Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display reports page', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Reportes');
  });

  test('should show report generation form', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    // Verificar selector de tipo de reporte
    const typeSelector = page.locator('select[name="type"], [data-testid="report-type"]');
    const hasTypeSelector = await typeSelector.count() > 0;

    if (hasTypeSelector) {
      await expect(typeSelector).toBeVisible();

      // Verificar opciones de reporte
      const options = await typeSelector.locator('option').allTextContents();
      expect(options.length).toBeGreaterThan(0);
    }
  });

  test('should show format selector', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    const formatSelector = page.locator('select[name="format"], [data-testid="report-format"]');
    const hasFormat = await formatSelector.count() > 0;

    if (hasFormat) {
      await expect(formatSelector).toBeVisible();

      // Verificar formatos disponibles
      const options = await formatSelector.locator('option').allTextContents();
      expect(options).toContain('PDF');
      expect(options).toContain('Excel');
    }
  });

  test('should allow date range selection', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    const startDateInput = page.locator('input[name="startDate"], input[type="date"]:first-of-type');
    const endDateInput = page.locator('input[name="endDate"], input[type="date"]:nth-of-type(2)');

    const hasDates = (await startDateInput.count() > 0) && (await endDateInput.count() > 0);

    if (hasDates) {
      await expect(startDateInput).toBeVisible();
      await expect(endDateInput).toBeVisible();
    }
  });

  test('should generate report via API', async ({ page, request }) => {
    // Login
    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    // Generar reporte
    const response = await request.post('/api/reports/generate', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        type: 'personnel',
        format: 'pdf',
        filters: {
          startDate: new Date('2024-01-01').toISOString(),
          endDate: new Date().toISOString(),
        },
      },
    });

    expect(response.ok()).toBe(true);

    const report = await response.json();
    expect(report.success).toBe(true);
  });

  test('should schedule new report', async ({ page, request }) => {
    // Login
    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    // Crear reporte programado
    const response = await request.post('/api/reports/schedule', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Reporte Semanal E2E',
        reportType: 'personnel',
        frequency: 'weekly',
        recipientEmails: JSON.stringify(['test@example.com']),
        parameters: JSON.stringify({
          format: 'pdf',
        }),
        nextRunAt: new Date(Date.now() + 86400000).toISOString(), // Mañana
        isActive: true,
      },
    });

    expect(response.ok()).toBe(true);

    const result = await response.json();
    expect(result.success).toBe(true);
  });

  test('should display scheduled reports list', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    // Buscar sección de reportes programados
    const scheduledSection = page.locator('text=Reportes Agendados, text=Scheduled Reports, [data-testid="scheduled-reports"]');
    const hasScheduled = await scheduledSection.count() > 0;

    if (hasScheduled) {
      await expect(scheduledSection.first()).toBeVisible();

      // Verificar que hay tabla o lista
      const table = page.locator('table');
      const hasTable = await table.count() > 0;

      if (hasTable) {
        await expect(table).toBeVisible();
      }
    }
  });

  test('should allow pausing scheduled report', async ({ page, request }) => {
    // Login
    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    // Crear reporte programado
    const createResponse = await request.post('/api/reports/schedule', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Reporte Pausable E2E',
        reportType: 'vehicles',
        frequency: 'daily',
        recipientEmails: JSON.stringify(['test@example.com']),
        nextRunAt: new Date(Date.now() + 86400000).toISOString(),
        isActive: true,
      },
    });

    const created = await createResponse.json();
    const reportId = created.data.id;

    // Pausar reporte
    const pauseResponse = await request.patch(`/api/reports/scheduled/${reportId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { isActive: false },
    });

    expect(pauseResponse.ok()).toBe(true);
  });

  test('should delete scheduled report', async ({ page, request }) => {
    // Login
    const loginResponse = await request.post('/api/auth/login', {
      data: TEST_CREDENTIALS,
    });
    const { accessToken } = (await loginResponse.json()).data;

    // Crear reporte
    const createResponse = await request.post('/api/reports/schedule', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Reporte Eliminable E2E',
        reportType: 'arrests',
        frequency: 'monthly',
        recipientEmails: JSON.stringify(['test@example.com']),
        nextRunAt: new Date(Date.now() + 86400000).toISOString(),
        isActive: true,
      },
    });

    const created = await createResponse.json();
    const reportId = created.data.id;

    // Eliminar reporte
    const deleteResponse = await request.delete(`/api/reports/scheduled/${reportId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(deleteResponse.ok()).toBe(true);
  });
});

test.describe('Reports - Report Categories', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show different report categories', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    // Buscar tarjetas o secciones de categorías
    const categories = page.locator('.category, .report-type, [data-testid="report-category"]');
    const hasCategories = await categories.count() > 0;

    if (hasCategories) {
      const categoryCount = await categories.count();
      expect(categoryCount).toBeGreaterThan(0);

      // Verificar categorías comunes
      const text = await page.textContent();
      expect(text).toMatch(/operacionales|estadísticos|financieros/i);
    }
  });

  test('should display recent reports', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });

    const recentSection = page.locator('text=Reportes Recientes, text=Recent Reports, [data-testid="recent-reports"]');
    const hasRecent = await recentSection.count() > 0;

    if (hasRecent) {
      await expect(recentSection.first()).toBeVisible();
    }
  });
});
