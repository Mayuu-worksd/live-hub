-- ═══════════════════════════════════════════════════════
-- LiveHub — Migration: Secure Direct Messaging
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Create User Blocks Table
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);

-- 2. Add Deleted Flag to Messages for "Delete for Everyone"
alter table public.messages 
add column if not exists is_deleted boolean not null default false,
add column if not exists deleted_at timestamptz;

-- 3. Enable Row Level Security (RLS)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.user_blocks enable row level security;

-- 4. Conversations Policies
create policy "Users can view their conversations" 
on public.conversations for select 
using (auth.uid() = participant_one or auth.uid() = participant_two);

create policy "Users can insert conversations they are in" 
on public.conversations for insert 
with check (auth.uid() = participant_one or auth.uid() = participant_two);

-- 5. Messages Policies
create policy "Users can view messages in their conversations" 
on public.messages for select 
using (
  exists (
    select 1 from public.conversations c 
    where c.id = messages.conversation_id 
    and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
  )
);

create policy "Users can insert messages in their conversations" 
on public.messages for insert 
with check (
  auth.uid() = sender_id and
  exists (
    select 1 from public.conversations c 
    where c.id = conversation_id 
    and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
  )
);

create policy "Senders can update their messages (soft delete)" 
on public.messages for update 
using (auth.uid() = sender_id);

-- 6. User Blocks Policies
create policy "Users can view their own blocks" 
on public.user_blocks for select 
using (auth.uid() = blocker_id);

create policy "Users can manage their own blocks" 
on public.user_blocks for all 
using (auth.uid() = blocker_id);

-- 7. Enable Realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
