import React from 'react';

export const InventoryList: React.FC = () => {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Inventory Management</h1>
      <div className='bg-white rounded-lg shadow p-6'>
        <p>Inventory management system is loading...</p>
        <div className='mt-4'>
          <button className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'>
            Add Part
          </button>
        </div>
      </div>
    </div>
  );
};
