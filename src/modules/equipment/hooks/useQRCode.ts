import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  qrCodeService,
  QRCodeGenerationOptions,
  QRScanResult,
} from '../services/qr-code';

export const QR_CODE_QUERY_KEYS = {
  all: ['qr-codes'] as const,
  equipment: (equipmentId: string) =>
    [...QR_CODE_QUERY_KEYS.all, 'equipment', equipmentId] as const,
  scanHistory: (equipmentId: string) =>
    [...QR_CODE_QUERY_KEYS.all, 'scan-history', equipmentId] as const,
  printable: (equipmentIds: string[]) =>
    [...QR_CODE_QUERY_KEYS.all, 'printable', equipmentIds] as const,
};

/**
 * Hook to get QR code for equipment
 */
export function useEquipmentQRCode(equipmentId: string) {
  return useQuery({
    queryKey: QR_CODE_QUERY_KEYS.equipment(equipmentId),
    queryFn: () => qrCodeService.getEquipmentQRCode(equipmentId),
    enabled: !!equipmentId,
  });
}

/**
 * Hook to create QR code for equipment
 */
export function useCreateEquipmentQRCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      equipmentId,
      options,
    }: {
      equipmentId: string;
      options?: QRCodeGenerationOptions;
    }) => qrCodeService.createEquipmentQRCode(equipmentId, options),
    onSuccess: (_, { equipmentId }) => {
      queryClient.invalidateQueries({
        queryKey: QR_CODE_QUERY_KEYS.equipment(equipmentId),
      });
    },
  });
}

/**
 * Hook to regenerate QR code for equipment
 */
export function useRegenerateEquipmentQRCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      equipmentId,
      options,
    }: {
      equipmentId: string;
      options?: QRCodeGenerationOptions;
    }) => qrCodeService.regenerateEquipmentQRCode(equipmentId, options),
    onSuccess: (_, { equipmentId }) => {
      queryClient.invalidateQueries({
        queryKey: QR_CODE_QUERY_KEYS.equipment(equipmentId),
      });
    },
  });
}

/**
 * Hook to batch generate QR codes
 */
export function useBatchGenerateQRCodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      equipmentIds,
      options,
    }: {
      equipmentIds: string[];
      options?: QRCodeGenerationOptions;
    }) => qrCodeService.batchGenerateQRCodes(equipmentIds, options),
    onSuccess: result => {
      // Invalidate all successful equipment QR codes
      result.successful.forEach(qrCode => {
        queryClient.invalidateQueries({
          queryKey: QR_CODE_QUERY_KEYS.equipment(qrCode.equipment_id),
        });
      });
    },
  });
}

/**
 * Hook to scan QR code
 */
export function useScanQRCode() {
  return useMutation({
    mutationFn: (qrCodeData: string) => qrCodeService.scanQRCode(qrCodeData),
  });
}

/**
 * Hook to get QR scan history
 */
export function useQRScanHistory(equipmentId: string, limit: number = 50) {
  return useQuery({
    queryKey: QR_CODE_QUERY_KEYS.scanHistory(equipmentId),
    queryFn: () => qrCodeService.getQRScanHistory(equipmentId, limit),
    enabled: !!equipmentId,
  });
}

/**
 * Hook to get printable QR code labels
 */
export function usePrintableQRCodes(
  equipmentIds: string[],
  labelOptions: {
    includeEquipmentName?: boolean;
    includeLocation?: boolean;
    includeInstructions?: boolean;
    labelSize?: 'small' | 'medium' | 'large';
  } = {}
) {
  return useQuery({
    queryKey: QR_CODE_QUERY_KEYS.printable(equipmentIds),
    queryFn: () =>
      qrCodeService.getPrintableQRCodes(equipmentIds, labelOptions),
    enabled: equipmentIds.length > 0,
  });
}

/**
 * Hook to deactivate QR code
 */
export function useDeactivateQRCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipmentId: string) =>
      qrCodeService.deactivateQRCode(equipmentId),
    onSuccess: (_, equipmentId) => {
      queryClient.invalidateQueries({
        queryKey: QR_CODE_QUERY_KEYS.equipment(equipmentId),
      });
    },
  });
}

/**
 * Custom hook for QR code camera scanning with real implementation
 */
export function useQRCodeCamera() {
  const scanQRCode = useScanQRCode();

  const startCamera = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      return stream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      return null;
    }
  };

  const stopCamera = (stream: MediaStream) => {
    stream.getTracks().forEach(track => track.stop());
  };

  const scanFromCamera = async (
    videoElement: HTMLVideoElement
  ): Promise<QRScanResult | null> => {
    try {
      // Use qr-scanner library for robust QR code detection
      const { default: QrScanner } = await import('qr-scanner');

      // Try to scan QR code from video element
      const result = await QrScanner.scanImage(videoElement, {
        returnDetailedScanResult: true,
      });

      if (result && result.data) {
        // Process the scanned QR code data
        const scanResult = await scanQRCode.mutateAsync(result.data);
        return scanResult;
      }

      return null;
    } catch (error) {
      console.error('Failed to scan QR code:', error);
      return null;
    }
  };

  const continuousScanning = async (
    videoElement: HTMLVideoElement,
    onResult: (result: QRScanResult) => void,
    onError: (error: Error) => void
  ): Promise<() => void> => {
    try {
      const { default: QrScanner } = await import('qr-scanner');

      const scanner = new QrScanner(
        videoElement,
        async result => {
          try {
            const scanResult = await scanQRCode.mutateAsync(result.data);
            if (scanResult) {
              onResult(scanResult);
            }
          } catch (error) {
            onError(error as Error);
          }
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        }
      );

      await scanner.start();

      // Return cleanup function
      return () => {
        scanner.stop();
        scanner.destroy();
      };
    } catch (error) {
      console.error('Failed to start continuous scanning:', error);
      onError(error as Error);
      return () => {}; // Return empty cleanup function
    }
  };

  return {
    startCamera,
    stopCamera,
    scanFromCamera,
    continuousScanning,
    scanQRCode: scanQRCode.mutateAsync,
    isScanning: scanQRCode.isPending,
    scanResult: scanQRCode.data,
    scanError: scanQRCode.error,
  };
}
