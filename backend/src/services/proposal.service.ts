import { pool } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { calculate, getPricingConfig } from './pricing.service';

interface CreateProposalInput {
  userId: string;
  clientCompany: string;
  clientContact?: string;
  clientRole?: string;
  clientNarrative?: string;
  industryId: string;
  moduleIds: string[];
  currency: 'JOD' | 'USD';
  isTaxEnabled: boolean;
  infrastructureType: string | null;
  hostingProvider: string | null;
  bulkMessaging: boolean;
  channels: string[];
}

interface UpdateProposalInput {
  clientCompany?: string;
  clientContact?: string;
  clientRole?: string;
  clientNarrative?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'expired';
  currency?: 'JOD' | 'USD';
  isTaxEnabled?: boolean;
  infrastructureType?: string | null;
  hostingProvider?: string | null;
  bulkMessaging?: boolean;
  channels?: string[];
  moduleIds?: string[];
  industryId?: string;
}

async function generateReferenceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM proposals
     WHERE reference_number LIKE $1`,
    [`DEV-${year}-%`],
  );
  const next = parseInt(result.rows[0].count, 10) + 1;
  return `DEV-${year}-${next.toString().padStart(4, '0')}`;
}

export async function createProposal(input: CreateProposalInput) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify industry exists
    const industryResult = await client.query(
      'SELECT id FROM industries WHERE id = $1 AND is_active = true',
      [input.industryId],
    );
    if (industryResult.rows.length === 0) {
      throw new AppError(400, 'Invalid industry ID');
    }

    // Server-side price calculation
    const totals = await calculate(
      input.moduleIds,
      input.infrastructureType,
      input.bulkMessaging,
    );

    const config = await getPricingConfig();
    const refNumber = await generateReferenceNumber();

    // Insert proposal
    const proposalResult = await client.query(
      `INSERT INTO proposals (
        user_id, reference_number, client_company, client_contact,
        client_role, client_narrative, industry_id, currency,
        is_tax_enabled, infrastructure_type, hosting_provider,
        bulk_messaging, channels, total_setup_jod, total_monthly_jod,
        total_yearly_jod, impact_score, snapshot_exchange_rate, snapshot_tax_rate
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *`,
      [
        input.userId,
        refNumber,
        input.clientCompany,
        input.clientContact || null,
        input.clientRole || null,
        input.clientNarrative || null,
        input.industryId,
        input.currency,
        input.isTaxEnabled,
        input.infrastructureType,
        input.hostingProvider,
        input.bulkMessaging,
        input.channels.length > 0 ? input.channels : null,
        totals.totalSetup,
        totals.totalMonthly,
        totals.totalYearly,
        totals.impactScore,
        config.exchangeRateUsd,
        config.taxRate,
      ],
    );

    const proposal = proposalResult.rows[0];

    // Snapshot selected modules
    const modules = await client.query(
      `SELECT id, name, setup_price_jod, monthly_price_jod, efficiency
       FROM modules WHERE id = ANY($1)`,
      [input.moduleIds],
    );

    for (const mod of modules.rows) {
      await client.query(
        `INSERT INTO proposal_modules (proposal_id, module_id, module_name, setup_price, monthly_price, efficiency)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          proposal.id,
          mod.id,
          mod.name,
          mod.setup_price_jod,
          mod.monthly_price_jod,
          mod.efficiency,
        ],
      );
    }

    await client.query('COMMIT');

    return { ...proposal, modules: modules.rows };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getProposals(
  userId: string,
  status?: string,
  page = 1,
  limit = 20,
) {
  const offset = (page - 1) * limit;
  const params: unknown[] = [userId, limit, offset];
  let whereClause = 'WHERE p.user_id = $1';

  if (status) {
    params.push(status);
    whereClause += ` AND p.status = $${params.length}`;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM proposals p ${whereClause}`,
    params.slice(0, status ? 2 : 1),
  );

  const result = await pool.query(
    `SELECT p.*, i.name as industry_name, i.theme_color
     FROM proposals p
     JOIN industries i ON p.industry_id = i.id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    params,
  );

  return {
    proposals: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page,
    limit,
  };
}

