import QRCode from 'qrcode';
import { supabase } from '../../../lib/supabase';

export interface QRCodeData {
  type: 'work_order' | 'equipment' | 'location';
  id: string;
  metadata?: Record<string, unknown>;
}

export interface QRCodeResult {
  success: boolean;
  data?: QRCodeData;
  error?: string;
}

class QRCodeService {
  /**
   * Generate QR code for work order, equipment, or location
   */
  async generateQRCode(data: QRCodeData): Promise<string> {
    try {
      const qrData = JSON.stringify(data);
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code for a work order
   */
  async generateWorkOrderQRCode(workOrderId: string): Promise<string> {
    const qrData: QRCodeData = {
      type: 'work_order',
      id: workOrderId,
      metadata: {
        generated_at: new Date().toISOString(),
        app: 'MaintAInPro',
      },
    };
    return this.generateQRCode(qrData);
  }

  /**
   * Generate QR code for equipment
   */
  async generateEquipmentQRCode(equipmentId: string): Promise<string> {
    const qrData: QRCodeData = {
      type: 'equipment',
      id: equipmentId,
      metadata: {
        generated_at: new Date().toISOString(),
        app: 'MaintAInPro',
      },
    };
    return this.generateQRCode(qrData);
  }

  /**
   * Parse QR code data from scanned string
   */
  parseQRCode(qrString: string): QRCodeResult {
    try {
      const data: QRCodeData = JSON.parse(qrString);

      // Validate QR code format
      if (!data.type || !data.id) {
        return {
          success: false,
          error: 'Invalid QR code format',
        };
      }

      // Validate supported types
      if (!['work_order', 'equipment', 'location'].includes(data.type)) {
        return {
          success: false,
          error: 'Unsupported QR code type',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse QR code',
      };
    }
  }

  /**
   * Handle QR code scan result
   */
  async handleQRCodeScan(qrString: string): Promise<QRCodeResult> {
    const parseResult = this.parseQRCode(qrString);

    if (!parseResult.success || !parseResult.data) {
      return parseResult;
    }

    const { type, id } = parseResult.data;

    try {
      // Verify the entity exists in database
      switch (type) {
        case 'work_order': {
          const { data: workOrder, error: woError } = await supabase
            .from('work_orders')
            .select('id, title, status')
            .eq('id', id)
            .single();

          if (woError || !workOrder) {
            return {
              success: false,
              error: 'Work order not found',
            };
          }
          break;
        }

        case 'equipment': {
          const { data: equipment, error: eqError } = await supabase
            .from('equipment')
            .select('id, name, status')
            .eq('id', id)
            .single();

          if (eqError || !equipment) {
            return {
              success: false,
              error: 'Equipment not found',
            };
          }
          break;
        }

        case 'location': {
          const { data: location, error: locError } = await supabase
            .from('locations')
            .select('id, name')
            .eq('id', id)
            .single();

          if (locError || !location) {
            return {
              success: false,
              error: 'Location not found',
            };
          }
          break;
        }
      }

      return {
        success: true,
        data: parseResult.data,
      };
    } catch (error) {
      console.error('Error validating QR code:', error);
      return {
        success: false,
        error: 'Failed to validate QR code',
      };
    }
  }

  /**
   * Generate batch QR codes for equipment
   */
  async generateEquipmentBatchQRCodes(equipmentIds: string[]): Promise<{
    qrCodes: Array<{ equipmentId: string; qrCode: string }>;
    errors: Array<{ equipmentId: string; error: string }>;
  }> {
    const qrCodes: Array<{ equipmentId: string; qrCode: string }> = [];
    const errors: Array<{ equipmentId: string; error: string }> = [];

    for (const equipmentId of equipmentIds) {
      try {
        const qrCode = await this.generateEquipmentQRCode(equipmentId);
        qrCodes.push({ equipmentId, qrCode });
      } catch (error) {
        errors.push({
          equipmentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { qrCodes, errors };
  }

  /**
   * Get QR code scanner configuration for camera
   */
  getScannerConfig() {
    return {
      video: {
        facingMode: 'environment', // Use back camera
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      constraints: {
        audio: false,
        video: {
          facingMode: 'environment',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        },
      },
    };
  }
}

export const qrCodeService = new QRCodeService();
