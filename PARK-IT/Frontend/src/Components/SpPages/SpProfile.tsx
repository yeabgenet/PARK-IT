import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface CsrfResponse {
  csrfToken: string;
}

interface ServiceProviderProfile {
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  profile_picture: string | null;
  company_name: string;
  contact_person: string;
  phone_number: string;
  age: number;
  country: string;
  city: string;
  address: string;
  parking_lots_count: number;
  total_spots_count: number;
  available_spots_count: number;
}

const SpProfile: React.FC = () => {
  const [profile, setProfile] = useState<ServiceProviderProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      try {
        setLoading(true);
        setError('');
        console.log('Starting to fetch profile...');

        // First get CSRF token
        const csrfResponse = await axios.get<CsrfResponse>('http://localhost:8000/api/csrf/', {
          withCredentials: true,
        });
        axios.defaults.headers.common['X-CSRFToken'] = csrfResponse.data.csrfToken;
        console.log('CSRF token received');

        // Then fetch the profile data
        const response = await axios.get<ServiceProviderProfile>(
          'http://localhost:8000/api/service-provider/profile/',
          { withCredentials: true }
        );
        
        console.log('Profile response:', response.data);
        setProfile(response.data);
        
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        const errorMessage = err.response?.data?.error || 
                            err.response?.data?.message || 
                            err.response?.data?.detail || 
                            err.message || 
                            'Failed to load profile';
        setError(errorMessage);
        console.error('Error details:', err.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto mt-24">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto mt-24">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error Loading Profile:</strong> {error}
          </div>
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Debug Info:</strong> Check browser console for detailed error information.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="mt-4 inline-block bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto mt-24">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            No profile data found.
          </div>
          <Link
            to="/dashboard"
            className="mt-4 inline-block bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mt-24">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-slate-900 to-black px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  {profile.profile_picture ? (
                    <img 
                      src={profile.profile_picture} 
                      alt={`${profile.first_name} ${profile.last_name}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  <p className="text-blue-100">{profile.company_name}</p>
                  <p className="text-blue-200 text-sm mt-1">Service Provider</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm">
                  Share
                </button>
                <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm">
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-8">
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {profile.parking_lots_count}
                </div>
                <div className="text-sm font-medium text-blue-800">Parking Lots</div>
                <div className="text-xs text-blue-600 mt-1">Managed</div>
              </div>
              <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {profile.total_spots_count}
                </div>
                <div className="text-sm font-medium text-green-800">Total Spots</div>
                <div className="text-xs text-green-600 mt-1">Across all lots</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-6 text-center border border-purple-100">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {profile.available_spots_count}
                </div>
                <div className="text-sm font-medium text-purple-800">Available Spots</div>
                <div className="text-xs text-purple-600 mt-1">Currently free</div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Contact Information</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Email</span>
                    <span className="text-sm text-gray-900 font-medium">{profile.email}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Phone</span>
                    <span className="text-sm text-gray-900 font-medium">{profile.phone_number}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Contact Person</span>
                    <span className="text-sm text-gray-900 font-medium">{profile.contact_person}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Age</span>
                    <span className="text-sm text-gray-900 font-medium">{profile.age}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Gender</span>
                    <span className="text-sm text-gray-900 font-medium">
                      {profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Location</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Address</span>
                    <span className="text-sm text-gray-900 font-medium text-right max-w-xs">{profile.address}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">City</span>
                    <span className="text-sm text-gray-900 font-medium">{profile.city}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Country</span>
                    <span className="text-sm text-gray-900 font-medium">{profile.country}</span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Service Provider specializing in parking management solutions with {profile.parking_lots_count} parking 
                      {profile.parking_lots_count === 1 ? ' lot' : ' lots'} and {profile.total_spots_count} total parking 
                      spots across {profile.city}, {profile.country}. Currently {profile.available_spots_count} spots are available.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/spterminal"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-lg text-center transition-colors border border-blue-200"
                >
                  <div className="font-medium">View Terminals</div>
                  <div className="text-sm text-blue-600 mt-1">Manage parking lots</div>
                </Link>
                
                <Link
                  to="/add-terminal"
                  className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-lg text-center transition-colors border border-green-200"
                >
                  <div className="font-medium">Add Terminal</div>
                  <div className="text-sm text-green-600 mt-1">Create new lot</div>
                </Link>
                
                <Link
                  to="/analytics"
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg text-center transition-colors border border-purple-200"
                >
                  <div className="font-medium">Analytics</div>
                  <div className="text-sm text-purple-600 mt-1">View reports</div>
                </Link>
                
                <Link
                  to="/settings"
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 p-4 rounded-lg text-center transition-colors border border-gray-200"
                >
                  <div className="font-medium">Settings</div>
                  <div className="text-sm text-gray-600 mt-1">Account settings</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpProfile;