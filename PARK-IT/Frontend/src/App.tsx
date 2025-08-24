import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Nav from './Components/Nav/Nav';
import Index from './Components/Pages/Index';
import Login from './Components/Pages/Login';
import UserForm from './Components/Pages/UserForm';
import Unauthorized from './Components/Pages/Unauthorized';
//import AdminDashboard from './Components/Pages/AdminDashboard';
import ServiceProviderPage from './Components/SpPages/Index';
import PrivateRoute from './Components/Auth/PrivateRoute';

const AppContent = () => {
  const location = useLocation();

  // Hide Nav on /login and /userform
  const hideNav = ['/login', '/userform'].includes(location.pathname.toLowerCase());

  return (
    <>
      {!hideNav && <Nav />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/userform" element={<UserForm />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Role-Based Private Routes 
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        /> */}
        <Route
          path="/service-provider"
          element={
            <PrivateRoute allowedRoles={['service provider']}>
              <ServiceProviderPage />
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
