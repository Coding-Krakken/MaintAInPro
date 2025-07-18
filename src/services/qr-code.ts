import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';

export interface QRCodeData {
  type: 'equipment' | 'work_order' | 'location' | 'part';
  id: string;
  metadata?: Record<string, unknown>;
}

export interface EquipmentQRData extends QRCodeData {
  type: 'equipment';
  equipmentId: string;
  name: string;
  location: string;
}

export interface WorkOrderQRData extends QRCodeData {
  type: 'work_order';
  workOrderId: string;
  equipmentId?: string;
}

export class QRCodeService {
  /**
   * Generate QR code as data URL for equipment
   */
  static async generateEquipmentQR(
    equipmentId: string,
    name: string,
    location: string
  ): Promise<string> {
    const data: EquipmentQRData = {
      type: 'equipment',
      id: equipmentId,
      equipmentId,
      name,
      location,
      metadata: {
        generated_at: new Date().toISOString(),
        version: '1.0',
      },
    };

    return this.generateQRCode(data);
  }

  /**
   * Generate QR code as data URL for work order
   */
  static async generateWorkOrderQR(
    workOrderId: string,
    equipmentId?: string
  ): Promise<string> {
    const data: WorkOrderQRData = {
      type: 'work_order',
      id: workOrderId,
      workOrderId,
      ...(equipmentId && { equipmentId }),
      metadata: {
        generated_at: new Date().toISOString(),
        version: '1.0',
      },
    };

    return this.generateQRCode(data);
  }

  /**
   * Generate QR code from any data object
   */
  static async generateQRCode(data: QRCodeData): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const qrCodeDataUrl = await QRCode.toDataURL(jsonString, {
        errorCorrectionLevel: 'M',
        width: 256,
        margin: 1,
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate printable QR code label with text
   */
  static async generatePrintableQRLabel(
    data: QRCodeData,
    title: string,
    subtitle?: string
  ): Promise<string> {
    try {
      const qrDataUrl = await this.generateQRCode(data);

      // Create canvas for label
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas size for label (4x2 inches at 300 DPI)
      canvas.width = 400;
      canvas.height = 200;

      // Fill white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load QR code image
      const qrImage = new Image();
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
        qrImage.src = qrDataUrl;
      });

      // Draw QR code (left side)
      const qrSize = 160;
      const qrX = 20;
      const qrY = (canvas.height - qrSize) / 2;
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // Set font and draw title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'left';
      const textX = qrX + qrSize + 20;
      let textY = 60;

      // Word wrap title
      const words = title.split(' ');
      let line = '';
      const maxWidth = canvas.width - textX - 20;

      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line, textX, textY);
          line = word + ' ';
          textY += 25;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, textX, textY);

      // Draw subtitle if provided
      if (subtitle) {
        ctx.font = '14px Arial';
        textY += 30;
        ctx.fillText(subtitle, textX, textY);
      }

      // Draw QR data info
      ctx.font = '10px Arial';
      textY += 25;
      ctx.fillText(`Type: ${data.type.toUpperCase()}`, textX, textY);
      textY += 15;
      ctx.fillText(`ID: ${data.id}`, textX, textY);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating printable QR label:', error);
      throw new Error('Failed to generate printable QR label');
    }
  }

  /**
   * Scan QR code from video element
   */
  static async scanQRFromVideo(
    videoElement: HTMLVideoElement
  ): Promise<QRCodeData> {
    try {
      const result = await QrScanner.scanImage(videoElement, {
        returnDetailedScanResult: true,
      });

      const data = JSON.parse(result.data) as QRCodeData;
      return data;
    } catch (error) {
      console.error('Error scanning QR code:', error);
      throw new Error('Failed to scan QR code');
    }
  }

  /**
   * Parse QR code data from string
   */
  static parseQRData(qrString: string): QRCodeData {
    try {
      const data = JSON.parse(qrString) as QRCodeData;

      // Validate required fields
      if (!data.type || !data.id) {
        throw new Error('Invalid QR code format: missing type or id');
      }

      // Validate type
      const validTypes = ['equipment', 'work_order', 'location', 'part'];
      if (!validTypes.includes(data.type)) {
        throw new Error(`Invalid QR code type: ${data.type}`);
      }

      return data;
    } catch (error) {
      console.error('Error parsing QR data:', error);
      throw new Error('Invalid QR code format');
    }
  }

  /**
   * Create QR scanner instance for camera scanning
   */
  static createScanner(
    videoElement: HTMLVideoElement,
    onScan: (data: QRCodeData) => void,
    onError: (error: Error) => void
  ): QrScanner {
    const scanner = new QrScanner(videoElement, (result: string) => {
      try {
        const data = this.parseQRData(result);
        onScan(data);
      } catch (error) {
        onError(error as Error);
      }
    });

    return scanner;
  }

  /**
   * Check if device has camera support
   */
  static async hasCameraSupport(): Promise<boolean> {
    try {
      return await QrScanner.hasCamera();
    } catch {
      return false;
    }
  }

  /**
   * Get available cameras
   */
  static async getAvailableCameras(): Promise<QrScanner.Camera[]> {
    try {
      return await QrScanner.listCameras(true);
    } catch {
      return [];
    }
  }
}

export default QRCodeService;
