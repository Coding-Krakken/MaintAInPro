import React from 'react';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import {
  PackageIcon,
  DollarSignIcon,
  AlertTriangleIcon,
  XCircleIcon,
} from 'lucide-react';

interface InventoryMetricsProps {
  metrics: {
    totalParts: number;
    totalValue: number;
    lowStockParts: number;
    outOfStockParts: number;
  } | null;
}

export const InventoryMetrics: React.FC<InventoryMetricsProps> = ({
  metrics,
}) => {
  if (!metrics) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <div className='card-body text-center py-8'>
              <LoadingSpinner size='sm' />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const metricItems = [
    {
      title: 'Total Parts',
      value: metrics.totalParts.toLocaleString(),
      icon: PackageIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Value',
      value: `$${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSignIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Low Stock',
      value: metrics.lowStockParts.toLocaleString(),
      icon: AlertTriangleIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Out of Stock',
      value: metrics.outOfStockParts.toLocaleString(),
      icon: XCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {metricItems.map(item => {
        const Icon = item.icon;
        return (
          <Card key={item.title}>
            <div className='card-body'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-secondary-600 mb-1'>
                    {item.title}
                  </p>
                  <p className='text-2xl font-bold text-secondary-900'>
                    {item.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${item.bgColor}`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
