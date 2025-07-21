import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkOrderForm } from '../components/WorkOrderForm';

const CreateWorkOrderPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-4'>Create Work Order</h1>
      <WorkOrderForm onSuccess={id => navigate(`/work-orders/${id}`)} />
    </div>
  );
};

export default CreateWorkOrderPage;
