import React from 'react';

const TestReportsPage: React.FC = () => {
  return (
    <div className='p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>
          Reports & Analytics
        </h1>

        <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
          <h2 className='text-xl font-semibold mb-4'>Quick Reports</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-blue-50 p-4 rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer'>
              <h3 className='text-lg font-medium text-blue-800'>
                Equipment Summary
              </h3>
              <p className='text-sm text-blue-600'>
                View all equipment status and metrics
              </p>
            </div>
            <div className='bg-green-50 p-4 rounded-lg border border-green-200 hover:bg-green-100 cursor-pointer'>
              <h3 className='text-lg font-medium text-green-800'>
                Maintenance Report
              </h3>
              <p className='text-sm text-green-600'>
                Track maintenance activities and costs
              </p>
            </div>
            <div className='bg-purple-50 p-4 rounded-lg border border-purple-200 hover:bg-purple-100 cursor-pointer'>
              <h3 className='text-lg font-medium text-purple-800'>
                Inventory Report
              </h3>
              <p className='text-sm text-purple-600'>
                Analyze inventory levels and usage
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Report Templates</h2>
            <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>
              Create Custom Report
            </button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {[
              {
                name: 'Monthly Equipment Report',
                description: 'Monthly summary of equipment performance',
                category: 'Equipment',
              },
              {
                name: 'Work Order Analysis',
                description: 'Detailed work order completion metrics',
                category: 'Maintenance',
              },
              {
                name: 'Inventory Turnover',
                description: 'Parts usage and inventory rotation analysis',
                category: 'Inventory',
              },
              {
                name: 'Vendor Performance',
                description: 'Vendor ratings and cost analysis',
                category: 'Vendors',
              },
              {
                name: 'Cost Analysis',
                description: 'Maintenance costs breakdown by category',
                category: 'Financial',
              },
              {
                name: 'Compliance Report',
                description: 'PM completion and safety compliance',
                category: 'Compliance',
              },
            ].map((report, index) => (
              <div
                key={index}
                className='border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md'
              >
                <h3 className='font-medium text-gray-900 mb-2'>
                  {report.name}
                </h3>
                <p className='text-sm text-gray-600 mb-3'>
                  {report.description}
                </p>
                <div className='flex justify-between items-center'>
                  <span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded'>
                    {report.category}
                  </span>
                  <button className='text-blue-600 hover:text-blue-800 text-sm'>
                    Generate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestReportsPage;
