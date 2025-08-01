import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useWarehouses(organizationId: string) {
  return useQuery({
    queryKey: ['warehouses', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .eq('organization_id', organizationId);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}
