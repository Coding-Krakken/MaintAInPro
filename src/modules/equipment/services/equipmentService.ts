import { supabase } from '@/services/supabase';
import { EquipmentFilters } from '../types/equipment';
import { Database } from '@/types/database';

type EquipmentInsert = Database['public']['Tables']['equipment']['Insert'];
type EquipmentUpdate = Database['public']['Tables']['equipment']['Update'];

export class EquipmentService {
  static async getEquipment(
    filters: EquipmentFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    let query = supabase
      .from('equipment')
      .select(
        `
        *,
        categories(name)
      `
      )
      .order('updated_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%,asset_tag.ilike.%${filters.search}%`
      );
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.condition) {
      query = query.eq('condition', filters.condition);
    }

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.manufacturer) {
      query = query.ilike('manufacturer', `%${filters.manufacturer}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  static async getEquipmentById(id: string) {
    const { data, error } = await supabase
      .from('equipment')
      .select(
        `
        *,
        categories(name),
        work_orders(id, title, status, priority, created_at)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch equipment: ${error.message}`);
    }

    return data;
  }

  static async createEquipment(equipment: EquipmentInsert) {
    const { data, error } = await supabase
      .from('equipment')
      .insert(equipment)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create equipment: ${error.message}`);
    }

    return data;
  }

  static async updateEquipment(id: string, updates: EquipmentUpdate) {
    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update equipment: ${error.message}`);
    }

    return data;
  }

  static async deleteEquipment(id: string) {
    const { error } = await supabase.from('equipment').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete equipment: ${error.message}`);
    }
  }

  static async getManufacturers() {
    const { data, error } = await supabase
      .from('equipment')
      .select('manufacturer')
      .not('manufacturer', 'is', null)
      .order('manufacturer');

    if (error) {
      throw new Error(`Failed to fetch manufacturers: ${error.message}`);
    }

    // Get unique manufacturers
    const manufacturers = [...new Set(data.map(item => item.manufacturer))];
    return manufacturers.filter(Boolean);
  }

  static async getLocations() {
    const { data, error } = await supabase
      .from('equipment')
      .select('location')
      .not('location', 'is', null)
      .order('location');

    if (error) {
      throw new Error(`Failed to fetch locations: ${error.message}`);
    }

    // Get unique locations
    const locations = [...new Set(data.map(item => item.location))];
    return locations.filter(Boolean);
  }

  /**
   * Get equipment options for work order assignment
   */
  static async getEquipmentOptions() {
    const { data, error } = await supabase
      .from('equipment')
      .select(
        `
        id,
        name,
        asset_tag,
        location,
        status,
        condition,
        categories(name)
      `
      )
      .eq('status', 'active')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch equipment options: ${error.message}`);
    }

    return (
      data?.map(equipment => ({
        value: equipment.id,
        label: `${equipment.name} (${equipment.asset_tag || 'No Tag'}) - ${equipment.location || 'No Location'}`,
        data: equipment,
      })) || []
    );
  }

  /**
   * Search equipment by name, asset tag, or location
   */
  static async searchEquipment(searchTerm: string) {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const { data, error } = await supabase
      .from('equipment')
      .select(
        `
        id,
        name,
        asset_tag,
        location,
        status,
        condition,
        categories(name)
      `
      )
      .or(
        `name.ilike.%${searchTerm}%,asset_tag.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`
      )
      .eq('status', 'active')
      .order('name')
      .limit(50);

    if (error) {
      throw new Error(`Failed to search equipment: ${error.message}`);
    }

    return (
      data?.map(equipment => ({
        value: equipment.id,
        label: `${equipment.name} (${equipment.asset_tag || 'No Tag'}) - ${equipment.location || 'No Location'}`,
        data: equipment,
      })) || []
    );
  }
}
