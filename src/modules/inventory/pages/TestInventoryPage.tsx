import React from 'react';

const TestInventoryPage: React.FC = () => {
  return (
    <div className='p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>
          Inventory Management
        </h1>

        <div className='bg-white rounded-lg shadow-lg p-6 mb-6'>
          <h2 className='text-xl font-semibold mb-4'>Inventory Overview</h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-blue-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-blue-800'>Total Parts</h3>
              <p className='text-3xl font-bold text-blue-600'>1,247</p>
            </div>
            <div className='bg-green-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-green-800'>
                Total Value
              </h3>
              <p className='text-3xl font-bold text-green-600'>$45,920</p>
            </div>
            <div className='bg-yellow-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-yellow-800'>Low Stock</h3>
              <p className='text-3xl font-bold text-yellow-600'>23</p>
            </div>
            <div className='bg-red-50 p-4 rounded-lg'>
              <h3 className='text-lg font-medium text-red-800'>Out of Stock</h3>
              <p className='text-3xl font-bold text-red-600'>5</p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Parts Inventory</h2>
            <button className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>
              Add Part
            </button>
          </div>

          <div className='overflow-x-auto'>
            <table className='min-w-full table-auto'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Part Name
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Part Number
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Stock
                  </th>
                  <th className='px-4 py-2 text-left text-sm font-medium text-gray-700'>
                    Unit Cost
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
                    name: 'HVAC Filter',
                    number: 'FLT-001',
                    stock: 25,
                    cost: 15.99,
                    status: 'In Stock',
                  },
                  {
                    name: 'Motor Bearing',
                    number: 'BRG-102',
                    stock: 5,
                    cost: 89.5,
                    status: 'Low Stock',
                  },
                  {
                    name: 'Pump Seal',
                    number: 'SEL-203',
                    stock: 0,
                    cost: 45.0,
                    status: 'Out of Stock',
                  },
                ].map((item, index) => (
                  <tr key={index} className='border-b'>
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      {item.name}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-600'>
                      {item.number}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      {item.stock}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      ${item.cost}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.status === 'In Stock'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'Low Stock'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
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

export default TestInventoryPage;
