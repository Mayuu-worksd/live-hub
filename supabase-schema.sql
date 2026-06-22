-- ═══════════════════════════════════════════════════════
-- LiveHub — Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── Teardown (Run to reset database cleanly) ─────────────
drop table if exists public.audit_logs cascade;
drop table if exists public.admin_settings cascade;
drop table if exists public.call_billing cascade;
drop table if exists public.video_purchases cascade;
drop table if exists public.videos cascade;
drop table if exists public.photos cascade;
drop table if exists public.posts cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.reports cascade;
drop table if exists public.notifications cascade;
drop table if exists public.agency_members cascade;
drop table if exists public.withdrawals cascade;
drop table if exists public.call_sessions cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.subscription_plans cascade;
drop table if exists public.stream_gifts cascade;
drop table if exists public.gift_catalog cascade;
drop table if exists public.stream_messages cascade;
drop table if exists public.stream_viewers cascade;
drop table if exists public.streams cascade;
drop table if exists public.coin_packages cascade;
drop table if exists public.wallet_transactions cascade;
drop table if exists public.wallets cascade;
drop table if exists public.followers cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;

-- ── Users ────────────────────────────────────────────────
create table public.users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  email text unique not null,
  username text unique not null,
  role text not null default 'viewer',
  platform text not null default 'public',
  is_verified boolean not null default false,
  is_banned boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Profiles ─────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references public.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  cover_url text,
  country text,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  total_earned numeric not null default 0,
  social_links jsonb not null default '{}'::jsonb
);

-- ── Followers ────────────────────────────────────────────
create table public.followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(follower_id, following_id)
);

-- ── Wallets ──────────────────────────────────────────────
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.users(id) on delete cascade,
  coin_balance integer not null default 0,
  diamond_balance integer not null default 0,
  pending_withdrawal integer not null default 0,
  total_earned integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ── Wallet Transactions ──────────────────────────────────
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  type text not null,
  amount numeric not null default 0,
  coins_delta integer not null default 0,
  diamonds_delta integer not null default 0,
  reference_id text,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- ── Coin Packages ────────────────────────────────────────
create table public.coin_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  coins integer not null,
  price_usd numeric not null,
  price_inr numeric not null default 0,
  bonus_coins integer not null default 0,
  is_popular boolean not null default false,
  is_active boolean not null default true
);

-- Seed default packages
insert into public.coin_packages (name, coins, price_usd, price_inr, bonus_coins, is_popular) values
  ('Starter', 100, 0.99, 82, 0, false),
  ('Basic', 500, 4.99, 415, 50, false),
  ('Popular', 1200, 9.99, 830, 200, true),
  ('Pro', 3000, 24.99, 2075, 600, false),
  ('Elite', 6500, 49.99, 4150, 1500, false),
  ('Ultimate', 14000, 99.99, 8300, 4000, false);

