import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EquipmentService } from '../services/equipmentService';
import { EquipmentFilters } from '../types/equipment';
import { Database } from '@/types/database';

type EquipmentInsert = Database['public']['Tables']['equipment']['Insert'];
type EquipmentUpdate = Database['public']['Tables']['equipment']['Update'];

export const useEquipment = (
  filters: EquipmentFilters = {},
  page: number = 1,
  limit: number = 20
) => {
  return useQuery({
    queryKey: ['equipment', filters, page, limit],
    queryFn: () => EquipmentService.getEquipment(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEquipmentById = (id: string) => {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => EquipmentService.getEquipmentById(id),
    enabled: !!id,
  });
};

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipment: EquipmentInsert) =>
      EquipmentService.createEquipment(equipment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: EquipmentUpdate }) =>
      EquipmentService.updateEquipment(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', id] });
    },
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => EquipmentService.deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};

export const useManufacturers = () => {
  return useQuery({
    queryKey: ['equipment-manufacturers'],
    queryFn: EquipmentService.getManufacturers,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useLocations = () => {
  return useQuery({
    queryKey: ['equipment-locations'],
    queryFn: EquipmentService.getLocations,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
