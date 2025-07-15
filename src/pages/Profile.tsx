import React from 'react';
import { useAuth } from '@/modules/auth/hooks/useAuth';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-secondary-900'>Profile</h1>
        <p className='text-secondary-600'>
          Manage your account settings and preferences.
        </p>
      </div>

      <div className='card'>
        <div className='card-header'>
          <h3 className='text-lg font-semibold'>Account Information</h3>
        </div>
        <div className='card-body'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                First Name
              </label>
              <p className='text-secondary-900'>
                {user?.firstName || 'Not set'}
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Last Name
              </label>
              <p className='text-secondary-900'>
                {user?.lastName || 'Not set'}
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Email
              </label>
              <p className='text-secondary-900'>{user?.email}</p>
            </div>
            <div>
              <label className='block text-sm font-medium text-secondary-700 mb-1'>
                Role
              </label>
              <p className='text-secondary-900 capitalize'>
                {user?.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
