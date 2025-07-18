import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Tabs } from '../../../components/ui/Tabs';
import {
  SettingsIcon,
  UserIcon,
  BuildingIcon,
  BellIcon,
  ShieldIcon,
  DatabaseIcon,
} from 'lucide-react';

export const SettingsList: React.FC = () => {
  const [organizationName, setOrganizationName] = useState('MaintAInPro Demo');
  const [timezone, setTimezone] = useState('America/New_York');
  const [currency, setCurrency] = useState('USD');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: SettingsIcon,
      content: (
        <div className='space-y-6'>
          <Card>
            <div className='card-header'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <BuildingIcon className='h-5 w-5' />
                Organization Settings
              </h3>
            </div>
            <div className='card-body space-y-4'>
              <div>
                <label
                  htmlFor='org-name'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Organization Name
                </label>
                <Input
                  id='org-name'
                  value={organizationName}
                  onChange={e => setOrganizationName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor='timezone'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Timezone
                </label>
                <Input
                  id='timezone'
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor='currency'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Default Currency
                </label>
                <Input
                  id='currency'
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className='card-header'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <DatabaseIcon className='h-5 w-5' />
                System Preferences
              </h3>
            </div>
            <div className='card-body space-y-4'>
              <Checkbox
                id='auto-assign'
                label='Auto-assign work orders based on technician availability'
              />
              <Checkbox
                id='require-approval'
                label='Require approval for high-priority work orders'
              />
              <Checkbox
                id='track-time'
                label='Enable time tracking for all work orders'
              />
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      content: (
        <div className='space-y-6'>
          <Card>
            <div className='card-header'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <BellIcon className='h-5 w-5' />
                Notification Preferences
              </h3>
            </div>
            <div className='card-body space-y-4'>
              <Checkbox
                id='email-notifications'
                checked={emailNotifications}
                onChange={e => setEmailNotifications(e.target.checked)}
                label='Email notifications'
              />
              <Checkbox
                id='sms-notifications'
                checked={smsNotifications}
                onChange={e => setSmsNotifications(e.target.checked)}
                label='SMS notifications'
              />
              <Checkbox id='overdue-alerts' label='Overdue work order alerts' />
              <Checkbox
                id='low-stock-alerts'
                label='Low stock inventory alerts'
              />
              <Checkbox
                id='maintenance-reminders'
                label='Preventive maintenance reminders'
              />
            </div>
          </Card>

          <Card>
            <div className='card-header'>
              <h3 className='text-lg font-semibold'>Notification Frequency</h3>
            </div>
            <div className='card-body space-y-4'>
              <div>
                <label
                  htmlFor='alert-frequency'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Alert Frequency
                </label>
                <select
                  id='alert-frequency'
                  className='flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='immediate'>Immediate</option>
                  <option value='hourly'>Hourly</option>
                  <option value='daily'>Daily</option>
                  <option value='weekly'>Weekly</option>
                </select>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'users',
      label: 'Users & Roles',
      icon: UserIcon,
      content: (
        <div className='space-y-6'>
          <Card>
            <div className='card-header'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <UserIcon className='h-5 w-5' />
                User Management
              </h3>
            </div>
            <div className='card-body'>
              <div className='mb-4'>
                <Button>
                  <UserIcon className='h-4 w-4 mr-2' />
                  Invite User
                </Button>
              </div>
              <div className='space-y-4'>
                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div>
                    <p className='font-medium'>John Smith</p>
                    <p className='text-sm text-gray-600'>john@example.com</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm'>
                      Admin
                    </span>
                    <Button variant='secondary' size='sm'>
                      Edit
                    </Button>
                  </div>
                </div>
                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div>
                    <p className='font-medium'>Sarah Wilson</p>
                    <p className='text-sm text-gray-600'>sarah@example.com</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='px-2 py-1 bg-green-100 text-green-800 rounded text-sm'>
                      Technician
                    </span>
                    <Button variant='secondary' size='sm'>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      icon: ShieldIcon,
      content: (
        <div className='space-y-6'>
          <Card>
            <div className='card-header'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <ShieldIcon className='h-5 w-5' />
                Security Settings
              </h3>
            </div>
            <div className='card-body space-y-4'>
              <Checkbox
                id='two-factor'
                label='Require two-factor authentication'
              />
              <Checkbox
                id='password-requirements'
                label='Enforce strong password requirements'
              />
              <Checkbox
                id='session-timeout'
                label='Auto-logout after inactivity'
              />
              <div>
                <label
                  htmlFor='session-duration'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Session Timeout (minutes)
                </label>
                <Input
                  id='session-duration'
                  type='number'
                  defaultValue='30'
                  min='5'
                  max='480'
                />
              </div>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-secondary-900'>
          System Configuration
        </h1>
        <p className='text-secondary-600'>
          Configure system settings and parameters
        </p>
      </div>

      {/* Settings Tabs */}
      <Card>
        <div className='card-body p-0'>
          <Tabs defaultValue='general'>
            <div className='border-b'>
              <div className='flex space-x-8 px-6'>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      className='flex items-center gap-2 py-4 text-sm font-medium border-b-2 border-transparent hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600'
                      data-state={tab.id === 'general' ? 'active' : 'inactive'}
                    >
                      <Icon className='h-4 w-4' />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {tabs.map(tab => (
              <div key={tab.id} className='p-6'>
                {tab.content}
              </div>
            ))}
          </Tabs>
        </div>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end'>
        <Button onClick={() => alert('Settings saved! (Demo)')}>
          Save Changes
        </Button>
      </div>

      {/* Development Notice */}
      <Card className='border-green-200 bg-green-50'>
        <div className='card-body'>
          <div className='flex items-start gap-3'>
            <SettingsIcon className='h-5 w-5 text-green-600 mt-0.5' />
            <div>
              <h4 className='font-semibold text-green-800 mb-1'>
                Configuration Interface
              </h4>
              <p className='text-sm text-green-700'>
                This settings interface demonstrates the available configuration
                options. Full functionality including user management, role
                permissions, and system preferences will be connected to backend
                services.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
