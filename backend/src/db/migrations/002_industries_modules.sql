-- 002_industries_modules.sql
-- Industries and their associated AI modules (pricing catalog)

CREATE TABLE industries (
    id          VARCHAR(50) PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    theme_color VARCHAR(7) NOT NULL,
    narrative   TEXT NOT NULL,
    roi         TEXT NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE modules (
    id                VARCHAR(100) PRIMARY KEY,
    industry_id       VARCHAR(50) NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    description       TEXT NOT NULL,
    setup_price_jod   NUMERIC(10,2) NOT NULL,
    monthly_price_jod NUMERIC(10,2) NOT NULL,
    efficiency        INT NOT NULL CHECK (efficiency BETWEEN 0 AND 100),
    sort_order        INT NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_modules_industry ON modules(industry_id);
