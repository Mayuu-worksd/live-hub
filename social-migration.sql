-- ═══════════════════════════════════════════════════════
-- LiveHub — Migration: Social System Overhaul
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Profiles: Privacy & Status
alter table public.profiles
add column if not exists is_private boolean not null default false,
add column if not exists message_privacy text not null default 'everyone' check (message_privacy in ('everyone', 'followers', 'nobody')),
add column if not exists is_online boolean not null default false,
add column if not exists last_seen timestamptz not null default now();

-- 2. Follow Requests Table
create table if not exists public.follow_requests (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(follower_id, following_id)
);

-- 3. Conversations: Message Requests Support
alter table public.conversations
add column if not exists is_approved boolean not null default true,
add column if not exists initiated_by uuid references public.users(id);

-- Approve all legacy conversations
update public.conversations set is_approved = true where initiated_by is null;

-- 4. RLS for Follow Requests
alter table public.follow_requests enable row level security;

create policy "Users can view requests they sent or received"
on public.follow_requests for select
using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "Users can insert their own requests"
on public.follow_requests for insert
with check (auth.uid() = follower_id);

create policy "Users can delete requests they sent or received"
on public.follow_requests for delete
using (auth.uid() = follower_id or auth.uid() = following_id);

-- 5. Realtime Updates
alter publication supabase_realtime add table public.follow_requests;
