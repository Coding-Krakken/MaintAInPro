import React, { useState } from 'react';
import { Button } from '../../../components/ui';
import { Input } from '../../../components/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui';
import { Alert, AlertDescription } from '../../../components/ui';
import { Badge } from '../../../components/ui';
import {
  mfaService,
  type MFASetupData,
  type MFAStatus,
} from '../services/mfaService';
import { useAuth } from '../hooks/useAuth';
import {
  ShieldCheckIcon,
  QrCodeIcon,
  KeyIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface MFASetupProps {
  onSetupComplete: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onSetupComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'init' | 'setup' | 'verify'>('init');
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const handleInitializeSetup = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await mfaService.initializeTOTP(user.id);
      setSetupData(data);
      setStep('setup');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to initialize MFA setup'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!user || !setupData) return;

    setLoading(true);
    setError(null);

    try {
      const result = await mfaService.verifyAndEnableTOTP(
        user.id,
        verificationCode,
        setupData.secret
      );

      if (result.success) {
        setStep('verify');
        setShowBackupCodes(true);
      } else {
        setError(result.error || 'Verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = () => {
    onSetupComplete();
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;

    const content = setupData.backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (step === 'init') {
    return (
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ShieldCheckIcon className='h-5 w-5' />
            Enable Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-sm text-gray-600'>
            <p>
              Two-factor authentication adds an extra layer of security to your
              account. You&apos;ll need to provide a code from your
              authenticator app when signing in.
            </p>
          </div>

          <div className='space-y-2'>
            <h4 className='font-medium'>What you&apos;ll need:</h4>
            <ul className='text-sm text-gray-600 space-y-1'>
              <li>
                • An authenticator app (Google Authenticator, Authy, etc.)
              </li>
              <li>• Your current password</li>
              <li>• A secure place to store backup codes</li>
            </ul>
          </div>

          {error && (
            <Alert variant='destructive'>
              <ExclamationTriangleIcon className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleInitializeSetup}
            disabled={loading}
            className='w-full'
          >
            {loading ? 'Setting up...' : 'Set up MFA'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'setup') {
    return (
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <QrCodeIcon className='h-5 w-5' />
            Scan QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-sm text-gray-600'>
            <p>
              Scan this QR code with your authenticator app, then enter the
              6-digit code to verify the setup.
            </p>
          </div>

          {setupData && (
            <div className='space-y-4'>
              <div className='flex justify-center'>
                <img
                  src={setupData.qrCode}
                  alt='MFA QR Code'
                  className='border rounded-lg'
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='manual-secret' className='text-sm font-medium'>
                  Or enter this secret manually:
                </label>
                <div
                  id='manual-secret'
                  className='bg-gray-50 p-2 rounded border font-mono text-sm'
                >
                  {setupData.secret}
                </div>
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='verification-code'
                  className='text-sm font-medium'
                >
                  Enter verification code:
                </label>
                <Input
                  id='verification-code'
                  type='text'
                  value={verificationCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setVerificationCode(e.target.value)
                  }
                  placeholder='123456'
                  maxLength={6}
                  className='text-center text-lg font-mono'
                />
              </div>

              {error && (
                <Alert variant='destructive'>
                  <ExclamationTriangleIcon className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleVerifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className='w-full'
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify' && showBackupCodes) {
    return (
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <KeyIcon className='h-5 w-5' />
            Save Backup Codes
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert>
            <ExclamationTriangleIcon className='h-4 w-4' />
            <AlertDescription>
              <strong>Important:</strong> Save these backup codes in a secure
              location. You can use them to access your account if you lose your
              authenticator device.
            </AlertDescription>
          </Alert>

          {setupData && (
            <div className='space-y-4'>
              <div className='bg-gray-50 p-4 rounded border'>
                <div className='grid grid-cols-2 gap-2 font-mono text-sm'>
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className='text-center'>
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className='space-y-2'>
                <Button
                  onClick={downloadBackupCodes}
                  variant='outline'
                  className='w-full'
                >
                  Download Backup Codes
                </Button>

                <Button onClick={handleCompleteSetup} className='w-full'>
                  I&apos;ve Saved My Backup Codes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

interface MFAStatusProps {
  status: MFAStatus;
  onDisable: () => void;
  onRegenerateBackupCodes: () => void;
}

export const MFAStatusCard: React.FC<MFAStatusProps> = ({
  status,
  onDisable,
  onRegenerateBackupCodes,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ShieldCheckIcon className='h-5 w-5' />
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Status</span>
          <Badge variant={status.enabled ? 'default' : 'secondary'}>
            {status.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {status.enabled && (
          <>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Methods</span>
              <div className='flex gap-1'>
                {status.methods.map(method => (
                  <Badge key={method} variant='outline'>
                    {method.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>

            {status.lastUsed && (
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Last Used</span>
                <span className='text-sm text-gray-600'>
                  {status.lastUsed.toLocaleDateString()}
                </span>
              </div>
            )}

            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Backup Codes</span>
              <span className='text-sm text-gray-600'>
                {status.backupCodesRemaining} remaining
              </span>
            </div>

            <div className='space-y-2'>
              <Button
                onClick={onRegenerateBackupCodes}
                variant='outline'
                size='sm'
                className='w-full'
              >
                Regenerate Backup Codes
              </Button>

              <Button
                onClick={onDisable}
                variant='destructive'
                size='sm'
                className='w-full'
              >
                Disable MFA
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
