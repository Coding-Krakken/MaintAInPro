import { User, UserRole, Permission } from '@/types';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type { User } from '@/types';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

// Convert Supabase user to application User type
export const transformSupabaseUser = (
  supabaseUser: SupabaseUser,
  profile?: {
    first_name?: string;
    last_name?: string;
    avatar?: string;
    role?: UserRole;
    organization_id?: string;
    warehouse_ids?: string[];
    permissions?: Permission[];
    is_active?: boolean;
    last_login?: string;
    updated_at?: string;
  }
): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    avatar: profile?.avatar || supabaseUser.user_metadata?.['avatar_url'],
    role: profile?.role || 'viewer',
    organizationId: profile?.organization_id || '',
    warehouseIds: profile?.warehouse_ids || [],
    permissions: profile?.permissions || [],
    isActive: profile?.is_active ?? true,
    lastLoginAt: profile?.last_login
      ? new Date(profile.last_login)
      : new Date(),
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(
      profile?.updated_at || supabaseUser.updated_at || supabaseUser.created_at
    ),
  };
};
