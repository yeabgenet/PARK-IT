import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

type RoleValue = 'Driver' | 'Service Provider' | '';

type CountryData = {
  [country: string]: {
    [city: string]: string[];
  };
};

interface UserData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  gender: string;
  profile_picture: File | null;
}

interface DriverData {
  license_number: string;
  license_plate: string;
  phone_number: string;
  age: number;
  country: string;
  city: string;
  address: string;
}

interface ServiceProviderData {
  company_name: string;
  contact_person: string;
  phone_number: string;
  age: number;
  country: string;
  city: string;
  address: string;
  terminal_picture: File | null;
}

interface RegisterResponse {
  message: string;
  user?: {
    username: string;
    role: string | null;
  };
}

const countryCityHoodsData: CountryData = {
  Ethiopia: {
    'Addis Abeba': ['Mexico', 'Kality', 'Lideta', '4 kilo', 'Jemo', 'Stadium', 'Bisrate Gabriel', 'Sar bet'],
    'Dire Dawa': ['Ashewa', 'Sabian', 'Goro', 'Kebele 01'],
    Harar: ['Abadir', 'Feres Megala', 'Jinela', 'Shenkor', 'Keladamba'],
    Jijiga: ['Kebele 01', 'Fara', 'Taleh', 'Kebele 06'],
  },
  Kenya: {
    Nairobi: ['Westlands', 'Kilimani', 'Karen', 'Langata'],
    Mombasa: ['Nyali', 'Bamburi', 'Kisauni'],
    Kisumu: ['Milimani', 'Kibuye'],
  },
  Uganda: {
    Kampala: ['Kololo', 'Muyenga', 'Naguru', 'Buziga'],
    Jinja: ['Walukuba', 'Bugembe'],
  },
};

