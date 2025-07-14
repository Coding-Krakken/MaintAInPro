import React from 'react';

const InventoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Parts & Inventory</h1>
        <p className="text-secondary-600">Manage your parts inventory and stock levels.</p>
      </div>

      <div className="card">
        <div className="card-body text-center py-12">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Inventory Management
          </h3>
          <p className="text-secondary-600">
            This module is under development. Full functionality coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
