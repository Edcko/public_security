/**
 * Database Schema Definition
 *
 * This file defines all tables using Drizzle ORM.
 * All tables include corporation_id for multi-tenancy with RLS.
 */

import { pgTable, uuid, varchar, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { corporations } from './corporations.table';

/**
 * Corporaciones Policiales
 * - federal: Guardia Nacional, SSPF, etc.
 * - estatal: Policías estatales (32 estados)
 * - municipal: Policías municipales (~2,500 municipios)
 */
export { corporations };

/**
 * Usuarios del Sistema (Login)
 * Distinto de "personnel" - estos son usuarios que pueden hacer login
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id),
  role: varchar('role', { length: 50 }).notNull(), // 'national_admin', 'state_admin', 'officer', 'dispatcher'
  mfaEnabled: boolean('mfa_enabled').default(false),
  mfaSecret: varchar('mfa_secret', { length: 255 }),
  mfaBackupCodes: text('mfa_backup_codes').array(),
  refreshToken: varchar('refresh_token', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  corporationIdx: index('users_corporation_idx').on(table.corporationId),
  emailIdx: index('users_email_idx').on(table.email),
}));

/**
 * Personal Policial (Expedientes)
 * Contiene información detallada de cada policía
 */
export const personnel = pgTable('personnel', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id),
  badgeNumber: varchar('badge_number', { length: 50 }).notNull(),
  curp: varchar('curp', { length: 18 }).unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  rank: varchar('rank', { length: 50 }).notNull(), // 'cadete', 'oficial', 'comandante', etc.
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'suspended', 'retired'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  corporationIdx: index('personnel_corporation_idx').on(table.corporationId),
  badgeIdx: index('personnel_badge_idx').on(table.badgeNumber),
  curpIdx: index('personnel_curp_idx').on(table.curp),
}));

/**
 * Armamento y Municiones
 * Control estricto de armas asignadas a oficiales
 */
export const weapons = pgTable('weapons', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id),
  serialNumber: varchar('serial_number', { length: 100 }).notNull(),
  weaponType: varchar('weapon_type', { length: 50 }).notNull(), // 'pistol', 'rifle', 'shotgun', etc.
  make: varchar('make', { length: 100 }),
  model: varchar('model', { length: 100 }),
  caliber: varchar('caliber', { length: 20 }),
  status: varchar('status', { length: 20 }).default('available'), // 'available', 'assigned', 'maintenance', 'decommissioned'
  assignedTo: uuid('assigned_to').references(() => personnel.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  corporationIdx: index('weapons_corporation_idx').on(table.corporationId),
  serialIdx: index('weapons_serial_idx').on(table.serialNumber),
  assignedToIdx: index('weapons_assigned_idx').on(table.assignedTo),
}));

/**
 * Patrullas y Vehículos
 * Gestión de la flota de vehículos policiales
 */
export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id),
  plateNumber: varchar('plate_number', { length: 20 }).notNull(),
  vehicleType: varchar('vehicle_type', { length: 50 }).notNull(), // 'patrol', 'motorcycle', 'truck', etc.
  make: varchar('make', { length: 100 }),
  model: varchar('model', { length: 100 }),
  year: integer('year'),
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'maintenance', 'decommissioned'
  currentMileage: integer('current_mileage').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  corporationIdx: index('vehicles_corporation_idx').on(table.corporationId),
  plateIdx: index('vehicles_plate_idx').on(table.plateNumber),
}));

/**
 * Vitácora de Arrestos
 * Registro obligatorio de cada detención
 */
export const arrests = pgTable('arrests', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id),
  arrestDate: timestamp('arrest_date').notNull(),
  officerId: uuid('officer_id').notNull().references(() => personnel.id),
  detaineeName: varchar('detainee_name', { length: 255 }).notNull(),
  detaineeCurp: varchar('detainee_curp', { length: 18 }),
  detaineeAge: integer('detainee_age'),
  charges: text('charges').notNull(),
  location: varchar('location', { length: 255 }),
  incidentReport: text('incident_report'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  corporationIdx: index('arrests_corporation_idx').on(table.corporationId),
  dateIdx: index('arrests_date_idx').on(table.arrestDate),
  officerIdx: index('arrests_officer_idx').on(table.officerId),
}));

/**
 * Audit Logs (LFPDPPP Compliance)
 * Registro obligatorio de todas las operaciones con datos personales
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  timestamp: timestamp('timestamp').defaultNow(),
  userId: uuid('user_id').notNull().references(() => users.id),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id),
  action: varchar('action', { length: 10 }).notNull(), // 'CREATE', 'READ', 'UPDATE', 'DELETE'
  resource: varchar('resource', { length: 100 }).notNull(), // 'personnel', 'weapons', etc.
  resourceId: uuid('resource_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  success: boolean('success').notNull(),
  failureReason: text('failure_reason'),
}, (table) => ({
  userIdx: index('audit_logs_user_idx').on(table.userId),
  corporationIdx: index('audit_logs_corporation_idx').on(table.corporationId),
  timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
}));

/**
 * GPS Tracking (TimescaleDB)
 * Ubicación en tiempo real de patrullas
 */
export const gpsTracking = pgTable('gps_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id),
  latitude: varchar('latitude', { length: 20 }).notNull(),
  longitude: varchar('longitude', { length: 20 }).notNull(),
  speed: integer('speed'), // km/h
  heading: integer('heading'), // 0-359 degrees
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  vehicleIdx: index('gps_tracking_vehicle_idx').on(table.vehicleId),
  timestampIdx: index('gps_tracking_timestamp_idx').on(table.timestamp),
}));

/**
 * Password Reset Tokens
 * Tokens para reseteo de contraseña con expiración
 */
