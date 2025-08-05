import { useQuery } from '@tanstack/react-query';
import { InventoryService } from '../services/inventoryService';

export function usePartsOptions() {
  return useQuery({
    queryKey: ['parts-options'],
    queryFn: async () => {
      // Use correct filter key for DB: is_active
      const { data } = await InventoryService.getParts(
        { is_active: true },
        1,
        100
      );
      return (
        data?.map(part => ({
          value: part.id,
          label: `${part.name} (${part.partNumber})`,
          data: part,
        })) || []
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}
