import React from 'react';
import {
  ChartBarIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/modules/auth/hooks/useAuth';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
}) => {
  const getChangeColor = () => {
    if (!changeType) return 'text-secondary-500';
    return changeType === 'increase'
      ? 'text-success-600'
      : changeType === 'decrease'
        ? 'text-error-600'
        : 'text-secondary-500';
  };

  return (
    <div className='card'>
      <div className='card-body'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-secondary-600'>{title}</p>
            <p className='text-2xl font-bold text-secondary-900'>{value}</p>
            {change && (
              <p className={`text-sm ${getChangeColor()}`}>{change}</p>
            )}
          </div>
          <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
            <Icon className='w-6 h-6 text-primary-600' />
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className='space-y-6'>
      {/* Welcome header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-secondary-900'>
            Welcome back, {user?.firstName}!
          </h1>
          <p className='text-secondary-600'>
            Here's what's happening with your maintenance operations today.
          </p>
        </div>
        <div className='text-sm text-secondary-500'>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatsCard
          title='Active Work Orders'
          value={24}
          icon={WrenchScrewdriverIcon}
          change='+12% from last month'
          changeType='increase'
        />
        <StatsCard
          title='Equipment Assets'
          value={156}
          icon={CogIcon}
          change='+3 new assets'
          changeType='increase'
        />
        <StatsCard
          title='Low Stock Items'
          value={8}
          icon={ArchiveBoxIcon}
          change='-2 from yesterday'
          changeType='decrease'
        />
        <StatsCard
          title='Overdue Tasks'
          value={3}
          icon={ExclamationTriangleIcon}
          change='Needs attention'
          changeType='decrease'
        />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Work Orders */}
        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-semibold text-secondary-900'>
              Recent Work Orders
            </h3>
          </div>
          <div className='card-body space-y-4'>
            {[
              {
                id: 'WO-001',
                title: 'AC Unit Maintenance',
                status: 'In Progress',
                priority: 'High',
              },
              {
                id: 'WO-002',
                title: 'Conveyor Belt Repair',
                status: 'Pending',
                priority: 'Medium',
              },
              {
                id: 'WO-003',
                title: 'Emergency Generator Test',
                status: 'Completed',
                priority: 'Low',
              },
            ].map(order => (
              <div
                key={order.id}
                className='flex items-center justify-between p-3 border border-secondary-200 rounded-lg'
              >
                <div>
                  <p className='font-medium text-secondary-900'>
                    {order.title}
                  </p>
                  <p className='text-sm text-secondary-600'>{order.id}</p>
                </div>
                <div className='text-right'>
                  <span
                    className={`badge ${
                      order.status === 'Completed'
                        ? 'badge-success'
                        : order.status === 'In Progress'
                          ? 'badge-primary'
                          : 'badge-secondary'
                    }`}
                  >
                    {order.status}
                  </span>
                  <p
                    className={`text-xs mt-1 ${
                      order.priority === 'High'
                        ? 'text-error-600'
                        : order.priority === 'Medium'
                          ? 'text-warning-600'
                          : 'text-secondary-500'
                    }`}
                  >
                    {order.priority} Priority
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className='card'>
          <div className='card-header'>
            <h3 className='text-lg font-semibold text-secondary-900'>
              Quick Actions
            </h3>
          </div>
          <div className='card-body space-y-3'>
            <button className='w-full flex items-center p-3 text-left border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors'>
              <WrenchScrewdriverIcon className='w-5 h-5 mr-3 text-primary-600' />
              <span className='font-medium text-secondary-900'>
                Create Work Order
              </span>
            </button>
            <button className='w-full flex items-center p-3 text-left border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors'>
              <CogIcon className='w-5 h-5 mr-3 text-primary-600' />
              <span className='font-medium text-secondary-900'>
                Add Equipment
              </span>
            </button>
            <button className='w-full flex items-center p-3 text-left border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors'>
              <ArchiveBoxIcon className='w-5 h-5 mr-3 text-primary-600' />
              <span className='font-medium text-secondary-900'>
                Manage Inventory
              </span>
            </button>
            <button className='w-full flex items-center p-3 text-left border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors'>
              <ChartBarIcon className='w-5 h-5 mr-3 text-primary-600' />
              <span className='font-medium text-secondary-900'>
                View Reports
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      <div className='card'>
        <div className='card-header'>
          <h3 className='text-lg font-semibold text-secondary-900'>
            System Alerts
          </h3>
        </div>
        <div className='card-body space-y-3'>
          <div className='flex items-start p-3 bg-warning-50 border border-warning-200 rounded-lg'>
            <ExclamationTriangleIcon className='w-5 h-5 mr-3 text-warning-600 mt-0.5' />
            <div>
              <p className='font-medium text-warning-800'>Low Stock Alert</p>
              <p className='text-sm text-warning-700'>
                Motor oil is running low. Only 2 units remaining.
              </p>
            </div>
          </div>
          <div className='flex items-start p-3 bg-success-50 border border-success-200 rounded-lg'>
            <CheckCircleIcon className='w-5 h-5 mr-3 text-success-600 mt-0.5' />
            <div>
              <p className='font-medium text-success-800'>
                Maintenance Completed
              </p>
              <p className='text-sm text-success-700'>
                HVAC system maintenance has been completed successfully.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
