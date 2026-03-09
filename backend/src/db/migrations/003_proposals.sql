-- 003_proposals.sql
-- Proposals and their module snapshots

CREATE TABLE proposals (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reference_number      VARCHAR(50) UNIQUE NOT NULL,
    status                VARCHAR(20) NOT NULL DEFAULT 'draft',

    -- Client info
    client_company        VARCHAR(255) NOT NULL,
    client_contact        VARCHAR(255),
    client_role           VARCHAR(255),
    client_narrative      TEXT,

    -- Configuration snapshot
    industry_id           VARCHAR(50) NOT NULL REFERENCES industries(id),
    currency              VARCHAR(3) NOT NULL DEFAULT 'JOD',
    is_tax_enabled        BOOLEAN NOT NULL DEFAULT false,
    infrastructure_type   VARCHAR(50),
    hosting_provider      VARCHAR(50),
    bulk_messaging        BOOLEAN NOT NULL DEFAULT false,
    channels              TEXT[],

    -- Calculated totals (in base JOD)
    total_setup_jod       NUMERIC(10,2) NOT NULL,
    total_monthly_jod     NUMERIC(10,2) NOT NULL,
    total_yearly_jod      NUMERIC(10,2) NOT NULL,
    impact_score          INT NOT NULL,

    -- Rate snapshot at creation time
    snapshot_exchange_rate NUMERIC(10,4),
    snapshot_tax_rate      NUMERIC(10,4),

    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposals_user ON proposals(user_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- Snapshots module data at save time so catalog changes don't alter old proposals
CREATE TABLE proposal_modules (
    proposal_id   UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    module_id     VARCHAR(100) NOT NULL,
    module_name   VARCHAR(255) NOT NULL,
    setup_price   NUMERIC(10,2) NOT NULL,
    monthly_price NUMERIC(10,2) NOT NULL,
    efficiency    INT NOT NULL,
    PRIMARY KEY (proposal_id, module_id)
);

-- Pricing config: key-value table for database-driven pricing
CREATE TABLE pricing_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       NUMERIC(10,4) NOT NULL,
    description VARCHAR(255),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
