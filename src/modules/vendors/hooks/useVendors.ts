import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VendorService } from '../services/vendorService';
import { VendorFilters } from '../types/vendor';
import { Database } from '@/types/database';

type VendorInsert = Database['public']['Tables']['vendors']['Insert'];
type VendorUpdate = Database['public']['Tables']['vendors']['Update'];

export const useVendors = (
  filters: VendorFilters = {},
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: ['vendors', filters, page, limit],
    queryFn: () => VendorService.getVendors(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useVendorById = (id: string) => {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: () => VendorService.getVendorById(id),
    enabled: !!id,
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vendor: VendorInsert) => VendorService.createVendor(vendor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-metrics'] });
    },
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: VendorUpdate }) =>
      VendorService.updateVendor(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors', id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-metrics'] });
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => VendorService.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-metrics'] });
    },
  });
};

export const useVendorMetrics = () => {
  return useQuery({
    queryKey: ['vendor-metrics'],
    queryFn: VendorService.getVendorMetrics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
