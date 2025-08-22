import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Equipment, InsertEquipment } from '../types';
import { apiRequest } from '../lib/queryClient';

export function useEquipment() {
  return useQuery<Equipment[]>({
    queryKey: ['/api/equipment'],
    queryFn: async () => {
      const response = await fetch('/api/equipment', {
        headers: {
          'x-user-id': localStorage.getItem('userId') || 'default-user-id',
          'x-warehouse-id': localStorage.getItem('warehouseId') || 'default-warehouse-id',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch equipment');
      return response.json();
    },
  });
}

export function useEquipmentById(id: string) {
  return useQuery<Equipment>({
    queryKey: ['/api/equipment', id],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/${id}`, {
        headers: {
          'x-user-id': localStorage.getItem('userId') || 'default-user-id',
          'x-warehouse-id': localStorage.getItem('warehouseId') || 'default-warehouse-id',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch equipment');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useEquipmentByAssetTag(assetTag: string) {
  return useQuery<Equipment>({
    queryKey: ['/api/equipment/asset', assetTag],
    queryFn: async () => {
      const response = await fetch(`/api/equipment/asset/${assetTag}`, {
        headers: {
          'x-user-id': localStorage.getItem('userId') || 'default-user-id',
          'x-warehouse-id': localStorage.getItem('warehouseId') || 'default-warehouse-id',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch equipment');
      return response.json();
    },
    enabled: !!assetTag,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipment: InsertEquipment) => {
      const response = await apiRequest('POST', '/api/equipment', equipment);
      return response.json();
    },
    onMutate: async (newEquipment: InsertEquipment) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['/api/equipment'] });

      // Snapshot the previous value
      const previousEquipment = queryClient.getQueryData<Equipment[]>(['/api/equipment']);

      // Optimistically update to the new value
      const optimisticEquipment: Equipment = {
        id: `temp-${Date.now()}`, // Temporary ID until server responds
        assetTag: newEquipment.assetTag,
        model: newEquipment.model,
        description: newEquipment.description || '',
        area: newEquipment.area || null,
        status: (newEquipment.status as 'active' | 'inactive' | 'maintenance' | 'retired') || 'active',
        criticality: (newEquipment.criticality as 'low' | 'medium' | 'high' | 'critical') || 'medium',
        installDate: null,
        warrantyExpiry: null,
        manufacturer: newEquipment.manufacturer || null,
        serialNumber: null,
        specifications: null,
        organizationId: null,
        warehouseId: null,
        tsv: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        createdBy: null,
        updatedBy: null,
        qrCode: null,
      };

      queryClient.setQueryData<Equipment[]>(['/api/equipment'], (old) => {
        return old ? [...old, optimisticEquipment] : [optimisticEquipment];
      });

      // Return a context object with the snapshotted value
      return { previousEquipment };
    },
    onError: (_err, _newEquipment, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['/api/equipment'], context?.previousEquipment);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state is correct
      queryClient.invalidateQueries({ queryKey: ['/api/equipment'] });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertEquipment> }) => {
      const response = await apiRequest('PATCH', `/api/equipment/${id}`, data);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment', id] });
    },
  });
}
