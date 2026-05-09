CREATE TABLE IF NOT EXISTS snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment TEXT NOT NULL CHECK (environment IN ('staging', 'production')),
    version_tag TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    payload_url TEXT,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    staging_snapshot_id UUID REFERENCES snapshots(id),
    production_snapshot_id UUID REFERENCES snapshots(id),
    status TEXT DEFAULT 'pending'
);