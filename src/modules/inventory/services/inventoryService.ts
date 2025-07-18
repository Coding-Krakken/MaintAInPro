import { supabase } from '@/services/supabase';
import { PartFilters, StockStatus } from '../types/inventory';
import { Database } from '@/types/database';

type PartInsert = Database['public']['Tables']['parts']['Insert'];
type PartUpdate = Database['public']['Tables']['parts']['Update'];

export class InventoryService {
  static async getParts(
    filters: PartFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    let query = supabase
      .from('parts')
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
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,part_number.ilike.%${filters.search}%`
      );
    }

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.manufacturer) {
      query = query.ilike('manufacturer', `%${filters.manufacturer}%`);
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.isConsumable !== undefined) {
      query = query.eq('is_consumable', filters.isConsumable);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters.lowStock) {
      // For low stock filter, we'll need to handle this on the client side
      // since Supabase doesn't support column comparisons in this way
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch parts: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  static async getPartById(id: string) {
    const { data, error } = await supabase
      .from('parts')
      .select(
        `
        *,
        categories(name)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch part: ${error.message}`);
    }

    return data;
  }

  static async createPart(part: PartInsert) {
    const { data, error } = await supabase
      .from('parts')
      .insert(part)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create part: ${error.message}`);
    }

    return data;
  }

  static async updatePart(id: string, updates: PartUpdate) {
    const { data, error } = await supabase
      .from('parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update part: ${error.message}`);
    }

    return data;
  }

  static async deletePart(id: string) {
    const { error } = await supabase.from('parts').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete part: ${error.message}`);
    }
  }

  static getStockStatus(part: {
    stock_quantity: number;
    reorder_point: number;
    min_stock_level: number;
    max_stock_level: number;
  }): StockStatus {
    const { stock_quantity, reorder_point, min_stock_level, max_stock_level } =
      part;

    if (stock_quantity <= 0) {
      return StockStatus.OUT_OF_STOCK;
    }

    if (stock_quantity <= reorder_point || stock_quantity <= min_stock_level) {
      return StockStatus.LOW_STOCK;
    }

    if (max_stock_level > 0 && stock_quantity > max_stock_level) {
      return StockStatus.OVER_STOCK;
    }

    return StockStatus.IN_STOCK;
  }

  static async getLowStockParts() {
    // We'll fetch all parts and filter on the client side since Supabase doesn't support column comparisons
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch low stock parts: ${error.message}`);
    }

    // Filter for low stock on the client side
    const lowStockParts = (data || []).filter(
      part => part.stock_quantity <= part.reorder_point
    );

    return lowStockParts;
  }

  static async getInventoryMetrics() {
    const { data, error } = await supabase
      .from('parts')
      .select('stock_quantity, unit_cost, reorder_point, is_active')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch inventory metrics: ${error.message}`);
    }

    const totalParts = data.length;
    const totalValue = data.reduce(
      (sum, part) => sum + part.stock_quantity * part.unit_cost,
      0
    );
    const lowStockParts = data.filter(
      part => part.stock_quantity <= part.reorder_point
    ).length;
    const outOfStockParts = data.filter(
      part => part.stock_quantity <= 0
    ).length;

    return {
      totalParts,
      totalValue,
      lowStockParts,
      outOfStockParts,
    };
  }
}
