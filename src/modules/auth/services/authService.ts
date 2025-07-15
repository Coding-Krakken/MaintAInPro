import { supabase } from '../../../lib/supabase';
import { userService } from '../../../lib/database';
import type { User, AuthState } from '../types/auth';
import type { Permission } from '../../../types';

export class AuthService {
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      // Get user profile from our users table
      const userProfile = await userService.getProfile(data.user.id);

      // Update last login
      await userService.updateProfile(data.user.id, {
        lastLoginAt: new Date(),
      });

      return { user: userProfile, error: null };
    } catch (error: unknown) {
      return {
        user: null,
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async signUp(
    email: string,
    password: string,
    userData: {
      first_name: string;
      last_name: string;
      organization_id: string;
      role?: string;
      department?: string;
      phone?: string;
    }
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        // Create user profile in our users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email!,
              ...userData,
            },
          ])
          .select()
          .single();

        if (profileError) {
          return { user: null, error: profileError.message };
        }

        return { user: userProfile, error: null };
      }

      return { user: null, error: 'User registration failed' };
    } catch (error: unknown) {
      return {
        user: null,
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error: unknown) {
      return {
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('🔍 Getting current user...');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log('❌ No authenticated user found');
        return null;
      }

      console.log('✅ Auth user found, getting profile...');

      // Try to get the user profile from our users table
      const userProfile = await userService.getProfile(user.id);

      // If user exists in auth but not in our users table, return null for now
      // This will cause the auth hook to not be in a loading state
      if (!userProfile) {
        console.warn('⚠️ User exists in auth but not in users table:', user.id);
        return null;
      }

      console.log('✅ User profile retrieved successfully');
      return userProfile as User;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  async getSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async updateProfile(
    updates: Partial<User>
  ): Promise<{ user: User | null; error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { user: null, error: 'No authenticated user' };
      }

      const updatedProfile = await userService.updateProfile(user.id, updates);
      return { user: updatedProfile, error: null };
    } catch (error: unknown) {
      return {
        user: null,
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error: error?.message || null };
    } catch (error: unknown) {
      return {
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  onAuthStateChange(callback: (state: AuthState) => void) {
    return supabase.auth.onAuthStateChange(async (_, session) => {
      let user: User | null = null;

      if (session?.user) {
        try {
          user = await userService.getProfile(session.user.id);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }

      callback({
        user,
        isLoading: false,
        session: session,
        isAuthenticated: !!session && !!user,
      });
    });
  }

  // Permission checking methods
  hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;

    // Super admins have all permissions
    if (user.role === 'super_admin') return true;

    // Check if user has specific permission
    return user.permissions?.includes(permission as Permission) || false;
  }

  hasRole(user: User | null, role: string | string[]): boolean {
    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }

  canAccessModule(user: User | null, module: string): boolean {
    if (!user) return false;

    // Define module permissions
    const modulePermissions: Record<string, string[]> = {
      equipment: ['equipment.view', 'equipment.create', 'equipment.edit'],
      work_orders: [
        'work_orders.view',
        'work_orders.create',
        'work_orders.edit',
      ],
      inventory: ['inventory.view', 'inventory.create', 'inventory.edit'],
      vendors: ['vendors.view', 'vendors.create', 'vendors.edit'],
      preventive_maintenance: ['pm.view', 'pm.create', 'pm.edit'],
      reports: ['reports.view'],
      settings: ['settings.view', 'settings.edit'],
    };

    const requiredPermissions = modulePermissions[module] || [];
    return requiredPermissions.some(permission =>
      this.hasPermission(user, permission)
    );
  }
}

export const authService = new AuthService();
