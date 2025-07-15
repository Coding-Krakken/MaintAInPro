import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AuthDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Starting auth debug check...');

        // Check environment variables
        const envVars = {
          VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
          VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
            ? 'SET'
            : 'NOT SET',
        };

        console.log('📝 Environment variables:', envVars);

        // Check if we can connect to Supabase
        console.log('🔗 Checking Supabase connection...');
        const { data: session, error: sessionError } =
          await supabase.auth.getSession();

        console.log('📊 Session result:', { session, sessionError });

        // Check auth state
        console.log('👤 Checking auth state...');
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        console.log('🔐 User result:', { user, userError });

        setDebugInfo({
          envVars,
          session,
          sessionError: sessionError?.message,
          user,
          userError: userError?.message,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('❌ Auth debug error:', error);
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
        <h3 className='font-bold text-yellow-800'>Auth Debug Loading...</h3>
      </div>
    );
  }

  return (
    <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
      <h3 className='font-bold text-blue-800 mb-2'>Auth Debug Info</h3>
      <pre className='text-sm text-gray-700 whitespace-pre-wrap'>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};

export default AuthDebug;
