import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// In Login.tsx, update the interface
interface LoginResponse {
  message: string;
  user?: {
    username: string;
    first_name: string;
    last_name: string;
    role: string | null;
    is_superuser?: boolean; // Add this optional property
  };
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get<{ csrfToken: string }>('http://localhost:8000/api/csrf/', { withCredentials: true })
      .then(response => {
        axios.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken;
        console.log('CSRF token fetched:', response.data.csrfToken);
      })
      .catch(err => {
        console.error('Failed to fetch CSRF token:', err.message, err.response?.status, err.response?.data);
        setError('Failed to fetch CSRF token. Please refresh and try again.');
      });
  }, []);

  // In Login.tsx, modify the handleSubmit function
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const payload = {
      username,
      password: String(password)
    };
    console.log('Sending login request with:', payload);
    const response = await axios.post<LoginResponse>('http://localhost:8000/api/login/', payload, {
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': axios.defaults.headers.common['X-CSRFToken'] },
      withCredentials: true
    });
    console.log('Login response:', response.data);
    if (response.data.message === 'Login successful' && response.data.user) {
      // Redirect based on user role
      const userRole = response.data.user.role;
      const isSuperuser = response.data.user.is_superuser || false;
      
      console.log('User role:', userRole, 'Is superuser:', isSuperuser);
      
      if (isSuperuser || userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'service provider') {
        navigate('/service-provider');
      } else {
        // For drivers and any other roles, go to the main page (driver dashboard)
        navigate('/');
      }
    } else {
      setError(response.data.message || 'Login failed');
    }
  } catch (err: any) {
    console.error('Login error:', err.response?.status, err.response?.data, err.message);
    setError(err.response?.data?.message || 'An error occurred. Please check your credentials and try again.');
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md p-6 sm:p-10 md:p-16 lg:pt-20 lg:pb-20 lg:pl-24 lg:pr-24 rounded-3xl border border-gray-300 shadow-xl bg-white relative">
        <div className="flex items-center mb-4 relative">
          <img src="./images/logo.png" alt="logo" className="h-20 sm:h-24 absolute left-0" />
          <h1 className="text-2xl font-extrabold ml-24 z-10">PARK IT</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="username">
              Username
            </label>
            <input
              className="w-full border rounded py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="password">
              Password
            </label>
            <input
              className="w-full border rounded py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex items-center justify-between mb-4">
            <button
              className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-full transition duration-300"
              type="submit"
            >
              Log in
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          <ul className="space-y-2 text-sm text-neutral-900">
            <li>
              <Link to="/userform" className="hover:underline">
                Create account
              </Link>
            </li>
            <li>
              <Link to="" className="hover:underline">
                Forgot Password?
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;