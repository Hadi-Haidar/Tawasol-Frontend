import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ShoppingCartIcon,
  HeartIcon,
  TrashIcon,
  CurrencyDollarIcon,
  GiftIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const getToastIcon = (type, message) => {
    // Custom icons based on message content
    if (message.includes('cart') || message.includes('Cart')) {
      return <ShoppingCartIcon className="w-5 h-5" />;
    }
    if (message.includes('favorite') || message.includes('Favorite')) {
      return <HeartIcon className="w-5 h-5" />;
    }
    if (message.includes('deleted') || message.includes('removed')) {
      return <TrashIcon className="w-5 h-5" />;
    }
    
    // Coin and reward specific icons
    if (message.includes('coins') || message.includes('earned') || message.includes('reward') || message.includes('bonus')) {
      if (message.includes('Daily login') || message.includes('daily login')) {
        return <CalendarDaysIcon className="w-5 h-5" />;
      }
      if (message.includes('Welcome') || message.includes('welcome') || message.includes('bonus')) {
        return <GiftIcon className="w-5 h-5" />;
      }
      if (message.includes('Activity') || message.includes('activity')) {
        return <ClockIcon className="w-5 h-5" />;
      }
      // Default coin icon for other coin-related messages
      return <CurrencyDollarIcon className="w-5 h-5" />;
    }

    // Default icons by type
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'info':
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  const getToastStyles = (type, message) => {
    // Special styling for coin rewards
    if (message && (message.includes('coins') || message.includes('earned') || message.includes('reward') || message.includes('bonus'))) {
      return {
        container: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/20 dark:to-amber-900/20 dark:border-yellow-800 shadow-lg',
        icon: 'text-yellow-600 dark:text-yellow-400',
        text: 'text-yellow-900 dark:text-yellow-100 font-medium',
        closeButton: 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
      };
    }

    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          text: 'text-green-800 dark:text-green-200',
          closeButton: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          text: 'text-red-800 dark:text-red-200',
          closeButton: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          text: 'text-yellow-800 dark:text-yellow-200',
          closeButton: 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          text: 'text-blue-800 dark:text-blue-200',
          closeButton: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
        };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type, toast.message);
        return (
          <div
            key={toast.id}
            className={`
              ${styles.container}
              border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out
              transform translate-x-0 opacity-100 animate-slideInRight
              ${toast.message && (toast.message.includes('coins') || toast.message.includes('earned') || toast.message.includes('reward') || toast.message.includes('bonus')) ? 'animate-coinShimmer' : ''}
            `}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${styles.icon}`}>
                {getToastIcon(toast.type, toast.message)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${styles.text}`}>
                  {toast.message}
                </p>
              </div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className={`
                  flex-shrink-0 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5 
                  transition-colors duration-200 ${styles.closeButton}
                `}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-[${toast.duration}ms] ease-linear w-0 animate-progressBar ${
                  toast.type === 'success' ? 'bg-green-500' :
                  toast.type === 'error' ? 'bg-red-500' :
                  toast.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                style={{
                  animation: `progressBar ${toast.duration}ms linear forwards`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer; 