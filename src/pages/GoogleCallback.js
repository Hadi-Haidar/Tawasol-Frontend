import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/LoadingSpinner';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check if there's an error from Google OAuth
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');
        
        if (error) {
          const decodedMessage = errorMessage ? decodeURIComponent(errorMessage) : 'Google authentication was cancelled or failed';
          setError(decodedMessage);
          setLoading(false);
          return;
        }

        // Check if we have a success response from our backend
        const success = searchParams.get('success');
        const token = searchParams.get('token');
        const userData = searchParams.get('user');

        if (success && token && userData) {
          // Handle direct callback with parameters from Laravel redirect
          try {
            const user = JSON.parse(decodeURIComponent(userData));
            
            // Add timestamp and store in localStorage
            const userWithTimestamp = { ...user, lastUpdated: Date.now() };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userWithTimestamp));// Navigate to user dashboard and let AuthContext pick up the data
        navigate('/user');
          } catch (parseError) {
            console.error('Failed to parse Google user data from URL:', parseError);
            setError('Failed to process authentication data');
          }
        } else {
          // Handle standard OAuth callback (fallback method)await handleGoogleCallback();
          navigate('/user');
        }
      } catch (err) {
        console.error('Google callback error:', err);
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [searchParams, handleGoogleCallback, navigate]);

  if (loading) {
    return <PageLoader message="Processing Google authentication..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleCallback; 