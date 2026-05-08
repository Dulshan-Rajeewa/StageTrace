-- Creates Supabase-compatible tables for StageTrace snapshots and incident tracking

create table if not exists snapshots (
    id uuid primary key,
    environment text not null check (environment in ('staging', 'production')),
    config jsonb not null,
    captured_at timestamptz not null default now()
);

create table if not exists incidents (
    id uuid primary key,
    snapshot_id uuid not null references snapshots(id) on delete cascade,
    deltas jsonb not null,
    severity text not null check (severity in ('high', 'medium', 'low')),
    created_at timestamptz not null default now()
);
