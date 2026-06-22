-- ═══════════════════════════════════════════════════════
-- LiveHub — Migration: RBAC Architecture
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Add onboarding_completed flag
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 2. Add platform column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'public'
CHECK (platform IN ('public', 'admin', 'agency'));

-- 3. Mark existing admin/agency as onboarded + set platform
UPDATE public.users
SET onboarding_completed = true, platform = 'admin'
WHERE role IN ('admin', 'super_admin', 'moderator');

UPDATE public.users
SET onboarding_completed = true, platform = 'agency'
WHERE role = 'agency_manager';

-- 4. Mark existing viewers/creators as onboarded (they already chose implicitly)
UPDATE public.users
SET onboarding_completed = true
WHERE role IN ('viewer', 'creator', 'verified_creator');

-- 5. Add role constraint
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role IN ('viewer','creator','verified_creator','agency_manager','moderator','admin','super_admin'));