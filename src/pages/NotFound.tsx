import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

const NotFound: React.FC = () => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-secondary-50'>
      <div className='max-w-md w-full text-center'>
        <div className='mb-8'>
          <h1 className='text-9xl font-bold text-primary-600'>404</h1>
          <h2 className='text-2xl font-semibold text-secondary-900 mt-4'>
            Page Not Found
          </h2>
          <p className='text-secondary-600 mt-2'>
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className='space-y-4'>
          <Link to='/' className='inline-flex items-center btn-primary'>
            <HomeIcon className='w-5 h-5 mr-2' />
            Back to Dashboard
          </Link>

          <div className='text-sm text-secondary-500'>
            <p>
              If you believe this is an error, please{' '}
              <a
                href='mailto:support@maintainpro.com'
                className='text-primary-600 hover:text-primary-500'
              >
                contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
