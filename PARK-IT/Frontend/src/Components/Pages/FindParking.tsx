import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Clock, DollarSign, Car, CreditCard, X } from 'lucide-react';
import axios from 'axios';

interface ParkingSpot {
  id: number;
  spot_number: string;
  status: string;
  is_reserved: boolean;
  lot_name: string;
  lot_address: string;
  distance_km: number;
  price_per_hour: number;
  image_url?: string;
}

const FindParking: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [nearbySpots, setNearbySpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [spotToReserve, setSpotToReserve] = useState<ParkingSpot | null>(null);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          setError('Unable to get your location. Please enable location services.');
          console.error(error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchNearbySpots();
    }
  }, [userLocation]);

  const fetchNearbySpots = async () => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/parking-spots/recommend/', {
        params: {
          lat: userLocation.lat,
          lon: userLocation.lon,
        },
        withCredentials: true,
      });
      
      setNearbySpots(response.data.recommended_spots || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch parking spots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCamera = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setShowCamera(true);
  };

  const handleReserveClick = (spot: ParkingSpot) => {
      setSpotToReserve(spot);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-32">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Parking</h1>
          <p className="text-gray-600">
            Discover available parking spots near you
          </p>
        </div>

        {/* Location Status */}
        {userLocation && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center gap-3">
            <MapPin className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Your location</p>
              <p className="font-medium">
                {userLocation.lat.toFixed(6)}, {userLocation.lon.toFixed(6)}
              </p>
            </div>
            <button
              onClick={fetchNearbySpots}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Finding nearby parking spots...</p>
          </div>
        )}

        {/* Parking Spots Grid */}
        {!loading && nearbySpots.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbySpots.map((spot) => (
              <ParkingSpotCard
                key={spot.id}
                spot={spot}
                onViewCamera={handleViewCamera}
                onReserve={handleReserveClick}
              />
            ))}
          </div>
        )}

        {/* No Spots Found */}
        {!loading && nearbySpots.length === 0 && userLocation && (
          <div className="text-center py-12">
            <Car className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No parking spots found nearby
            </h3>
            <p className="text-gray-600">
              Try expanding your search radius or check back later
            </p>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && selectedSpot && (
        <CameraModal
          spot={selectedSpot}
          onClose={() => {
            setShowCamera(false);
            setSelectedSpot(null);
          }}
        />
      )}

      {/* Payment Modal */}
      {spotToReserve && (
          <PaymentModal
            spot={spotToReserve}
            onClose={() => setSpotToReserve(null)}
          />
      )}
    </div>
  );
};

interface ParkingSpotCardProps {
  spot: ParkingSpot;
  onViewCamera: (spot: ParkingSpot) => void;
  onReserve: (spot: ParkingSpot) => void;
}

const ParkingSpotCard: React.FC<ParkingSpotCardProps> = ({ spot, onViewCamera, onReserve }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Spot Image or Placeholder */}
      {spot.image_url ? (
        <img
          src={spot.image_url}
          alt={`Spot ${spot.spot_number}`}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Car className="text-white" size={64} />
        </div>
      )}

      {/* Spot Details */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">
              Spot {spot.spot_number}
            </h3>
            <p className="text-sm text-gray-600">{spot.lot_name}</p>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            Available
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} />
            <span>{spot.distance_km?.toFixed(1) || '?'} km away</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign size={16} />
            <span>${spot.price_per_hour || 0}/hour</span>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2">
            {spot.lot_address}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewCamera(spot)}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <Camera size={18} />
            <span>View Live</span>
          </button>
          
          <button
            onClick={() => onReserve(spot)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
};

interface PaymentModalProps {
    spot: ParkingSpot;
    onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ spot, onClose }) => {
    const [processing, setProcessing] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [duration, setDuration] = useState(2.0);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            await axios.post(
              'http://localhost:8000/api/reservations/',
              {
                spot: spot.id,
                expected_duration_hours: duration,
              },
              { withCredentials: true }
            );
            
            alert('Payment successful! Parking spot reserved.');
            window.location.href = '/driver/reservations';
          } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to reserve parking spot');
            setProcessing(false);
          }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <CreditCard size={20} />
                        Secure Payment
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handlePayment} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold text-blue-900">Order Summary</h4>
                        <p className="text-sm text-blue-700">Spot {spot.spot_number} at {spot.lot_name}</p>
                        <div className="flex justify-between mt-2 pt-2 border-t border-blue-200 font-bold text-blue-900">
                            <span>Estimated Total</span>
                            <span>${(spot.price_per_hour * duration).toFixed(2)}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input 
                            type="text" 
                            required
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                            <input 
                                type="text" 
                                required
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="MM/YY"
                                value={expiry}
                                onChange={e => setExpiry(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                            <input 
                                type="text" 
                                required
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="123"
                                value={cvc}
                                onChange={e => setCvc(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours)</label>
                         <input 
                            type="number" 
                            min="0.5"
                            step="0.5"
                            required
                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={duration}
                            onChange={e => setDuration(parseFloat(e.target.value))}
                         />
                    </div>

                    <button 
                        type="submit" 
                        disabled={processing}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors mt-4"
                    >
                        {processing ? 'Processing...' : `Pay $${(spot.price_per_hour * duration).toFixed(2)}`}
                    </button>
                </form>
            </div>
        </div>
    );
};

interface CameraModalProps {
  spot: ParkingSpot;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ spot, onClose }) => {
  const [detecting, setDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndDetect = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setDetecting(true);
    setPrediction(null);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');

      try {
        const response = await axios.post(
          'http://localhost:8000/api/detect-parking/',
          {
            spot_id: spot.id,
            image: imageData,
          },
          { withCredentials: true }
        );
        
        const result = response.data;
        setDetectionResult(result);

        // If occupied, fetch prediction
        if (result.detection.is_occupied) {
            try {
                const predResponse = await axios.get(`http://localhost:8000/api/predict-availability/?spot_id=${spot.id}`, { withCredentials: true });
                setPrediction(predResponse.data);
            } catch (e) {
                console.error("Prediction failed", e);
            }
        }

      } catch (err: any) {
        alert(err.response?.data?.error || 'Detection failed');
      } finally {
        setDetecting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold">
            Live Camera - Spot {spot.spot_number}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Camera Feed */}
        <div className="p-4">
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Detection Result */}
          {detectionResult && (
            <div className={`p-4 rounded-lg mb-4 ${
              detectionResult.detection.is_occupied 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <p className="font-semibold mb-2">
                {detectionResult.detection.is_occupied 
                  ? '🚗 Spot is Occupied' 
                  : '✓ Spot is Available'}
              </p>
              <p className="text-sm text-gray-600">
                Confidence: {(detectionResult.detection.confidence * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">
                Status: {detectionResult.updated_spot_status}
              </p>
              
              {/* Prediction Result */}
              {prediction && (
                  <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-sm font-medium text-red-800">
                          {prediction.message}
                      </p>
                  </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={captureAndDetect}
              disabled={detecting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              <span>{detecting ? 'Detecting...' : 'Detect Occupancy'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindParking;
