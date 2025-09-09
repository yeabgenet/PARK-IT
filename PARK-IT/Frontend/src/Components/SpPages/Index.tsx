// src/Components/Pages/ServiceProviderDashboard.tsx
// src/Components/SpPages/Index.tsx
import React from "react";
import SpNav from "../SpNav/SpNav";

const ServiceProviderPage: React.FC = () => {
  return (
    <>
      
      <div className="mt-32"> {/* Add margin to account for fixed nav */}
        <h1 className="text-2xl font-bold">Welcome, Service Provider 🔧</h1>
        {/* Your service provider content here */}
      </div>
    </>
  );
};

export default ServiceProviderPage;
