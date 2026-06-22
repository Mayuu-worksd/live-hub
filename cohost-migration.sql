-- ═══════════════════════════════════════════════════════
-- LiveHub — Migration: Co-host & Viewer Tracking
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Create Cohost Requests Table
create table if not exists public.cohost_requests (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.streams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'invited', 'accepted', 'rejected', 'removed', 'left'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(stream_id, user_id)
);

-- 2. Update stream_viewers table to track leaved_at and watch_duration
alter table public.stream_viewers 
add column if not exists leaved_at timestamptz,
add column if not exists watch_duration_seconds integer default 0;

-- Drop unique constraint to allow multiple sessions on the same stream by same user
alter table public.stream_viewers drop constraint if exists stream_viewers_stream_id_user_id_key;

-- 3. Enable RLS on cohost_requests
alter table public.cohost_requests enable row level security;

-- 4. Create RLS Policies
create policy "Anyone can read cohost requests" 
on public.cohost_requests for select 
using (true);

create policy "Service role full access on cohost requests" 
on public.cohost_requests for all 
using (true)
with check (true);

-- 5. Enable Realtime for cohost_requests
alter publication supabase_realtime add table public.cohost_requests;
