import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

const fetchHistory = async (workOrderId: string) => {
  const { data, error } = await supabase
    .from('work_order_history')
    .select('*')
    .eq('work_order_id', workOrderId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

type WorkOrderHistoryEntry = {
  id: string;
  action: string;
  details: unknown;
  created_at: string;
  user_id?: string;
};

const WorkOrderHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    data = [],
    isLoading,
    error,
  } = useQuery<WorkOrderHistoryEntry[]>({
    queryKey: ['workOrderHistory', id],
    queryFn: () => fetchHistory(id || ''),
  });

  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-4'>Work Order History</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className='text-red-600'>Error loading history.</div>
      ) : data.length > 0 ? (
        <div className='space-y-4'>
          {data.map(entry => (
            <div key={entry.id} className='p-4 bg-white rounded shadow'>
              <div className='font-semibold'>{entry.action}</div>
              <div className='text-sm text-gray-600'>
                {(() => {
                  if (entry.details == null) return null;
                  if (
                    typeof entry.details === 'string' ||
                    typeof entry.details === 'number'
                  )
                    return entry.details;
                  if (typeof entry.details === 'object')
                    return JSON.stringify(entry.details);
                  return String(entry.details);
                })()}
              </div>
              <div className='text-xs text-gray-500'>
                {entry.created_at
                  ? new Date(entry.created_at).toLocaleString()
                  : ''}
              </div>
              {entry.user_id && (
                <div className='text-xs text-gray-400'>
                  User: {entry.user_id}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>No history found for this work order.</div>
      )}
    </div>
  );
};

export default WorkOrderHistoryPage;
