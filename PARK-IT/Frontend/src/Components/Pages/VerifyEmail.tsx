import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface LocationState {
  email?: string;
}

interface VerifyResponse {
  message: string;
  user?: {
    username: string;
    email: string;
    role: string;
  };
}

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [email] = useState(state?.email || '');
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Fetch CSRF token
    axios.get<{ csrfToken: string }>('http://localhost:8000/api/csrf/', { withCredentials: true })
      .then(response => {
        axios.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken;
      })
      .catch(err => {
        console.error('Failed to fetch CSRF token:', err);
        setErrorMessage('Failed to initialize. Please refresh the page.');
      });

    // Redirect if no email provided
    if (!email) {
      setErrorMessage('No email provided. Redirecting to registration...');
      setTimeout(() => navigate('/register'), 3000);
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!email || !code) {
      setErrorMessage('Please enter the verification code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post<VerifyResponse>(
        'http://localhost:8000/api/verify-email/',
        { email, code },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': axios.defaults.headers.common['X-CSRFToken']
          },
          withCredentials: true
        }
      );

      setSuccessMessage('Email verified successfully! Redirecting...');
      
      // Redirect based on user role
      const role = response.data.user?.role?.toLowerCase();
      setTimeout(() => {
        if (role === 'service provider') {
          navigate('/service-provider');
        } else if (role === 'driver') {
          navigate('/');
        } else {
          navigate('/');
        }
      }, 2000);

    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsResending(true);

    try {
      await axios.post(
        'http://localhost:8000/api/resend-verification/',
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': axios.defaults.headers.common['X-CSRFToken']
          },
          withCredentials: true
        }
      );

      setSuccessMessage('Verification code resent! Please check your email.');
    } catch (err: any) {
      console.error('Resend error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center mt-6 mb-6 px-4">
        <div className="p-6 w-full max-w-md bg-white rounded-lg">
          <h1 className="text-center text-3xl font-bold mb-4">ParkIt</h1>
          <hr />
        </div>
      </div>

      <div className="flex items-center justify-center px-4">
        <div className="p-6 w-full max-w-md bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-center">Verify Your Email</h2>
          <p className="text-gray-600 mb-6 text-center">
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </p>

          {errorMessage && (
            <div className="text-red-600 bg-red-100 p-3 rounded-md text-center mb-4">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="text-green-600 bg-green-100 p-3 rounded-md text-center mb-4">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-base font-medium text-neutral-900 mb-1">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-center text-2xl tracking-widest"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code from your email</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full bg-black text-white rounded-md px-4 py-2 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResendCode}
              disabled={isResending}
              className="text-blue-600 hover:text-blue-800 underline disabled:text-gray-400 disabled:no-underline"
            >
              {isResending ? 'Resending...' : 'Resend Code'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/register')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Registration
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default VerifyEmail;
