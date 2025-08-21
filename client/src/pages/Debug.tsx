import React, { useEffect, useState } from 'react';

const DebugPage: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<string>('Checking...');
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [envVars, setEnvVars] = useState<Record<string, unknown> | null>(null);
  const [testSummary, setTestSummary] = useState<string>('Pending...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check database connection
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setDbStatus(data.database || 'Unknown'))
      .catch(() => {
        setDbStatus('Error');
        setError('Failed to fetch database status.');
      });

    // Check API status
    fetch('/api/health')
      .then(res => (res.ok ? setApiStatus('OK') : setApiStatus('Error')))
      .catch(() => {
        setApiStatus('Error');
        setError('Failed to fetch API status.');
      });

    // Fetch environment variables (safe subset)
    fetch('/api/debug/env')
      .then(res => res.json())
      .then(data => setEnvVars(data))
      .catch(() => {
        setEnvVars({ error: 'Unable to fetch' });
        setError('Failed to fetch environment variables.');
      });

    // Fetch test summary
    fetch('/api/debug/test-summary')
      .then(res => res.json())
      .then(data => setTestSummary(data.summary || 'No data'))
      .catch(() => {
        setTestSummary('Error');
        setError('Failed to fetch test summary.');
      });
  }, []);

  return (
    <div className='p-8'>
      <h1 className='text-3xl font-bold mb-6'>Debug Dashboard</h1>
      {error && (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded'>
          <strong>Error:</strong> {error}
        </div>
      )}
      <section className='mb-6'>
        <h2 className='text-xl font-semibold'>Database Connection</h2>
        <p>
          Status: <span className='font-mono'>{dbStatus}</span>
        </p>
      </section>
      <section className='mb-6'>
        <h2 className='text-xl font-semibold'>API Health</h2>
        <p>
          Status: <span className='font-mono'>{apiStatus}</span>
        </p>
      </section>
      <section className='mb-6'>
        <h2 className='text-xl font-semibold'>Environment Variables</h2>
        <pre className='bg-gray-100 p-2 rounded text-xs'>
          {envVars ? JSON.stringify(envVars, null, 2) : 'No environment variables found.'}
        </pre>
      </section>
      <section className='mb-6'>
        <h2 className='text-xl font-semibold'>Test Results Summary</h2>
        <pre className='bg-gray-100 p-2 rounded text-xs'>
          {testSummary ? testSummary : 'No test summary available.'}
        </pre>
      </section>
      <div className='mt-8 text-gray-400 text-xs'>
        If you see this page, the debug UI is rendering correctly.
      </div>
    </div>
  );
};

export default DebugPage;
