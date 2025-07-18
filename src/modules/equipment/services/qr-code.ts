import QRCode from 'qrcode';
import { supabase } from '../../../lib/supabase';

export interface QRCodeData {
  equipment_id: string;
  equipment_name: string;
  location: string;
  organization_id: string;
  qr_code_id: string;
  metadata?: Record<string, unknown>;
}

export interface EquipmentQRCode {
  id: string;
  equipment_id: string;
  qr_code_data: string;
  qr_code_image: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QRScanResult {
  success: boolean;
  data?: QRCodeData;
  equipment?: {
    id: string;
    name: string;
    location: string;
    status: string;
    qr_code_id: string;
  };
  error?: string;
}

export interface QRCodeGenerationOptions {
  size?: number;
  format?: 'png' | 'svg' | 'jpeg';
  quality?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  darkColor?: string;
  lightColor?: string;
}

class QRCodeService {
  private readonly defaultOptions: Required<QRCodeGenerationOptions> = {
    size: 256,
    format: 'png',
    quality: 0.92,
    errorCorrectionLevel: 'M',
    includeMargin: true,
    darkColor: '#000000',
    lightColor: '#FFFFFF',
  };

  /**
   * Generate QR code for equipment
   */
  async generateEquipmentQRCode(
    equipmentId: string,
    options: QRCodeGenerationOptions = {}
  ): Promise<{ qrCodeData: string; qrCodeImage: string }> {
    // Get equipment details
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, name, location, organization_id')
      .eq('id', equipmentId)
      .single();

    if (equipmentError || !equipment) {
      throw new Error(`Equipment not found: ${equipmentError?.message}`);
    }

    // Generate unique QR code ID
    const qrCodeId = `qr_${equipmentId}_${Date.now()}`;

    // Create QR code data structure
    const qrCodeData: QRCodeData = {
      equipment_id: equipment.id,
      equipment_name: equipment.name,
      location: equipment.location,
      organization_id: equipment.organization_id,
      qr_code_id: qrCodeId,
      metadata: {
        generated_at: new Date().toISOString(),
        version: '1.0',
      },
    };

    // Convert to JSON string for QR code
    const dataString = JSON.stringify(qrCodeData);

    // Generate QR code image
    const qrOptions = { ...this.defaultOptions, ...options };
    const qrCodeImage = await this.generateQRCodeImage(dataString, qrOptions);

    return {
      qrCodeData: dataString,
      qrCodeImage,
    };
  }

  /**
   * Generate QR code image from data
   */
  private async generateQRCodeImage(
    data: string,
    options: Required<QRCodeGenerationOptions>
  ): Promise<string> {
    const qrOptions = {
      width: options.size,
      height: options.size,
      quality: options.quality,
      errorCorrectionLevel: options.errorCorrectionLevel,
      margin: options.includeMargin ? 4 : 0,
      color: {
        dark: options.darkColor,
        light: options.lightColor,
      },
    };

    try {
      switch (options.format) {
        case 'svg':
          return await QRCode.toString(data, { ...qrOptions, type: 'svg' });
        case 'png':
        case 'jpeg':
        default:
          return await QRCode.toDataURL(data, {
            ...qrOptions,
            type: 'image/png',
          });
      }
    } catch (error) {
      throw new Error(
        `Failed to generate QR code: ${(error as Error).message}`
      );
    }
  }

