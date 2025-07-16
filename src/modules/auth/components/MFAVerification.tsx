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
import { mfaService } from '../services/mfaService';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

interface MFAVerificationProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({
  userId,
  onSuccess,
  onCancel,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );
  const [showBackupCode, setShowBackupCode] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await mfaService.verifyMFA(userId, code.trim());

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Verification failed');
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const isBackupCode = code.length === 8;
  const isValidCode = code.length === 6 || isBackupCode;

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ShieldCheckIcon className='h-5 w-5' />
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='text-sm text-gray-600'>
          <p>
            {showBackupCode
              ? 'Enter one of your backup codes:'
              : 'Enter the 6-digit code from your authenticator app:'}
          </p>
        </div>

        <div className='space-y-2'>
          <label htmlFor='mfa-code' className='text-sm font-medium'>
            {showBackupCode ? 'Backup Code' : 'Verification Code'}
          </label>
          <Input
            id='mfa-code'
            type='text'
            value={code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCode(e.target.value)
            }
            onKeyPress={handleKeyPress}
            placeholder={showBackupCode ? 'ABCD1234' : '123456'}
            maxLength={showBackupCode ? 8 : 6}
            className='text-center text-lg font-mono'
            disabled={loading}
          />
        </div>

        {error && (
          <Alert variant='destructive'>
            <ExclamationTriangleIcon className='h-4 w-4' />
            <AlertDescription>
              {error}
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <span className='block mt-1'>
                  {remainingAttempts} attempt
                  {remainingAttempts !== 1 ? 's' : ''} remaining
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className='space-y-2'>
          <Button
            onClick={handleVerify}
            disabled={loading || !isValidCode}
            className='w-full'
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>

          <Button
            onClick={() => setShowBackupCode(!showBackupCode)}
            variant='outline'
            size='sm'
            className='w-full'
          >
            <KeyIcon className='h-4 w-4 mr-2' />
            {showBackupCode ? 'Use Authenticator Code' : 'Use Backup Code'}
          </Button>

          <Button
            onClick={onCancel}
            variant='ghost'
            size='sm'
            className='w-full'
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
