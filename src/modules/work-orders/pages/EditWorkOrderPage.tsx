import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkOrder } from '../hooks/useWorkOrders';
import { WorkOrderForm } from '../components/WorkOrderForm';

const EditWorkOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workOrder, isLoading, error } = useWorkOrder(id || '');

  if (isLoading) return <div>Loading...</div>;
  if (error || !workOrder) return <div>Error loading work order.</div>;

  // Remove related objects from initial values
  const initialValues = { ...workOrder };

  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-4'>Edit Work Order</h1>
      <WorkOrderForm
        initialValues={initialValues}
        onSuccess={() => navigate(`/work-orders/${id}`)}
      />
    </div>
  );
};

export default EditWorkOrderPage;