  /**
   * Save QR code to database
   */
  async saveEquipmentQRCode(
    equipmentId: string,
    qrCodeData: string,
    qrCodeImage: string
  ): Promise<EquipmentQRCode> {
    const { data, error } = await supabase
      .from('equipment_qr_codes')
      .insert({
        equipment_id: equipmentId,
        qr_code_data: qrCodeData,
        qr_code_image: qrCodeImage,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save QR code: ${error.message}`);
    }

    // Update equipment table with QR code reference
    await supabase
      .from('equipment')
      .update({ qr_code_id: data.id })
      .eq('id', equipmentId);

    return data;
  }

  /**
   * Generate and save QR code for equipment
   */
  async createEquipmentQRCode(
    equipmentId: string,
    options: QRCodeGenerationOptions = {}
  ): Promise<EquipmentQRCode> {
    // Check if QR code already exists
    const { data: existingQRCode } = await supabase
      .from('equipment_qr_codes')
      .select('*')
      .eq('equipment_id', equipmentId)
      .eq('is_active', true)
      .single();

    if (existingQRCode) {
      throw new Error('Active QR code already exists for this equipment');
    }

    // Generate new QR code
    const { qrCodeData, qrCodeImage } = await this.generateEquipmentQRCode(
      equipmentId,
      options
    );

    // Save to database
    return await this.saveEquipmentQRCode(equipmentId, qrCodeData, qrCodeImage);
  }

  /**
   * Scan and decode QR code data
   */
  async scanQRCode(qrCodeData: string): Promise<QRScanResult> {
    try {
      // Parse QR code data
      const parsedData: QRCodeData = JSON.parse(qrCodeData);

      // Validate required fields
      if (!parsedData.equipment_id || !parsedData.qr_code_id) {
        return {
          success: false,
          error: 'Invalid QR code format',
        };
      }

      // Get equipment details
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select(
          `
          id,
          name,
          location,
          status,
          qr_code_id
        `
        )
        .eq('id', parsedData.equipment_id)
        .single();

      if (equipmentError || !equipment) {
        return {
          success: false,
          error: 'Equipment not found or QR code is invalid',
        };
      }

      // Verify QR code is still active
      const { data: qrCode } = await supabase
        .from('equipment_qr_codes')
        .select('is_active')
        .eq('equipment_id', parsedData.equipment_id)
        .eq('id', equipment.qr_code_id)
        .single();

      if (!qrCode?.is_active) {
        return {
          success: false,
          error: 'QR code is no longer active',
        };
      }

      // Log scan event
      await this.logQRScan(parsedData.equipment_id, parsedData.qr_code_id);

      return {
        success: true,
        data: parsedData,
        equipment: {
          id: equipment.id,
          name: equipment.name,
          location: equipment.location,
          status: equipment.status,
          qr_code_id: equipment.qr_code_id,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse QR code: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Regenerate QR code for equipment
   */
  async regenerateEquipmentQRCode(
    equipmentId: string,
    options: QRCodeGenerationOptions = {}
  ): Promise<EquipmentQRCode> {
    // Deactivate existing QR codes
    await supabase
      .from('equipment_qr_codes')
      .update({ is_active: false })
      .eq('equipment_id', equipmentId);

    // Generate new QR code
    const { qrCodeData, qrCodeImage } = await this.generateEquipmentQRCode(
      equipmentId,
      options
    );

    // Save new QR code
    return await this.saveEquipmentQRCode(equipmentId, qrCodeData, qrCodeImage);
  }

  /**
   * Batch generate QR codes for multiple equipment
   */
  async batchGenerateQRCodes(
    equipmentIds: string[],
    options: QRCodeGenerationOptions = {}
  ): Promise<{
    successful: EquipmentQRCode[];
    failed: { equipmentId: string; error: string }[];
  }> {
    const successful: EquipmentQRCode[] = [];
    const failed: { equipmentId: string; error: string }[] = [];

    for (const equipmentId of equipmentIds) {
      try {
        const qrCode = await this.createEquipmentQRCode(equipmentId, options);
        successful.push(qrCode);
      } catch (error) {
        failed.push({
          equipmentId,
          error: (error as Error).message,
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Get QR code for equipment
   */
  async getEquipmentQRCode(
    equipmentId: string
  ): Promise<EquipmentQRCode | null> {
    const { data, error } = await supabase
      .from('equipment_qr_codes')
      .select('*')
      .eq('equipment_id', equipmentId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  /**
   * Get printable QR code labels
   */
  async getPrintableQRCodes(
    equipmentIds: string[],
    labelOptions: {
      includeEquipmentName?: boolean;
      includeLocation?: boolean;
      includeInstructions?: boolean;
      labelSize?: 'small' | 'medium' | 'large';
    } = {}
  ): Promise<
    Array<{
      equipmentId: string;
      equipmentName: string;
      location: string;
      qrCodeImage: string;
      labelHtml: string;
    }>
  > {
    const labels = [];

    for (const equipmentId of equipmentIds) {
      const qrCode = await this.getEquipmentQRCode(equipmentId);
      if (!qrCode) continue;

      const { data: equipment } = await supabase
        .from('equipment')
        .select('name, location')
        .eq('id', equipmentId)
        .single();

      if (!equipment) continue;

      const labelHtml = this.generateLabelHTML(
        equipment.name,
        equipment.location,
        qrCode.qr_code_image,
        labelOptions
      );

      labels.push({
        equipmentId,
        equipmentName: equipment.name,
        location: equipment.location,
        qrCodeImage: qrCode.qr_code_image,
        labelHtml,
      });
    }

    return labels;
  }

  /**
   * Generate HTML for printable labels
   */
  private generateLabelHTML(
    equipmentName: string,
    location: string,
    qrCodeImage: string,
    options: {
      includeEquipmentName?: boolean;
      includeLocation?: boolean;
      includeInstructions?: boolean;
      labelSize?: 'small' | 'medium' | 'large';
    }
  ): string {
    const sizes = {
      small: { width: '2in', height: '1in', qrSize: '0.75in' },
      medium: { width: '3in', height: '2in', qrSize: '1.5in' },
      large: { width: '4in', height: '3in', qrSize: '2.5in' },
    };

    const size = sizes[options.labelSize || 'medium'];

    return `
      <div style="
        width: ${size.width};
        height: ${size.height};
        border: 1px solid #ccc;
        padding: 8px;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        page-break-inside: avoid;
        text-align: center;
      ">
        <img src="${qrCodeImage}" style="width: ${size.qrSize}; height: ${size.qrSize}; margin-bottom: 4px;" />
        ${options.includeEquipmentName ? `<div style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">${equipmentName}</div>` : ''}
        ${options.includeLocation ? `<div style="font-size: 8px; color: #666; margin-bottom: 2px;">${location}</div>` : ''}
        ${options.includeInstructions ? `<div style="font-size: 6px; color: #999;">Scan for details</div>` : ''}
      </div>
    `;
  }

  /**
   * Get QR scan history for equipment
   */
  async getQRScanHistory(
    equipmentId: string,
    limit: number = 50
  ): Promise<
    Array<{
      scanned_at: string;
      qr_code_id: string;
      user_id?: string;
      metadata?: Record<string, unknown>;
    }>
  > {
    const { data, error } = await supabase
      .from('qr_scan_logs')
      .select(
        `
        scanned_at,
        qr_code_id,
        user_id,
        metadata
      `
      )
      .eq('equipment_id', equipmentId)
      .order('scanned_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get scan history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Log QR code scan event
   */
  private async logQRScan(
    equipmentId: string,
    qrCodeId: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await supabase.from('qr_scan_logs').insert({
      equipment_id: equipmentId,
      qr_code_id: qrCodeId,
      user_id: userId,
      metadata: {
        ...metadata,
        scanned_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
    });
  }

  /**
   * Deactivate QR code
   */
  async deactivateQRCode(equipmentId: string): Promise<void> {
    const { error } = await supabase
      .from('equipment_qr_codes')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('equipment_id', equipmentId);

    if (error) {
      throw new Error(`Failed to deactivate QR code: ${error.message}`);
    }
  }
}

export const qrCodeService = new QRCodeService();
