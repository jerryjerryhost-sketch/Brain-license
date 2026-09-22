-- ==============================================================================
-- BRAIN CLOUD LICENSING - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query -> Paste & Run)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY DEFAULT ('lic-' || substr(md5(random()::text), 1, 12)),
    client_name TEXT NOT NULL,
    machine_id TEXT UNIQUE NOT NULL,
    license_type TEXT DEFAULT 'SUBSCRIPTION', -- 'SUBSCRIPTION', 'PERPETUAL', 'TRIAL'
    issued_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,                -- YYYY-MM-DD or 'PERPETUAL'
    status TEXT DEFAULT 'ACTIVE',             -- 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED'
    license_key TEXT NOT NULL,
    max_users INTEGER DEFAULT 0,              -- 0 = Unlimited, >0 = Max user accounts allowed
    app_version TEXT DEFAULT '',
    last_ip TEXT DEFAULT '',
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_licenses_machine_id ON licenses(machine_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_last_sync ON licenses(last_sync_at);

-- Enable Row Level Security (RLS) but allow service role full access
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public sync access" 
ON licenses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Migration for existing databases:
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 0;