export async function getProposalById(proposalId: string, userId: string) {
  const result = await pool.query(
    `SELECT p.*, i.name as industry_name, i.theme_color, i.narrative, i.roi
     FROM proposals p
     JOIN industries i ON p.industry_id = i.id
     WHERE p.id = $1 AND p.user_id = $2`,
    [proposalId, userId],
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Proposal not found');
  }

  const modules = await pool.query(
    `SELECT * FROM proposal_modules WHERE proposal_id = $1`,
    [proposalId],
  );

  return { ...result.rows[0], modules: modules.rows };
}

export async function updateProposal(
  proposalId: string,
  userId: string,
  input: UpdateProposalInput,
) {
  // Verify ownership
  const existing = await pool.query(
    'SELECT id FROM proposals WHERE id = $1 AND user_id = $2',
    [proposalId, userId],
  );
  if (existing.rows.length === 0) {
    throw new AppError(404, 'Proposal not found');
  }

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    clientCompany: 'client_company',
    clientContact: 'client_contact',
    clientRole: 'client_role',
    clientNarrative: 'client_narrative',
    status: 'status',
    currency: 'currency',
    isTaxEnabled: 'is_tax_enabled',
    infrastructureType: 'infrastructure_type',
    hostingProvider: 'hosting_provider',
    bulkMessaging: 'bulk_messaging',
    channels: 'channels',
    industryId: 'industry_id',
  };

  for (const [key, column] of Object.entries(fieldMap)) {
    if (key in input && (input as Record<string, unknown>)[key] !== undefined) {
      setClauses.push(`${column} = $${paramIndex}`);
      params.push((input as Record<string, unknown>)[key]);
      paramIndex++;
    }
  }

  // If modules changed, recalculate pricing
  if (input.moduleIds) {
    const infraType =
      input.infrastructureType !== undefined
        ? input.infrastructureType
        : (
            await pool.query(
              'SELECT infrastructure_type FROM proposals WHERE id = $1',
              [proposalId],
            )
          ).rows[0].infrastructure_type;

    const bulkMsg =
      input.bulkMessaging !== undefined
        ? input.bulkMessaging
        : (
            await pool.query(
              'SELECT bulk_messaging FROM proposals WHERE id = $1',
              [proposalId],
            )
          ).rows[0].bulk_messaging;

    const totals = await calculate(input.moduleIds, infraType, bulkMsg);
    const config = await getPricingConfig();

    setClauses.push(`total_setup_jod = $${paramIndex++}`);
    params.push(totals.totalSetup);
    setClauses.push(`total_monthly_jod = $${paramIndex++}`);
    params.push(totals.totalMonthly);
    setClauses.push(`total_yearly_jod = $${paramIndex++}`);
    params.push(totals.totalYearly);
    setClauses.push(`impact_score = $${paramIndex++}`);
    params.push(totals.impactScore);
    setClauses.push(`snapshot_exchange_rate = $${paramIndex++}`);
    params.push(config.exchangeRateUsd);
    setClauses.push(`snapshot_tax_rate = $${paramIndex++}`);
    params.push(config.taxRate);
  }

  setClauses.push(`updated_at = NOW()`);

  params.push(proposalId);
  const result = await pool.query(
    `UPDATE proposals SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params,
  );

  // Update modules if provided
  if (input.moduleIds) {
    await pool.query('DELETE FROM proposal_modules WHERE proposal_id = $1', [
      proposalId,
    ]);
    const modules = await pool.query(
      `SELECT id, name, setup_price_jod, monthly_price_jod, efficiency
       FROM modules WHERE id = ANY($1)`,
      [input.moduleIds],
    );
    for (const mod of modules.rows) {
      await pool.query(
        `INSERT INTO proposal_modules (proposal_id, module_id, module_name, setup_price, monthly_price, efficiency)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          proposalId,
          mod.id,
          mod.name,
          mod.setup_price_jod,
          mod.monthly_price_jod,
          mod.efficiency,
        ],
      );
    }
  }

  return result.rows[0];
}

export async function deleteProposal(proposalId: string, userId: string) {
  const result = await pool.query(
    'DELETE FROM proposals WHERE id = $1 AND user_id = $2 RETURNING id',
    [proposalId, userId],
  );
  if (result.rows.length === 0) {
    throw new AppError(404, 'Proposal not found');
  }
}
