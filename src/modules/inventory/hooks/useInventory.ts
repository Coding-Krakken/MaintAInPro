import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryService } from '../services/inventoryService';
import { PartFilters } from '../types/inventory';
import { Database } from '@/types/database';

type PartInsert = Database['public']['Tables']['parts']['Insert'];
type PartUpdate = Database['public']['Tables']['parts']['Update'];

export const useParts = (
  filters: PartFilters = {},
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: ['parts', filters, page, limit],
    queryFn: () => InventoryService.getParts(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePartById = (id: string) => {
  return useQuery({
    queryKey: ['parts', id],
    queryFn: () => InventoryService.getPartById(id),
    enabled: !!id,
  });
};

export const useCreatePart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (part: PartInsert) => InventoryService.createPart(part),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-metrics'] });
    },
  });
};

export const useUpdatePart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PartUpdate }) =>
      InventoryService.updatePart(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['parts', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-metrics'] });
    },
  });
};

export const useDeletePart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => InventoryService.deletePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-metrics'] });
    },
  });
};

export const useLowStockParts = () => {
  return useQuery({
    queryKey: ['parts', 'low-stock'],
    queryFn: InventoryService.getLowStockParts,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useInventoryMetrics = () => {
  return useQuery({
    queryKey: ['inventory-metrics'],
    queryFn: InventoryService.getInventoryMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
