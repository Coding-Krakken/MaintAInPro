import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/database';

type User = Database['public']['Tables']['users']['Row'];

export class UserService {
  /**
   * Get all technicians available for work order assignment
   */
  static async getTechnicians(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .in('role', ['technician', 'senior_technician', 'supervisor'])
      .order('first_name');

    if (error) {
      throw new Error(`Failed to fetch technicians: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all users by role
   */
  static async getUsersByRole(roleName: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .eq('role', roleName)
      .order('first_name');

    if (error) {
      throw new Error(`Failed to fetch users by role: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user availability for assignment
   */
  static async getUserAvailability(userId: string): Promise<{
    isAvailable: boolean;
    currentWorkOrderCount: number;
    maxWorkOrders: number;
  }> {
    try {
      // Get current work orders assigned to user
      const { count: currentWorkOrderCount, error: countError } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .in('status', ['open', 'assigned', 'in_progress']);

      if (countError) {
        throw new Error(`Failed to count work orders: ${countError.message}`);
      }

      // For now, set max work orders per technician to 10
      // This should be configurable in the future
      const maxWorkOrders = 10;
      const isAvailable = (currentWorkOrderCount || 0) < maxWorkOrders;

      return {
        isAvailable,
        currentWorkOrderCount: currentWorkOrderCount || 0,
        maxWorkOrders,
      };
    } catch (error) {
      console.error('Error checking user availability:', error);
      return {
        isAvailable: true,
        currentWorkOrderCount: 0,
        maxWorkOrders: 10,
      };
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  }

  /**
   * Get technicians with skills matching equipment type
   */
  static async getTechniciansForEquipment(): Promise<User[]> {
    // TODO: Implement skill matching when equipment types and user skills are defined
    // For now, return all available technicians
    return this.getTechnicians();
  }
}

export const userService = UserService;