function UserForm() {
  const [selectedRole, setSelectedRole] = useState<RoleValue>('');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const totalSteps = 5;
  const navigate = useNavigate();

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [availableHoods, setAvailableHoods] = useState<string[]>([]);
  const [address, setAddress] = useState<string>('');

  const [userData, setUserData] = useState<UserData>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    gender: '',
    profile_picture: null,
  });

  const [driverData, setDriverData] = useState<DriverData>({
    license_number: '',
    license_plate: '',
    phone_number: '',
    age: 0,
    country: '',
    city: '',
    address: '',
  });

  const [serviceProviderData, setServiceProviderData] = useState<ServiceProviderData>({
    company_name: '',
    contact_person: '',
    phone_number: '',
    age: 0,
    country: '',
    city: '',
    address: '',
    terminal_picture: null,
  });

  useEffect(() => {
    axios.get<{ csrfToken: string }>('http://localhost:8000/api/csrf/', { withCredentials: true })
      .then(response => {
        axios.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken;
        console.log('CSRF token fetched:', response.data.csrfToken);
      })
      .catch(err => {
        console.error('Failed to fetch CSRF token:', err.message, err.response?.status, err.response?.data);
        setErrorMessage('Failed to fetch CSRF token. Please refresh and try again.');
      });
  }, []);

  useEffect(() => {
    if (selectedCountry && selectedCity) {
      const hoodsForCity = countryCityHoodsData[selectedCountry as keyof CountryData]?.[selectedCity] || [];
      setAvailableHoods(hoodsForCity);
    } else {
      setAvailableHoods([]);
    }
  }, [selectedCountry, selectedCity]);

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.target.value);
    setSelectedCity('');
    setAddress('');
    setDriverData((prev) => ({ ...prev, country: event.target.value, city: '', address: '' }));
    setServiceProviderData((prev) => ({ ...prev, country: event.target.value, city: '', address: '' }));
  };

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(event.target.value);
    setAddress('');
    setDriverData((prev) => ({ ...prev, city: event.target.value, address: '' }));
    setServiceProviderData((prev) => ({ ...prev, city: event.target.value, address: '' }));
  };

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value);
    setDriverData((prev) => ({ ...prev, address: event.target.value }));
    setServiceProviderData((prev) => ({ ...prev, address: event.target.value }));
  };

  const citiesForSelectedCountry = selectedCountry ? Object.keys(countryCityHoodsData[selectedCountry as keyof CountryData]) : [];

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleDriverChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDriverData({ ...driverData, [e.target.name]: e.target.value });
  };

  const handleServiceProviderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setServiceProviderData({ ...serviceProviderData, [e.target.name]: e.target.value });
  };

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value as RoleValue);
    if (errorMessage) setErrorMessage('');
  };

  const clearSelection = () => setSelectedRole('');

  const nextStep = () => {
    if (currentStep === 1 && !selectedRole) {
      setErrorMessage('Please select a role to continue.');
      return;
    }
    setErrorMessage('');
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const formData = new FormData();
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== null && key !== 'profile_picture') {
        formData.append(key, value);
      }
    });
    if (userData.profile_picture) {
      formData.append('profile_picture', userData.profile_picture);
    }

    try {
      let response;
      if (selectedRole === 'Driver') {
        Object.entries(driverData).forEach(([key, value]) => {
          formData.append(key, value.toString());
        });
        formData.append('role', 'Driver');
        response = await axios.post<RegisterResponse>('http://localhost:8000/api/register/driver/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
      } else if (selectedRole === 'Service Provider') {
        Object.entries(serviceProviderData).forEach(([key, value]) => {
          if (value !== null && key !== 'terminal_picture') {
            formData.append(key, value.toString());
          }
        });
        if (serviceProviderData.terminal_picture) {
          formData.append('terminal_picture', serviceProviderData.terminal_picture);
        }
        formData.append('role', 'Service Provider');
        response = await axios.post<RegisterResponse>('http://localhost:8000/api/register/service-provider/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
      } else {
        setErrorMessage('Please select a role.');
        return;
      }

      console.log('Register response:', response.data);
      if (response.data.message === 'User created successfully') {
        const role = response.data.user?.role?.toLowerCase();
        console.log('Redirecting to:', role === 'service provider' ? '/service-provider' : '/');
        navigate(role === 'service provider' ? '/service-provider' : '/');
      } else {
        setErrorMessage(response.data.message || 'Failed to register.');
      }
    } catch (err: any) {
      console.error('Register error:', err.response?.status, err.response?.data, err.message);
      setErrorMessage(err.response?.data?.message || 'Error during registration. Please try again.');
    }
  };

  const PaginationDots = () => (
    <div className="flex justify-center items-center space-x-2 my-4 md:hidden">
      {[...Array(totalSteps)].map((_, index) => (
        <div
          key={index + 1}
          className={`w-3 h-3 rounded-full ${currentStep === index + 1 ? 'bg-black' : 'bg-gray-300'}`}
        ></div>
      ))}
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-center mt-6 mb-6 px-4">
        <div className="p-6 w-full max-w-md md:max-w-3xl bg-white rounded-lg">
          <h1 className="text-center text-3xl font-bold mb-4">ParkIt</h1>
          <hr />
        </div>
      </div>

      <div className="flex items-center justify-center px-4">
        <div className="p-6 w-full max-w-md md:max-w-3xl bg-white rounded-lg shadow-md">
          <PaginationDots />
          {errorMessage && (
            <div className="text-red-600 bg-red-100 p-3 rounded-md text-center mb-4">{errorMessage}</div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className={currentStep === 1 ? 'block' : 'hidden md:block'}>
              <label htmlFor="role" className="block text-base font-medium text-neutral-900 mb-1">
                Role <span className="text-neutral-600">*</span>
              </label>
              <select
                id="role"
                name="role"
                className="w-full border border-gray-300 rounded-md px-4 py-2"
                value={selectedRole}
                onChange={handleSelectionChange}
                required
              >
                <option value="" onClick={clearSelection}>
                  Select Your Role ...
                </option>
                <option value="Driver">Driver</option>
                <option value="Service Provider">Service Provider</option>
              </select>
            </div>

            <div className={currentStep === 2 ? 'block space-y-4' : 'hidden md:block md:space-y-4'}>
              <div className="lg:flex lg:space-x-14 sm:block">
                <div className="lg:w-1/2 sm:w-100%">
                  <label className="block text-base font-medium text-neutral-900 mb-1">First Name *</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                    name="first_name"
                    value={userData.first_name}
                    onChange={handleUserChange}
                    required
                  />
                </div>
                <div className="lg:w-1/2 sm:w-100">
                  <label className="block text-base font-medium text-neutral-900 mb-1">Last Name *</label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                    name="last_name"
                    placeholder="Last Name"
                    value={userData.last_name}
                    onChange={handleUserChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">Phone Number *</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-4 py-2"
                  name="phone_number"
                  value={selectedRole === 'Driver' ? driverData.phone_number : serviceProviderData.phone_number}
                  onChange={selectedRole === 'Driver' ? handleDriverChange : handleServiceProviderChange}
                  required
                />
              </div>
            </div>

            <div className={currentStep === 3 ? 'block space-y-4' : 'hidden md:block md:space-y-4'}>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">
                  Age <span className="text-neutral-600">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  className="w-1/5 border border-gray-300 rounded-md px-4 py-2"
                  placeholder="Age"
                  value={selectedRole === 'Driver' ? driverData.age : serviceProviderData.age}
                  onChange={selectedRole === 'Driver' ? handleDriverChange : handleServiceProviderChange}
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">
                  Gender <span className="text-neutral-600">*</span>
                </label>
                <select
                  name="gender"
                  value={userData.gender}
                  onChange={handleUserChange}
                  className="w-1/5 border border-gray-300 rounded-md px-4 py-2"
                  required
                >
                  <option value=""></option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor="country-select" className="block text-base font-medium text-neutral-900 mb-1">
                    Country <span className="text-neutral-600">*</span>
                  </label>
                  <select
                    id="country-select"
                    name="country"
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    required
                  >
                    <option value="">Select a country...</option>
                    {Object.keys(countryCityHoodsData).map((countryName) => (
                      <option key={countryName} value={countryName}>
                        {countryName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city-select" className="block text-base font-medium text-neutral-900 mb-1">
                    State / City <span className="text-neutral-600">*</span>
                  </label>
                  <select
                    id="city-select"
                    name="city"
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                    value={selectedCity}
                    onChange={handleCityChange}
                    disabled={!selectedCountry}
                    required
                  >
                    <option value="">Select a city...</option>
                    {citiesForSelectedCountry.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="address-input" className="block text-base font-medium text-neutral-900 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    id="address-input"
                    name="address"
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                    list="hood-list"
                    value={address}
                    onChange={handleAddressChange}
                    disabled={!selectedCity}
                    placeholder={selectedCity ? 'Enter or select a neighborhood' : 'Please select a city first...'}
                    required
                  />
                  <datalist id="hood-list">
                    {availableHoods.map((hoodName) => (
                      <option key={hoodName} value={hoodName}></option>
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className={currentStep === 4 ? 'block space-y-4' : 'hidden md:block md:space-y-4'}>
              {selectedRole === 'Driver' && (
                <>
                  <div className="lg:flex lg:space-x-14 sm:block">
                    <div className="lg:w-1/2 sm:w-100%">
                      <label className="block text-base font-medium text-neutral-900 mb-1">License Plate *</label>
                      <input
                        className="w-full border border-gray-300 rounded-md px-4 py-2"
                        name="license_plate"
                        placeholder="License Plate"
                        value={driverData.license_plate}
                        onChange={handleDriverChange}
                        required
                      />
                    </div>
                    <div className="lg:w-1/2 sm:w-100%">
                      <label className="block text-base font-medium text-neutral-900 mb-1">License Number *</label>
                      <input
                        className="w-full border border-gray-300 rounded-md px-4 py-2"
                        name="license_number"
                        placeholder="License Number"
                        value={driverData.license_number}
                        onChange={handleDriverChange}
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              {selectedRole === 'Service Provider' && (
                <>
                  <div className="lg:flex lg:space-x-14 sm:block">
                    <div className="lg:w-1/2 sm:w-100%">
                      <label className="block text-base font-medium text-neutral-900 mb-1">Terminal Name *</label>
                      <input
                        className="w-full border border-gray-300 rounded-md px-4 py-2"
                        name="company_name"
                        placeholder="Parking Terminal Name"
                        value={serviceProviderData.company_name}
                        onChange={handleServiceProviderChange}
                        required
                      />
                    </div>
                    <div className="lg:w-1/2 sm:w-100%">
                      <label className="block text-base font-medium text-neutral-900 mb-1">Contact Person *</label>
                      <input
                        className="w-full border border-gray-300 rounded-md px-4 py-2"
                        name="contact_person"
                        placeholder="Contact Person"
                        value={serviceProviderData.contact_person}
                        onChange={handleServiceProviderChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-medium text-neutral-900 mb-1">Terminal Picture</label>
                    <input
                      className="w-1/2 border border-gray-300 rounded-md px-4 py-10"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setServiceProviderData({
                          ...serviceProviderData,
                          terminal_picture: e.target.files ? e.target.files[0] : null,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className={currentStep === 5 ? 'block space-y-4' : 'hidden md:block md:space-y-4'}>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">Email *</label>
                <input
                  className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={userData.email}
                  onChange={handleUserChange}
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">Username *</label>
                <input
                  className="w-1/3 border border-gray-300 rounded-md px-4 py-2"
                  name="username"
                  placeholder="Username"
                  value={userData.username}
                  onChange={handleUserChange}
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">Password *</label>
                <input
                  className="w-1/3 border border-gray-300 rounded-md px-4 py-2"
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={userData.password}
                  onChange={handleUserChange}
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-neutral-900 mb-1">Profile Picture</label>
                <input
                  className="w-1/2 border border-gray-300 rounded-md px-4 py-10"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      profile_picture: e.target.files ? e.target.files[0] : null,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-between mt-6 md:hidden">
              {currentStep > 1 && <button type="button" onClick={prevStep}>Back</button>}
              {currentStep < totalSteps ? (
                <button type="button" onClick={nextStep}>Next</button>
              ) : (
                <button type="submit">Submit</button>
              )}
            </div>
            <div className="hidden md:flex justify-end mt-6">
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default UserForm;