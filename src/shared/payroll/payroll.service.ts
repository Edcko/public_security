/**
 * Payroll Service
 *
 * Servicio de cálculo y gestión de nómina
 */

import { db } from '@/shared/database/connection';
import { personnel, corporations, salaryConfigs, payrollRecords, corporationDeductions, deductionTypes } from '@/shared/database/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface PayrollCalculation {
  personnelId: string;
  periodStart: Date;
  periodEnd: Date;
  baseSalary: number;
  benefits: number;
  bonuses: number;
  deductions: number;
  totalPay: number;
}

export interface SalaryBreakdown {
  baseSalary: number;
  benefits: number;
  bonuses: number;
  grossPay: number;
  deductions: {
    name: string;
    amount: number;
  }[];
  totalDeductions: number;
  netPay: number;
}

/**
 * Calcula la nómina para un periodo y corporación
 */
export async function calculatePayroll(
  corporationId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PayrollCalculation[]> {
  // Obtener todo el personal de la corporación
  const personnelList = await db
    .select()
    .from(personnel)
    .where(eq(personnel.corporationId, corporationId));

  const calculations: PayrollCalculation[] = [];

  for (const person of personnelList) {
    const calculation = await calculatePersonnelPayroll(person.id, periodStart, periodEnd);
    calculations.push(calculation);
  }

  return calculations;
}

/**
 * Calcula la nómina para un miembro del personal
 */
export async function calculatePersonnelPayroll(
  personnelId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PayrollCalculation> {
  // Obtener datos del personal
  const [person] = await db
    .select()
    .from(personnel)
    .where(eq(personnel.id, personnelId))
    .limit(1);

  if (!person) {
    throw new Error('Personal not found');
  }

  // Obtener configuración salarial
  const [salaryConfig] = await db
    .select()
    .from(salaryConfigs)
    .where(
      and(
        eq(salaryConfigs.corporationId, person.corporationId),
        eq(salaryConfigs.rank, person.rank)
      )
    )
    .limit(1);

  const baseSalary = salaryConfig ? parseFloat(salaryConfig.baseSalary) : 0;
  const benefits = salaryConfig ? parseFloat(salaryConfig.benefits) : 0;
  const bonuses = salaryConfig ? parseFloat(salaryConfig.bonuses) : 0;

  // Calcular deducciones
  const grossPay = baseSalary + benefits + bonuses;
  const deductions = await calculateDeductions(person.corporationId, grossPay);
  const totalPay = grossPay - deductions;

  return {
    personnelId,
    periodStart,
    periodEnd,
    baseSalary,
    benefits,
    bonuses,
    deductions,
    totalPay,
  };
}

/**
 * Calcula las deducciones para un corporación y monto bruto
 */
export async function calculateDeductions(
  corporationId: string,
  grossPay: number
): Promise<number> {
  const corpDeductions = await db
    .select({
      percentage: corporationDeductions.percentage,
      fixedAmount: corporationDeductions.fixedAmount,
      name: deductionTypes.name,
    })
    .from(corporationDeductions)
    .innerJoin(deductionTypes, eq(corporationDeductions.deductionTypeId, deductionTypes.id))
    .where(eq(corporationDeductions.corporationId, corporationId));

  let totalDeductions = 0;

  for (const deduction of corpDeductions) {
    if (deduction.percentage) {
      totalDeductions += grossPay * (parseFloat(deduction.percentage) / 100);
    }
    if (deduction.fixedAmount) {
      totalDeductions += parseFloat(deduction.fixedAmount);
    }
  }

  return totalDeductions;
}

/**
 * Genera registros de nómina para un periodo
 */
export async function generatePayrollRecords(
  corporationId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ created: number; errors: number }> {
  const calculations = await calculatePayroll(corporationId, periodStart, periodEnd);

  let created = 0;
  let errors = 0;

  for (const calc of calculations) {
    try {
      await db.insert(payrollRecords).values({
        corporationId,
        personnelId: calc.personnelId,
        periodStart,
        periodEnd,
        baseSalary: calc.baseSalary.toString(),
        benefits: calc.benefits.toString(),
        bonuses: calc.bonuses.toString(),
        deductions: calc.deductions.toString(),
        totalPay: calc.totalPay.toString(),
        paymentStatus: 'pending',
      });
      created++;
    } catch (error) {
      console.error('Error creating payroll record:', error);
      errors++;
    }
  }

  return { created, errors };
}

/**
 * Obtiene el desglose salarial de un miembro del personal
 */
export async function getSalaryBreakdown(
  personnelId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<SalaryBreakdown> {
  const calc = await calculatePersonnelPayroll(personnelId, periodStart, periodEnd);
  const [person] = await db.select().from(personnel).where(eq(personnel.id, personnelId)).limit(1);

  if (!person) {
    throw new Error('Personal not found');
  }

  // Obtener detalle de deducciones
  const corpDeductions = await db
    .select({
      percentage: corporationDeductions.percentage,
      fixedAmount: corporationDeductions.fixedAmount,
      name: deductionTypes.name,
    })
    .from(corporationDeductions)
    .innerJoin(deductionTypes, eq(corporationDeductions.deductionTypeId, deductionTypes.id))
    .where(eq(corporationDeductions.corporationId, person.corporationId));

  const grossPay = calc.baseSalary + calc.benefits + calc.bonuses;
  const deductionDetails: { name: string; amount: number }[] = [];

  for (const deduction of corpDeductions) {
    let amount = 0;
    if (deduction.percentage) {
      amount = grossPay * (parseFloat(deduction.percentage) / 100);
    }
    if (deduction.fixedAmount) {
      amount += parseFloat(deduction.fixedAmount);
    }
    deductionDetails.push({
      name: deduction.name,
      amount: Math.round(amount * 100) / 100,
    });
  }

  return {
    baseSalary: calc.baseSalary,
    benefits: calc.benefits,
    bonuses: calc.bonuses,
    grossPay,
    deductions: deductionDetails,
    totalDeductions: calc.deductions,
    netPay: calc.totalPay,
  };
}

/**
 * Marca un registro de nómina como pagado
 */
export async function markAsPaid(payrollId: string): Promise<void> {
  await db
    .update(payrollRecords)
    .set({
      paymentStatus: 'paid',
      paymentDate: new Date(),
    })
    .where(eq(payrollRecords.id, payrollId));
}

/**
 * Cancela un registro de nómina
 */
export async function cancelPayroll(payrollId: string): Promise<void> {
  await db
    .update(payrollRecords)
    .set({
      paymentStatus: 'cancelled',
    })
    .where(eq(payrollRecords.id, payrollId));
}

export const payrollService = {
  calculatePayroll,
  calculatePersonnelPayroll,
  calculateDeductions,
  generatePayrollRecords,
  getSalaryBreakdown,
  markAsPaid,
  cancelPayroll,
};
