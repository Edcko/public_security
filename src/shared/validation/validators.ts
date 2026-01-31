/**
 * Zod Validators
 *
 * Schemas de validación para todos los datos del sistema.
 * Usar Zod garantiza validación type-safe en runtime.
 */

import { z } from 'zod';

// ==========================================
// COMMON VALIDATORS
// ==========================================

export const uuidSchema = z.string().uuid();

export const curpSchema = z
  .string()
  .length(18)
  .regex(/^[A-Z0-9]+$/, 'CURP must be uppercase alphanumeric');

export const emailSchema = z.string().email();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ==========================================
// AUTHENTICATION
// ==========================================

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  corporationId: uuidSchema,
  role: z.enum(['national_admin', 'state_admin', 'municipal_admin', 'officer', 'dispatcher']),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// ==========================================
// CORPORATIONS
// ==========================================

export const createCorporationSchema = z.object({
  name: z.string().min(3).max(255),
  type: z.enum(['federal', 'estatal', 'municipal']),
  parentId: uuidSchema.optional(),
});

export const updateCorporationSchema = createCorporationSchema.partial();

// ==========================================
// PERSONNEL
// ==========================================

export const createOfficerSchema = z.object({
  corporationId: uuidSchema,
  badgeNumber: z.string().min(1).max(50),
  curp: curpSchema.optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  rank: z.enum(['cadete', 'oficial', 'sargento', 'teniente', 'comandante', 'jefe']),
  status: z.enum(['active', 'suspended', 'retired']).default('active'),
});

export const updateOfficerSchema = createOfficerSchema.partial();

export const searchOfficerSchema = z.object({
  badgeNumber: z.string().optional(),
  curp: curpSchema.optional(),
  name: z.string().optional(),
  rank: z.string().optional(),
  status: z.string().optional(),
});

// ==========================================
// WEAPONS / INVENTORY
// ==========================================

export const createWeaponSchema = z.object({
  corporationId: uuidSchema,
  serialNumber: z.string().min(1).max(100),
  weaponType: z.enum(['pistol', 'rifle', 'shotgun', 'smg', 'sniper']),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  caliber: z.string().max(20).optional(),
  status: z.enum(['available', 'assigned', 'maintenance', 'decommissioned']).default('available'),
});

export const assignWeaponSchema = z.object({
  weaponId: uuidSchema,
  officerId: uuidSchema,
});

export const unassignWeaponSchema = z.object({
  weaponId: uuidSchema,
});

// ==========================================
// VEHICLES
// ==========================================

export const createVehicleSchema = z.object({
  corporationId: uuidSchema,
  plateNumber: z.string().min(1).max(20),
  vehicleType: z.enum(['patrol', 'motorcycle', 'truck', 'van', 'helicopter']),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  status: z.enum(['active', 'maintenance', 'decommissioned']).default('active'),
  currentMileage: z.number().int().min(0).default(0),
});

export const updateVehicleSchema = createVehicleSchema.partial();

// ==========================================
// ARRESTS
// ==========================================

export const createArrestSchema = z.object({
  corporationId: uuidSchema,
  arrestDate: z.coerce.date(),
  officerId: uuidSchema,
  detaineeName: z.string().min(1).max(255),
  detaineeCurp: curpSchema.optional(),
  detaineeAge: z.number().int().min(0).max(150).optional(),
  charges: z.string().min(1),
  location: z.string().max(255).optional(),
  incidentReport: z.string().optional(),
});

export const updateArrestSchema = createArrestSchema.partial();

// ==========================================
// GPS TRACKING
// ==========================================

export const gpsUpdateSchema = z.object({
  vehicleId: uuidSchema,
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  speed: z.number().int().min(0).max(500).optional(), // km/h
  heading: z.number().int().min(0).max(359).optional(), // degrees
  timestamp: z.coerce.date().optional(),
});

// ==========================================
// REPORTS / ANALYTICS
// ==========================================

export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const crimeReportSchema = dateRangeSchema.extend({
  corporationId: uuidSchema.optional(),
  crimeType: z.string().optional(),
  state: z.string().optional(),
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCorporationInput = z.infer<typeof createCorporationSchema>;
export type UpdateCorporationInput = z.infer<typeof updateCorporationSchema>;
export type CreateOfficerInput = z.infer<typeof createOfficerSchema>;
export type UpdateOfficerInput = z.infer<typeof updateOfficerSchema>;
export type CreateWeaponInput = z.infer<typeof createWeaponSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CreateArrestInput = z.infer<typeof createArrestSchema>;
export type UpdateArrestInput = z.infer<typeof updateArrestSchema>;
export type GPSUpdateInput = z.infer<typeof gpsUpdateSchema>;
