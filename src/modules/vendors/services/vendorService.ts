import { supabase } from '@/services/supabase';
import { VendorFilters } from '../types/vendor';
import { Database } from '@/types/database';

type VendorInsert = Database['public']['Tables']['vendors']['Insert'];
type VendorUpdate = Database['public']['Tables']['vendors']['Update'];

export class VendorService {
  static async getVendors(
    filters: VendorFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    let query = supabase
      .from('vendors')
      .select('*')
      .order('updated_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.rating) {
      query = query.gte('rating', filters.rating);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch vendors: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  static async getVendorById(id: string) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch vendor: ${error.message}`);
    }

    return data;
  }

  static async createVendor(vendor: VendorInsert) {
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendor)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create vendor: ${error.message}`);
    }

    return data;
  }

  static async updateVendor(id: string, updates: VendorUpdate) {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update vendor: ${error.message}`);
    }

    return data;
  }

  static async deleteVendor(id: string) {
    const { error } = await supabase.from('vendors').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete vendor: ${error.message}`);
    }
  }

  static async getVendorMetrics() {
    const { data, error } = await supabase
      .from('vendors')
      .select('type, is_active, rating');

    if (error) {
      throw new Error(`Failed to fetch vendor metrics: ${error.message}`);
    }

    const totalVendors = data.length;
    const activeVendors = data.filter(vendor => vendor.is_active).length;
    const vendorsByType = data.reduce(
      (acc, vendor) => {
        acc[vendor.type] = (acc[vendor.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const averageRating =
      data.reduce((sum, vendor) => sum + (vendor.rating || 0), 0) / data.length;

    return {
      totalVendors,
      activeVendors,
      vendorsByType,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }
}
