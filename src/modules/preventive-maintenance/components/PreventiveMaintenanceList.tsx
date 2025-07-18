import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import {
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  ClockIcon,
  SettingsIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from 'lucide-react';

export const PreventiveMaintenanceList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const mockSchedules = [
    {
      id: '1',
      name: 'Monthly HVAC Filter Change',
      equipmentName: 'HVAC Unit A-1',
      frequency: 'Monthly',
      nextDue: '2024-08-15',
      status: 'upcoming',
      assignedTo: 'John Smith',
    },
    {
      id: '2',
      name: 'Quarterly Generator Test',
      equipmentName: 'Backup Generator',
      frequency: 'Quarterly',
      nextDue: '2024-07-20',
      status: 'overdue',
      assignedTo: 'Mike Johnson',
    },
    {
      id: '3',
      name: 'Annual Boiler Inspection',
      equipmentName: 'Main Boiler',
      frequency: 'Annual',
      nextDue: '2024-09-01',
      status: 'upcoming',
      assignedTo: 'Sarah Wilson',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return AlertCircleIcon;
      case 'upcoming':
        return ClockIcon;
      case 'completed':
        return CheckCircleIcon;
      default:
        return CalendarIcon;
    }
  };

  const filteredSchedules = mockSchedules.filter(
    schedule =>
      schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.equipmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-secondary-900'>
            Preventive Maintenance
          </h1>
          <p className='text-secondary-600'>
            Manage preventive maintenance schedules and tasks
          </p>
        </div>
        <Button onClick={() => alert('Feature coming soon!')}>
          <PlusIcon className='h-4 w-4 mr-2' />
          Create Schedule
        </Button>
      </div>

      {/* Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card>
          <div className='card-body'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-secondary-600 mb-1'>
                  Total Schedules
                </p>
                <p className='text-2xl font-bold text-secondary-900'>12</p>
              </div>
              <div className='p-3 rounded-full bg-blue-100'>
                <CalendarIcon className='h-6 w-6 text-blue-600' />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='card-body'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-secondary-600 mb-1'>
                  Overdue
                </p>
                <p className='text-2xl font-bold text-red-600'>3</p>
              </div>
              <div className='p-3 rounded-full bg-red-100'>
                <AlertCircleIcon className='h-6 w-6 text-red-600' />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='card-body'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-secondary-600 mb-1'>
                  Due This Week
                </p>
                <p className='text-2xl font-bold text-yellow-600'>5</p>
              </div>
              <div className='p-3 rounded-full bg-yellow-100'>
                <ClockIcon className='h-6 w-6 text-yellow-600' />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='card-body'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-secondary-600 mb-1'>
                  Completed Today
                </p>
                <p className='text-2xl font-bold text-green-600'>2</p>
              </div>
              <div className='p-3 rounded-full bg-green-100'>
                <CheckCircleIcon className='h-6 w-6 text-green-600' />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className='card-body'>
          <div className='relative'>
            <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400' />
            <Input
              placeholder='Search schedules...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
      </Card>

      {/* Schedules List */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredSchedules.map(schedule => {
          const StatusIcon = getStatusIcon(schedule.status);

          return (
            <Card
              key={schedule.id}
              className='hover:shadow-lg transition-shadow'
            >
              <div className='card-body'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-secondary-900 mb-1'>
                      {schedule.name}
                    </h3>
                    <p className='text-sm text-secondary-500'>
                      {schedule.equipmentName}
                    </p>
                  </div>
                  <StatusIcon className='h-5 w-5 text-secondary-400' />
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-secondary-600'>Status</span>
                    <Badge className={getStatusColor(schedule.status)}>
                      {schedule.status}
                    </Badge>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-secondary-600'>
                      Frequency
                    </span>
                    <span className='text-sm text-secondary-900'>
                      {schedule.frequency}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-secondary-600'>Next Due</span>
                    <span className='text-sm text-secondary-900'>
                      {schedule.nextDue}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-secondary-600'>
                      Assigned To
                    </span>
                    <span className='text-sm text-secondary-900'>
                      {schedule.assignedTo}
                    </span>
                  </div>
                </div>

                <div className='mt-4 pt-4 border-t border-secondary-200'>
                  <div className='flex gap-2'>
                    <Button size='sm' className='flex-1'>
                      View Details
                    </Button>
                    {schedule.status === 'upcoming' && (
                      <Button variant='secondary' size='sm'>
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredSchedules.length === 0 && (
        <Card>
          <div className='card-body text-center py-12'>
            <SettingsIcon className='h-12 w-12 text-secondary-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-secondary-900 mb-2'>
              No Schedules Found
            </h3>
            <p className='text-secondary-600 mb-4'>
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Get started by creating your first preventive maintenance schedule.'}
            </p>
            <Button onClick={() => alert('Feature coming soon!')}>
              <PlusIcon className='h-4 w-4 mr-2' />
              Create Schedule
            </Button>
          </div>
        </Card>
      )}

      {/* Development Notice */}
      <Card className='border-yellow-200 bg-yellow-50'>
        <div className='card-body'>
          <div className='flex items-start gap-3'>
            <SettingsIcon className='h-5 w-5 text-yellow-600 mt-0.5' />
            <div>
              <h4 className='font-semibold text-yellow-800 mb-1'>
                Development in Progress
              </h4>
              <p className='text-sm text-yellow-700'>
                This module is showing demo data. Full functionality including
                schedule creation, automatic task generation, and completion
                tracking is being implemented.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
