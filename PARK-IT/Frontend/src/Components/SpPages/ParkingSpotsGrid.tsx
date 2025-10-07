// Components/SpPages/ParkingSpotsGrid.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ParkingSpotCard from './ParkingSpotCard';

interface ParkingSpot {
  id: number;
  spot_number: string;
  status: 'available' | 'occupied' | 'reserved';
  is_reserved: boolean;
  image_url: string | null;
  lot: {
    id: number;
    name: string;
    address: string;
  };
}

function ParkingSpotsGrid() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchParkingSpots();
  }, []);

  const fetchParkingSpots = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ParkingSpot[]>(
        'http://localhost:8000/api/parking-spots/',
        { withCredentials: true }
      );
      setSpots(response.data);
    } catch (err: any) {
      setError('Failed to load parking spots');
      console.error('Error fetching parking spots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (spot: ParkingSpot) => {
    // Handle edit functionality
    console.log('Edit spot:', spot);
    // You can implement a modal or navigate to edit page
  };

  const handleDelete = async (spotId: number) => {
    if (window.confirm('Are you sure you want to delete this parking spot?')) {
      try {
        const csrfResponse = await axios.get<{ csrfToken: string }>(
          'http://localhost:8000/api/csrf/',
          { withCredentials: true }
        );
        const csrfToken = csrfResponse.data.csrfToken;

        await axios.delete(
          `http://localhost:8000/api/parking-spots/${spotId}/`,
          {
            headers: {
              'X-CSRFToken': csrfToken,
            },
            withCredentials: true,
          }
        );

        setSpots(spots.filter(spot => spot.id !== spotId));
      } catch (err: any) {
        console.error('Error deleting spot:', err);
        alert('Failed to delete parking spot');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Parking Spots</h1>
          <p className="text-gray-600">Manage your parking spots across all terminals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{spots.length}</div>
            <div className="text-gray-600">Total Spots</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {spots.filter(spot => spot.status === 'available').length}
            </div>
            <div className="text-gray-600">Available</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {spots.filter(spot => spot.status === 'occupied').length}
            </div>
            <div className="text-gray-600">Occupied</div>
          </div>
        </div>

        {/* Spots Grid */}
        {spots.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm0 16h12V8H5v10z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No parking spots yet</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first parking spot</p>
            <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              Add First Spot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {spots.map(spot => (
              <ParkingSpotCard
                key={spot.id}
                spot={spot}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ParkingSpotsGrid;