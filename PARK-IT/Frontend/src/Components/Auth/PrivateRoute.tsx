import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

interface PrivateRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

interface UserResponse {
  user: {
    username: string;
    role: string | null;
  };
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles, children }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await axios.get<UserResponse>('http://localhost:8000/api/user/', {
          withCredentials: true,
        });
        const userRole = response.data.user?.role?.toLowerCase();
        setIsAuthorized(userRole ? allowedRoles.includes(userRole) : false);
      } catch (err) {
        console.error('Error checking user role:', err);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserRole();
  }, [allowedRoles]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;