-- ── Streams ──────────────────────────────────────────────
create table public.streams (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users(id) on delete cascade,
  livekit_room_name text not null,
  title text not null,
  thumbnail_url text,
  category text not null,
  status text not null default 'offline',
  viewer_count integer not null default 0,
  peak_viewers integer not null default 0,
  total_gifts_received integer not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Stream Viewers ───────────────────────────────────────
create table public.stream_viewers (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.streams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(stream_id, user_id)
);

-- ── Stream Messages ──────────────────────────────────────
create table public.stream_messages (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.streams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  type text not null default 'text',
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ── Gift Catalog ─────────────────────────────────────────
create table public.gift_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  coin_cost integer not null,
  animation_url text,
  category text not null default 'basic',
  is_active boolean not null default true,
  emoji text
);

insert into public.gift_catalog (name, coin_cost, category, emoji) values
  ('Rose', 1, 'basic', '🌹'),
  ('Heart', 5, 'basic', '💖'),
  ('Star', 10, 'basic', '⭐'),
  ('Gem', 50, 'premium', '💎'),
  ('Crown', 100, 'premium', '👑'),
  ('Rocket', 500, 'premium', '🚀'),
  ('Galaxy', 1000, 'ultra', '🌌'),
  ('Dragon', 5000, 'ultra', '🐉');

-- ── Stream Gifts ─────────────────────────────────────────
create table public.stream_gifts (
  id uuid primary key default gen_random_uuid(),
  stream_id uuid not null references public.streams(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  gift_id uuid not null references public.gift_catalog(id),
  quantity integer not null default 1,
  coins_spent integer not null,
  diamonds_earned integer not null,
  created_at timestamptz not null default now()
);

-- ── Subscriptions ────────────────────────────────────────
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  coin_price integer not null,
  duration_days integer not null default 30,
  benefits text[],
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.users(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status text not null default 'active',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ── Call Sessions ────────────────────────────────────────
create table public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references public.users(id) on delete cascade,
  callee_id uuid not null references public.users(id) on delete cascade,
  call_type text not null default 'audio',
  livekit_room_name text,
  status text not null default 'ringing',
  coin_rate_per_minute integer not null default 10,
  started_at timestamptz,
  ended_at timestamptz,
  total_coins_charged integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── Withdrawals ──────────────────────────────────────────
create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  diamond_amount integer not null,
  payment_method text not null,
  payment_details text not null,
  status text not null default 'pending',
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── Agency Members ───────────────────────────────────────
create table public.agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.users(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  commission_rate numeric not null default 0.1,
  created_at timestamptz not null default now(),
  unique(agency_id, creator_id)
);

-- ── Notifications ────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Reports ──────────────────────────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  reported_id uuid not null references public.users(id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

-- ── Conversations & Messages (DMs) ───────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one uuid not null references public.users(id) on delete cascade,
  participant_two uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(participant_one, participant_two)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  message_type text not null default 'text',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Posts & Premium Content ──────────────────────────────
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  content text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  video_url text not null,
  coin_price integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.video_purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  coins_spent integer not null,
  created_at timestamptz not null default now(),
  unique(buyer_id, video_id)
);

-- ── Call Billing ─────────────────────────────────────────
create table public.call_billing (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.call_sessions(id) on delete cascade,
  caller_id uuid not null references public.users(id) on delete cascade,
  callee_id uuid not null references public.users(id) on delete cascade,
  duration_seconds integer not null,
  total_coins integer not null,
  creator_diamonds integer not null,
  created_at timestamptz not null default now()
);

-- ── Admin Settings & Audit Logs ──────────────────────────
create table public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null,
  setting_value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.users(id),
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════
-- RPC Helper Functions
-- ═══════════════════════════════════════════════════════

create or replace function increment_coins(p_user_id uuid, p_amount integer)
returns void language plpgsql security definer as $$
begin
  update wallets set coin_balance = coin_balance + p_amount where user_id = p_user_id;
end;
$$;

create or replace function increment_diamonds(p_user_id uuid, p_amount integer)
returns void language plpgsql security definer as $$
begin
  update wallets set diamond_balance = diamond_balance + p_amount where user_id = p_user_id;
end;
$$;

create or replace function increment_stream_gifts(p_stream_id uuid, p_amount integer)
returns void language plpgsql security definer as $$
begin
  update streams set total_gifts_received = total_gifts_received + p_amount where id = p_stream_id;
end;
$$;

-- ═══════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.streams enable row level security;
alter table public.stream_messages enable row level security;
alter table public.notifications enable row level security;

-- Public read for users and profiles
create policy "Public read users" on public.users for select using (true);
create policy "Public read profiles" on public.profiles for select using (true);
create policy "Public read streams" on public.streams for select using (true);
create policy "Public read stream messages" on public.stream_messages for select using (true);
create policy "Public read gift catalog" on public.gift_catalog for select using (true);
create policy "Public read coin packages" on public.coin_packages for select using (true);

-- Wallets: only service role can write (via supabaseAdmin), anon cannot read others
create policy "No anon wallet read" on public.wallets for select using (false);

-- Notifications: user can only see their own
create policy "Own notifications" on public.notifications for select using (auth.uid()::text = user_id::text);

-- ═══════════════════════════════════════════════════════
-- Realtime
-- ═══════════════════════════════════════════════════════

alter publication supabase_realtime add table public.stream_messages;
alter publication supabase_realtime add table public.streams;
alter publication supabase_realtime add table public.stream_gifts;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.reports;
alter publication supabase_realtime add table public.withdrawals;
