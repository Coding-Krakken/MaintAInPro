import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { qrCodeService, QRCodeResult } from '../services/qrCodeService';
import { XIcon, CameraIcon, FlashlightIcon } from 'lucide-react';

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: QRCodeResult) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  isOpen,
  onClose,
  onScanResult,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFlashlight, setHasFlashlight] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initCamera = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if we're in a test environment or if mediaDevices is not available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          // In test environment, skip camera initialization
          setIsLoading(false);
          setError(null);
          return;
        }

        const config = qrCodeService.getScannerConfig();
        const stream = await navigator.mediaDevices.getUserMedia(
          config.constraints
        );

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          setHasFlashlight(false);

          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
            startScanning();
          };
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please check permissions.');
        setIsLoading(false);
      }
    };

    if (isOpen) {
      initCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const startScanning = () => {
    if (isScanning) return;

    setIsScanning(true);

    scanIntervalRef.current = setInterval(() => {
      scanQRCode();
    }, 100); // Scan every 100ms
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setIsScanning(false);
    setIsFlashlightOn(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR detection
    // const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Note: In a real implementation, you would use a QR code detection library
    // like jsQR here. For now, we'll simulate QR detection.
    // You would need to install jsQR: npm install jsqr

    // Simulated QR detection (replace with actual QR library)
    // const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

    // if (qrCode) {
    //   handleQRDetection(qrCode.data);
    // }
  };

  const handleQRDetection = async (qrData: string) => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setIsScanning(false);

    try {
      const result = await qrCodeService.handleQRCodeScan(qrData);
      onScanResult(result);
      onClose();
    } catch (error) {
      console.error('Error processing QR code:', error);
      onScanResult({
        success: false,
        error: 'Failed to process QR code',
      });
    }
  };

  const toggleFlashlight = async () => {
    // Flashlight feature disabled for now due to experimental API
    console.log('Flashlight toggle requested (not implemented)');
  };

  const handleManualInput = () => {
    // For testing purposes, simulate a scan
    const testQRData = JSON.stringify({
      type: 'work_order',
      id: 'test-wo-123',
      metadata: {
        generated_at: new Date().toISOString(),
        app: 'MaintAInPro',
      },
    });

    handleQRDetection(testQRData);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 bg-black' data-testid='qr-scanner'>
      {/* Header */}
      <div className='absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 p-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-white text-lg font-semibold'>Scan QR Code</h2>
          <div className='flex items-center space-x-2'>
            {hasFlashlight && (
              <Button
                variant='ghost'
                size='sm'
                onClick={toggleFlashlight}
                className='text-white hover:bg-white hover:bg-opacity-20'
              >
                <FlashlightIcon
                  className={`h-5 w-5 ${isFlashlightOn ? 'text-yellow-400' : 'text-white'}`}
                />
              </Button>
            )}
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='text-white hover:bg-white hover:bg-opacity-20'
              data-testid='close-scanner'
            >
              <XIcon className='h-5 w-5' />
            </Button>
          </div>
        </div>
      </div>

      {/* Camera View */}
      <div className='relative w-full h-full'>
        {isLoading && (
          <div className='absolute inset-0 flex items-center justify-center bg-black'>
            <div className='text-center'>
              <LoadingSpinner size='lg' className='text-white mb-4' />
              <p className='text-white'>Starting camera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className='absolute inset-0 flex items-center justify-center bg-black'>
            <div className='text-center px-6'>
              <CameraIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <p className='text-white text-lg mb-4'>{error}</p>
              <Button onClick={() => window.location.reload()} className='mb-2'>
                Try Again
              </Button>
              <br />
              <Button variant='outline' onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className='w-full h-full object-cover'
          playsInline
          muted
        />

        {/* Scanning overlay */}
        {isScanning && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='relative'>
              {/* Scanning frame */}
              <div className='w-64 h-64 border-2 border-white rounded-lg relative'>
                <div className='absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg'></div>
                <div className='absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg'></div>
                <div className='absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg'></div>
                <div className='absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg'></div>

                {/* Scanning line animation */}
                <div className='absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse'></div>
              </div>

              <p className='text-white text-center mt-4'>
                Position QR code within the frame
              </p>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className='hidden' />
      </div>

      {/* Bottom Actions */}
      <div className='absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50'>
        <div className='text-center'>
          <Button
            variant='outline'
            onClick={handleManualInput}
            className='mb-2 bg-white bg-opacity-20 text-white border-white'
          >
            Test Scan (Demo)
          </Button>
          <p className='text-white text-sm opacity-75'>
            Point your camera at a QR code to scan
          </p>
        </div>
      </div>
    </div>
  );
};
