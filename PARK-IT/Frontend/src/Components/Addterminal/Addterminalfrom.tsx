import React, { useState } from 'react';
import axios from 'axios';

interface CsrfTokenResponse {
  csrfToken: string;
}

interface ParkingLotFormData {
  name: string;
  address: string;
  total_capacity: number;
  city: string;
  country: string;
  profile_image_url: File | null;
}

function Addterminal() {
  const [formData, setFormData] = useState<ParkingLotFormData>({
    name: '',
    address: '',
    total_capacity: 0,
    city: '',
    country: '',
    profile_image_url: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_capacity' ? parseInt(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        profile_image_url: e.target.files![0]  // FIXED: Changed to profile_image_url
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      // Get CSRF token first with proper typing
      const csrfResponse = await axios.get<CsrfTokenResponse>(
        'http://localhost:8000/api/csrf/', 
        { withCredentials: true }
      );
      const csrfToken = csrfResponse.data.csrfToken;
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('address', formData.address);
      submitData.append('total_capacity', formData.total_capacity.toString());
      submitData.append('city', formData.city);
      submitData.append('country', formData.country);
      
      if (formData.profile_image_url) {
        submitData.append('terminal_picture', formData.profile_image_url);
      }

      // Submit to Django backend
      const response = await axios.post(
        'http://localhost:8000/api/parking-lots/', 
        submitData,
        {
          headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );

      setMessage('Parking lot added successfully!');
      // Reset form
      setFormData({
        name: '',
        address: '',
        total_capacity: 0,
        city: '',
        country: '',
        profile_image_url: null,
      });
    } catch (error: any) {
      console.error('Submission error:', error);
      setMessage(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to add parking lot. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mt-24 mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Parking Terminal</h2>
          <p className="text-gray-600 mt-1">Fill in the details below to add a new parking terminal</p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-8 py-6">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Terminal Name *
              </label>
              <input 
                type="text" 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                placeholder="Enter terminal name"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">
                Address
              </label>
              <input 
                type="text" 
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                placeholder="Enter full address"
              />
            </div>
            
            <div>
              <label htmlFor="total_capacity" className="block text-sm font-medium text-gray-900 mb-2">
                Total Capacity *
              </label>
              <input 
                type="number" 
                id="total_capacity"
                name="total_capacity"
                value={formData.total_capacity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                placeholder="0"
                min="1"
                required
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-2">
                City
              </label>
              <input 
                type="text" 
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                placeholder="Enter city"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="country" className="block text-sm font-medium text-gray-900 mb-2">
                Country
              </label>
              <input 
                type="text" 
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all" 
                placeholder="Enter country"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="terminal_picture" className="block text-sm font-medium text-gray-900 mb-2">
                Terminal Picture
              </label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="terminal_picture" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.profile_image_url ? formData.profile_image_url.name : 'SVG, PNG, JPG or GIF (MAX. 5MB)'}
                    </p>
                  </div>
                  <input 
                    id="terminal_picture" 
                    name="terminal_picture"
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
                  name: '',
                  address: '',
                  total_capacity: 0,
                  city: '',
                  country: '',
                  profile_image_url: null,
                });
                setMessage('');
              }}
            >
              Clear Form
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Terminal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Addterminal;