/**
 * Pest Control Technician Mobile App
 * 
 * Mobile-first technician app for pest control services
 * Features: route optimization, chemical logging, EPA compliance, photos, notes
 */

import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Camera,
  MapPin,
  Clock,
  CheckSquare,
  AlertTriangle,
  Phone,
  MessageSquare,
  Droplets,
  Shield,
  User,
  Route,
  FileText,
  Star,
  Upload,
  QrCode,
  Thermometer,
  Wind,
  CloudRain,
} from 'lucide-react';

// Feature flag check
import { isFeatureEnabled } from '../../../config/feature-flags';

interface TechnicianRoute {
  id: string;
  name: string;
  date: string;
  properties: RouteProperty[];
  estimatedDuration: number;
  totalDistance: number;
  status: 'planned' | 'active' | 'completed';
}

interface RouteProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  customer: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  appointment: {
    id: string;
    scheduledTime: string;
    service: { name: string; category: string };
    status: string;
    estimatedDuration: number;
  };
  coordinates?: { lat: number; lng: number };
  accessInstructions?: string;
  knownPestHistory?: string[];
}

interface ChemicalApplication {
  chemicalId: string;
  productName: string;
  activeIngredient: string;
  epaNumber: string;
  amountUsed: number;
  applicationMethod: string;
  areasTreated: string[];
  weatherConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: string;
  };
}

