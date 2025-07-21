import { useParams, Link } from 'react-router-dom';
import { useWorkOrder } from '../hooks/useWorkOrders';

const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: workOrder, isLoading, error } = useWorkOrder(id || '');

  if (isLoading) return <div>Loading...</div>;
  if (error || !workOrder) return <div>Error loading work order.</div>;

  // Extend the type for this page to include possible related fields
  type Profile = { first_name: string; last_name: string };
  type Equipment = { name: string };
  type Attachment = { file_name?: string } | string;
  type WorkOrderDetail = typeof workOrder & {
    assigned_to_profile?: Profile[];
    equipment?: Equipment[];
    attachments?: Attachment[];
  };

  const wo = workOrder as WorkOrderDetail;

  let assignedTo: string;

  if (
    wo.assigned_to_profile &&
    Array.isArray(wo.assigned_to_profile) &&
    wo.assigned_to_profile.length > 0
  ) {
    const profile = wo.assigned_to_profile[0];
    assignedTo =
      `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() ||
      'Unassigned';
  } else if (typeof wo.assigned_to === 'string') {
    assignedTo = wo.assigned_to;
  } else {
    assignedTo = 'Unassigned';
  }

  let equipment: string;
  if (wo.equipment && Array.isArray(wo.equipment) && wo.equipment.length > 0) {
    equipment = wo.equipment[0]?.name ?? 'N/A';
  } else if (typeof wo.equipment_id === 'string') {
    equipment = wo.equipment_id;
  } else {
    equipment = 'N/A';
  }

  let attachments: string;
  if (
    wo.attachments &&
    Array.isArray(wo.attachments) &&
    wo.attachments.length > 0
  ) {
    attachments = wo.attachments
      .map((a: Attachment) => (typeof a === 'string' ? a : a.file_name || ''))
      .filter(Boolean)
      .join(', ');
    if (!attachments) attachments = 'None';
  } else {
    attachments = 'None';
  }

  return (
    <div className='container mx-auto py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-secondary-900'>
            Work Order Detail
          </h1>
          <p className='text-secondary-600'>
            View and edit work order details.
          </p>
        </div>
        <div className='flex gap-2'>
          <Link to={`/work-orders/${id}/edit`} className='btn btn-primary'>
            Edit
          </Link>
          <Link
            to={`/work-orders/${id}/checklist`}
            className='btn btn-secondary'
          >
            Checklist
          </Link>
          <Link to={`/work-orders/${id}/history`} className='btn btn-secondary'>
            History
          </Link>
        </div>
      </div>
      <div className='card'>
        <div className='card-body'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <div>
                <strong>Work Order #:</strong> {workOrder.work_order_number}
              </div>
              <div>
                <strong>Title:</strong> {workOrder.title}
              </div>
              <div>
                <strong>Status:</strong> {workOrder.status}
              </div>
              <div>
                <strong>Priority:</strong> {workOrder.priority}
              </div>
              <div>
                <strong>Type:</strong> {workOrder.type}
              </div>
              <div>
                <strong>Assigned To:</strong> {assignedTo}
              </div>
              <div>
                <strong>Equipment:</strong> {equipment}
              </div>
              <div>
                <strong>Created At:</strong> {workOrder.created_at}
              </div>
              <div>
                <strong>Scheduled Start:</strong>{' '}
                {workOrder.scheduled_start || 'N/A'}
              </div>
              <div>
                <strong>Scheduled End:</strong>{' '}
                {workOrder.scheduled_end || 'N/A'}
              </div>
            </div>
            <div>
              <div>
                <strong>Description:</strong> {workOrder.description || 'N/A'}
              </div>
              <div>
                <strong>Estimated Hours:</strong>{' '}
                {workOrder.estimated_hours || 'N/A'}
              </div>
              <div>
                <strong>Estimated Cost:</strong>{' '}
                {workOrder.estimated_cost || 'N/A'}
              </div>
              <div>
                <strong>Actual Hours:</strong> {workOrder.actual_hours || 'N/A'}
              </div>
              <div>
                <strong>Actual Cost:</strong> {workOrder.actual_cost || 'N/A'}
              </div>
              <div>
                <strong>Completion Notes:</strong>{' '}
                {workOrder.completion_notes || 'N/A'}
              </div>
              <div>
                <strong>Attachments:</strong> {attachments}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetailPage;