export const passwordResets = pgTable('password_resets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  usedAt: timestamp('used_at'),
}, (table) => ({
  userIdIdx: index('password_resets_user_id_idx').on(table.userId),
  tokenHashIdx: index('password_resets_token_hash_idx').on(table.tokenHash),
  expiresAtIdx: index('password_resets_expires_at_idx').on(table.expiresAt),
}));

/**
 * Salary Configuration
 * Configuración salarial por rango y corporación
 */
export const salaryConfigs = pgTable('salary_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id, { onDelete: 'cascade' }),
  rank: varchar('rank', { length: 50 }).notNull(),
  baseSalary: text('base_salary').notNull(), // Using text for decimal precision
  benefits: text('benefits').default('0'),
  bonuses: text('bonuses').default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  corporationRankUnique: index('salary_configs_corporation_rank_unique').on(table.corporationId, table.rank),
  corporationIdx: index('salary_configs_corporation_idx').on(table.corporationId),
}));

/**
 * Payroll Records
 * Registros de nómina del personal
 */
export const payrollRecords = pgTable('payroll_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id, { onDelete: 'cascade' }),
  personnelId: uuid('personnel_id').notNull().references(() => personnel.id, { onDelete: 'cascade' }),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  baseSalary: text('base_salary').notNull(),
  benefits: text('benefits').default('0'),
  bonuses: text('bonuses').default('0'),
  deductions: text('deductions').default('0'),
  totalPay: text('total_pay').notNull(),
  paymentDate: timestamp('payment_date'),
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'), // 'pending', 'paid', 'cancelled'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  corporationIdx: index('payroll_records_corporation_idx').on(table.corporationId),
  personnelIdx: index('payroll_records_personnel_idx').on(table.personnelId),
  periodIdx: index('payroll_records_period_idx').on(table.periodStart, table.periodEnd),
}));

/**
 * Deduction Types
 * Tipos de deducciones (ISR, IMSS, etc.)
 */
export const deductionTypes = pgTable('deduction_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  percentage: text('percentage'), // Using text for decimal precision
  fixedAmount: text('fixed_amount'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Corporation Deductions
 * Configuración de deducciones por corporación
 */
export const corporationDeductions = pgTable('corporation_deductions', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id, { onDelete: 'cascade' }),
  deductionTypeId: uuid('deduction_type_id').notNull().references(() => deductionTypes.id, { onDelete: 'cascade' }),
  percentage: text('percentage'),
  fixedAmount: text('fixed_amount'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  corporationDeductionUnique: index('corporation_deductions_corporation_deduction_unique').on(table.corporationId, table.deductionTypeId),
  corporationIdx: index('corporation_deductions_corporation_idx').on(table.corporationId),
}));

/**
 * Personnel History
 * Historial de cambios de personal (auditoría)
 */
export const personnelHistory = pgTable('personnel_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  personnelId: uuid('personnel_id').notNull().references(() => personnel.id, { onDelete: 'cascade' }),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 20 }).notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'
  changes: text('changes'), // JSON con campos antes y después
  changedBy: uuid('changed_by').references(() => users.id), // Usuario que hizo el cambio
  changedAt: timestamp('changed_at').defaultNow(),
  metadata: text('metadata'), // JSON con información adicional
}, (table) => ({
  personnelIdx: index('personnel_history_personnel_idx').on(table.personnelId),
  corporationIdx: index('personnel_history_corporation_idx').on(table.corporationId),
  changedAtIdx: index('personnel_history_changed_at_idx').on(table.changedAt),
}));

/**
 * Scheduled Reports
 * Configuración de reportes programados recurrentes
 */
export const scheduledReports = pgTable('scheduled_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporationId: uuid('corporation_id').notNull().references(() => corporations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  reportType: varchar('report_type', { length: 50 }).notNull(), // 'personnel', 'vehicles', 'weapons', 'arrests', 'payroll'
  frequency: varchar('frequency', { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly'
  recipientEmails: text('recipient_emails').notNull(), // JSON array of emails
  parameters: text('parameters'), // JSON object with report parameters
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  corporationIdx: index('scheduled_reports_corporation_idx').on(table.corporationId),
  nextRunIdx: index('scheduled_reports_next_run_idx').on(table.nextRunAt),
  isActiveIdx: index('scheduled_reports_is_active_idx').on(table.isActive),
}));

// Type exports for TypeScript
export type Corporation = typeof corporations.$inferSelect;
export type NewCorporation = typeof corporations.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Personnel = typeof personnel.$inferSelect;
export type NewPersonnel = typeof personnel.$inferInsert;

export type Weapon = typeof weapons.$inferSelect;
export type NewWeapon = typeof weapons.$inferInsert;

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

export type Arrest = typeof arrests.$inferSelect;
export type NewArrest = typeof arrests.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type GPSTracking = typeof gpsTracking.$inferSelect;
export type NewGPSTracking = typeof gpsTracking.$inferInsert;

export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;

export type SalaryConfig = typeof salaryConfigs.$inferSelect;
export type NewSalaryConfig = typeof salaryConfigs.$inferInsert;

export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type NewPayrollRecord = typeof payrollRecords.$inferInsert;

export type DeductionType = typeof deductionTypes.$inferSelect;
export type NewDeductionType = typeof deductionTypes.$inferInsert;

export type CorporationDeduction = typeof corporationDeductions.$inferSelect;
export type NewCorporationDeduction = typeof corporationDeductions.$inferInsert;

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type NewScheduledReport = typeof scheduledReports.$inferInsert;

export type PersonnelHistory = typeof personnelHistory.$inferSelect;
export type NewPersonnelHistory = typeof personnelHistory.$inferInsert;
