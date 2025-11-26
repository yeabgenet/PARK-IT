import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

interface Reservation {
  id: number;
  spot_details: {
    id: number;
    spot_number: string;
    status: string;
  };
  lot_name: string;
  lot_address: string;
  reservation_time: string;
  start_time: string | null;
  end_time: string | null;
  expected_duration_hours: number;
  price_per_hour: number;
  total_cost: number | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';
  elapsed_time: number | null;
  current_cost: number | null;
  created_at: string;
}

const MyReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReservations();
    
    // Refresh every 30 seconds to update timers
    const interval = setInterval(fetchReservations, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/reservations/', {
        withCredentials: true,
      });
      
      setReservations(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch reservations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await axios.post(
        `http://localhost:8000/api/reservations/${id}/activate/`,
        {},
        { withCredentials: true }
      );
      
      fetchReservations();
      alert('Reservation activated! Parking timer started.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to activate reservation');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await axios.post(
        `http://localhost:8000/api/reservations/${id}/complete/`,
        {},
        { withCredentials: true }
      );
      
      fetchReservations();
      alert('Parking session completed!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to complete reservation');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    
    try {
      await axios.post(
        `http://localhost:8000/api/reservations/${id}/cancel/`,
        {},
        { withCredentials: true }
      );
      
      fetchReservations();
      alert('Reservation cancelled');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel reservation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading reservations...</p>
        </div>
      </div>
    );
  }

  const activeReservations = reservations.filter(r => r.status === 'active' || r.status === 'pending');
  const pastReservations = reservations.filter(r => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reservations</h1>
          <p className="text-gray-600">Manage your parking reservations and sessions</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Active Reservations */}
        {activeReservations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Sessions</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeReservations.map((reservation) => (
                <ActiveReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  onActivate={handleActivate}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Reservations */}
        {pastReservations.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Past Reservations</h2>
            <div className="space-y-4">
              {pastReservations.map((reservation) => (
                <PastReservationCard key={reservation.id} reservation={reservation} />
              ))}
            </div>
          </div>
        )}

        {/* No Reservations */}
        {reservations.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No reservations yet
            </h3>
            <p className="text-gray-600 mb-6">
              Find a parking spot to get started
            </p>
            <a
              href="/driver/find-parking"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Find Parking
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

interface ActiveReservationCardProps {
  reservation: Reservation;
  onActivate: (id: number) => void;
  onComplete: (id: number) => void;
  onCancel: (id: number) => void;
}

const ActiveReservationCard: React.FC<ActiveReservationCardProps> = ({
  reservation,
  onActivate,
  onComplete,
  onCancel,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const calculateElapsedTime = () => {
    if (reservation.status !== 'active' || !reservation.start_time) return 0;
    
    const start = new Date(reservation.start_time);
    const diff = currentTime.getTime() - start.getTime();
    return diff / (1000 * 60 * 60); // Convert to hours
  };

  const calculateCurrentCost = () => {
    const elapsed = calculateElapsedTime();
    return elapsed * parseFloat(reservation.price_per_hour.toString());
  };

  const elapsedHours = calculateElapsedTime();
  const currentCost = calculateCurrentCost();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-blue-600">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Spot {reservation.spot_details.spot_number}
            </h3>
            <p className="text-sm text-gray-600">{reservation.lot_name}</p>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              reservation.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 mb-4 text-sm text-gray-600">
          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{reservation.lot_address}</span>
        </div>

        {/* Timer and Cost (for active) */}
        {reservation.status === 'active' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock size={16} />
                  <span>Elapsed Time</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {elapsedHours.toFixed(2)}h
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <DollarSign size={16} />
                  <span>Current Cost</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  ${currentCost.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Rate: ${reservation.price_per_hour}/hour
              </p>
            </div>
          </div>
        )}

        {/* Reservation Info (for pending) */}
        {reservation.status === 'pending' && (
          <div className="bg-yellow-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Reserved:</strong> {formatDistanceToNow(new Date(reservation.created_at), { addSuffix: true })}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Rate:</strong> ${reservation.price_per_hour}/hour
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {reservation.status === 'pending' && (
            <>
              <button
                onClick={() => onActivate(reservation.id)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                <span>I've Arrived</span>
              </button>
              
              <button
                onClick={() => onCancel(reservation.id)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </>
          )}
          
          {reservation.status === 'active' && (
            <button
              onClick={() => onComplete(reservation.id)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              <span>End Parking</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface PastReservationCardProps {
  reservation: Reservation;
}

const PastReservationCard: React.FC<PastReservationCardProps> = ({ reservation }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
      <div className="flex items-start gap-4 flex-1">
        <div
          className={`p-3 rounded-lg ${
            reservation.status === 'completed'
              ? 'bg-green-100'
              : 'bg-gray-100'
          }`}
        >
          {reservation.status === 'completed' ? (
            <CheckCircle className="text-green-600" size={24} />
          ) : (
            <XCircle className="text-gray-600" size={24} />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Spot {reservation.spot_details.spot_number} - {reservation.lot_name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {reservation.lot_address}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              {new Date(reservation.created_at).toLocaleDateString()}
            </span>
            {reservation.status === 'completed' && reservation.total_cost && (
              <span className="font-semibold text-gray-700">
                Total: ${reservation.total_cost.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full ${
          reservation.status === 'completed'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
      </span>
    </div>
  );
};

export default MyReservations;
