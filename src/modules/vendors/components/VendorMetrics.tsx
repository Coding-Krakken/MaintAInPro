import React from 'react';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import {
  BuildingIcon,
  CheckCircleIcon,
  UsersIcon,
  StarIcon,
} from 'lucide-react';

interface VendorMetricsProps {
  metrics: {
    totalVendors: number;
    activeVendors: number;
    vendorsByType: Record<string, number>;
    averageRating: number;
  } | null;
}

export const VendorMetrics: React.FC<VendorMetricsProps> = ({ metrics }) => {
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
      title: 'Total Vendors',
      value: metrics.totalVendors.toLocaleString(),
      icon: BuildingIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Vendors',
      value: metrics.activeVendors.toLocaleString(),
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Most Common Type',
      value:
        Object.entries(metrics.vendorsByType)
          .sort((a, b) => b[1] - a[1])[0]?.[0]
          ?.replace('_', ' ') || 'N/A',
      icon: UsersIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Average Rating',
      value: metrics.averageRating > 0 ? `${metrics.averageRating}⭐` : 'N/A',
      icon: StarIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
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
