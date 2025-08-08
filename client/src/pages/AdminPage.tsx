import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthDashboard } from '@/components/admin/HealthDashboard';
import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
          <p className="text-muted-foreground">
            Monitor and manage system health, performance, and configuration
          </p>
        </div>

        <Tabs defaultValue="health" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="health" className="space-y-4">
            <HealthDashboard />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <PerformanceDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}