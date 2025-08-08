/**
 * Comprehensive test page to debug monitoring issues in production
 */

import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

function MonitoringDebugPage() {
  const [testResults, setTestResults] = useState<any>({});

  const testEndpoint = async (endpoint: string) => {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          success: response.ok,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        }
      }));
    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error);
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          error: error.message,
          success: false
        }
      }));
    }
  };

  const testAllEndpoints = async () => {
    const endpoints = [
      '/api/test',
      '/api/health',
      '/api/monitoring/metrics',
      '/api/monitoring/alerts',
      '/api/monitoring/health',
      '/api/monitoring/system',
      '/api/monitoring/kpi'
    ];

    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Monitoring Debug Page</h1>
      
      <Card className="p-4">
        <Button onClick={testAllEndpoints} className="mb-4">
          Test All API Endpoints
        </Button>
        
        <div className="space-y-4">
          {Object.entries(testResults).map(([endpoint, result]: [string, any]) => (
            <Alert key={endpoint} variant={result.success ? "default" : "destructive"}>
              <AlertDescription>
                <strong>{endpoint}</strong>
                <br />
                Status: {result.status || 'Error'}
                <br />
                Success: {result.success ? 'Yes' : 'No'}
                {result.error && (
                  <>
                    <br />
                    Error: {result.error}
                  </>
                )}
                {result.data && (
                  <details className="mt-2">
                    <summary>Response Data</summary>
                    <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default MonitoringDebugPage;
