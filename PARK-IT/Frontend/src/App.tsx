import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Nav from './Components/Nav/Nav';
import SpNav from './Components/SpNav/SpNav';
import AdminDashboard from './Components/Pages/AdminDashboard';
import Index from './Components/Pages/Index';
import Login from './Components/Pages/Login';
import UserForm from './Components/Pages/UserForm';
import Unauthorized from './Components/Pages/Unauthorized';
import PrivateRoute from './Components/Auth/PrivateRoute';
import AdminNav from './Components/AdminNav/AdminNav';
import ServiceProviderPage from './Components/SpPages/Index';
import Add from './Components/SpPages/Add';
import Spterminals from './Components/SpTerminal/Spterminals';
const AppContent = () => {
  const location = useLocation();

  // Hide Nav on /login and /userform
  const hideNav = ['/login', '/userform'].includes(location.pathname.toLowerCase());
  // Check for service provider or admin routes
  const isServiceProviderRoute = ['/service-provider','/add' , '/spterminal'].includes(location.pathname.toLocaleLowerCase());
  const isAdminRoute = location.pathname.toLowerCase() === '/admin';

  return (
    <>
      {!hideNav && (
        isServiceProviderRoute ? <SpNav /> :
        isAdminRoute ? <AdminNav /> : <Nav /> // Replace with AdminNav if created
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/userform" element={<UserForm />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Role-Based Private Routes */}
        <Route
    path="/"
    element={
      <PrivateRoute allowedRoles={['driver']}>
        <Index />
      </PrivateRoute>
    }
  />
  <Route
    path="/admin"
    element={
      <PrivateRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </PrivateRoute>
    }
  />
  <Route
    path="/service-provider"
    element={
      <PrivateRoute allowedRoles={['service provider']}>
        <ServiceProviderPage />
      </PrivateRoute>
    }
  />

<Route
    path="/add"
    element={
      <PrivateRoute allowedRoles={['service provider']}>
        <Add/>
      </PrivateRoute>
    }
  />

<Route
    path="/spterminal"
    element={
      <PrivateRoute allowedRoles={['service provider']}>
        <Spterminals/>
      </PrivateRoute>
    }
  />

</Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;