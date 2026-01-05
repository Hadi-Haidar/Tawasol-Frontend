import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle, XCircle, Moon, Sun, Mail, RefreshCw } from 'lucide-react';
import authService from '../services/authService';

const EmailVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Get email from location state (passed from signup page)
  const emailFromState = location.state?.email || '';
  
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('pending'); // 'pending', 'success', 'error'
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !code.trim()) {
      setStatus('error');
      setMessage('Please enter both email and verification code');
      return;
    }

    if (code.length !== 6) {
      setStatus('error');
      setMessage('Verification code must be 6 digits');
      return;
    }

    setIsSubmitting(true);
    setStatus('pending');
    setMessage('Verifying your email...');

    try {
      const response = await authService.verifyEmail(email, code);
      if (response.status === 'success') {
        setStatus('success');
        setMessage(response.message || 'Your email has been verified successfully!');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Email verified successfully! You can now log in.' 
            }
          });
        }, 2000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Email verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Email verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter your email address first');
      return;
    }

    setIsResending(true);
    setMessage('Sending new verification code...');

    try {
      const response = await authService.resendVerificationCode(email);
      if (response.status === 'success') {
        setStatus('pending');
        setMessage('A new verification code has been sent to your email');
        setCode(''); // Clear the code input
      } else {
        setStatus('error');
        setMessage(response.message || 'Failed to resend verification code');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    if (status === 'success') {
      return <CheckCircle className="text-green-600 dark:text-green-400" size={48} />;
    } else if (status === 'error') {
      return <XCircle className="text-red-600 dark:text-red-400" size={48} />;
    } else {
      return <Mail className="text-blue-600 dark:text-blue-400" size={48} />;
    }
  };

  const getStatusTitle = () => {
    if (status === 'success') {
      return 'Email Verified!';
    } else if (status === 'error') {
      return 'Verification Failed';
    } else {
      return 'Verify Your Email';
    }
  };

  const getStatusColor = () => {
    if (status === 'success') {
      return 'text-green-600 dark:text-green-400';
    } else if (status === 'error') {
      return 'text-red-600 dark:text-red-400';
    } else {
      return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              Tawasol
            </Link>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Verification Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {getStatusIcon()}
              </div>
              
              <h2 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
                {getStatusTitle()}
              </h2>
              
              {status !== 'success' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="code"
                      value={code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                        if (value.length <= 6) {
                          setCode(value);
                        }
                      }}
                      placeholder="Enter 6-digit code"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-lg tracking-widest font-mono"
                      maxLength="6"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || code.length !== 6}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>
              )}
              
              {message && (
                <p className={`mt-4 text-sm ${status === 'error' ? 'text-red-600 dark:text-red-400' : status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {message}
                </p>
              )}
              
              {status !== 'success' && (
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleResendCode}
                    disabled={isResending || !email.trim()}
                    className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} className={isResending ? 'animate-spin' : ''} />
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                  
                  <div className="text-center">
                    <Link
                      to="/signup"
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Back to Sign Up
                    </Link>
                    <span className="mx-2 text-gray-400">|</span>
                    <Link
                      to="/login"
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              )}
              
              {status === 'success' && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Redirecting to login page...
                  </p>
                  <Link
                    to="/login"
                    className="btn-primary inline-block"
                  >
                    Continue to Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage; 