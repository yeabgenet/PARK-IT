import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-4">Welcome, System Administrator! Manage the PARK-IT system from here.</p>
      <div className="space-y-4">
        <Link to="/admin/users" className="block text-blue-600 hover:underline">Manage Users</Link>
        <Link to="/admin/parking-lots" className="block text-blue-600 hover:underline">Manage Parking Lots</Link>
        <Link to="/logout" className="block text-blue-600 hover:underline">Logout</Link>
      </div>
    </div>
  );
};

export default AdminDashboard;