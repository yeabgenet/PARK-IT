import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CsrfTokenResponse {
  csrfToken: string;
}

interface Terminal {
  id: number;
  name: string;
  address: string;
}

interface ParkingSpotFormData {
  lot: number;
  spot_number: string;
  is_reserved: boolean;
  status: string;
  spot_picture: File | null;
}

function AddSpot() {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [formData, setFormData] = useState<ParkingSpotFormData>({
    lot: 0,
    spot_number: '',
    is_reserved: false,
    status: 'available',
    spot_picture: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingTerminals, setLoadingTerminals] = useState(true);

  // Fetch terminals on component mount
  useEffect(() => {
    const fetchTerminals = async () => {
      try {
        const response = await axios.get<Terminal[]>(
          'http://localhost:8000/api/terminals/',
          { withCredentials: true }
        );
        setTerminals(response.data);
      } catch (error) {
        console.error('Error fetching terminals:', error);
        setMessage('Failed to load terminals');
      } finally {
        setLoadingTerminals(false);
      }
    };

    fetchTerminals();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        spot_picture: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
  
    if (!formData.lot) {
      setMessage('Please select a terminal');
      setIsSubmitting(false);
      return;
    }
  
    try {
      // Get CSRF token
      const csrfResponse = await axios.get<CsrfTokenResponse>(
        'http://localhost:8000/api/csrf/', 
        { withCredentials: true }
      );
      const csrfToken = csrfResponse.data.csrfToken;
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('lot', formData.lot.toString());
      submitData.append('spot_number', formData.spot_number);
      submitData.append('is_reserved', formData.is_reserved.toString());
      submitData.append('status', formData.status);
      
      if (formData.spot_picture) {
        submitData.append('spot_picture', formData.spot_picture);
      }
  
      // Log what we're sending
      console.log('Submitting form data:');
      for (let [key, value] of submitData.entries()) {
        console.log(key, value);
      }
  
      // Submit to Django backend
      const response = await axios.post(
        'http://localhost:8000/api/parking-spots/', 
        submitData,
        {
          headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
  
      console.log('Response from server:', response.data);
      setMessage('Parking spot added successfully!');
      
      // Reset form
      setFormData({
        lot: 0,
        spot_number: '',
        is_reserved: false,
        status: 'available',
        spot_picture: null,
      });
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      setMessage(
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.response?.data?.detail ||
        'Failed to add parking spot. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mt-24 mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Parking Spot</h2>
          <p className="text-gray-600 mt-1">Fill in the details below to add a new parking spot</p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-8 py-6">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-6">
            {/* Terminal Selection Dropdown */}
            <div>
              <label htmlFor="lot" className="block text-sm font-medium text-gray-900 mb-2">
                Terminal *
              </label>
              <select
                id="lot"
                name="lot"
                value={formData.lot}
                onChange={handleSelectChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                required
                disabled={loadingTerminals}
              >
                <option value={0}>Select a terminal</option>
                {terminals.map(terminal => (
                  <option key={terminal.id} value={terminal.id}>
                    {terminal.name} - {terminal.address}
                  </option>
                ))}
              </select>
              {loadingTerminals && (
                <p className="text-sm text-gray-500 mt-1">Loading terminals...</p>
              )}
            </div>

            {/* Spot Number */}
            <div>
              <label htmlFor="spot_number" className="block text-sm font-medium text-gray-900 mb-2">
                Spot Number *
              </label>
              <input 
                type="text" 
                id="spot_number"
                name="spot_number"
                value={formData.spot_number}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                placeholder="Enter spot number (e.g., A1, B2)"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                required
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>

            {/* Reserved Checkbox */}
            <div className="flex items-center">
              <input
                id="is_reserved"
                name="is_reserved"
                type="checkbox"
                checked={formData.is_reserved}
                onChange={handleInputChange}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <label htmlFor="is_reserved" className="ml-2 block text-sm text-gray-900">
                Reserved Spot
              </label>
            </div>

            {/* Spot Picture Upload */}
            <div className="md:col-span-2">
              <label htmlFor="spot_picture" className="block text-sm font-medium text-gray-900 mb-2">
                Spot Picture
              </label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="spot_picture" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.spot_picture ? formData.spot_picture.name : 'SVG, PNG, JPG or GIF (MAX. 5MB)'}
                    </p>
                  </div>
                  <input 
                    id="spot_picture" 
                    name="spot_picture"
                    type="file" 
                    onChange={handleFileChange}
                    className="hidden" 
                    accept="image/*"
                  />
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-4">
            <button 
              type="button" 
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors"
              onClick={() => {
                setFormData({
                  lot: 0,
                  spot_number: '',
                  is_reserved: false,
                  status: 'available',
                  spot_picture: null,
                });
                setMessage('');
              }}
            >
              Clear Form
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || loadingTerminals}
              className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Spot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSpot;