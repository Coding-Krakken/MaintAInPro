import { User } from '@/types';

export type { User } from '@/types';

export interface AuthState {
  user: User | null;
  session: any | null;
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
  supabaseUser: any,
  profile?: any
): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    avatar: profile?.avatar || supabaseUser.user_metadata?.avatar_url,
    role: profile?.role || 'viewer',
    organizationId: profile?.organization_id || '',
    warehouseIds: profile?.warehouse_ids || [],
    permissions: profile?.permissions || [],
    isActive: profile?.is_active ?? true,
    lastLoginAt: profile?.last_login_at ? new Date(profile.last_login_at) : new Date(),
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(profile?.updated_at || supabaseUser.updated_at || supabaseUser.created_at),
  };
};
