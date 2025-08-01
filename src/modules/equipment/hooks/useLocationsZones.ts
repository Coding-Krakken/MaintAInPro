import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useLocationsZones(organizationId: string) {
  return useQuery({
    queryKey: ['locations-zones', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations_zones')
        .select('id, name')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}
