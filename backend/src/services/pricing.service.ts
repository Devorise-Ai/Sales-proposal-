import { pool } from '../config/database';
import { PricingConfig, CalculateResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

export async function getPricingConfig(): Promise<PricingConfig> {
  const result = await pool.query('SELECT key, value FROM pricing_config');
  const config: Record<string, number> = {};
  for (const row of result.rows) {
    config[row.key] = parseFloat(row.value);
  }

  return {
    exchangeRateUsd: config['exchange_rate_usd'],
    taxRate: config['tax_rate'],
    systemCreationFee: config['system_creation_fee'],
    bulkMessagingMonthly: config['bulk_messaging_monthly'],
  };
}

export async function calculate(
  moduleIds: string[],
  infrastructureType: string | null,
  bulkMessaging: boolean,
): Promise<CalculateResponse> {
  if (moduleIds.length === 0) {
    throw new AppError(400, 'At least one module must be selected');
  }

  const config = await getPricingConfig();

  const result = await pool.query(
    `SELECT setup_price_jod, monthly_price_jod, efficiency
     FROM modules
     WHERE id = ANY($1) AND is_active = true`,
    [moduleIds],
  );

  if (result.rows.length === 0) {
    throw new AppError(400, 'No valid modules found for the given IDs');
  }

  let totalSetup = 0;
  let totalMonthly = 0;
  let totalEfficiency = 0;

  for (const row of result.rows) {
    totalSetup += parseFloat(row.setup_price_jod);
    totalMonthly += parseFloat(row.monthly_price_jod);
    totalEfficiency += row.efficiency;
  }

  if (infrastructureType === 'system_creation') {
    totalSetup += config.systemCreationFee;
  }

  if (bulkMessaging) {
    totalMonthly += config.bulkMessagingMonthly;
  }

  const totalYearly = totalSetup + totalMonthly * 12;
  const impactScore = Math.min(95, totalEfficiency);

  return { totalSetup, totalMonthly, totalYearly, impactScore };
}
