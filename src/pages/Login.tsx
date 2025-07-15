import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import DebugInfo from '@/components/DebugInfo';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { signIn, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to='/' replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Welcome back!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

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

        <form className='mt-8 space-y-6' onSubmit={handleSubmit(onSubmit)}>
          <div className='space-y-4'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-secondary-700'
              >
                Email address
              </label>
              <input
                {...register('email')}
                type='email'
                autoComplete='email'
                className={`mt-1 input ${errors.email ? 'input-error' : ''}`}
                placeholder='Enter your email'
              />
              {errors.email && (
                <p className='mt-1 text-sm text-error-600'>
                  {errors.email.message}
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
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
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
              {errors.password && (
                <p className='mt-1 text-sm text-error-600'>
                  {errors.password.message}
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
            <button
              type='submit'
              disabled={isLoading}
              className='w-full btn-primary'
            >
              {isLoading ? (
                <div className='flex items-center justify-center'>
                  <LoadingSpinner size='sm' color='white' className='mr-2' />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className='text-center'>
            <p className='text-sm text-secondary-600'>
              Don't have an account?{' '}
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

        {/* Debug information */}
        <DebugInfo />
      </div>
    </div>
  );
};

export default Login;
