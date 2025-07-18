import React, { useState } from 'react';

const TestSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General' },
    { id: 'users', name: 'Users' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'security', name: 'Security' },
    { id: 'integrations', name: 'Integrations' },
  ];

  return (
    <div className='p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>
          System Settings
        </h1>

        <div className='bg-white rounded-lg shadow-lg'>
          {/* Tab Navigation */}
          <div className='border-b border-gray-200'>
            <nav className='flex space-x-8 px-6'>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className='p-6'>
            {activeTab === 'general' && (
              <div>
                <h2 className='text-xl font-semibold mb-6'>General Settings</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label
                      htmlFor='company-name'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Company Name
                    </label>
                    <input
                      id='company-name'
                      type='text'
                      defaultValue='MaintAInPro Corp'
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='timezone'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Time Zone
                    </label>
                    <select
                      id='timezone'
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    >
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-7 (Mountain Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor='currency'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Default Currency
                    </label>
                    <select
                      id='currency'
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    >
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor='date-format'
                      className='block text-sm font-medium text-gray-700 mb-2'
                    >
                      Date Format
                    </label>
                    <select
                      id='date-format'
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    >
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h2 className='text-xl font-semibold mb-6'>User Management</h2>
                <div className='mb-4'>
                  <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>
                    Add New User
                  </button>
                </div>
                <div className='overflow-x-auto'>
                  <table className='min-w-full table-auto'>
                    <thead>
                      <tr className='bg-gray-50'>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                          Name
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                          Email
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                          Role
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                          Status
                        </th>
                        <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          name: 'John Admin',
                          email: 'john@company.com',
                          role: 'Administrator',
                          status: 'Active',
                        },
                        {
                          name: 'Jane Manager',
                          email: 'jane@company.com',
                          role: 'Manager',
                          status: 'Active',
                        },
                        {
                          name: 'Bob Tech',
                          email: 'bob@company.com',
                          role: 'Technician',
                          status: 'Active',
                        },
                      ].map((user, index) => (
                        <tr key={index} className='border-b'>
                          <td className='px-4 py-3 text-sm text-gray-900'>
                            {user.name}
                          </td>
                          <td className='px-4 py-3 text-sm text-gray-600'>
                            {user.email}
                          </td>
                          <td className='px-4 py-3 text-sm text-gray-600'>
                            {user.role}
                          </td>
                          <td className='px-4 py-3'>
                            <span className='px-2 py-1 text-xs rounded-full bg-green-100 text-green-800'>
                              {user.status}
                            </span>
                          </td>
                          <td className='px-4 py-3'>
                            <button className='text-blue-600 hover:text-blue-800 text-sm mr-2'>
                              Edit
                            </button>
                            <button className='text-red-600 hover:text-red-800 text-sm'>
                              Deactivate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className='text-xl font-semibold mb-6'>
                  Notification Settings
                </h2>
                <div className='space-y-4'>
                  {[
                    {
                      name: 'Email Notifications',
                      description: 'Receive notifications via email',
                    },
                    {
                      name: 'SMS Notifications',
                      description: 'Receive notifications via SMS',
                    },
                    {
                      name: 'Work Order Updates',
                      description: 'Get notified when work orders are updated',
                    },
                    {
                      name: 'Maintenance Reminders',
                      description: 'Receive PM schedule reminders',
                    },
                    {
                      name: 'Inventory Alerts',
                      description: 'Get alerts for low stock items',
                    },
                  ].map((setting, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-4 border border-gray-200 rounded-lg'
                    >
                      <div>
                        <h3 className='font-medium text-gray-900'>
                          {setting.name}
                        </h3>
                        <p className='text-sm text-gray-600'>
                          {setting.description}
                        </p>
                      </div>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <span className='sr-only'>Toggle {setting.name}</span>
                        <input
                          type='checkbox'
                          defaultChecked
                          className='sr-only peer'
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'security' || activeTab === 'integrations') && (
              <div>
                <h2 className='text-xl font-semibold mb-6'>
                  {activeTab === 'security'
                    ? 'Security Settings'
                    : 'Integrations'}
                </h2>
                <p className='text-gray-600'>
                  {activeTab === 'security'
                    ? 'Security settings and password policies will be configured here.'
                    : 'Third-party integrations and API configurations will be managed here.'}
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className='border-t border-gray-200 px-6 py-4'>
            <button className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSettingsPage;
