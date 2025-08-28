/**
 * Pest Control Admin Panel
 * 
 * Comprehensive admin dashboard for pest control business management
 * Features: user management, pricing, inventory, dispatch, CRM, analytics, compliance
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Package,
  MapPin,
  BarChart3,
  FileText,
  Settings,
  Shield,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';

// Feature flag check
import { isFeatureEnabled } from '../../../config/feature-flags';

interface DashboardMetrics {
  totalCustomers: number;
  activeAppointments: number;
  revenueThisMonth: number;
  pendingQuotes: number;
  completionRate: number;
  averageRating: number;
  chemicalUsage: number;
  complianceScore: number;
}

interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  status: string;
  loyaltyTier: string;
  accountBalance: number;
  lastService: string;
  properties: number;
}

interface ServiceAppointment {
  id: string;
  appointmentNumber: string;
  customer: { firstName: string; lastName: string; companyName?: string };
  property: { address: string; city: string; state: string };
  service: { name: string; category: string };
  technician?: { firstName: string; lastName: string };
  scheduledDate: string;
  status: string;
  totalAmount: number;
  customerRating?: number;
}

const PestControlAdminPanel: React.FC = () => {
  // Feature flag check
  if (!isFeatureEnabled('pestControlPlatform')) {
    return null;
  }

  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'appointments' | 'dispatch' | 'inventory' | 'analytics' | 'compliance' | 'settings'>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      setMetrics({
        totalCustomers: 1247,
        activeAppointments: 23,
        revenueThisMonth: 54780.50,
        pendingQuotes: 12,
        completionRate: 96.5,
        averageRating: 4.8,
        chemicalUsage: 85.2,
        complianceScore: 99.2,
      });

      setCustomers([
        {
          id: '1',
          customerId: 'CUST-2024-001',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@email.com',
          phoneNumber: '(555) 123-4567',
          status: 'active',
          loyaltyTier: 'silver',
          accountBalance: 0,
          lastService: '2024-01-15',
          properties: 1,
        },
        // Add more mock customers...
      ]);

      setAppointments([
        {
          id: '1',
          appointmentNumber: 'APPT-2024-0001',
          customer: { firstName: 'John', lastName: 'Smith' },
          property: { address: '123 Main St', city: 'Springfield', state: 'IL' },
          service: { name: 'General Pest Control', category: 'general_pest' },
          technician: { firstName: 'Mike', lastName: 'Johnson' },
          scheduledDate: '2024-02-01T10:00:00Z',
          status: 'scheduled',
          totalAmount: 89.99,
        },
        // Add more mock appointments...
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PestShield Admin</h1>
                <p className="text-sm text-gray-600">Business Management Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-600">Last login: Today 8:30 AM</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { key: 'customers', label: 'Customers', icon: Users },
              { key: 'appointments', label: 'Appointments', icon: Calendar },
              { key: 'dispatch', label: 'Dispatch Board', icon: MapPin },
              { key: 'inventory', label: 'Inventory', icon: Package },
              { key: 'analytics', label: 'Analytics', icon: TrendingUp },
              { key: 'compliance', label: 'Compliance', icon: Shield },
              { key: 'settings', label: 'Settings', icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === key
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardView metrics={metrics} />}
        {activeTab === 'customers' && <CustomersView customers={customers} />}
        {activeTab === 'appointments' && <AppointmentsView appointments={appointments} />}
        {activeTab === 'dispatch' && <DispatchView appointments={appointments} />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'analytics' && <AnalyticsView metrics={metrics} />}
        {activeTab === 'compliance' && <ComplianceView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

// Dashboard View Component
const DashboardView: React.FC<{ metrics: DashboardMetrics | null }> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalCustomers.toLocaleString()}</p>
              <p className="text-gray-600">Total Customers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{metrics.activeAppointments}</p>
              <p className="text-gray-600">Active Appointments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">${metrics.revenueThisMonth.toLocaleString()}</p>
              <p className="text-gray-600">Revenue This Month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{metrics.pendingQuotes}</p>
              <p className="text-gray-600">Pending Quotes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">{metrics.completionRate}%</p>
              <p className="text-gray-600">Completion Rate</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">{metrics.averageRating}</p>
              <p className="text-gray-600">Avg Customer Rating</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">{metrics.chemicalUsage}%</p>
              <p className="text-gray-600">Chemical Usage Rate</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">{metrics.complianceScore}%</p>
              <p className="text-gray-600">Compliance Score</p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Appointments</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-gray-900">General Pest Control</p>
                  <p className="text-sm text-gray-600">John Smith • 123 Main St</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">Completed</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Alerts & Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Low Chemical Stock</p>
                <p className="text-sm text-gray-600">Phantom Aerosol is running low (8 units remaining)</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Appointment Reminder</p>
                <p className="text-sm text-gray-600">Mike Johnson has 6 appointments scheduled for today</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <Star className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">New 5-Star Review</p>
                <p className="text-sm text-gray-600">Mary Johnson left excellent feedback for recent service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Customers View Component
const CustomersView: React.FC<{ customers: Customer[] }> = ({ customers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.companyName && customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const loyaltyTiers = {
    bronze: { color: 'text-amber-600', bg: 'bg-amber-50' },
    silver: { color: 'text-gray-600', bg: 'bg-gray-50' },
    gold: { color: 'text-yellow-600', bg: 'bg-yellow-50' },
    platinum: { color: 'text-purple-600', bg: 'bg-purple-50' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loyalty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Properties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </p>
                      {customer.companyName && (
                        <p className="text-sm text-gray-600">{customer.companyName}</p>
                      )}
                      <p className="text-xs text-gray-500">{customer.customerId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {customer.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {customer.phoneNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : customer.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      loyaltyTiers[customer.loyaltyTier as keyof typeof loyaltyTiers]?.bg
                    } ${loyaltyTiers[customer.loyaltyTier as keyof typeof loyaltyTiers]?.color}`}>
                      {customer.loyaltyTier.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.properties}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(customer.lastService).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      customer.accountBalance > 0
                        ? 'text-red-600'
                        : customer.accountBalance < 0
                        ? 'text-green-600'
                        : 'text-gray-900'
                    }`}>
                      ${Math.abs(customer.accountBalance).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Appointments View Component
const AppointmentsView: React.FC<{ appointments: ServiceAppointment[] }> = ({ appointments }) => {
  const [viewType, setViewType] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAppointments = appointments.filter(appointment => {
    return statusFilter === 'all' || appointment.status === statusFilter;
  });

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Appointment Management</h2>
        <div className="flex items-center space-x-4">
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewType('list')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                viewType === 'list'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewType('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border ${
                viewType === 'calendar'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Calendar View
            </button>
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{appointment.appointmentNumber}</p>
                      {appointment.customerRating && (
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < appointment.customerRating!
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.customer.firstName} {appointment.customer.lastName}
                      </p>
                      {appointment.customer.companyName && (
                        <p className="text-sm text-gray-600">{appointment.customer.companyName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">{appointment.property.address}</p>
                      <p className="text-sm text-gray-600">
                        {appointment.property.city}, {appointment.property.state}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{appointment.service.name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {appointment.service.category.replace('_', ' ')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.technician ? (
                      <p className="text-sm text-gray-900">
                        {appointment.technician.firstName} {appointment.technician.lastName}
                      </p>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm text-gray-900">
                        {new Date(appointment.scheduledDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.scheduledDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[appointment.status as keyof typeof statusColors]
                    }`}>
                      {appointment.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${appointment.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Dispatch View Component
const DispatchView: React.FC<{ appointments: ServiceAppointment[] }> = ({ appointments }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dispatch Board</h2>
      
      {/* Route Optimization */}
      {isFeatureEnabled('pestControlRouteOptimization') && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Smart Route Optimization</h3>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              Optimize Routes
            </button>
          </div>
          <p className="text-gray-600">AI-powered route optimization can reduce travel time by up to 25%</p>
        </div>
      )}

      {/* Technician Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['Mike Johnson', 'Sarah Davis', 'Tom Wilson'].map((technician, index) => (
          <div key={technician} className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-medium text-gray-900">{technician}</h3>
              <p className="text-sm text-gray-600">6 appointments today</p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {appointments.slice(index * 2, (index + 1) * 2).map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {new Date(appointment.scheduledDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        appointment.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">
                      {appointment.customer.firstName} {appointment.customer.lastName}
                    </p>
                    <p className="text-xs text-gray-600">{appointment.property.address}</p>
                    <p className="text-xs text-gray-600">{appointment.service.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Inventory View Component
const InventoryView: React.FC = () => {
  const [chemicals] = useState([
    {
      id: '1',
      productName: 'Termidor SC',
      activeIngredient: 'Fipronil',
      epaNumber: '7969-210',
      currentStock: 15,
      minimumStock: 5,
      unitCost: 189.99,
      expirationDate: '2025-06-30',
      status: 'active',
    },
    {
      id: '2',
      productName: 'Phantom Aerosol',
      activeIngredient: 'Chlorfenapyr',
      epaNumber: '241-392',
      currentStock: 8,
      minimumStock: 10,
      unitCost: 45.99,
      expirationDate: '2024-12-15',
      status: 'active',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Chemical Inventory Management</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Chemical
        </button>
      </div>

      {/* Inventory Alerts */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-yellow-800">Low Stock Alert</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Phantom Aerosol is below minimum stock level (8 units remaining, minimum 10)
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EPA Registration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Minimum Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chemicals.map((chemical) => (
                <tr key={chemical.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{chemical.productName}</p>
                      <p className="text-sm text-gray-600">{chemical.activeIngredient}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {chemical.epaNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium ${
                      chemical.currentStock <= chemical.minimumStock
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {chemical.currentStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {chemical.minimumStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${chemical.unitCost}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(chemical.expirationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {chemical.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Package className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Analytics View Component
const AnalyticsView: React.FC<{ metrics: DashboardMetrics | null }> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Business Analytics</h2>
      
      {/* Revenue Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trends</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Revenue Chart (Integration with charting library needed)</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="font-medium">{metrics?.completionRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Rating</span>
              <span className="font-medium">{metrics?.averageRating}/5.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">On-Time Performance</span>
              <span className="font-medium">94.2%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Customer Retention</span>
              <span className="font-medium">87.3%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Service Value</span>
              <span className="font-medium">$127.50</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Referral Rate</span>
              <span className="font-medium">23.1%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compliance View Component
const ComplianceView: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">EPA Compliance Dashboard</h2>
      
      {/* Compliance Score */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Overall Compliance Score</h3>
          <span className="text-3xl font-bold text-green-600">99.2%</span>
        </div>
        <p className="text-gray-600">All regulatory requirements are being met</p>
      </div>

      {/* Compliance Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Chemical Usage Tracking</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Applications Logged</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="font-medium">100%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Weather Data Recorded</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="font-medium">100%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">EPA Forms Filed</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="font-medium">Current</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Technician Certifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Certifications</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="font-medium">12/12</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expiring Soon (90 days)</span>
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="font-medium">2</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Training Hours</span>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="font-medium">Current</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Compliance Reports</h3>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Monthly Chemical Usage Report</p>
              <p className="text-sm text-gray-600">January 2024 • Due Feb 1st</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Submitted
            </span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Quarterly Inspection Report</p>
              <p className="text-sm text-gray-600">Q1 2024 • Due Apr 1st</p>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              In Progress
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings View Component
const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
      
      {/* Business Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              defaultValue="PestShield Professional Services"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Number
            </label>
            <input
              type="text"
              defaultValue="PC-2024-001"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Pricing Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Rules</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Base Service Fee</p>
              <p className="text-sm text-gray-600">Standard residential treatment</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">$89.99</span>
              <button className="text-blue-600 hover:text-blue-900">
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Travel Charge</p>
              <p className="text-sm text-gray-600">Per mile over 10 miles</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">$2.50</span>
              <button className="text-blue-600 hover:text-blue-900">
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Configuration</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">AI Quote Generation</p>
              <p className="text-sm text-gray-600">Enable AI-powered quote generation</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Route Optimization</p>
              <p className="text-sm text-gray-600">AI-powered route optimization</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestControlAdminPanel;