import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  EyeSlashIcon,
  GlobeAltIcon,
  LockClosedIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { storeApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const VisibilityToggle = ({ product, onVisibilityChange, userCoins }) => {
  const toast = useToast();
  const [isChanging, setIsChanging] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState(null);
  const [showPrivateConfirmModal, setShowPrivateConfirmModal] = useState(false);

  // Add useEffect to ensure modal state is properly managed
  useEffect(() => {}, [showConfirmModal, showPrivateConfirmModal, pendingVisibility]);

  // Add useEffect to handle escape key closing modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showConfirmModal) {
          cancelVisibilityChange();
        } else if (showPrivateConfirmModal) {
          cancelPrivateChange();
        }
      }
    };

    if (showConfirmModal || showPrivateConfirmModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmModal, showPrivateConfirmModal]);

  const handleToggleVisibility = async (newVisibility) => {
    // Always log the action for debugging// If changing from private to public, ALWAYS show confirmation modal
    if (product.visibility === 'private' && newVisibility === 'public') {// Set the pending visibility first
      setPendingVisibility(newVisibility);
      
      // Show modal immediately
      setShowConfirmModal(true);
      
   
      return;
    }

    // If changing from public to private, ask for confirmation
    if (product.visibility === 'public' && newVisibility === 'private') {setPendingVisibility(newVisibility);
      setShowPrivateConfirmModal(true);
      return;
    }

    // Direct change for other cases
    await performVisibilityChange(newVisibility);
  };

  const performVisibilityChange = async (visibility) => {
    setIsChanging(true);
    try {
      const response = await storeApi.toggleProductVisibility(product.id, visibility);
      
      // Update the product in parent component
      if (onVisibilityChange) {
        onVisibilityChange(product.id, response.product);
      }
      
      toast.showSuccess(response.message);
      
      // Close both modals if open
      setShowConfirmModal(false);
      setShowPrivateConfirmModal(false);
      setPendingVisibility(null);
    } catch (error) {
      console.error('Error changing visibility:', error);
      toast.showError(error.message || 'Failed to change product visibility');
    } finally {
      setIsChanging(false);
    }
  };

  const confirmVisibilityChange = () => {
    if (pendingVisibility) {
      performVisibilityChange(pendingVisibility);
    }
  };

  const cancelVisibilityChange = () => {
    setShowConfirmModal(false);
    setShowPrivateConfirmModal(false);
    setPendingVisibility(null);
  };

  const confirmPrivateChange = () => {
    if (pendingVisibility === 'private') {
      performVisibilityChange('private');
    }
  };

  const cancelPrivateChange = () => {
    setShowPrivateConfirmModal(false);
    setPendingVisibility(null);
  };

  return (
    <>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Visibility:
          </span>
          {/* Status Indicator - moved to right */}
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            product.visibility === 'public'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {product.visibility === 'public' ? (
              <>
                <EyeIcon className="w-3 h-3 mr-1" />
                Store
              </>
            ) : (
              <>
                <EyeSlashIcon className="w-3 h-3 mr-1" />
                Room Only
              </>
            )}
          </div>
        </div>
        
        {/* Compact toggle buttons */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-1 w-fit">
          {/* Private Button */}
          <button
            onClick={() => handleToggleVisibility('private')}
            disabled={isChanging || product.visibility === 'private'}
            className={`flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
              product.visibility === 'private'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <LockClosedIcon className="w-3 h-3 mr-1" />
            Private
          </button>
          
          {/* Public Button */}
          <button
            onClick={() => {handleToggleVisibility('public');
            }}
            disabled={isChanging || product.visibility === 'public'}
            data-testid="visibility-public-button"
            data-product-id={product.id}
            className={`flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
              product.visibility === 'public'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <GlobeAltIcon className="w-3 h-3 mr-1" />
            Public
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              cancelVisibilityChange();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Make Product Public
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Making this product public will cost you <strong>20 coins</strong> and make it visible in the global store for all users to see and purchase.
              </p>
              
              {/* Show warning if insufficient coins */}
              {userCoins < 20 ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                    <div>
                      <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                        Insufficient coins! You need {20 - userCoins} more coins.
                      </p>
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                        Current balance: {userCoins} coins
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-blue-500 mr-2" />
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                        Cost: 20 coins
                      </p>
                      <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                        Your balance: {userCoins} coins → After: {userCoins - 20} coins
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelVisibilityChange}
                disabled={isChanging}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmVisibilityChange}
                disabled={isChanging || userCoins < 20}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChanging ? 'Processing...' : userCoins < 20 ? 'Insufficient Coins' : 'Make Public'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Private Confirmation Modal */}
      {showPrivateConfirmModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              cancelPrivateChange();
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Make Product Private
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Are you sure you want to make this product private? It will no longer be visible in the global store and only room members will be able to see and purchase it.
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2" />
                  <div>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm font-medium">
                      This action is free but will reduce your product's visibility
                    </p>
                    <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                      You can make it public again later for 20 coins
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelPrivateChange}
                disabled={isChanging}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPrivateChange}
                disabled={isChanging}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChanging ? 'Processing...' : 'Make Private'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VisibilityToggle; 