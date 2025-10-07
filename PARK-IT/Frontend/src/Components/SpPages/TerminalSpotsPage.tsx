import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useParams, Link } from 'react-router-dom';
import ParkingSpotCard from './ParkingSpotCard';

interface CsrfResponse {
  csrfToken: string;
}

interface ParkingSpot {
  id: number;
  lot: { id: number; name: string; address: string };
  spot_number: string;
  status: 'available' | 'occupied' | 'reserved';
  is_reserved: boolean;
  image_url: string | null;
}

interface Terminal {
  id: number;
  name: string;
  address: string;
  total_capacity: number;
  city: string;
  country: string;
  profile_image_url: string | null;
}

function TerminalSpotsPage() {
  const { terminalId } = useParams<{ terminalId: string }>();
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const setupAxios = async () => {
      try {
        const csrfResponse = await axios.get<CsrfResponse>('http://localhost:8000/api/csrf/', {
          withCredentials: true,
        });
        axios.defaults.headers.common['X-CSRFToken'] = csrfResponse.data.csrfToken;
        fetchTerminalAndSpots();
      } catch (err: any) {
        console.error('Error fetching CSRF token:', err);
        setError('Failed to initialize. Please try again.');
        setLoading(false);
      }
    };

    if (terminalId) {
      setupAxios();
    }
  }, [terminalId]);

  const fetchTerminalAndSpots = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch terminal details
      const terminalResponse = await axios.get<Terminal>(
        `http://localhost:8000/api/parking-lots/${terminalId}/`,
        { withCredentials: true }
      );
      console.log('Terminal response:', terminalResponse.data);
      setTerminal(terminalResponse.data);

      // Fetch spots for this terminal using lot_id
      const spotsResponse = await axios.get<any[]>(
        `http://localhost:8000/api/parking-spots/?lot_id=${terminalId}`,
        { withCredentials: true }
      );
      console.log('Spots response:', spotsResponse.data);

      // Transform spots to match ParkingSpot interface expected by ParkingSpotCard
      const transformedSpots: ParkingSpot[] = spotsResponse.data.map(spot => ({
        id: spot.id,
        lot: {
          id: terminalResponse.data.id,
          name: terminalResponse.data.name,
          address: terminalResponse.data.address,
        },
        spot_number: spot.spot_number,
        status: spot.status,
        is_reserved: spot.is_reserved,
        image_url: spot.image_url,
      }));
      setSpots(transformedSpots);
    } catch (err: any) {
      console.error('Error details:', err.response?.data || err.message);
      const errorMessage =
        err.response?.data && typeof err.response.data === 'object'
          ? err.response.data.error ||
            err.response.data.message ||
            err.response.data.detail ||
            JSON.stringify(err.response.data)
          : 'Failed to load terminal or spots';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSpot = (spot: ParkingSpot) => {
    // Handle edit logic here
    console.log('Editing spot:', spot);
    // You can navigate to an edit page or open a modal
    // Example: navigate(`/edit-spot/${spot.id}`);
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

  if (error || !terminal) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Terminal not found'}
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
      <div className="max-w-7xl mx-auto mt-24">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              to="/spterminal"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Terminals
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{terminal.name}</h1>
            <p className="text-gray-600 mt-2">
              {terminal.address}, {terminal.city}, {terminal.country}
            </p>
          </div>
          <Link
            to={`/add?terminalId=${terminalId}`}
            className="bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            + Add Spot
          </Link>
        </div>

        {/* Terminal Info Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Capacity</h3>
              <p className="text-2xl font-bold text-gray-900">{terminal.total_capacity}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Available Spots</h3>
              <p className="text-2xl font-bold text-green-600">
                {spots.filter(spot => spot.status === 'available').length}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Occupied Spots</h3>
              <p className="text-2xl font-bold text-red-600">
                {spots.filter(spot => spot.status === 'occupied').length}
              </p>
            </div>
          </div>
        </div>

        {/* Spots Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Parking Spots</h2>
          
          {spots.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm0 16h12V8H5v10z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parking spots yet</h3>
              <p className="text-gray-600 mb-4">Add spots to this terminal to get started</p>
              <Link
                to={`/add?terminalId=${terminalId}`}
                className="bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block"
              >
                Add First Spot
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {spots.map(spot => (
                <ParkingSpotCard
                  key={spot.id}
                  spot={spot}
                  onEdit={handleEditSpot}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TerminalSpotsPage;