const PestControlTechnicianApp: React.FC = () => {
  // Feature flag check
  if (!isFeatureEnabled('pestControlTechnicianApp')) {
    return null;
  }

  const [currentRoute, setCurrentRoute] = useState<TechnicianRoute | null>(null);
  const [activeProperty, setActiveProperty] = useState<RouteProperty | null>(null);
  const [currentView, setCurrentView] = useState<'route' | 'property' | 'chemicals' | 'profile'>('route');
  const [serviceNotes, setServiceNotes] = useState<string>('');
  const [chemicalApplications, setChemicalApplications] = useState<ChemicalApplication[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [pestIssues, setPestIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTechnicianRoute();
  }, []);

  const loadTechnicianRoute = async () => {
    try {
      setLoading(true);
      
      // Mock route data - replace with actual API call
      setCurrentRoute({
        id: 'route-1',
        name: 'North Springfield Route',
        date: new Date().toISOString(),
        estimatedDuration: 480, // 8 hours
        totalDistance: 45.2,
        status: 'active',
        properties: [
          {
            id: 'prop-1',
            address: '123 Main Street',
            city: 'Springfield',
            state: 'IL',
            customer: {
              firstName: 'John',
              lastName: 'Smith',
              phoneNumber: '(555) 123-4567',
            },
            appointment: {
              id: 'appt-1',
              scheduledTime: '09:00',
              service: { name: 'General Pest Control', category: 'general_pest' },
              status: 'scheduled',
              estimatedDuration: 60,
            },
            coordinates: { lat: 39.7817, lng: -89.6501 },
            accessInstructions: 'Key under flower pot. Ring doorbell first.',
            knownPestHistory: ['ants', 'spiders'],
          },
          {
            id: 'prop-2',
            address: '456 Oak Avenue',
            city: 'Springfield',
            state: 'IL',
            customer: {
              firstName: 'Mary',
              lastName: 'Johnson',
              phoneNumber: '(555) 987-6543',
            },
            appointment: {
              id: 'appt-2',
              scheduledTime: '10:30',
              service: { name: 'Rodent Control', category: 'rodent' },
              status: 'scheduled',
              estimatedDuration: 75,
            },
            coordinates: { lat: 39.7891, lng: -89.6445 },
            knownPestHistory: ['mice', 'rats'],
          },
        ],
      });
    } catch (error) {
      console.error('Error loading route:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNavigation = (property: RouteProperty) => {
    if (property.coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${property.coordinates.lat},${property.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  const completeService = async (property: RouteProperty) => {
    try {
      const completionData = {
        appointmentId: property.appointment.id,
        serviceNotes,
        chemicalApplications,
        pestIssues,
        photos,
        completedAt: new Date().toISOString(),
        weatherConditions: await getCurrentWeather(),
      };

      // Submit completion data to API
      console.log('Service completed:', completionData);
      
      // Update property status
      setActiveProperty(null);
      setServiceNotes('');
      setChemicalApplications([]);
      setPhotos([]);
      setPestIssues([]);
      
      // Show success message
      alert('Service completed successfully!');
    } catch (error) {
      console.error('Error completing service:', error);
      alert('Error completing service. Please try again.');
    }
  };

  const getCurrentWeather = async () => {
    // Mock weather data - integrate with actual weather API
    return {
      temperature: 72,
      humidity: 65,
      windSpeed: 8,
      precipitation: 'none',
    };
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
      <header className="bg-green-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-lg font-bold">PestShield Tech</h1>
              {currentRoute && (
                <p className="text-sm opacity-90">{currentRoute.name}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">
              {new Date().toLocaleDateString()}
            </p>
            <p className="text-xs opacity-75">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white border-b px-4 py-2">
        <div className="flex space-x-6 overflow-x-auto">
          {[
            { key: 'route', label: 'Route', icon: Route },
            { key: 'property', label: 'Current', icon: MapPin },
            { key: 'chemicals', label: 'Chemicals', icon: Droplets },
            { key: 'profile', label: 'Profile', icon: User },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCurrentView(key as any)}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                currentView === key
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4 pb-20">
        {currentView === 'route' && <RouteView route={currentRoute} onSelectProperty={setActiveProperty} onStartNavigation={startNavigation} />}
        {currentView === 'property' && <PropertyView property={activeProperty} onComplete={completeService} />}
        {currentView === 'chemicals' && <ChemicalsView />}
        {currentView === 'profile' && <ProfileView />}
      </main>
    </div>
  );
};

// Route View Component
const RouteView: React.FC<{
  route: TechnicianRoute | null;
  onSelectProperty: (property: RouteProperty) => void;
  onStartNavigation: (property: RouteProperty) => void;
}> = ({ route, onSelectProperty, onStartNavigation }) => {
  if (!route) return null;

  const completedProperties = route.properties.filter(p => p.appointment.status === 'completed');
  const remainingProperties = route.properties.filter(p => p.appointment.status !== 'completed');

  return (
    <div className="space-y-4">
      {/* Route Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today's Route</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            route.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {route.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{route.properties.length}</p>
            <p className="text-sm text-gray-600">Properties</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{Math.round(route.totalDistance)}mi</p>
            <p className="text-sm text-gray-600">Distance</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{Math.round(route.estimatedDuration / 60)}h</p>
            <p className="text-sm text-gray-600">Duration</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">
            {completedProperties.length} of {route.properties.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{ width: `${(completedProperties.length / route.properties.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Remaining Properties */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Stops</h3>
        {remainingProperties.map((property, index) => (
          <div key={property.id} className="bg-white rounded-lg shadow">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-600">{property.appointment.scheduledTime}</span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900">
                    {property.customer.firstName} {property.customer.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">{property.address}</p>
                  <p className="text-sm text-gray-600">{property.city}, {property.state}</p>
                  
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {property.appointment.estimatedDuration}min
                    </span>
                    <span className="capitalize">{property.appointment.service.category.replace('_', ' ')}</span>
                  </div>

                  {property.knownPestHistory && property.knownPestHistory.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {property.knownPestHistory.map((pest, idx) => (
                        <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {pest}
                        </span>
                      ))}
                    </div>
                  )}

                  {property.accessInstructions && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {property.accessInstructions}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => onStartNavigation(property)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate
                </button>
                <button
                  onClick={() => onSelectProperty(property)}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Start Service
                </button>
                <button
                  onClick={() => window.open(`tel:${property.customer.phoneNumber}`, '_self')}
                  className="bg-gray-200 text-gray-700 py-2 px-3 rounded-md text-sm hover:bg-gray-300"
                >
                  <Phone className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completed Properties */}
      {completedProperties.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Completed ({completedProperties.length})</h3>
          {completedProperties.map((property) => (
            <div key={property.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {property.customer.firstName} {property.customer.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">{property.address}</p>
                </div>
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Property View Component (Active Service)
const PropertyView: React.FC<{
  property: RouteProperty | null;
  onComplete: (property: RouteProperty) => void;
}> = ({ property, onComplete }) => {
  const [serviceNotes, setServiceNotes] = useState('');
  const [pestIssues, setPestIssues] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [treatmentAreas, setTreatmentAreas] = useState<string[]>([]);
  
  if (!property) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Service</h3>
        <p className="text-gray-600">Select a property from your route to start service</p>
      </div>
    );
  }

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const commonPests = ['ants', 'spiders', 'cockroaches', 'mice', 'rats', 'wasps', 'beetles', 'flies'];
  const treatmentOptions = ['interior baseboards', 'exterior perimeter', 'basement', 'attic', 'kitchen', 'bathrooms', 'garage', 'yard'];

  return (
    <div className="space-y-4">
      {/* Property Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {property.customer.firstName} {property.customer.lastName}
            </h2>
            <p className="text-sm text-gray-600">{property.address}</p>
            <p className="text-sm text-gray-600">{property.city}, {property.state}</p>
            <div className="mt-2 flex items-center space-x-4 text-sm">
              <span className="flex items-center text-blue-600">
                <Clock className="h-4 w-4 mr-1" />
                {property.appointment.scheduledTime}
              </span>
              <span className="text-gray-600">{property.appointment.service.name}</span>
            </div>
          </div>
          <button
            onClick={() => window.open(`tel:${property.customer.phoneNumber}`, '_self')}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </button>
        </div>
      </div>

      {/* Service Form */}
      <div className="space-y-4">
        {/* Pest Issues Found */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Pest Issues Identified</h3>
          <div className="grid grid-cols-2 gap-2">
            {commonPests.map((pest) => (
              <label key={pest} className="flex items-center">
                <input
                  type="checkbox"
                  checked={pestIssues.includes(pest)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPestIssues([...pestIssues, pest]);
                    } else {
                      setPestIssues(pestIssues.filter(p => p !== pest));
                    }
                  }}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm capitalize">{pest}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Treatment Areas */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Treatment Areas</h3>
          <div className="grid grid-cols-2 gap-2">
            {treatmentOptions.map((area) => (
              <label key={area} className="flex items-center">
                <input
                  type="checkbox"
                  checked={treatmentAreas.includes(area)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTreatmentAreas([...treatmentAreas, area]);
                    } else {
                      setTreatmentAreas(treatmentAreas.filter(a => a !== area));
                    }
                  }}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm capitalize">{area}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Chemical Applications */}
        {isFeatureEnabled('pestControlChemicalTracking') && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Chemical Applications</h3>
              <button className="bg-green-600 text-white py-2 px-3 rounded-md text-sm hover:bg-green-700 flex items-center">
                <QrCode className="h-4 w-4 mr-2" />
                Scan Product
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">Log chemical usage for EPA compliance</p>
            
            {/* Weather Conditions */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-md">
              <div className="text-center">
                <Thermometer className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Temp</p>
                <p className="font-medium">72°F</p>
              </div>
              <div className="text-center">
                <Wind className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Wind</p>
                <p className="font-medium">8 mph</p>
              </div>
              <div className="text-center">
                <CloudRain className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Rain</p>
                <p className="font-medium">None</p>
              </div>
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Service Photos</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {photos.map((photo, index) => (
              <div key={index} className="aspect-square bg-gray-100 rounded-md flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
            ))}
          </div>
          <label className="block w-full">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-gray-400 cursor-pointer">
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Tap to take photos</p>
            </div>
          </label>
        </div>

        {/* Service Notes */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Service Notes</h3>
          <textarea
            value={serviceNotes}
            onChange={(e) => setServiceNotes(e.target.value)}
            placeholder="Enter detailed service notes, observations, and recommendations..."
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
        </div>

        {/* Complete Service Button */}
        <button
          onClick={() => onComplete(property)}
          disabled={!serviceNotes.trim()}
          className="w-full bg-green-600 text-white py-4 px-6 rounded-md text-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <CheckSquare className="h-6 w-6 mr-2" />
          Complete Service
        </button>
      </div>
    </div>
  );
};

// Chemicals View Component
const ChemicalsView: React.FC = () => {
  const [chemicals] = useState([
    {
      id: '1',
      productName: 'Termidor SC',
      activeIngredient: 'Fipronil',
      epaNumber: '7969-210',
      currentStock: 15,
      minimumStock: 5,
      expirationDate: '2025-06-30',
    },
    {
      id: '2',
      productName: 'Phantom Aerosol',
      activeIngredient: 'Chlorfenapyr',
      epaNumber: '241-392',
      currentStock: 8,
      minimumStock: 10,
      expirationDate: '2024-12-15',
    },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Chemical Inventory</h2>
        <button className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center text-sm">
          <QrCode className="h-4 w-4 mr-2" />
          Scan Chemical
        </button>
      </div>

      <div className="space-y-3">
        {chemicals.map((chemical) => (
          <div key={chemical.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{chemical.productName}</h3>
                <p className="text-sm text-gray-600">{chemical.activeIngredient}</p>
                <p className="text-sm text-gray-600">EPA #: {chemical.epaNumber}</p>
                
                <div className="mt-2 flex items-center space-x-4">
                  <span className={`text-sm font-medium ${
                    chemical.currentStock > chemical.minimumStock
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    Stock: {chemical.currentStock}
                  </span>
                  <span className="text-sm text-gray-600">
                    Min: {chemical.minimumStock}
                  </span>
                  <span className="text-sm text-gray-600">
                    Exp: {new Date(chemical.expirationDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {chemical.currentStock <= chemical.minimumStock && (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Usage Log */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Today's Usage Log</h3>
        <p className="text-sm text-gray-600 mb-4">EPA compliance requires detailed usage tracking</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm">Termidor SC</span>
            <span className="text-sm text-gray-600">0.5 gal used</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm">Phantom Aerosol</span>
            <span className="text-sm text-gray-600">2 cans used</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile View Component
const ProfileView: React.FC = () => {
  const technicianInfo = {
    name: 'Mike Johnson',
    id: 'TECH-001',
    certifications: ['Core Certification', 'Category 7a - Structural', 'Category 8 - Public Health'],
    phone: '(555) 234-5678',
    email: 'mike.johnson@pestshield.com',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Technician Profile</h2>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="bg-green-100 rounded-full p-3">
            <User className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{technicianInfo.name}</h3>
            <p className="text-sm text-gray-600">{technicianInfo.id}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Phone</p>
            <p className="text-sm text-gray-900">{technicianInfo.phone}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-sm text-gray-900">{technicianInfo.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-900 mb-3">Certifications</h3>
        <div className="space-y-2">
          {technicianInfo.certifications.map((cert, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-900">{cert}</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-900 mb-3">Today's Stats</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">6</p>
            <p className="text-sm text-gray-600">Services Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">8.5</p>
            <p className="text-sm text-gray-600">Hours Worked</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestControlTechnicianApp;