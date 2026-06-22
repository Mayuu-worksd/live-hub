export type UserRole =
  | 'viewer'
  | 'creator'
  | 'verified_creator'
  | 'agency_manager'
  | 'moderator'
  | 'admin'
  | 'super_admin';

export type UserPlatform = 'public' | 'admin' | 'agency';

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  username: string;
  role: UserRole;
  platform: UserPlatform;
  onboarding_completed: boolean;
  is_verified: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  country: string | null;
  followers_count: number;
  following_count: number;
  total_earned: number;
  social_links: Record<string, string>;
  interests: string[];
}

export interface UserProfile extends User {
  profile: Profile;
}

// Role helpers
export const PUBLIC_ROLES: UserRole[] = ['viewer', 'creator', 'verified_creator'];
export const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin', 'moderator'];
export const AGENCY_ROLES: UserRole[] = ['agency_manager'];
export const CREATOR_ROLES: UserRole[] = ['creator', 'verified_creator'];
