import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  DownloadIcon,
  BarChart3Icon,
  PieChartIcon,
  TrendingUpIcon,
  CalendarIcon,
  FileTextIcon,
  FilterIcon,
} from 'lucide-react';

export const ReportsList: React.FC = () => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportType, setReportType] = useState('');

  const reportTypes = [
    { value: '', label: 'All Reports' },
    { value: 'work_orders', label: 'Work Orders' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'costs', label: 'Costs & Budget' },
  ];

  const reports = [
    {
      id: '1',
      title: 'Work Order Summary',
      description:
        'Overview of work orders by status, priority, and completion time',
      type: 'work_orders',
      icon: FileTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: '2',
      title: 'Equipment Downtime Analysis',
      description: 'Analysis of equipment downtime and maintenance frequency',
      type: 'equipment',
      icon: BarChart3Icon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      id: '3',
      title: 'Inventory Usage Report',
      description: 'Parts consumption and stock level analysis',
      type: 'inventory',
      icon: PieChartIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      id: '4',
      title: 'Maintenance Cost Trends',
      description:
        'Cost analysis and budget tracking for maintenance activities',
      type: 'costs',
      icon: TrendingUpIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      id: '5',
      title: 'Preventive Maintenance Schedule',
      description: 'Upcoming and overdue preventive maintenance tasks',
      type: 'maintenance',
      icon: CalendarIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const filteredReports = reports.filter(
    report => !reportType || report.type === reportType
  );

  const handleGenerateReport = (reportId: string) => {
    alert(`Generating report ${reportId}... Feature coming soon!`);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-secondary-900'>
          Reports & Analytics
        </h1>
        <p className='text-secondary-600'>
          Generate comprehensive maintenance reports and analytics
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className='card-body'>
          <div className='flex items-center gap-2 mb-4'>
            <FilterIcon className='h-5 w-5 text-secondary-600' />
            <h3 className='text-lg font-semibold text-secondary-900'>
              Report Filters
            </h3>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <label
                htmlFor='from-date'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                From Date
              </label>
              <Input
                id='from-date'
                type='date'
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor='to-date'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                To Date
              </label>
              <Input
                id='to-date'
                type='date'
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Select
                label='Report Type'
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                options={reportTypes}
              />
            </div>
            <div className='flex items-end'>
              <Button variant='secondary' className='w-full'>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card>
          <div className='card-body'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-secondary-600 mb-1'>
                  Work Orders (30d)
                </p>
                <p className='text-2xl font-bold text-secondary-900'>47</p>
              </div>
              <div className='p-3 rounded-full bg-blue-100'>
                <FileTextIcon className='h-6 w-6 text-blue-600' />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='card-body'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-secondary-600 mb-1'>
                  Avg. Completion Time
                </p>
                <p className='text-2xl font-bold text-secondary-900'>3.2h</p>
              </div>
              <div className='p-3 rounded-full bg-green-100'>
                <BarChart3Icon className='h-6 w-6 text-green-600' />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='card-body'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-secondary-600 mb-1'>
                  Parts Used
                </p>
                <p className='text-2xl font-bold text-secondary-900'>142</p>
              </div>
              <div className='p-3 rounded-full bg-purple-100'>
                <PieChartIcon className='h-6 w-6 text-purple-600' />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className='card-body'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-secondary-600 mb-1'>
                  Total Cost
                </p>
                <p className='text-2xl font-bold text-secondary-900'>$8,240</p>
              </div>
              <div className='p-3 rounded-full bg-orange-100'>
                <TrendingUpIcon className='h-6 w-6 text-orange-600' />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Reports */}
      <div>
        <h2 className='text-xl font-semibold text-secondary-900 mb-4'>
          Available Reports
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredReports.map(report => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className='hover:shadow-lg transition-shadow'
              >
                <div className='card-body'>
                  <div className='flex items-start gap-4'>
                    <div className={`p-3 rounded-full ${report.bgColor}`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-lg font-semibold text-secondary-900 mb-2'>
                        {report.title}
                      </h3>
                      <p className='text-sm text-secondary-600 mb-4'>
                        {report.description}
                      </p>
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          onClick={() => handleGenerateReport(report.id)}
                        >
                          <DownloadIcon className='h-4 w-4 mr-2' />
                          Generate
                        </Button>
                        <Button variant='secondary' size='sm'>
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Development Notice */}
      <Card className='border-blue-200 bg-blue-50'>
        <div className='card-body'>
          <div className='flex items-start gap-3'>
            <BarChart3Icon className='h-5 w-5 text-blue-600 mt-0.5' />
            <div>
              <h4 className='font-semibold text-blue-800 mb-1'>
                Advanced Analytics Coming Soon
              </h4>
              <p className='text-sm text-blue-700'>
                This module shows demo data and basic report templates. Full
                analytics capabilities including custom report builders, charts,
                and automated scheduling are being developed.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
