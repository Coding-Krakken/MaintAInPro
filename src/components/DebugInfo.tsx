import React from 'react';

const DebugInfo: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div className='p-4 bg-gray-100 border border-gray-300 rounded'>
      <h3 className='font-bold text-lg mb-2'>Debug Information</h3>
      <div className='space-y-2 text-sm'>
        <div>
          <strong>Supabase URL:</strong> {supabaseUrl || 'Not set'}
        </div>
        <div>
          <strong>Supabase Key:</strong>{' '}
          {supabaseKey ? 'Set (hidden)' : 'Not set'}
        </div>
        <div>
          <strong>Environment:</strong> {import.meta.env.MODE}
        </div>
        <div>
          <strong>Current URL:</strong> {window.location.href}
        </div>
      </div>
    </div>
  );
};

export default DebugInfo;
