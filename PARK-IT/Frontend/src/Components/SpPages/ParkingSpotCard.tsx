// Components/SpPages/ParkingSpotCard.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

interface ParkingSpotCardProps {
  spot: ParkingSpot;
  onEdit?: (spot: ParkingSpot) => void;
  onDelete?: (spotId: number) => void;
  onStatusChange?: () => void;
}

// API Response Interfaces
interface CheckDriverResponse {
  exists: boolean;
  driver_name: string;
  driver_id: number;
}

interface StatusUpdateResponse {
  message: string;
  spot: ParkingSpot;
}

// Toggle Button Component
const StatusToggle: React.FC<{
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
}> = ({ isChecked, onToggle, loading = false, disabled = false }) => {
  const handleCheckboxChange = () => {
    if (!loading && !disabled) {
      onToggle(!isChecked);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
      <span className={`text-sm font-medium ${isChecked ? 'text-red-600' : 'text-green-600'}`}>
        {isChecked ? 'Occupied' : 'Available'}
      </span>
      <label className='flex cursor-pointer select-none items-center'>
        <div className='relative'>
          <input
            type='checkbox'
            checked={isChecked}
            onChange={handleCheckboxChange}
            disabled={loading || disabled}
            className='sr-only'
          />
          <div 
            className={`block h-8 w-14 rounded-full transition-colors duration-300 ${
              isChecked ? 'bg-red-500' : 'bg-green-500'
            } ${loading || disabled ? 'opacity-50' : ''}`}
          ></div>
          <div 
            className={`dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-lg transition-transform duration-300 ${
              isChecked ? 'transform translate-x-6' : ''
            } ${loading || disabled ? 'opacity-70' : ''}`}
          ></div>
        </div>
      </label>
      {loading && (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      )}
    </div>
  );
};

function ParkingSpotCard({ spot, onEdit, onDelete, onStatusChange }: ParkingSpotCardProps) {
  const [currentStatus, setCurrentStatus] = useState(spot.status);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [driverInfo, setDriverInfo] = useState<{ name: string; isValid: boolean } | null>(null);
  const [checkingDriver, setCheckingDriver] = useState(false);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'reserved':
        return 'Reserved';
      default:
        return status;
    }
  };

  // Check if driver exists when username changes
  useEffect(() => {
    const checkDriver = async () => {
      const trimmedUsername = username.trim();
      
      if (trimmedUsername.length < 3) {
        setDriverInfo(null);
        return;
      }

      setCheckingDriver(true);
      try {
        console.log(`Checking driver with username: ${trimmedUsername}`);
        
        const response = await axios.get<CheckDriverResponse>(
          `/api/check-driver/?username=${encodeURIComponent(trimmedUsername)}`, 
          {
            withCredentials: true
          }
        );
        
        console.log('Driver check response:', response.data);
        
        if (response.data.exists) {
          setDriverInfo({
            name: response.data.driver_name,
            isValid: true
          });
        } else {
          setDriverInfo({
            name: 'Driver not found',
            isValid: false
          });
        }
      } catch (error: any) {
        console.error('Error checking driver:', error);
        console.error('Error response:', error.response?.data);
        setDriverInfo({
          name: 'Error checking driver',
          isValid: false
        });
      } finally {
        setCheckingDriver(false);
      }
    };

    const timeoutId = setTimeout(checkDriver, 800);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleToggleChange = async (isOccupied: boolean) => {
    if (loading) return;
    
    const newStatus = isOccupied ? 'occupied' : 'available';
    const trimmedUsername = username.trim();
    
    console.log(`Toggle change: ${newStatus}, username: ${trimmedUsername}`);
    
    // If changing to occupied, require valid username
    if (newStatus === 'occupied') {
      if (!trimmedUsername) {
        alert('Please enter driver username before setting status to occupied');
        return;
      }
      if (!driverInfo?.isValid) {
        alert('Please enter a valid driver username');
        return;
      }
    }

    setLoading(true);
    try {
      console.log(`Sending request to update spot ${spot.id} to ${newStatus}`);
      
      const response = await axios.patch<StatusUpdateResponse>(
        `/api/parking-spots/${spot.id}/status/`, 
        {
          status: newStatus,
          username: newStatus === 'occupied' ? trimmedUsername : undefined
        }, 
        {
          headers: {
            'X-CSRFToken': getCsrfToken(),
            'Content-Type': 'application/json',
          },
          withCredentials: true
        }
      );
      
      console.log('Update response:', response.data);
      
      setCurrentStatus(newStatus);
      
      // Clear username when switching to available
      if (newStatus === 'available') {
        setUsername('');
        setDriverInfo(null);
      }
      
      if (onStatusChange) onStatusChange();
      
      // Show success message
      alert(`Spot ${newStatus === 'occupied' ? 'occupied' : 'released'} successfully!`);
      
    } catch (error: any) {
      console.error('Error updating status:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to update status';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get CSRF token
  const getCsrfToken = () => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  };

  const isToggleChecked = currentStatus === 'occupied';
  const canToggleToOccupied = driverInfo?.isValid || currentStatus === 'occupied';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200">
        {spot.image_url ? (
          <img
            src={spot.image_url}
            alt={`Parking spot ${spot.spot_number}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTIwQzE0Mi4zMjcgMTIwIDEyOCAxMzQuMzI3IDEyOCAxNTJDMTI4IDE2OS42NzMgMTQyLjMycyAxODQgMTYwIDE4NEMxNzcuNjczIDE4NCAxOTIgMTY5LjY3MyAxOTIgMTUyQzE5MiAxMzQuMzI3IDE3Ny42NzMgMTIwIDE2MCAxMjBaIiBmaWxsPSIjOEU5MEE2Ii8+CjxwYXRoIGQ9Ik05NiAyMDBWMjQwSDIyNFYyMDBIMTQ0SDk2WiIgZmlsbD0iIzhFOTBBNiIvPgo8L3N2Zz4K';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {/* Edit Icon */}
        {onEdit && (
          <button
            onClick={() => onEdit(spot)}
            className="absolute top-4 left-4 p-2 bg-white rounded-2xl shadow-md hover:bg-gray-100 transition-colors duration-200 z-10"
            aria-label="Edit parking spot"
          >
            <i className="ri-edit-2-line text-gray-600"></i>
          </button>
        )}
        {/* Status Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStatus)}`}>
          {getStatusText(currentStatus)}
        </div>
        {/* Reserved Badge */}
        {spot.is_reserved && (
          <div className="absolute top-14 right-4 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            Reserved
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">Spot {spot.spot_number}</h3>
          <span className="text-sm text-gray-500">ID: {spot.id}</span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{spot.lot.name}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{spot.lot.address}</span>
          </div>
        </div>

        {/* Status Toggle and Username Input */}
        <div className="space-y-4 mb-4">
          {/* Username Input - ALWAYS VISIBLE */}
          <div>
            <label htmlFor={`username-${spot.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              Driver Username
            </label>
            <input
              type="text"
              id={`username-${spot.id}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 transition-all ${
                driverInfo ? 
                  (driverInfo.isValid ? 'border-green-500 focus:border-green-500' : 'border-red-500 focus:border-red-500') 
                  : 'border-gray-300 focus:border-indigo-500'
              } ${loading ? 'opacity-50' : ''}`}
              placeholder="Enter driver username to occupy"
              disabled={loading}
            />
            {checkingDriver && username.trim().length >= 3 && (
              <p className="text-xs text-blue-500 mt-1">Checking driver...</p>
            )}
            {driverInfo && !checkingDriver && (
              <p className={`text-xs mt-1 ${
                driverInfo.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {driverInfo.name}
              </p>
            )}
            {!username && (
              <p className="text-xs text-gray-500 mt-1">
                Enter driver username to switch to occupied status
              </p>
            )}
          </div>

          {/* Toggle Button for Available/Occupied */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Spot Status:
            </label>
            <StatusToggle
              isChecked={isToggleChecked}
              onToggle={handleToggleChange}
              loading={loading}
              disabled={!canToggleToOccupied && !isToggleChecked}
            />
          </div>
          
          {/* Help text */}
          {!canToggleToOccupied && !isToggleChecked && (
            <p className="text-xs text-red-500 text-center">
              Please enter a valid driver username first to switch to occupied status
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {onDelete && (
          <div className="flex space-x-2 pt-4 border-t border-gray-100">
            <button
              onClick={() => onDelete(spot.id)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ParkingSpotCard;