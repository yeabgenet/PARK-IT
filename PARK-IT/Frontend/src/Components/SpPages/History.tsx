import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Car, Clock, TrendingUp, Calendar } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

interface HistoryData {
  statistics: {
    total_parking_lots: number;
    total_reservations: number;
    active_reservations: number;
    completed_reservations: number;
    total_revenue: number;
  };
  recent_reservations: ReservationHistory[];
}

interface ReservationHistory {
  id: number;
  spot_details: {
    spot_number: string;
  };
  driver_name: string;
  lot_name: string;
  lot_address: string;
  start_time: string | null;
  end_time: string | null;
  total_cost: number | null;
  status: string;
  created_at: string;
  elapsed_time: number | null;
  current_cost: number | null;
}

const History: React.FC = () => {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/provider/history/', {
        withCredentials: true,
      });
      
      setHistoryData(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error || !historyData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error || 'Failed to load history'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <BarChart3 size={32} />
            Parking History & Analytics
          </h1>
          <p className="text-gray-600">View reservation history and revenue statistics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Parking Lots"
            value={historyData.statistics.total_parking_lots}
            icon={<Car className="text-blue-600" size={24} />}
            color="blue"
          />
          
          <StatCard
            title="Total Reservations"
            value={historyData.statistics.total_reservations}
            icon={<Calendar className="text-purple-600" size={24} />}
            color="purple"
          />
          
          <StatCard
            title="Active Now"
            value={historyData.statistics.active_reservations}
            icon={<Clock className="text-green-600" size={24} />}
            color="green"
          />
          
          <StatCard
            title="Total Revenue"
            value={`$${historyData.statistics.total_revenue.toFixed(2)}`}
            icon={<DollarSign className="text-yellow-600" size={24} />}
            color="yellow"
          />
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-1">Total Revenue</p>
              <h2 className="text-4xl font-bold mb-2">
                ${historyData.statistics.total_revenue.toFixed(2)}
              </h2>
              <p className="text-blue-100">
                From {historyData.statistics.completed_reservations} completed reservations
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <TrendingUp size={48} />
            </div>
          </div>
        </div>

        {/* Recent Reservations */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Reservations</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historyData.recent_reservations.length > 0 ? (
                  historyData.recent_reservations.map((reservation) => (
                    <ReservationRow key={reservation.id} reservation={reservation} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No reservation history yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

interface ReservationRowProps {
  reservation: ReservationHistory;
}

const ReservationRow: React.FC<ReservationRowProps> = ({ reservation }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = () => {
    if (reservation.status === 'active' && reservation.start_time) {
      return `Started ${format(new Date(reservation.start_time), 'MMM d, h:mm a')}`;
    } else if (reservation.status === 'completed' && reservation.end_time) {
      return `Ended ${format(new Date(reservation.end_time), 'MMM d, h:mm a')}`;
    } else {
      return format(new Date(reservation.created_at), 'MMM d, h:mm a');
    }
  };

  const getCost = () => {
    if (reservation.status === 'completed' && reservation.total_cost) {
      return `$${reservation.total_cost.toFixed(2)}`;
    } else if (reservation.status === 'active' && reservation.current_cost) {
      return `$${reservation.current_cost.toFixed(2)} (ongoing)`;
    } else {
      return '-';
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{reservation.driver_name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">Spot {reservation.spot_details.spot_number}</div>
        <div className="text-xs text-gray-500">{reservation.lot_name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500 max-w-xs truncate">
          {reservation.lot_address}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{formatTime()}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {getCost()}
      </td>
    </tr>
  );
};

export default History;
