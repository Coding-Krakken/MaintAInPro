/**
 * Pest Control Customer Portal
 * 
 * Modern, intuitive customer portal for pest control services
 * Features: booking, payment, service history, AI-powered quotes
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Star,
  Bug,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  Building,
  Leaf,
  MessageSquare,
} from 'lucide-react';

// Feature flag check
import { isFeatureEnabled } from '../../../config/feature-flags';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  accountBalance: number;
}

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  type: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  squareFootage?: number;
  knownPestHistory?: any[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  frequency?: string;
  duration?: number;
}

interface ServiceAppointment {
  id: string;
  appointmentNumber: string;
  scheduledDate: string;
  status: string;
  service: { name: string; category: string };
  property: { address: string; city: string; state: string };
  technician?: { firstName: string; lastName: string };
  totalAmount: number;
  customerRating?: number;
  customerFeedback?: string;
}

const PestControlCustomerPortal: React.FC = () => {
  // Feature flag check
  if (!isFeatureEnabled('pestControlCustomerPortal')) {
    return null;
  }

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<ServiceAppointment[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'book' | 'history' | 'billing' | 'profile'>('dashboard');
  const [loading, setLoading] = useState(true);

  // Loyalty tier configurations
  const loyaltyTiers = {
    bronze: { color: 'text-amber-600', bg: 'bg-amber-50', discount: 0 },
    silver: { color: 'text-gray-600', bg: 'bg-gray-50', discount: 5 },
    gold: { color: 'text-yellow-600', bg: 'bg-yellow-50', discount: 10 },
    platinum: { color: 'text-purple-600', bg: 'bg-purple-50', discount: 15 },
  };

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      
      // Load customer profile (mock data - replace with actual API calls)
      setCustomer({
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phoneNumber: '(555) 123-4567',
        loyaltyTier: 'silver',
        accountBalance: 0.00,
      });

      // Load properties
      setProperties([
        {
          id: '1',
          address: '123 Main Street',
          city: 'Springfield',
          state: 'IL',
          type: 'residential',
          squareFootage: 2400,
          knownPestHistory: ['ants', 'spiders'],
        },
      ]);

      // Load available services
      setServices([
        {
          id: '1',
          name: 'General Pest Control',
          description: 'Comprehensive interior and exterior treatment',
          category: 'general_pest',
          basePrice: 89.99,
          frequency: 'quarterly',
          duration: 60,
        },
        {
          id: '2',
          name: 'Ant Treatment',
          description: 'Targeted ant control with baiting system',
          category: 'ant',
          basePrice: 129.99,
          frequency: 'one_time',
          duration: 45,
        },
      ]);

      // Load appointment history
      setAppointments([
        {
          id: '1',
          appointmentNumber: 'APPT-2024-0001',
          scheduledDate: '2024-01-15T10:00:00Z',
          status: 'completed',
          service: { name: 'General Pest Control', category: 'general_pest' },
          property: { address: '123 Main Street', city: 'Springfield', state: 'IL' },
          technician: { firstName: 'Mike', lastName: 'Johnson' },
          totalAmount: 89.99,
          customerRating: 5,
          customerFeedback: 'Excellent service, very thorough!',
        },
      ]);
    } catch (error) {
      console.error('Error loading customer data:', error);
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
              <h1 className="text-2xl font-bold text-gray-900">PestShield Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              {customer && (
                <div className="flex items-center">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${loyaltyTiers[customer.loyaltyTier].bg} ${loyaltyTiers[customer.loyaltyTier].color}`}>
                    {customer.loyaltyTier.toUpperCase()} MEMBER
                  </div>
                  <span className="ml-3 text-sm text-gray-700">
                    {customer.firstName} {customer.lastName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: Home },
              { key: 'book', label: 'Book Service', icon: Calendar },
              { key: 'history', label: 'Service History', icon: FileText },
              { key: 'billing', label: 'Billing & Payments', icon: CreditCard },
              { key: 'profile', label: 'My Profile', icon: null },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  {Icon && <Icon className="h-4 w-4 mr-2" />}
                  {label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardView customer={customer} appointments={appointments} properties={properties} />}
        {activeTab === 'book' && <BookingView services={services} properties={properties} />}
        {activeTab === 'history' && <HistoryView appointments={appointments} />}
        {activeTab === 'billing' && <BillingView customer={customer} appointments={appointments} />}
        {activeTab === 'profile' && <ProfileView customer={customer} properties={properties} />}
      </main>
    </div>
  );
};

// Dashboard View Component
const DashboardView: React.FC<{
  customer: Customer | null;
  appointments: ServiceAppointment[];
  properties: Property[];
}> = ({ customer, appointments, properties }) => {
  const nextAppointment = appointments.find(apt => apt.status === 'scheduled');
  const recentServices = appointments.filter(apt => apt.status === 'completed').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {customer?.firstName}!
        </h2>
        <p className="opacity-90">
          Your home is protected by our comprehensive pest control program.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{properties.length}</p>
              <p className="text-gray-600">Protected Properties</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {appointments.filter(apt => apt.status === 'completed').length}
              </p>
              <p className="text-gray-600">Services Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {appointments.filter(apt => apt.status === 'scheduled').length}
              </p>
              <p className="text-gray-600">Upcoming Services</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">
                {customer?.loyaltyTier?.toUpperCase() || 'N/A'}
              </p>
              <p className="text-gray-600">Loyalty Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Appointment */}
      {nextAppointment && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Next Appointment</h3>
          <div className="flex items-start space-x-4">
            <div className="bg-green-100 rounded-full p-2">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{nextAppointment.service.name}</p>
              <p className="text-sm text-gray-600">
                {new Date(nextAppointment.scheduledDate).toLocaleDateString()} at{' '}
                {new Date(nextAppointment.scheduledDate).toLocaleTimeString()}
              </p>
              <p className="text-sm text-gray-600">
                <MapPin className="h-4 w-4 inline mr-1" />
                {nextAppointment.property.address}
              </p>
              {nextAppointment.technician && (
                <p className="text-sm text-gray-600">
                  Technician: {nextAppointment.technician.firstName} {nextAppointment.technician.lastName}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">${nextAppointment.totalAmount}</p>
              <button className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Services */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Services</h3>
        <div className="space-y-4">
          {recentServices.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-full p-2">
                  <Bug className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{appointment.service.name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(appointment.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {appointment.customerRating && (
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < appointment.customerRating!
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
                <span className="font-medium text-gray-900">${appointment.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Chat Support (if enabled) */}
      {isFeatureEnabled('pestControlAIChatbot') && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Need Help?</h3>
              <p className="text-gray-600">Chat with our AI assistant for instant support</p>
            </div>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Start Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Booking View Component
const BookingView: React.FC<{
  services: Service[];
  properties: Property[];
}> = ({ services, properties }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const serviceCategories = {
    general_pest: { icon: Shield, name: 'General Pest Control', color: 'green' },
    ant: { icon: Bug, name: 'Ant Control', color: 'red' },
    rodent: { icon: Home, name: 'Rodent Control', color: 'brown' },
    termite: { icon: Building, name: 'Termite Control', color: 'yellow' },
    lawn_care: { icon: Leaf, name: 'Lawn Care', color: 'green' },
  } as const;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Book Your Service</h2>
        <p className="mt-2 text-gray-600">Schedule professional pest control service</p>
      </div>

      {/* Service Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Service</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => {
            const category = serviceCategories[service.category as keyof typeof serviceCategories];
            const Icon = category?.icon || Bug;
            
            return (
              <div
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedService?.id === service.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-gray-100 rounded-full p-2">
                    <Icon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-semibold text-green-600">
                        ${service.basePrice}
                      </span>
                      {service.duration && (
                        <span className="text-sm text-gray-500">~{service.duration} min</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Property Selection */}
      {selectedService && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Property</h3>
          <div className="space-y-3">
            {properties.map((property) => (
              <div
                key={property.id}
                onClick={() => setSelectedProperty(property)}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedProperty?.id === property.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {property.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      {property.city}, {property.state} • {property.type}
                      {property.squareFootage && ` • ${property.squareFootage.toLocaleString()} sq ft`}
                    </p>
                  </div>
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date & Time Selection */}
      {selectedService && selectedProperty && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Appointment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Window
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select time...</option>
                <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                <option value="afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
                <option value="specific">Specific time (call to arrange)</option>
              </select>
            </div>
          </div>

          {selectedDate && selectedTime && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span>{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Property:</span>
                  <span>{selectedProperty.address}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(selectedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="capitalize">{selectedTime.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${selectedService.basePrice}</span>
                </div>
              </div>
              <button className="mt-4 w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium">
                Confirm Booking
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// History View Component
const HistoryView: React.FC<{ appointments: ServiceAppointment[] }> = ({ appointments }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Service History</h2>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Past Services</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status.toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-500">
                      {appointment.appointmentNumber}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-medium text-gray-900 mt-2">
                    {appointment.service.name}
                  </h4>
                  
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-600">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {new Date(appointment.scheduledDate).toLocaleDateString()} at{' '}
                      {new Date(appointment.scheduledDate).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      {appointment.property.address}
                    </p>
                    {appointment.technician && (
                      <p className="text-sm text-gray-600">
                        Technician: {appointment.technician.firstName} {appointment.technician.lastName}
                      </p>
                    )}
                  </div>
                  
                  {appointment.customerFeedback && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">{appointment.customerFeedback}</p>
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-6">
                  <p className="text-lg font-semibold text-gray-900">
                    ${appointment.totalAmount}
                  </p>
                  
                  {appointment.customerRating && (
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < appointment.customerRating!
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Billing View Component
const BillingView: React.FC<{
  customer: Customer | null;
  appointments: ServiceAppointment[];
}> = ({ customer, appointments }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Billing & Payments</h2>
      
      {/* Account Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              ${customer?.accountBalance?.toFixed(2) || '0.00'}
            </p>
            <p className="text-gray-600">Current Balance</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              ${appointments
                .filter(apt => apt.status === 'completed')
                .reduce((sum, apt) => sum + apt.totalAmount, 0)
                .toFixed(2)}
            </p>
            <p className="text-gray-600">Total Paid</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {customer?.loyaltyTier === 'silver' ? '5%' :
               customer?.loyaltyTier === 'gold' ? '10%' :
               customer?.loyaltyTier === 'platinum' ? '15%' : '0%'}
            </p>
            <p className="text-gray-600">Loyalty Discount</p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
          <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
            Add Payment Method
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-600">Expires 12/26</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Default
              </span>
              <button className="text-blue-600 hover:text-blue-800 text-sm">
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Invoices</h3>
        <div className="space-y-3">
          {appointments
            .filter(apt => apt.status === 'completed')
            .slice(0, 5)
            .map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Invoice #{appointment.appointmentNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    {appointment.service.name} - {new Date(appointment.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${appointment.totalAmount}</p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Profile View Component
const ProfileView: React.FC<{
  customer: Customer | null;
  properties: Property[];
}> = ({ customer, properties }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
      
      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            Edit Profile
          </button>
        </div>
        
        {customer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <p className="mt-1 text-sm text-gray-900">{customer.firstName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <p className="mt-1 text-sm text-gray-900">{customer.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{customer.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-sm text-gray-900">{customer.phoneNumber}</p>
            </div>
          </div>
        )}
      </div>

      {/* Properties */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">My Properties</h3>
          <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
            Add Property
          </button>
        </div>
        
        <div className="space-y-4">
          {properties.map((property) => (
            <div key={property.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{property.address}</p>
                  <p className="text-sm text-gray-600">
                    {property.city}, {property.state} • {property.type}
                  </p>
                  {property.squareFootage && (
                    <p className="text-sm text-gray-600">
                      {property.squareFootage.toLocaleString()} sq ft
                    </p>
                  )}
                  {property.knownPestHistory && property.knownPestHistory.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Previous pest issues:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {property.knownPestHistory.map((pest, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                          >
                            {pest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PestControlCustomerPortal;