import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, 
  ArrowLeft, 
  DollarSign, 
  Wallet,
  CheckCircle,
  AlertCircle,
  Crown,
  ShoppingCart,
  CreditCard,
  Loader2
} from 'lucide-react';
import { coinService } from '../services/coinService';
import { PageLoader } from '../components/ui/LoadingSpinner';

const CoinPurchasePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseOptions, setPurchaseOptions] = useState([]);
  const [usdBalance, setUsdBalance] = useState(0);
  const [currentCoins, setCurrentCoins] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);

  useEffect(() => {
    loadPurchaseData();
  }, []);

  const loadPurchaseData = async () => {
    try {
      setLoading(true);
      const [purchaseData, balanceData] = await Promise.all([
        coinService.getPurchaseOptions(),
        coinService.getBalance()
      ]);

      if (purchaseData.success) {
        setPurchaseOptions(purchaseData.data.purchase_options);
        setUsdBalance(purchaseData.data.current_balance_usd);
      }

      if (balanceData.success) {
        setCurrentCoins(balanceData.data.current_balance);
      }
    } catch (error) {
      console.error('Error loading purchase data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setPurchasing(true);
      const result = await coinService.purchaseCoins(selectedPackage.amount_usd);
      
      if (result.success) {
        setPurchaseResult(result);
        setCurrentCoins(result.data.new_coin_balance);
        setUsdBalance(result.data.new_usd_balance);
        setShowConfirmation(false);
        
        // Show success for 3 seconds then redirect
        setTimeout(() => {
          navigate('/user/coins');
        }, 3000);
      }
    } catch (error) {
      setPurchaseResult({
        success: false,
        message: error.message || 'Purchase failed'
      });
    } finally {
      setPurchasing(false);
    }
  };

  const getPackageIcon = (amount) => {
    return <Crown className="text-purple-600" size={32} />;
  };

  const getPackageGradient = (amount) => {
    return 'from-purple-500 to-pink-500';
  };

  const getBestValueBadge = (amount) => {
    if (amount === 1100) return 'Best Value';
    if (amount === 100) return 'Popular';
    return null;
  };

  if (loading) {
    return <PageLoader message="Loading purchase options..." />;
  }

  if (purchaseResult?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-white" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Purchase Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {purchaseResult.message}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Coins className="text-green-600 dark:text-green-400" size={24} />
              <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                +{purchaseResult.data?.coins_purchased}
              </span>
            </div>
            <p className="text-green-600 dark:text-green-400 text-sm">coins added to your wallet</p>
          </div>

          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Redirecting to your wallet...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (purchaseResult && !purchaseResult.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-white" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Purchase Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {purchaseResult.message}
            </p>
          </div>
          
          <button
            onClick={() => setPurchaseResult(null)}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/user/coins')}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 mr-4"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Buy Coins</h1>
            <p className="text-gray-600 dark:text-gray-400">Convert your USD balance to coins</p>
          </div>
        </div>

        {/* Balance Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">USD Balance</h3>
                <div className="flex items-center space-x-2">
                  <DollarSign className="text-green-500" size={20} />
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">${usdBalance}</span>
                </div>
              </div>
              <Wallet className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Current Coins</h3>
                <div className="flex items-center space-x-2">
                  <Coins className="text-purple-500" size={20} />
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{currentCoins.toLocaleString()}</span>
                </div>
              </div>
              <Coins className="text-purple-500" size={32} />
            </div>
          </div>
        </div>

        {/* Purchase Packages - Google Play Style */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Choose your package</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchaseOptions.map((option) => {
              const isSelected = selectedPackage?.amount_usd === option.amount_usd;
              const badge = getBestValueBadge(option.coins);
              const canAfford = usdBalance >= option.amount_usd;
              
              return (
                <div
                  key={option.amount_usd}
                  onClick={() => canAfford && setSelectedPackage(option)}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg transition-all duration-300 cursor-pointer border-2 ${
                    isSelected
                      ? 'border-purple-500 shadow-2xl scale-105'
                      : canAfford
                      ? 'border-transparent hover:border-purple-300 hover:shadow-xl hover:scale-102'
                      : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Best Value Badge */}
                  {badge && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                        {badge}
                      </span>
                    </div>
                  )}

                  {/* Package Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${getPackageGradient(option.coins)} rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
                    {getPackageIcon(option.coins)}
                  </div>

                  {/* Package Details */}
                  <div className="text-center">
                    <div className="mb-3">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {option.coins.toLocaleString()}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400 text-sm">coins</div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <DollarSign size={16} className="text-green-500" />
                        <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                          {option.amount_usd}
                        </span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        {Math.round(option.coins / option.amount_usd)} coins per $1
                      </div>
                    </div>

                    {!canAfford && (
                      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm py-2 px-3 rounded-lg">
                        Insufficient USD balance
                      </div>
                    )}

                    {canAfford && isSelected && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm py-2 px-3 rounded-lg">
                        Selected
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Purchase Button */}
        {selectedPackage && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Summary</h3>
                <p className="text-gray-600 dark:text-gray-400">Review your purchase details</p>
              </div>
              <ShoppingCart className="text-purple-500" size={24} />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Coins to receive:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedPackage.coins.toLocaleString()} coins
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${selectedPackage.amount_usd}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Remaining USD balance:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${(usdBalance - selectedPackage.amount_usd).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmation(true)}
              disabled={purchasing}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {purchasing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  <span>Purchase {selectedPackage.coins.toLocaleString()} Coins</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Purchase</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You're about to purchase {selectedPackage.coins.toLocaleString()} coins for ${selectedPackage.amount_usd}
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50"
              >
                {purchasing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinPurchasePage; 