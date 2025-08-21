import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Settings } from 'lucide-react';
import { Equipment } from '@shared/schema';

interface AssetCardProps {
  equipment: Equipment;
  onClick?: () => void;
}

export default function AssetCard({ equipment, onClick }: AssetCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'retired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      className='cursor-pointer hover:shadow-md transition-shadow'
      onClick={onClick}
      data-testid='asset-card'
    >
      <CardContent className='p-6'>
        <div className='flex items-start justify-between mb-4'>
          <div className='w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center'>
            <Settings className='w-6 h-6 text-primary-600' data-testid='asset-icon' />
          </div>
          <div className='flex space-x-2'>
            <Badge 
              className={getStatusColor(equipment.status)} 
              data-testid='status-badge'
            >
              {equipment.status}
            </Badge>
            <Badge 
              className={getCriticalityColor(equipment.criticality)}
              data-testid='criticality-badge'
            >
              {equipment.criticality}
            </Badge>
          </div>
        </div>

        <h3 
          className='font-semibold text-gray-900 mb-1' 
          data-testid='asset-tag'
        >
          {equipment.assetTag}
        </h3>
        <p 
          className='text-sm text-gray-600 mb-2' 
          data-testid='asset-description'
        >
          {equipment.description || 'No description'}
        </p>

        <div className='space-y-1 text-sm text-gray-500'>
          <div className='flex justify-between' data-testid='asset-model'>
            <span>Model:</span>
            <span>{equipment.model}</span>
          </div>
          {equipment.area && (
            <div className='flex justify-between' data-testid='asset-location'>
              <span>Location:</span>
              <span>{equipment.area}</span>
            </div>
          )}
          {equipment.manufacturer && (
            <div className='flex justify-between' data-testid='asset-manufacturer'>
              <span>Manufacturer:</span>
              <span>{equipment.manufacturer}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}