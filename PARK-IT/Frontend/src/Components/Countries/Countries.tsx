import React, { useState, useEffect } from 'react';

// Define a TypeScript type for the full nested data structure.
// This is a professional practice to ensure type safety.
type CountryData = {
  [country: string]: {
    [city: string]: string[];
  };
};

// This data would typically be fetched from a backend API endpoint.
// For this example, we'll keep it separate from the component for clarity.
const countryCityHoodsData: CountryData = {
  'Ethiopia': {
    'Addis Abeba': ['Mexico', 'Kality', 'Lideta', '4 kilo', 'Jemo', 'Stadium', 'Bisrate Gabriel', 'Sar bet'],
    'Dire Dawa': ['Ashewa', 'Sabian', 'Goro', 'Kebele 01'],
    'Harar': ['Abadir', 'Feres Megala', 'Jinela' , 'Shenkor' , 'Keladamba'],
    'Jijiga': ['Kebele 01', 'Fara', 'Taleh' , 'Kebele 06'],
  },
  'Kenya': {
    'Nairobi': ['Westlands', 'Kilimani', 'Karen', 'Langata'],
    'Mombasa': ['Nyali', 'Bamburi', 'Kisauni'],
    'Kisumu': ['Milimani', 'Kibuye'],
  },
  'Uganda': {
    'Kampala': ['Kololo', 'Muyenga', 'Naguru', 'Buziga'],
    'Jinja': ['Walukuba', 'Bugembe'],
  },
};

const Countries: React.FC = () => {
  // State to manage the user's country selection.
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  // State to manage the user's city selection.
  const [selectedCity, setSelectedCity] = useState<string>('');

  // State to hold the list of neighborhoods to be displayed in the datalist.
  const [availableHoods, setAvailableHoods] = useState<string[]>([]);

  // State to hold the user's address input.
  const [address, setAddress] = useState<string>('');

  // Use a useEffect hook to update the available neighborhoods whenever the city changes.
  useEffect(() => {
    if (selectedCountry && selectedCity) {
      // Find the hoods for the selected city from our data source.
      const hoodsForCity = countryCityHoodsData[selectedCountry as keyof CountryData]?.[selectedCity] || [];
      setAvailableHoods(hoodsForCity);
    } else {
      // If no city is selected, clear the neighborhoods list.
      setAvailableHoods([]);
    }
  }, [selectedCountry, selectedCity]); // This dependency array ensures the effect runs when either country or city changes.

  // Event handler for the country dropdown.
  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.target.value);
    // When the country changes, reset both the city and address to clear old data.
    setSelectedCity('');
    setAddress('');
  };

  // Event handler for the city dropdown.
  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(event.target.value);
    setAddress(''); // It's good practice to clear the address when the city changes.
  };

  // Event handler for the address input.
  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(event.target.value);
  };

  const citiesForSelectedCountry = selectedCountry ? Object.keys(countryCityHoodsData[selectedCountry as keyof CountryData]) : [];

  return (
    <div className="space-y-3" >
      {/* Country Dropdown */}
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
          {/* Dynamically populate options from the data source */}
          {Object.keys(countryCityHoodsData).map((countryName) => (
            <option key={countryName} value={countryName}>
              {countryName}
            </option>
          ))}
        </select>
      </div>

      {/* City Dropdown */}
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
          {/* Dynamically populate options from the data source */}
          {citiesForSelectedCountry.map((cityName) => (
            <option key={cityName} value={cityName}>
              {cityName}
            </option>
          ))}
        </select>
      </div>

      {/* Address Input with Dynamic Datalist */}
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
          disabled={!selectedCity} // Disable until a city is selected
          placeholder={selectedCity ? "Enter or select a neighborhood" : "Please select a city first..."}
          required
        />
        {/* The datalist is now dynamically populated by the 'availableHoods' state */}
        <datalist id="hood-list">
          {availableHoods.map((hoodName) => (
            <option key={hoodName} value={hoodName}></option>
          ))}
        </datalist>
      </div>
    </div>
  );
};

export default Countries;
