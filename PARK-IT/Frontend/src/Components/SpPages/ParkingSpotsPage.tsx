// Components/SpPages/ParkingSpotsPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ParkingSpotCard from "./ParkingSpotCard";

interface ParkingSpot {
  id: number;
  spot_number: string;
  status: "available" | "occupied" | "reserved";
  is_reserved: boolean;
  image_url: string | null;
  lot: {
    id: number;
    name: string;
    address: string;
  };
}

export default function ParkingSpotsPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const res = await axios.get<ParkingSpot[]>("/api/parking-spots/", {
          withCredentials: true,
        });
        setSpots(res.data);
      } catch (err) {
        console.error("Error fetching spots:", err);
      }
    };

    fetchSpots();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Parking Spots</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spots.map((spot) => (
          <ParkingSpotCard key={spot.id} spot={spot} />
        ))}
      </div>
    </div>
  );
}
