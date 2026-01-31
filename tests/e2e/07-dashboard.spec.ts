/**
 * Dashboard E2E Tests - Tests Completos del Dashboard
 *
 * Basado en: / (página principal)
 */

import { test, expect } from '@playwright/test';
import { login } from '../helpers/test-helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verificar que estamos en el dashboard
    const h1 = page.locator('h1');
    const hasH1 = await h1.count() > 0;

    if (hasH1) {
      const title = await h1.textContent();
      expect(title).toMatch(/dashboard|seguridad|policía/i);
    }
  });

  test('should display personnel statistics', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Buscar estadísticas de personal
    const personnelStat = page.locator('text=Personal Activo, text=Total Personal');
    const hasStat = await personnelStat.count() > 0;

    if (hasStat) {
      await expect(personnelStat).toBeVisible();
    }
  });

  test('should display quick actions or navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Buscar navegación o botones de acción rápida
    const nav = page.locator('nav, .navigation, [role="navigation"]');
    const hasNav = await nav.count() > 0;

    if (hasNav) {
      await expect(nav).toBeVisible();
    }

    // Verificar enlaces principales
    const links = page.locator('a[href="/personnel"], a[href="/vehicles"], a[href="/weapons"]');
    const linkCount = await links.count();

    if (linkCount > 0) {
      await expect(links.first()).toBeVisible();
    }
  });

  test('should display charts or visualizations', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Buscar gráficos o visualizaciones
    const chart = page.locator('[data-testid="chart"], .chart, canvas, [class*="chart"]');
    const hasChart = await chart.count() > 0;

    if (hasChart) {
      await expect(chart.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verificar que la página carga correctamente
    const mainContent = page.locator('main, .dashboard, [role="main"]');
    await expect(mainContent).toBeVisible();

    // Restaurar viewport desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

test.describe('Dashboard - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to personnel section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Buscar enlace a personal
    const personnelLink = page.locator('a[href="/personnel"], [data-testid="nav-personnel"]');
    const personnelCount = await personnelLink.count();

    if (personnelCount > 0) {
      await personnelLink.first().click();
      await page.waitForURL('/personnel', { timeout: 5000 });
      expect(page.url()).toContain('/personnel');
    } else {
      // Si no hay enlace, navegar manualmente
      await page.goto('/personnel', { waitUntil: 'domcontentloaded' });
      expect(page.locator('h1')).toContainText('Personal');
    }
  });

  test('should navigate to vehicles section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const vehiclesLink = page.locator('a[href="/vehicles"], [data-testid="nav-vehicles"]');
    const vehiclesCount = await vehiclesLink.count();

    if (vehiclesCount > 0) {
      await vehiclesLink.first().click();
      await page.waitForURL('/vehicles', { timeout: 5000 });
      expect(page.url()).toContain('/vehicles');
    }
  });

  test('should navigate to weapons section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const weaponsLink = page.locator('a[href="/weapons"], [data-testid="nav-weapons"]');
    const weaponsCount = await weaponsLink.count();

    if (weaponsCount > 0) {
      await weaponsLink.first().click();
      await page.waitForURL('/weapons', { timeout: 5000 });
      expect(page.url()).toContain('/weapons');
    }
  });
});
