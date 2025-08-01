export { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

// Export types for convenience
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): string => {
  if (error?.message) {
    // Common error messages mapping
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed':
        'Please check your email and click the confirmation link',
      'User not found': 'Account not found',
      'duplicate key value violates unique constraint':
        'A record with this information already exists',
      'permission denied': 'You do not have permission to perform this action',
      'row level security': 'Access denied',
    };

    const message = error.message;
    for (const [key, value] of Object.entries(errorMap)) {
      if (message.includes(key)) {
        return value;
      }
    }

    return message;
  }

  return 'An unexpected error occurred';
};
