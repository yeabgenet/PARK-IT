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
import AddSpot from './Components/AddSpot/Addspot';
import TerminalSpotsPage from './Components/SpPages/TerminalSpotsPage';

const AppContent = () => {
  const location = useLocation();

  // Hide Nav on /login and /userform
  const hideNav = ['/login', '/userform'].includes(location.pathname.toLowerCase());
  
  // Check for service provider routes (startsWith instead of exact match)
  const isServiceProviderRoute = 
    location.pathname.toLowerCase().startsWith('/service-provider') ||
    location.pathname.toLowerCase().startsWith('/add') ||
    location.pathname.toLowerCase().startsWith('/spterminal') ||
    location.pathname.toLowerCase().startsWith('/addspot') ||
    location.pathname.toLowerCase().startsWith('/spots') ||
    location.pathname.toLowerCase().startsWith('/terminal/') ||
    location.pathname.toLowerCase().startsWith('/parkingspotspage');
  
  const isAdminRoute = location.pathname.toLowerCase() === '/admin';

  return (
    <>
      {!hideNav && (
        isServiceProviderRoute ? <SpNav /> :
        isAdminRoute ? <AdminNav /> : <Nav />
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
        <Route
          path="/addspot"
          element={
            <PrivateRoute allowedRoles={['service provider']}>
              <AddSpot/>
            </PrivateRoute>
          }
        />
        <Route
          path="/terminal/:terminalId/spots"
          element={
            <PrivateRoute allowedRoles={['service provider']}>
              <TerminalSpotsPage />
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