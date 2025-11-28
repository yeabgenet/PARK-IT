// Frontend/src/Components/SpPages/VerifyParkingLot.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';

interface CsrfResponse {
  csrfToken: string;
}

interface ParkingLot {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  total_capacity: number;
}

interface VerifyFormData {
  latitude: string;
  longitude: string;
}

const VerifyParkingLot: React.FC = () => {
  const { lotId } = useParams<{ lotId: string }>();
  const navigate = useNavigate();
  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const [formData, setFormData] = useState<VerifyFormData>({
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchParkingLot();
  }, [lotId]);

  const fetchParkingLot = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      const csrfResponse = await axios.get<CsrfResponse>('http://localhost:8000/api/csrf/', {
        withCredentials: true,
      });
      axios.defaults.headers.common['X-CSRFToken'] = csrfResponse.data.csrfToken;

      const response = await axios.get<ParkingLot>(
        `http://localhost:8000/api/parking-lots/${lotId}/`,
        { withCredentials: true }
      );
      
      setParkingLot(response.data);
      
      // Pre-fill form if coordinates exist
      if (response.data.latitude && response.data.longitude) {
        setFormData({
          latitude: response.data.latitude.toString(),
          longitude: response.data.longitude.toString()
        });
      }
      
    } catch (err: any) {
      console.error('Error fetching parking lot:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Failed to load parking lot';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getCurrentLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
  
    setLoading(true);
    setError('');
    setSuccess('');
  
    // Modern promise-based API (much more reliable)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          }
        );
      });
  
      const { latitude, longitude } = position.coords;
      setFormData({
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
      });
      setSuccess('Location captured successfully!');
    } catch (err: any) {
      let message = 'Unknown error';
      if (err.code) {
        switch (err.code) {
          case 1: message = 'Location permission denied. Please allow location access.'; break;
          case 2: message = 'Position update is unavailable (try moving outside or enabling Wi-Fi)'; break;
          case 3: message = 'Location request timed out. Try again.'; break;
        }
      }
      setError(`Error getting location: ${message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const validateCoordinates = (): boolean => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid numeric coordinates');
      return false;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return false;
    }

    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateCoordinates()) {
      return;
    }

    try {
      setSubmitting(true);

      const csrfResponse = await axios.get<CsrfResponse>('http://localhost:8000/api/csrf/', {
        withCredentials: true,
      });
      axios.defaults.headers.common['X-CSRFToken'] = csrfResponse.data.csrfToken;

      const submitData = {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        is_verified: true
      };

      await axios.patch(
        `http://localhost:8000/api/parking-lots/${lotId}/verify/`,
        submitData,
        { withCredentials: true }
      );

      setSuccess('Parking lot verified successfully! Coordinates have been saved.');
      setTimeout(() => {
        navigate('/spterminal');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error verifying parking lot:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Failed to verify parking lot';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto mt-24">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !parkingLot) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto mt-24">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <Link
            to="/spterminal"
            className="mt-4 inline-block bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Back to Terminals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto mt-24">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/spterminal"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Terminals
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Verify Parking Lot Location</h1>
          <p className="text-gray-600 mt-2">
            Add precise coordinates for {parkingLot?.name}
          </p>
        </div>

        {/* Parking Lot Info */}
        {parkingLot && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{parkingLot.name}</h2>
            <p className="text-gray-600">{parkingLot.address}</p>
            <p className="text-gray-600">{parkingLot.city}, {parkingLot.country}</p>
            <p className="text-gray-600">Capacity: {parkingLot.total_capacity} spots</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                parkingLot.is_verified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {parkingLot.is_verified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
          </div>
        )}

        {/* Verification Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {/* Location Capture Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Getting Location...' : 'Use Current Location'}
              </button>
            </div>

            <div className="text-center text-sm text-gray-500">
              OR enter coordinates manually
            </div>

            {/* Coordinates Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude *
                </label>
                <input
                  type="text"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 40.7128"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Between -90 and 90</p>
              </div>

              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude *
                </label>
                <input
                  type="text"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., -74.0060"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Between -180 and 180</p>
              </div>
            </div>

            {/* Map Preview (Optional) */}
            {formData.latitude && formData.longitude && validateCoordinates() && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Location Preview:</p>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Coordinates: {formData.latitude}, {formData.longitude}
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${formData.latitude},${formData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center mt-2"
                  >
                    View on Google Maps
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/spterminal')}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.latitude || !formData.longitude}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Verify Parking Lot'}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Why verify location?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Helps users find your parking lot accurately</li>
            <li>• Enables GPS navigation to your location</li>
            <li>• Improves search results for nearby parking</li>
            <li>• Required for location-based features</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerifyParkingLot;