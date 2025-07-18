import { useQuery } from '@tanstack/react-query';
import { EquipmentService } from '../services/equipmentService';
import { userService } from '../../auth/services/userService';

/**
 * Hook to get equipment options for work order creation
 */
export function useEquipmentOptions() {
  return useQuery({
    queryKey: ['equipment-options'],
    queryFn: () => EquipmentService.getEquipmentOptions(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

/**
 * Hook to search equipment by name, asset tag, or location
 */
export function useEquipmentSearch(searchTerm: string) {
  return useQuery({
    queryKey: ['equipment-search', searchTerm],
    queryFn: () => EquipmentService.searchEquipment(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });
}

/**
 * Hook to get available technicians for work order assignment
 */
export function useTechnicians() {
  return useQuery({
    queryKey: ['technicians'],
    queryFn: () => userService.getTechnicians(),
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
  });
}

/**
 * Hook to get user availability for assignment
 */
export function useUserAvailability(userId: string) {
  return useQuery({
    queryKey: ['user-availability', userId],
    queryFn: () => userService.getUserAvailability(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
  });
}
