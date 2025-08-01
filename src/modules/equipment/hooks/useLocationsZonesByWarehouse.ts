import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useLocationsZonesByWarehouse(warehouseId: string) {
  return useQuery({
    queryKey: ['locations-zones', warehouseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations_zones')
        .select('id, name')
        .eq('warehouse_id', warehouseId);
      if (error) throw error;
      return data;
    },
    enabled: !!warehouseId,
  });
}
