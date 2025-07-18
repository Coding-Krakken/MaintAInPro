import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useQRCodeCamera } from '../hooks/useQRCode';
import {
  CameraIcon,
  XIcon,
  FlashlightIcon,
  RotateCcwIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from 'lucide-react';

interface QRScannerMobileProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (
    equipmentId: string,
    equipmentData: {
      id: string;
      name: string;
      location: string;
      status: string;
    }
  ) => void;
  onScanError: (error: string) => void;
}

export const QRScannerMobile: React.FC<QRScannerMobileProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onScanError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);

  const {
    startCamera,
    stopCamera,
    scanFromCamera,
    scanQRCode,
    isScanning,
    scanResult,
    scanError,
  } = useQRCodeCamera();

  useEffect(() => {
    if (isOpen && !stream) {
      initializeCamera();
    } else if (!isOpen && stream) {
      cleanup();
    }

    return () => {
      if (stream) {
        cleanup();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (scanResult && scanResult.success && scanResult.equipment) {
      onScanSuccess(scanResult.equipment.id, {
        id: scanResult.equipment.id,
        name: scanResult.equipment.name,
        location: scanResult.equipment.location,
        status: scanResult.equipment.status,
      });
      onClose();
    } else if (scanResult && !scanResult.success) {
      onScanError(scanResult.error || 'Unknown scan error');
    }
  }, [scanResult, onScanSuccess, onScanError, onClose]);

  useEffect(() => {
    if (scanError) {
      onScanError(scanError.message);
    }
  }, [scanError, onScanError]);

  const initializeCamera = async () => {
    try {
      const mediaStream = await startCamera();
      if (mediaStream && videoRef.current) {
        setStream(mediaStream);
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        startScanning();
      }
    } catch (error) {
      onScanError(`Failed to initialize camera: ${(error as Error).message}`);
    }
  };

  const cleanup = () => {
    setScanning(false);
    if (stream) {
      stopCamera(stream);
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanning = () => {
    setScanning(true);
    scanLoop();
  };

  const scanLoop = async () => {
    if (!scanning || !videoRef.current || !stream) return;

    const now = Date.now();
    // Limit scan attempts to avoid overwhelming the system
    if (now - lastScanTime > 1000) {
      try {
        const result = await scanFromCamera(videoRef.current);
        if (result && result.success) {
          setLastScanTime(now);
          await scanQRCode(result.data!.toString());
          return;
        }
      } catch (error) {
        console.error('Scan error:', error);
      }
      setLastScanTime(now);
    }

    // Continue scanning
    requestAnimationFrame(scanLoop);
  };

  const toggleFlash = async () => {
    if (!stream) return;

    try {
      const tracks = stream.getVideoTracks();
      if (tracks.length > 0) {
        const track = tracks[0];
        if (track) {
          const capabilities = track.getCapabilities();

          // Check if torch is supported (this is experimental and may not work on all devices)
          if ('torch' in capabilities) {
            await track.applyConstraints({
              advanced: [{ torch: !isFlashOn } as MediaTrackConstraintSet],
            });
            setIsFlashOn(!isFlashOn);
          }
        }
      }
    } catch (error) {
      console.error('Flash toggle failed:', error);
    }
  };

  const switchCamera = async () => {
    if (!stream) return;

    cleanup();
    // Add logic to switch between front/back camera
    // This would require re-initializing with different facingMode
    setTimeout(() => {
      initializeCamera();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black z-50 flex flex-col'>
      {/* Header */}
      <div className='bg-black text-white p-4 flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <CameraIcon className='h-6 w-6' />
          <h1 className='text-lg font-semibold'>Scan QR Code</h1>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={onClose}
          className='text-white hover:bg-white/20 p-2'
        >
          <XIcon className='h-6 w-6' />
        </Button>
      </div>

      {/* Camera View */}
      <div className='flex-1 relative bg-black'>
        <video
          ref={videoRef}
          className='w-full h-full object-cover'
          playsInline
          muted
        />

        {/* Scan Overlay */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='relative'>
            {/* Scan Frame */}
            <div className='w-64 h-64 border-4 border-white rounded-lg relative'>
              {/* Corner indicators */}
              <div className='absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-green-400'></div>
              <div className='absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-green-400'></div>
              <div className='absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-green-400'></div>
              <div className='absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-green-400'></div>

              {/* Scanning line animation */}
              {scanning && (
                <div className='absolute inset-x-0 top-0 h-1 bg-green-400 animate-pulse'></div>
              )}
            </div>

            {/* Instructions */}
            <div className='mt-6 text-center'>
              <p className='text-white text-lg font-medium mb-2'>
                Position QR code within the frame
              </p>
              <p className='text-gray-300 text-sm'>
                Hold steady and ensure good lighting
              </p>
            </div>
          </div>
        </div>

        {/* Scanning Status */}
        {isScanning && (
          <div className='absolute top-4 left-1/2 transform -translate-x-1/2'>
            <Card className='bg-blue-600 text-white px-4 py-2'>
              <div className='flex items-center space-x-2'>
                <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent'></div>
                <span className='text-sm font-medium'>Scanning...</span>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className='bg-black text-white p-4'>
        <div className='flex items-center justify-center space-x-8'>
          {/* Flash Toggle */}
          <Button
            variant='ghost'
            size='lg'
            onClick={toggleFlash}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center space-y-1 ${
              isFlashOn ? 'bg-yellow-600' : 'bg-gray-700'
            }`}
          >
            <FlashlightIcon className='h-6 w-6' />
            <span className='text-xs'>Flash</span>
          </Button>

          {/* Camera Switch */}
          <Button
            variant='ghost'
            size='lg'
            onClick={switchCamera}
            className='w-16 h-16 rounded-full bg-gray-700 flex flex-col items-center justify-center space-y-1'
          >
            <RotateCcwIcon className='h-6 w-6' />
            <span className='text-xs'>Switch</span>
          </Button>
        </div>

        {/* Manual Input Option */}
        <div className='mt-4 pt-4 border-t border-gray-700'>
          <p className='text-center text-gray-400 text-sm mb-3'>
            Having trouble scanning?
          </p>
          <Button
            variant='outline'
            className='w-full h-12 text-white border-gray-600 hover:bg-gray-700'
            onClick={() => {
              // Would open manual equipment ID input
              onClose();
            }}
          >
            Enter Equipment ID Manually
          </Button>
        </div>
      </div>
    </div>
  );
};

// Success/Error feedback components
export const ScanSuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  equipmentName: string;
  location: string;
}> = ({ isOpen, onClose, equipmentName, location }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <Card className='bg-white p-6 max-w-sm w-full text-center'>
        <div className='mb-4'>
          <CheckCircleIcon className='h-16 w-16 text-green-500 mx-auto' />
        </div>
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Scan Successful!
        </h2>
        <p className='text-gray-600 mb-1'>Equipment found:</p>
        <p className='font-medium text-gray-900 mb-1'>{equipmentName}</p>
        <p className='text-sm text-gray-500 mb-6'>{location}</p>
        <Button onClick={onClose} className='w-full'>
          Continue
        </Button>
      </Card>
    </div>
  );
};

export const ScanErrorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  error: string;
  onRetry: () => void;
}> = ({ isOpen, onClose, error, onRetry }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <Card className='bg-white p-6 max-w-sm w-full text-center'>
        <div className='mb-4'>
          <AlertCircleIcon className='h-16 w-16 text-red-500 mx-auto' />
        </div>
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Scan Failed
        </h2>
        <p className='text-gray-600 mb-6'>{error}</p>
        <div className='space-y-3'>
          <Button onClick={onRetry} className='w-full'>
            Try Again
          </Button>
          <Button variant='outline' onClick={onClose} className='w-full'>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
};
