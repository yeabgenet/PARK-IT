import { Link } from 'react-router-dom';
import React from 'react';

// Define the type for a parking spot, including lot_name
interface ParkingSpot {
  spot_id: number;
  lot: number;
  spot_number: string;
  is_reserved: boolean;
  status: 'available' | 'occupied' | 'reserved';
  image_url: string | null;
  // This property is needed to match what's used in the JSX
  lot_name: string;
}

// Define the props for your component
interface ParkingSpotCardProps {
  spot: ParkingSpot;
}

// The single, well-typed component definition
const ParkingSpotCard: React.FC<ParkingSpotCardProps> = ({ spot }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden my-4 md:my-0 flex flex-col md:flex-row">
      {/* Parking Spot Image */}
      <div className="md:w-1/2 w-full">
        <img 
          src={spot.image_url || "https://placehold.co/600x400/1e293b/fff?text=No+Image"} 
          alt={`Parking Spot ${spot.spot_number}`} 
          className="w-full h-full object-cover" 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://placehold.co/600x400/1e293b/fff?text=No+Image";
          }}
        />
      </div>
      
      {/* Parking Spot Details */}
      <div className="p-5 flex-1 md:w-1/2 w-full flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold">{spot.spot_number}</h2>
          <p className="text-gray-600 text-sm mt-1">{spot.lot_name}</p>
          <p className="mt-3 text-sm text-gray-500">
            {/* You can add more details here from the spot or lot data */}
            Status: <span className={`font-semibold ${spot.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>{spot.status}</span>
          </p>
        </div>
        
        {/* Reservation Button */}
        <div className="mt-4">
          {spot.status === 'available' ? (
            <Link to={`/reserve/${spot.spot_id}`}>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full w-full transition-colors duration-200">
                Reserve
              </button>
            </Link>
          ) : (
            <button className="bg-gray-400 text-white font-semibold py-2 px-4 rounded-full w-full cursor-not-allowed" disabled>
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParkingSpotCard;
