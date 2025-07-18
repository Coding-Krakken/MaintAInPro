import React from 'react';

const TestPreventiveMaintenancePage: React.FC = () => {
  return (
    <div className='p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>
          Preventive Maintenance
        </h1>

        <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
          <h2 className='text-xl font-semibold mb-4'>PM Overview</h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-blue-800'>
                Total PM Tasks
              </h3>
              <p className='text-3xl font-bold text-blue-600'>342</p>
            </div>
            <div className='bg-green-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-green-800'>Completed</h3>
              <p className='text-3xl font-bold text-green-600'>298</p>
            </div>
            <div className='bg-yellow-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-yellow-800'>Scheduled</h3>
              <p className='text-3xl font-bold text-yellow-600'>32</p>
            </div>
            <div className='bg-red-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-red-800'>Overdue</h3>
              <p className='text-3xl font-bold text-red-600'>12</p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Maintenance Schedule</h2>
            <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>
              Schedule PM
            </button>
          </div>

          <div className='overflow-x-auto'>
            <table className='min-w-full table-auto'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Task
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Equipment
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Frequency
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Due Date
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
                    task: 'HVAC Filter Change',
                    equipment: 'HVAC Unit 1',
                    frequency: 'Monthly',
                    due: '2025-07-25',
                    status: 'Scheduled',
                  },
                  {
                    task: 'Generator Oil Check',
                    equipment: 'Generator 1',
                    frequency: 'Weekly',
                    due: '2025-07-20',
                    status: 'Overdue',
                  },
                  {
                    task: 'Pump Inspection',
                    equipment: 'Pump Station 1',
                    frequency: 'Quarterly',
                    due: '2025-08-01',
                    status: 'Scheduled',
                  },
                ].map((item, index) => (
                  <tr key={index} className='border-b'>
                    <td className='px-4 py-3 text-sm text-gray-900 font-medium'>
                      {item.task}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {item.equipment}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {item.frequency}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      {item.due}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'Scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <button className='text-blue-600 hover:text-blue-800 text-sm mr-2'>
                        View
                      </button>
                      <button className='text-green-600 hover:text-green-800 text-sm'>
                        Complete
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

export default TestPreventiveMaintenancePage;
