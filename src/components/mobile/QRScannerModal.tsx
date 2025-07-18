import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import QrScanner from 'qr-scanner';
import { QRCodeService, QRCodeData } from '../../services/qr-code';
import { XIcon, FlashlightIcon, CameraIcon } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: QRCodeData) => void;
  onError?: (error: Error) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        const hasCameraSupport = await QRCodeService.hasCameraSupport();
        setHasCamera(hasCameraSupport);
      } catch (err) {
        setHasCamera(false);
        setError('Camera access not available');
      }
    };

    checkCameraSupport();
  }, []);

  useEffect(() => {
    if (isOpen && hasCamera && videoRef.current) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hasCamera]);

  const startScanner = async () => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);

      const scanner = QRCodeService.createScanner(
        videoRef.current,
        handleScan,
        handleScanError
      );

      scannerRef.current = scanner;
      await scanner.start();

      // Check if flash is available
      const hasFlashSupport = await scanner.hasFlash();
      setHasFlash(hasFlashSupport);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to start camera');
      setIsScanning(false);
      onError?.(err as Error);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
    setFlashEnabled(false);
  };

  const handleScan = (data: QRCodeData) => {
    try {
      onScan(data);
      onClose();
    } catch (err) {
      handleScanError(err as Error);
    }
  };

  const handleScanError = (err: Error) => {
    console.error('QR scan error:', err);
    setError(err.message);
    onError?.(err);
  };

  const toggleFlash = async () => {
    if (scannerRef.current && hasFlash) {
      try {
        const newFlashState = !flashEnabled;
        if (newFlashState) {
          await scannerRef.current.turnFlashOn();
        } else {
          await scannerRef.current.turnFlashOff();
        }
        setFlashEnabled(newFlashState);
      } catch (err) {
        console.error('Failed to toggle flash:', err);
        setError('Failed to toggle flashlight');
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!hasCamera) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size='lg'>
        <div className='p-6 text-center'>
          <CameraIcon className='h-16 w-16 mx-auto text-gray-400 mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Camera Not Available
          </h2>
          <p className='text-gray-600 mb-4'>
            Camera access is required for QR code scanning. Please check your
            browser permissions.
          </p>
          <Button onClick={handleClose} variant='outline'>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size='full'>
      <div className='relative h-full bg-black'>
        {/* Header */}
        <div className='absolute top-0 left-0 right-0 z-10 bg-black/50 p-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-white text-lg font-semibold'>Scan QR Code</h2>
            <div className='flex items-center space-x-2'>
              {hasFlash && (
                <Button
                  onClick={toggleFlash}
                  variant='outline'
                  size='sm'
                  className={`${
                    flashEnabled
                      ? 'bg-yellow-500 text-black'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  <FlashlightIcon className='h-4 w-4' />
                </Button>
              )}
              <Button
                onClick={handleClose}
                variant='outline'
                size='sm'
                className='bg-white/20 text-white'
              >
                <XIcon className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Video container */}
        <div className='relative h-full'>
          <video
            ref={videoRef}
            className='w-full h-full object-cover'
            playsInline
            muted
          />

          {/* Scanning overlay */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='relative'>
              {/* Scanning frame */}
              <div className='w-64 h-64 border-2 border-white/50 rounded-lg relative'>
                {/* Corner markers */}
                <div className='absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg' />
                <div className='absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg' />
                <div className='absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg' />
                <div className='absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg' />

                {/* Scanning line animation */}
                {isScanning && (
                  <div className='absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse' />
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className='absolute bottom-0 left-0 right-0 p-6 bg-black/50'>
            <div className='text-center text-white'>
              <p className='text-lg mb-2'>Point your camera at a QR code</p>
              <p className='text-sm opacity-75'>
                Position the QR code within the frame to scan
              </p>
              {isScanning && (
                <div className='flex items-center justify-center mt-4'>
                  <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
                  <span className='ml-2 text-sm'>Scanning...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className='absolute bottom-20 left-4 right-4 bg-red-600 text-white p-3 rounded-lg'>
            <p className='text-sm'>{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QRScannerModal;
