import React from 'react';

const TestVendorsPage: React.FC = () => {
  return (
    <div className='p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>
          Vendor Management
        </h1>

        <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
          <h2 className='text-xl font-semibold mb-4'>Vendor Overview</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-blue-800'>
                Total Vendors
              </h3>
              <p className='text-3xl font-bold text-blue-600'>84</p>
            </div>
            <div className='bg-green-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-green-800'>Active</h3>
              <p className='text-3xl font-bold text-green-600'>76</p>
            </div>
            <div className='bg-purple-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-purple-800'>
                Avg Rating
              </h3>
              <p className='text-3xl font-bold text-purple-600'>4.2</p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Vendor Directory</h2>
            <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>
              Add Vendor
            </button>
          </div>

          <div className='overflow-x-auto'>
            <table className='min-w-full table-auto'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Company
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Type
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Contact
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Rating
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
                    company: 'ACME Supplies',
                    type: 'Supplier',
                    contact: 'john@acme.com',
                    rating: 4.5,
                    status: 'Active',
                  },
                  {
                    company: 'TechFix Services',
                    type: 'Service Provider',
                    contact: 'service@techfix.com',
                    rating: 4.2,
                    status: 'Active',
                  },
                  {
                    company: 'Industrial Parts Co',
                    type: 'Supplier',
                    contact: 'sales@indparts.com',
                    rating: 3.8,
                    status: 'Active',
                  },
                ].map((item, index) => (
                  <tr key={index} className='border-b'>
                    <td className='px-4 py-3 text-sm text-gray-900 font-medium'>
                      {item.company}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {item.type}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {item.contact}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      ★ {item.rating}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='px-2 py-1 text-xs rounded-full bg-green-100 text-green-800'>
                        {item.status}
                      </span>
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

export default TestVendorsPage;
