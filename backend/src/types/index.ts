export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  company_name: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_name: string | null;
  avatar_url: string | null;
  created_at: Date;
}

export interface Industry {
  id: string;
  name: string;
  theme_color: string;
  narrative: string;
  roi: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
}

export interface Module {
  id: string;
  industry_id: string;
  name: string;
  description: string;
  setup_price_jod: number;
  monthly_price_jod: number;
  efficiency: number;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
}

export interface PricingConfigRow {
  key: string;
  value: number;
  description: string;
}

export interface PricingConfig {
  exchangeRateUsd: number;
  taxRate: number;
  systemCreationFee: number;
  bulkMessagingMonthly: number;
}

export interface Proposal {
  id: string;
  user_id: string;
  reference_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'expired';
  client_company: string;
  client_contact: string | null;
  client_role: string | null;
  client_narrative: string | null;
  industry_id: string;
  currency: 'JOD' | 'USD';
  is_tax_enabled: boolean;
  infrastructure_type: string | null;
  hosting_provider: string | null;
  bulk_messaging: boolean;
  channels: string[] | null;
  total_setup_jod: number;
  total_monthly_jod: number;
  total_yearly_jod: number;
  impact_score: number;
  snapshot_exchange_rate: number | null;
  snapshot_tax_rate: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProposalModule {
  proposal_id: string;
  module_id: string;
  module_name: string;
  setup_price: number;
  monthly_price: number;
  efficiency: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface CalculateRequest {
  moduleIds: string[];
  currency: 'JOD' | 'USD';
  isTaxEnabled: boolean;
  infrastructureType: 'integration_only' | 'system_creation' | null;
  bulkMessaging: boolean;
}

export interface CalculateResponse {
  totalSetup: number;
  totalMonthly: number;
  totalYearly: number;
  impactScore: number;
}
