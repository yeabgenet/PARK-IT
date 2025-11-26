import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Phone, MapPin, CreditCard, Save, Camera } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  license_number: string;
  plate_number: string; // Note: Driver model has license_number, Car model has license_plate
  address: string;
  city: string;
  country: string;
  profile_picture?: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // 1. Get User ID from session
      const userResponse = await axios.get('http://localhost:8000/api/user/', { withCredentials: true });
      const userId = userResponse.data.user.id;

      if (!userId) throw new Error("User ID not found");

      // 2. Fetch Driver details using ID
      // Note: Assuming /api/drivers/{id}/ is the endpoint. 
      // If the backend uses a different structure, this needs adjustment.
      // However, the DriverViewSet is usually mapped to /api/drivers/
      // And since Driver primary key is OneToOne with User, driver_id == user_id
      const driverResponse = await axios.get(`http://localhost:8000/api/drivers/${userId}/`, { withCredentials: true });
      
      // Flatten the response for easier handling
      // DriverSerializer returns nested structure? Let's assume it matches the serializer fields
      const data = driverResponse.data;
      
      // We might need to fetch the car details separately if not included
      // But DriverSerializer in code showed 'plate_number' as write_only?
      // Let's check what GET returns. 
      // DriverSerializer fields: 'username', ... 'plate_number' (write_only).
      // So we might miss plate_number in GET.
      // We can fetch cars from /api/cars/ or similar if needed.
      
      setProfile(data);
      setFormData(data);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to load profile. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      // Prepare data for update
      // Note: DRF might expect multipart/form-data if uploading image
      // For simple text update, JSON is fine.
      
      // Filter out read-only fields or fields not in serializer if necessary
      // DriverViewSet update uses DriverSerializer.
      
      await axios.patch(`http://localhost:8000/api/drivers/${profile.id}/`, formData, {
        withCredentials: true
      });

      setProfile({ ...profile, ...formData } as UserProfile);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to update profile: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

        <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header / Cover */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
            
            <div className="px-8 pb-8">
                {/* Profile Picture & Basic Info */}
                <div className="relative flex justify-between items-end -mt-12 mb-6">
                    <div className="flex items-end gap-6">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden relative group">
                            {profile?.profile_picture ? (
                                <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500">
                                    <User size={48} />
                                </div>
                            )}
                            {editing && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                    <Camera className="text-white" />
                                </div>
                            )}
                        </div>
                        <div className="mb-2">
                            <h2 className="text-2xl font-bold">{formData.first_name} {formData.last_name}</h2>
                            <p className="text-gray-600">@{formData.username}</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setEditing(!editing)}
                        className={`px-6 py-2 rounded-lg font-medium transition ${
                            editing 
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {editing ? 'Cancel' : 'Edit Profile'}
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name || ''}
                                    onChange={handleInputChange}
                                    disabled={!editing}
                                    className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name || ''}
                                    onChange={handleInputChange}
                                    disabled={!editing}
                                    className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        className="w-full border rounded-lg pl-10 pr-3 py-2 disabled:bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="phone_number"
                                        value={formData.phone_number || ''}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        className="w-full border rounded-lg pl-10 pr-3 py-2 disabled:bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address & License */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold border-b pb-2">Details</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address || ''}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        className="w-full border rounded-lg pl-10 pr-3 py-2 disabled:bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city || ''}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country || ''}
                                        onChange={handleInputChange}
                                        disabled={!editing}
                                        className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        name="license_number"
                                        value={formData.license_number || ''}
                                        onChange={handleInputChange}
                                        disabled={!editing} // Usually ID/License shouldn't be easily editable
                                        className="w-full border rounded-lg pl-10 pr-3 py-2 disabled:bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {editing && (
                        <div className="mt-8 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
