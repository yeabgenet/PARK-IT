import { useState, useEffect } from 'react';
import Filter from '../Filter/Filter';
import Footer from '../Footer/Footer';
import ParkingSpotCard from '../Cards/Cards'; // Import the new component

interface ParkingSpot {
  spot_id: number;
  lot: number;
  spot_number: string;
  is_reserved: boolean;
  status: 'available' | 'occupied' | 'reserved';
  image_url: string | null;
  lot_name: string; // Add this if your data includes the lot name
}

function Index() {
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  //const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is where you'd fetch data, for example:
    const fetchData = async () => {
      try {
        // Example data structure, replace with your actual fetch call
        const response = await fetch('/api/parking-spots');
        const data: ParkingSpot[] = await response.json();
        setParkingSpots(data);
      } catch (error) {
        console.error("Failed to fetch parking spots:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="w-full px-4 pt-36 flex justify-center ">
        <div className=" w-[25rem]  items-center">
          <form action="" className="relative items-center w-full max-w-lg">
            <input 
              type="text" 
              className="border w-full h-[3rem] sm:ml-8 lg:ml-12 pl-5 pr-12 rounded-full" 
              placeholder="Search for parking spot..." 
            />
            <i className="ri-search-line absolute top-1/2 lg:-right-7 right-7 transform -translate-y-1/2 text-gray-400"></i>
          </form>
        </div>
      </div>

      <div className="w-full lg:w-[95%] mx-auto px-[8%]">
        <div>
          <div className='mt-9 flex flex-col md:flex-row md:justify-between md:items-center gap-8'>
            <div className='welcoming'>
              <div className='flex gap-2 text-lg md:text-xl font-medium text-gray-600'>
                <h3>Selam</h3>
                {/* You'll need to fetch the user's name to display here */}
                <h3>User Name</h3> 
              </div>
              <div>
                <h1 className='text-3xl lg:text-4xl font-bold text-gray-800 mt-1'>
                  Where to park?
                </h1>
              </div>
            </div>
            <div>
              <Filter />
            </div>
          </div>
          <div className='mt-8'>
            <hr className='border-gray-200' />
          </div>
        </div>
      </div>

      {/* This is the new section to display the parking spot cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {parkingSpots.map((spot) => (
        // Now TypeScript knows that `spot` has a `spot_id`
        <ParkingSpotCard key={spot.spot_id} spot={spot} />
      ))}
    </div>

      <div className='footer'>
        <Footer/>
      </div>
    </>
  );
}

export default Index;