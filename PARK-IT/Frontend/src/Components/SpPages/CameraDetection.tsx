import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Camera, Upload, RefreshCw } from 'lucide-react';

const CameraDetection = () => {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [spots, setSpots] = useState<any[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchSpots();
    // Don't call getDevices() immediately, wait for user interaction or mode check
  }, []);

  useEffect(() => {
    if (mode === 'camera') {
      // If we have a selected device, try to start it
      if (selectedDeviceId) {
        startCamera(selectedDeviceId);
      } else {
        // Otherwise, try to get any camera and then enumerate
        initializeCamera();
      }
    } else {
      stopCamera();
    }
  }, [mode, selectedDeviceId]);

  const fetchSpots = async () => {
    try {
      // Fetch spots belonging to this service provider
      const response = await axios.get('http://localhost:8000/api/parking-spots/', {
        withCredentials: true
      });
      setSpots(response.data);
    } catch (error) {
      console.error("Error fetching spots", error);
    }
  };

  const initializeCamera = async () => {
    try {
      console.log("Initializing camera...");
      // First request access to default camera to trigger permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Once we have permission/stream, enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length > 0) {
        // Set the first device as selected, which will trigger the other useEffect
        setSelectedDeviceId(videoDevices[0].deviceId);
        
        // If we already have a stream and it matches the first device roughly, we could use it,
        // but simpler to let startCamera handle it with the specific ID.
        // However, we should stop the test stream first to release it.
        stream.getTracks().forEach(track => track.stop());
      } else {
        alert("No camera devices found.");
      }
    } catch (error) {
      console.error("Error initializing camera:", error);
      alert("Could not access camera. Please ensure you have granted camera permissions.");
    }
  };

  const startCamera = async (deviceId: string) => {
    stopCamera();
    try {
      console.log(`Starting camera with device ID: ${deviceId}`);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error("Error starting camera with specific ID:", error);
      // Fallback: try generic video constraints if exact ID fails
      try {
        console.log("Retrying with generic video constraints...");
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackError) {
        console.error("Fallback camera start failed:", fallbackError);
        alert("Failed to start camera. Please check connection and permissions.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedSpotId) {
        if (!selectedSpotId) alert("Please select a parking spot first.");
        return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      detectParking(imageData);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && selectedSpotId) {
             detectParking(reader.result as string);
        } else if (!selectedSpotId) {
             alert("Please select a parking spot first.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const detectParking = async (base64Image: string) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/detect-parking/', {
        spot_id: selectedSpotId,
        image: base64Image
      }, {
        withCredentials: true
      });
      setDetectionResult(response.data);
      // Refresh spots to show updated status
      fetchSpots();
      
      // Show success message
      if (response.data.success) {
        const status = response.data.updated_spot_status;
        const method = response.data.method || 'detection';
        alert(`Detection successful! Spot is now: ${status}\nMethod: ${method}`);
      }
    } catch (error: any) {
      console.error("Detection failed", error);
      
      // Show detailed error message
      const errorData = error.response?.data;
      if (errorData) {
        const errorMsg = errorData.error || 'Detection failed';
        const details = errorData.details || '';
        const note = errorData.note || errorData.fallback || '';
        
        alert(`${errorMsg}\n\n${details}\n\n${note}`);
      } else {
        alert("Detection failed. Please check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto pt-32">
      <h1 className="text-3xl font-bold mb-6">Parking Spot Detection</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="space-x-4">
                <button 
                  className={`px-4 py-2 rounded ${mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  onClick={() => setMode('camera')}
                >
                  <Camera className="inline mr-2" size={18} />
                  Live Camera
                </button>
                <button 
                  className={`px-4 py-2 rounded ${mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  onClick={() => setMode('upload')}
                >
                  <Upload className="inline mr-2" size={18} />
                  Upload Image
                </button>
              </div>
              
              {mode === 'camera' && (
                <select 
                  className="border rounded px-3 py-2"
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                >
                  {devices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${devices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="aspect-video bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
              {mode === 'camera' ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                   {detectionResult?.processed_image ? (
                       <img src={detectionResult.processed_image} alt="Processed Detection" className="w-full h-full object-contain" />
                   ) : previewUrl ? (
                       <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                   ) : (
                       <>
                        <Upload size={48} className="mb-2 opacity-50" />
                        <p>Click below to upload an image</p>
                       </>
                   )}
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-4">
               <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Select Spot to Monitor</label>
                   <select 
                        className="w-full border rounded px-3 py-2"
                        value={selectedSpotId}
                        onChange={(e) => setSelectedSpotId(e.target.value)}
                   >
                       <option value="">-- Select a Spot --</option>
                       {spots.map((spot: any) => (
                           <option key={spot.id} value={spot.id}>
                               {spot.spot_number} - {spot.lot_name || 'Lot'} ({spot.status})
                           </option>
                       ))}
                   </select>
               </div>
               
               <div className="flex items-end">
                   {mode === 'camera' ? (
                       <button 
                           className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                           onClick={handleCapture}
                           disabled={loading || !selectedSpotId}
                       >
                           {loading ? 'Detecting...' : 'Capture & Detect'}
                       </button>
                   ) : (
                       <label className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer disabled:opacity-50 inline-block">
                           {loading ? 'Processing...' : 'Select Image'}
                           <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={loading} />
                       </label>
                   )}
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 h-full">
                <h2 className="text-xl font-bold mb-4">Detection Results</h2>
                
                {detectionResult ? (
                    <div className={`p-4 rounded-lg border ${detectionResult.detection.is_occupied ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="text-3xl mb-2 text-center">
                            {detectionResult.detection.is_occupied ? '🚗 Occupied' : '✅ Available'}
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Confidence:</span>
                                <span className="font-bold">{(detectionResult.detection.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">New Status:</span>
                                <span className="font-bold capitalize">{detectionResult.updated_spot_status}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                                Detected at: {new Date().toLocaleTimeString()}
                            </div>
                            
                            {/* Show Processed Image */}
                            {detectionResult.processed_image && (
                                <div className="mt-4 border rounded overflow-hidden">
                                    <p className="text-xs text-gray-500 mb-1 text-center">Detection Visual:</p>
                                    <img 
                                        src={detectionResult.processed_image} 
                                        alt="YOLO Detection" 
                                        className="w-full h-auto"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-500 text-center py-10">
                        No detection performed yet.
                    </div>
                )}

                <div className="mt-8">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-700">Spot Status Overview</h3>
                        <button onClick={fetchSpots} className="text-blue-600 hover:text-blue-800">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {spots.map((spot: any) => (
                            <div key={spot.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded border-b">
                                <div>
                                    <span className="font-medium">{spot.spot_number}</span>
                                    <span className="text-xs text-gray-500 block">{spot.lot_name}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    spot.status === 'available' ? 'bg-green-100 text-green-800' :
                                    spot.status === 'occupied' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {spot.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CameraDetection;
