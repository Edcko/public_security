/**
 * Casbin RBAC Service
 *
 * Sistema de control de acceso basado en roles con soporte multi-tenancy.
 * Define permisos granulares por rol y corporación.
 */

import { newEnforcer } from 'casbin';
import { db } from '@/shared/database/connection';
import { users } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';

// Modelo RBAC con dominio para multi-tenancy
const casbinModel = `
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && keyMatch2(r.obj, p.obj) && r.act == p.act
`;

let enforcer: any = null;

/**
 * Inicializa el servicio RBAC con Casbin
 */
export async function initRBAC() {
  try {
    // Usar Drizzle ORM connection para Casbin
    // const adapter = await PostgresAdapter.newAdapter({
    //   connectionString: process.env.DATABASE_URL,
    // });

    // Por ahora, usamos un adaptador en memoria hasta tener las tablas de Casbin
    // Crear enforcer
    enforcer = await newEnforcer(casbinModel);

    // Definir políticas por defecto
    await defineDefaultPolicies();

    console.log('RBAC initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RBAC:', error);
    throw error;
  }
}

/**
 * Define políticas RBAC por defecto
 */
async function defineDefaultPolicies() {
  if (!enforcer) return;

  // 1. Administrador Nacional - Acceso total a todo
  await enforcer.addPolicy('national_admin', '*', '*', '*');
  await enforcer.addPolicy('national_admin', '*', '*', 'create');
  await enforcer.addPolicy('national_admin', '*', '*', 'read');
  await enforcer.addPolicy('national_admin', '*', '*', 'update');
  await enforcer.addPolicy('national_admin', '*', '*', 'delete');

  // 2. Administrador Estatal - Acceso total a su corporación
  await enforcer.addPolicy('state_admin', '*', '*', '*');

  // 3. Administrador Municipal - Acceso total a su corporación
  await enforcer.addPolicy('municipal_admin', '*', '*', '*');

  // 4. Oficial - Permisos limitados
  await enforcer.addPolicy('officer', '*', 'personnel', 'read');
  await enforcer.addPolicy('officer', '*', 'personnel', 'create');
  await enforcer.addPolicy('officer', '*', 'weapons', 'read');
  await enforcer.addPolicy('officer', '*', 'weapons', 'create'); // Asignar armas a sí mismo
  await enforcer.addPolicy('officer', '*', 'vehicles', 'read');
  await enforcer.addPolicy('officer', '*', 'arrests', 'create'); // Crear arrestos
  await enforcer.addPolicy('officer', '*', 'arrests', 'read');
  await enforcer.addPolicy('officer', '*', 'shifts', 'read');
  await enforcer.addPolicy('officer', '*', 'attendance', 'create'); // Check-in/out

  // 5. Dispatcher - Permisos de lectura y gestión de incidentes
  await enforcer.addPolicy('dispatcher', '*', '*', 'read');
  await enforcer.addPolicy('dispatcher', '*', 'incidents', 'create');
  await enforcer.addPolicy('dispatcher', '*', 'arrests', 'create');
  await enforcer.addPolicy('dispatcher', '*', 'vehicles', 'update'); // Asignar vehículos

  // Guardar políticas
  await enforcer.savePolicy();
}

/**
 * Verifica si un usuario tiene permiso para una acción
 *
 * @param userId - ID del usuario
 * @param corporationId - ID de la corporación (dominio)
 * @param resource - Recurso (ej: 'personnel', 'weapons')
 * @param action - Acción (ej: 'create', 'read', 'update', 'delete')
 */
export async function checkPermission(
  userId: string,
  corporationId: string,
  resource: string,
  action: string
): Promise<boolean> {
  if (!enforcer) {
    // Si RBAC no está inicializado, permitir todo (development mode)
    console.warn('RBAC not initialized, allowing all');
    return true;
  }

  try {
    // Obtener rol del usuario
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return false;
    }

    const role = user.role;

    // Verificar permiso con Casbin
    // corporationId es el "dominio" en Casbin
    const allowed = await enforcer.enforce(role, corporationId, resource, action);

    return allowed;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Verifica múltiples permisos a la vez
 */
export async function checkPermissions(
  userId: string,
  corporationId: string,
  permissions: Array<{ resource: string; action: string }>
): Promise<boolean[]> {
  return await Promise.all(
    permissions.map((p) => checkPermission(userId, corporationId, p.resource, p.action))
  );
}

/**
 * Agrega una política personalizada
 */
export async function addPolicy(
  role: string,
  corporationId: string,
  resource: string,
  action: string
): Promise<boolean> {
  if (!enforcer) return false;

  return await enforcer.addPolicy(role, corporationId, resource, action);
}

/**
 * Elimina una política
 */
export async function removePolicy(
  role: string,
  corporationId: string,
  resource: string,
  action: string
): Promise<boolean> {
  if (!enforcer) return false;

  return await enforcer.removePolicy(role, corporationId, resource, action);
}

/**
 * Obtiene todos los roles de un usuario
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    return [];
  }

  return [user.role];
}

/**
 * Verifica si el usuario tiene alguno de los roles requeridos
 */
export async function hasRole(userId: string, requiredRoles: string[]): Promise<boolean> {
  const userRoles = await getUserRoles(userId);

  return requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Verifica si el usuario es administrador (cualquier nivel)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return await hasRole(userId, ['national_admin', 'state_admin', 'municipal_admin']);
}

/**
 * Middleware helper para verificar permisos en controllers
 */
export function requirePermission(resource: string, action: string) {
  return async (userId: string, corporationId: string): Promise<boolean> => {
    return await checkPermission(userId, corporationId, resource, action);
  };
}

/**
 * Middleware helper para verificar roles
 */
export function requireRole(requiredRoles: string[]) {
  return async (userId: string): Promise<boolean> => {
    return await hasRole(userId, requiredRoles);
  };
}
