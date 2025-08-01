import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { ThemeProvider } from '@/components/ui/DarkModeToggle';
import { ToastNotificationProvider } from '@/components/ui/NotificationCenter';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Login = React.lazy(() => import('@/pages/LoginMFA'));
const WorkOrders = React.lazy(
  () => import('@/modules/work-orders/pages/WorkOrdersPage')
);
const WorkOrderDetail = React.lazy(
  () => import('@/modules/work-orders/pages/WorkOrderDetailPage')
);
const CreateWorkOrder = React.lazy(
  () => import('@/modules/work-orders/pages/CreateWorkOrderPage')
);
const EditWorkOrder = React.lazy(
  () => import('@/modules/work-orders/pages/EditWorkOrderPage')
);
const WorkOrderChecklist = React.lazy(
  () => import('@/modules/work-orders/pages/WorkOrderChecklistPage')
);
const WorkOrderHistory = React.lazy(
  () => import('@/modules/work-orders/pages/WorkOrderHistoryPage')
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
  const { isLoading } = useAuth();

  // Add a timeout fallback for loading state
  const [showLoadingFallback, setShowLoadingFallback] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowLoadingFallback(true);
      }
    }, 8000); // 8 seconds

    return () => clearTimeout(timer);
  }, [isLoading]);

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
        <p className='text-sm text-gray-600'>
          Please check your environment configuration and try again.
        </p>
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
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastNotificationProvider>
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
                  <Route
                    path='/work-orders/create'
                    element={<CreateWorkOrder />}
                  />
                  <Route
                    path='/work-orders/:id'
                    element={<WorkOrderDetail />}
                  />
                  <Route
                    path='/work-orders/:id/edit'
                    element={<EditWorkOrder />}
                  />
                  <Route
                    path='/work-orders/:id/checklist'
                    element={<WorkOrderChecklist />}
                  />
                  <Route
                    path='/work-orders/:id/history'
                    element={<WorkOrderHistory />}
                  />

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
          </Suspense>
        </ToastNotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
