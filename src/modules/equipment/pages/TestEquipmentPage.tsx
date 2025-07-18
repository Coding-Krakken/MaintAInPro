import React from 'react';

const TestEquipmentPage: React.FC = () => {
  return (
    <div className='p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>
          Equipment Management
        </h1>

        <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
          <h2 className='text-xl font-semibold mb-4'>Equipment Overview</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-blue-800'>
                Total Equipment
              </h3>
              <p className='text-3xl font-bold text-blue-600'>156</p>
            </div>
            <div className='bg-green-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-green-800'>Active</h3>
              <p className='text-3xl font-bold text-green-600'>143</p>
            </div>
            <div className='bg-yellow-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-yellow-800'>
                Maintenance
              </h3>
              <p className='text-3xl font-bold text-yellow-600'>13</p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Equipment List</h2>
            <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>
              Add Equipment
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
                    Asset Tag
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Status
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Location
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: 'HVAC Unit 1',
                    tag: 'EQ-001',
                    status: 'Active',
                    location: 'Building A',
                  },
                  {
                    name: 'Generator 1',
                    tag: 'EQ-002',
                    status: 'Maintenance',
                    location: 'Building B',
                  },
                  {
                    name: 'Pump Station 1',
                    tag: 'EQ-003',
                    status: 'Active',
                    location: 'Facility C',
                  },
                ].map((item, index) => (
                  <tr key={index} className='border-b'>
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      {item.name}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {item.tag}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {item.location}
                    </td>
                    <td className='px-4 py-3'>
                      <button className='text-blue-600 hover:text-blue-800 text-sm'>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEquipmentPage;
