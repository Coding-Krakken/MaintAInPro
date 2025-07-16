import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const mfaSchema = z.object({
  code: z.string().length(6, 'MFA code must be 6 digits'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type MFAFormData = z.infer<typeof mfaSchema>;

const LoginMFA: React.FC = () => {
  const { signIn, verifyMFAAndCompleteLogin, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [loginCredentials, setLoginCredentials] =
    useState<LoginFormData | null>(null);
  const [mfaError, setMfaError] = useState<string | null>(null);

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerMFA,
    handleSubmit: handleMFASubmit,
    formState: { errors: mfaErrors },
    reset: resetMFA,
  } = useForm<MFAFormData>({
    resolver: zodResolver(mfaSchema),
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setMfaError(null);

    try {
      const result = await signIn(data.email, data.password);

      if (result.requiresMFA) {
        // Show MFA form
        setLoginCredentials(data);
        setShowMFA(true);
        setIsLoading(false);
      } else {
        // Login successful without MFA
        toast.success('Welcome back!');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const onMFASubmit = async (data: MFAFormData) => {
    if (!loginCredentials) return;

    setIsLoading(true);
    setMfaError(null);

    try {
      await verifyMFAAndCompleteLogin(
        loginCredentials.email,
        loginCredentials.password,
        data.code
      );
      toast.success('Welcome back!');
    } catch (error) {
      console.error('MFA verification error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'MFA verification failed';
      setMfaError(errorMessage);
      resetMFA();
      setIsLoading(false);
    }
  };

  const goBackToLogin = () => {
    setShowMFA(false);
    setLoginCredentials(null);
    setMfaError(null);
    resetMFA();
  };

  if (showMFA) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          <div>
            <div className='mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center'>
              <ShieldCheckIcon className='h-8 w-8 text-white' />
            </div>
            <h2 className='mt-6 text-center text-3xl font-bold text-secondary-900'>
              Multi-Factor Authentication
            </h2>
            <p className='mt-2 text-center text-sm text-secondary-600'>
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form
            className='mt-8 space-y-6'
            onSubmit={handleMFASubmit(onMFASubmit)}
          >
            {mfaError && (
              <Alert variant='destructive' className='mb-4'>
                {mfaError}
              </Alert>
            )}

            <div>
              <label
                htmlFor='code'
                className='block text-sm font-medium text-secondary-700'
              >
                Authentication Code
              </label>
              <input
                {...registerMFA('code')}
                type='text'
                inputMode='numeric'
                pattern='[0-9]*'
                maxLength={6}
                className={`mt-1 input text-center text-xl tracking-widest ${
                  mfaErrors.code ? 'input-error' : ''
                }`}
                placeholder='000000'
                autoComplete='one-time-code'
              />
              {mfaErrors.code && (
                <p className='mt-1 text-sm text-error-600'>
                  {mfaErrors.code.message}
                </p>
              )}
            </div>

            <div className='flex space-x-4'>
              <Button
                type='button'
                variant='outline'
                onClick={goBackToLogin}
                className='flex-1'
                disabled={isLoading}
              >
                Back to Login
              </Button>
              <Button type='submit' disabled={isLoading} className='flex-1'>
                {isLoading ? (
                  <div className='flex items-center justify-center'>
                    <LoadingSpinner size='sm' color='white' className='mr-2' />
                    Verifying...
                  </div>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </form>

          <div className='text-center'>
            <p className='text-sm text-secondary-600'>
              Having trouble?{' '}
              <a
                href='#'
                className='font-medium text-primary-600 hover:text-primary-500'
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <div className='mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center'>
            <span className='text-white text-2xl font-bold'>MP</span>
          </div>
          <h2 className='mt-6 text-center text-3xl font-bold text-secondary-900'>
            Sign in to MaintainPro
          </h2>
          <p className='mt-2 text-center text-sm text-secondary-600'>
            Manage your maintenance operations efficiently
          </p>
        </div>

        <form
          className='mt-8 space-y-6'
          onSubmit={handleLoginSubmit(onLoginSubmit)}
        >
          <div className='space-y-4'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-secondary-700'
              >
                Email address
              </label>
              <input
                {...registerLogin('email')}
                type='email'
                autoComplete='email'
                className={`mt-1 input ${loginErrors.email ? 'input-error' : ''}`}
                placeholder='Enter your email'
              />
              {loginErrors.email && (
                <p className='mt-1 text-sm text-error-600'>
                  {loginErrors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-secondary-700'
              >
                Password
              </label>
              <div className='mt-1 relative'>
                <input
                  {...registerLogin('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  className={`input pr-10 ${loginErrors.password ? 'input-error' : ''}`}
                  placeholder='Enter your password'
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className='h-5 w-5 text-secondary-400' />
                  ) : (
                    <EyeIcon className='h-5 w-5 text-secondary-400' />
                  )}
                </button>
              </div>
              {loginErrors.password && (
                <p className='mt-1 text-sm text-error-600'>
                  {loginErrors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <input
                id='remember-me'
                name='remember-me'
                type='checkbox'
                className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded'
              />
              <label
                htmlFor='remember-me'
                className='ml-2 block text-sm text-secondary-700'
              >
                Remember me
              </label>
            </div>

            <div className='text-sm'>
              <a
                href='#'
                className='font-medium text-primary-600 hover:text-primary-500'
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <Button type='submit' disabled={isLoading} className='w-full'>
              {isLoading ? (
                <div className='flex items-center justify-center'>
                  <LoadingSpinner size='sm' color='white' className='mr-2' />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </div>

          <div className='text-center'>
            <p className='text-sm text-secondary-600'>
              Don&apos;t have an account?{' '}
              <a
                href='#'
                className='font-medium text-primary-600 hover:text-primary-500'
              >
                Contact your administrator
              </a>
            </p>
          </div>
        </form>

        {/* Demo credentials for development */}
        {import.meta.env.MODE === 'development' && (
          <div className='mt-8 p-4 bg-warning-50 border border-warning-200 rounded-lg'>
            <h3 className='text-sm font-medium text-warning-800 mb-2'>
              Demo Credentials
            </h3>
            <div className='text-xs text-warning-700 space-y-1'>
              <p>Admin: admin@maintainpro.com / password123</p>
              <p>Manager: manager@maintainpro.com / password123</p>
              <p>Technician: tech@maintainpro.com / password123</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginMFA;
