import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import DebugInfo from '@/components/DebugInfo';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Login = React.lazy(() => import('@/pages/Login'));
const WorkOrders = React.lazy(
  () => import('@/modules/work-orders/pages/WorkOrdersPage')
);
const WorkOrderDetail = React.lazy(
  () => import('@/modules/work-orders/pages/WorkOrderDetailPage')
);
const Equipment = React.lazy(
  () => import('@/modules/equipment/pages/EquipmentPage')
);
const EquipmentDetail = React.lazy(
  () => import('@/modules/equipment/pages/EquipmentDetailPage')
);
const Inventory = React.lazy(
  () => import('@/modules/inventory/pages/InventoryPage')
);
const PartDetail = React.lazy(
  () => import('@/modules/inventory/pages/PartDetailPage')
);
const PreventiveMaintenance = React.lazy(
  () =>
    import('@/modules/preventive-maintenance/pages/PreventiveMaintenancePage')
);
const Vendors = React.lazy(() => import('@/modules/vendors/pages/VendorsPage'));
const Reports = React.lazy(() => import('@/modules/reports/pages/ReportsPage'));
const Settings = React.lazy(
  () => import('@/modules/settings/pages/SettingsPage')
);
const Profile = React.lazy(() => import('@/pages/Profile'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

const App: React.FC = () => {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Add a timeout fallback for loading state
  const [showLoadingFallback, setShowLoadingFallback] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Loading state persisted too long, showing fallback');
        setShowLoadingFallback(true);
      }
    }, 8000); // 8 seconds

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Debug output
  console.log('App render:', { isLoading, isAuthenticated, user });

  // Show debug info if there are issues
  if (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY
  ) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold text-red-600 mb-4'>
          Configuration Error
        </h1>
        <p className='mb-4'>
          Supabase environment variables are not configured.
        </p>
        <DebugInfo />
      </div>
    );
  }

  if (isLoading && !showLoadingFallback) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <LoadingSpinner size='lg' />
          <p className='mt-4 text-gray-600'>Loading application...</p>
        </div>
      </div>
    );
  }

  // If loading has been going on too long, show fallback
  if (showLoadingFallback) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center max-w-md'>
          <div className='mb-4'>
            <LoadingSpinner size='lg' />
          </div>
          <p className='text-gray-600 mb-4'>
            Loading is taking longer than expected...
          </p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >
            Reload Page
          </button>
          <div className='mt-4'>
            <DebugInfo />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center min-h-screen'>
          <LoadingSpinner size='lg' />
        </div>
      }
    >
      <Routes>
        {/* Public routes */}
        <Route path='/login' element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path='/' element={<Dashboard />} />
            <Route path='/dashboard' element={<Dashboard />} />

            {/* Work Orders */}
            <Route path='/work-orders' element={<WorkOrders />} />
            <Route path='/work-orders/:id' element={<WorkOrderDetail />} />

            {/* Equipment & Assets */}
            <Route path='/equipment' element={<Equipment />} />
            <Route path='/equipment/:id' element={<EquipmentDetail />} />

            {/* Parts & Inventory */}
            <Route path='/inventory' element={<Inventory />} />
            <Route path='/inventory/parts/:id' element={<PartDetail />} />

            {/* Preventive Maintenance */}
            <Route
              path='/preventive-maintenance'
              element={<PreventiveMaintenance />}
            />

            {/* Vendors & Contractors */}
            <Route path='/vendors' element={<Vendors />} />

            {/* Reports & Analytics */}
            <Route path='/reports' element={<Reports />} />

            {/* Settings */}
            <Route path='/settings' element={<Settings />} />

            {/* Profile */}
            <Route path='/profile' element={<Profile />} />
          </Route>
        </Route>

        {/* 404 page */}
        <Route path='*' element={<NotFound />} />
      </Routes>
      <DebugInfo />
    </Suspense>
  );
};

export default App;
