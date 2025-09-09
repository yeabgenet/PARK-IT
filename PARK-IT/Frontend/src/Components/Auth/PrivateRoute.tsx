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
    is_superuser?: boolean; // Make this optional
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
        const isSuperuser = response.data.user?.is_superuser || false;
        
        // Check if user is admin (either by role or is_superuser)
        const isAdmin = isSuperuser || userRole === 'admin';
        
        let isRoleAllowed = false;
        
        if (allowedRoles.includes('admin')) {
          isRoleAllowed = isAdmin;
        } else if (allowedRoles.includes('driver')) {
          // For driver access, check if user is a driver OR if no specific role is set
          isRoleAllowed = userRole === 'driver' || userRole === null || userRole === undefined;
        } else {
          // For other roles (service provider)
          isRoleAllowed = userRole ? allowedRoles.includes(userRole) : false;
        }
        
        setIsAuthorized(isRoleAllowed);
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