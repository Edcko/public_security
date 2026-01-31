/**
 * Test Helpers - Funciones reutilizables para E2E tests
 */

import { Page, APIRequestContext } from '@playwright/test';

// Credenciales de prueba (usar las del seed data)
export const TEST_CREDENTIALS = {
  email: 'admin@seguridad.gob.mx',
  password: 'Admin123!',
  corporationId: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000001',
};

/**
 * Login completo con JWT y localStorage
 */
export async function login(page: Page) {
  // Hacer login via API
  const response = await page.request.post('/api/auth/login', {
    data: {
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Login failed: ${data.error}`);
  }

  // Setear tokens en localStorage
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(([accessToken, refreshToken]) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }, [data.data.accessToken, data.data.refreshToken]);

  // Recargar la página para que se apliquen los tokens
  await page.reload({ waitUntil: 'domcontentloaded' });

  return data.data;
}

/**
 * Crear personal de prueba via API
 */
export async function createTestPersonnel(api: APIRequestContext, data?: any) {
  const response = await api.post('/api/personnel', {
    data: {
      firstName: data?.firstName || 'Juan',
      lastName: data?.lastName || 'Prueba',
      badgeNumber: data?.badgeNumber || `TEST-${Date.now()}`,
      rank: data?.rank || 'SERGEANT',
      position: data?.position || 'Test Officer',
      status: 'ACTIVE',
      hireDate: data?.hireDate || new Date().toISOString().split('T')[0],
      email: data?.email || `test${Date.now()}@test.com`,
      phone: data?.phone || '555-5555',
      ...data,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create personnel: ${await response.text()}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Crear vehículo de prueba via API
 */
export async function createTestVehicle(api: APIRequestContext, data?: any) {
  const response = await api.post('/api/vehicles', {
    data: {
      plate: data?.plate || `TEST-${Date.now()}`,
      brand: data?.brand || 'Toyota',
      model: data?.model || 'Corolla',
      year: data?.year || 2024,
      type: data?.type || 'PATROL',
      status: data?.status || 'ACTIVE',
      vin: data?.vin || `VIN${Date.now()}`,
      ...data,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create vehicle: ${await response.text()}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Crear arma de prueba via API
 */
export async function createTestWeapon(api: APIRequestContext, data?: any) {
  const response = await api.post('/api/weapons', {
    data: {
      serialNumber: data?.serialNumber || `SN${Date.now()}`,
      brand: data?.brand || 'Glock',
      model: data?.model || '17',
      caliber: data?.caliber || '9mm',
      type: data?.type || 'PISTOL',
      status: data?.status || 'ASSIGNED',
      assignmentDate: data?.assignmentDate || new Date().toISOString().split('T')[0],
      ...data,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create weapon: ${await response.text()}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Crear turno de prueba via API
 */
export async function createTestShift(api: APIRequestContext, data?: any) {
  const response = await api.post('/api/shifts', {
    data: {
      name: data?.name || `Test Shift ${Date.now()}`,
      startTime: data?.startTime || '08:00',
      endTime: data?.endTime || '16:00',
      daysOfWeek: data?.daysOfWeek || '1,2,3,4,5',
      isActive: true,
      ...data,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create shift: ${await response.text()}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Limpiar datos de prueba (eliminar por badgeNumber/plate/serialNumber que empieza con TEST-)
 */
export async function cleanupTestData(api: APIRequestContext) {
  // Esta función eliminaría todos los datos de prueba creados
  // Por ahora es un placeholder para evitar borrar datos accidentales
  console.log('Cleanup test data - to be implemented');
}

/**
 * Esperar a que un elemento esté visible y hacer click
 */
export async function clickAndWait(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await page.click(selector);
}

/**
 * Llenar un formulario
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) {
    await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
    await page.fill(selector, value);
  }
}

/**
 * Verificar que una notificación toast aparece
 */
export async function verifyToast(page: Page, message: string) {
  // Buscar el toast (generalmente aparece en la esquina superior derecha)
  const toast = page.locator(`.toast, [role="alert"], .notification`).filter({ hasText: message });
  await expect(toast).toBeVisible({ timeout: 5000 });
}

/**
 * Tomar screenshot si el test falla
 */
export async function screenshotOnFailure(page: Page, testName: string) {
  await page.screenshot({
    path: `test-results/screenshots/${testName}-failure.png`,
    fullPage: true,
  });
}

/**
 * Verificar health check del sistema
 */
export async function verifySystemHealth(api: APIRequestContext) {
  const response = await api.get('/api/health');

  if (!response.ok()) {
    throw new Error('System health check failed');
  }

  const data = await response.json();
  return data.status === 'healthy';
}
