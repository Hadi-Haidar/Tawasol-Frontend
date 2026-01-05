import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Crown, 
  Star, 
  Award, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy
} from 'lucide-react';
import subscriptionService from '../services/subscriptionService';
import { PageLoader, InlineLoader } from '../components/ui/LoadingSpinner';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';

const SubscriptionPaymentPage = () => {
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('subscription');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    phone_no: '',
    currency: 'USD',
    payment_method: 'wishmoney',
    transaction_id: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [qrError, setQrError] = useState(null);

  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    try {
      setPageLoading(true);
      await Promise.all([
        fetchSubscriptionData(),
        fetchPaymentHistory(),
        fetchSubscriptionHistory(),
        fetchPricing()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchSubscriptionData = async () => {
    try {
      const response = await subscriptionService.getBalance();
      if (response.success) {
        setSubscriptionData(response);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await subscriptionService.payment.getHistory();
      if (response.success) {
        setPaymentHistory(response.payments);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const fetchSubscriptionHistory = async () => {
    try {
      const response = await subscriptionService.getTransactions();
      if (response.success) {
        setSubscriptionHistory(response.subscriptions);
      }
    } catch (error) {
      console.error('Error fetching subscription history:', error);
    }
  };

  const fetchPricing = async () => {
    try {
      const response = await subscriptionService.getPricing();
      if (response.success) {
        setPricing(response.pricing);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const fetchQrCode = async () => {
    try {setQrError(null);
      const response = await subscriptionService.payment.getQrCode();if (response.success) {setQrData(response.data);
      } else {
        console.error('QR code response not successful:', response);
        setQrError('QR code data not available');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setQrError(error.message || 'Failed to load QR code information');
      setMessage({ type: 'error', text: 'Failed to load QR code information' });
    }
  };

  const handleUpgradeSubscription = async (level) => {
    setLoading(true);
    try {
      const response = await subscriptionService.upgrade(level);
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message });
        
        // Refresh subscription data
        fetchSubscriptionData();
        fetchSubscriptionHistory();
        
        // Use the updated user data from the subscription response (more efficient!)
        if (response.updated_user) {updateUser(response.updated_user);} else {
          // Fallback to manual refresh if backend doesn't include user data
          try {
            const freshUserData = await authService.refreshProfile();updateUser(freshUserData);
          } catch (refreshError) {}
        }
        
        // Notify dashboard and other components about subscription update
        window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
          detail: {
            newLevel: level,
            userData: response.updated_user
          }
        }));}
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to upgrade subscription' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await subscriptionService.payment.create(paymentForm);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Payment request created successfully!' });
        setPaymentForm({
          amount: '',
          phone_no: '',
          currency: 'USD',
          payment_method: 'wishmoney',
          transaction_id: ''
        });
        setShowPaymentForm(false);
        fetchPaymentHistory();
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create payment request' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPayment = async (paymentId) => {
    setLoading(true);
    try {
      const response = await subscriptionService.payment.cancel(paymentId);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Payment cancelled successfully' });
        fetchPaymentHistory();
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to cancel payment' 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
  };

  const getSubscriptionIcon = (level) => {
    switch (level) {
      case 'bronze': return <Award className="w-6 h-6 text-orange-600" />;
      case 'silver': return <Star className="w-6 h-6 text-gray-500" />;
      case 'gold': return <Crown className="w-6 h-6 text-yellow-500" />;
      default: return <Award className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-gray-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const startPaymentProcess = () => {
    setShowPaymentForm(true);
    fetchQrCode();
  };

  // Show page loader while loading initial data
  if (pageLoading) {
    return <PageLoader message="Loading subscription and payment data..." />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Subscription & Payment
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscription and payment methods
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'subscription', label: 'Subscription', icon: Crown },
              { id: 'payment', label: 'Add Balance', icon: CreditCard },
              { id: 'history', label: 'History', icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-8">
          {/* Current Subscription Status */}
          {subscriptionData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Current Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getSubscriptionIcon(subscriptionData.subscription_level)}
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                    {subscriptionData.subscription_level} Plan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Plan</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    ${subscriptionData.balance}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Account Balance</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {subscriptionData.coins}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Coins</p>
                </div>
              </div>
              
              {subscriptionData.active_subscription && (
                <div className={`mt-6 p-4 rounded-lg border ${
                  subscriptionData.active_subscription.level === 'gold'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    subscriptionData.active_subscription.level === 'gold'
                      ? 'text-yellow-900 dark:text-yellow-400'
                      : 'text-blue-900 dark:text-blue-400'
                  }`}>
                    Active Subscription
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className={`${
                        subscriptionData.active_subscription.level === 'gold'
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}>Level:</span>
                      <span className="ml-2 font-medium capitalize">
                        {subscriptionData.active_subscription.level}
                      </span>
                    </div>
                    <div>
                      <span className={`${
                        subscriptionData.active_subscription.level === 'gold'
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}>Expires:</span>
                      <span className="ml-2 font-medium">
                        {subscriptionData.active_subscription.end_date}
                      </span>
                    </div>
                    <div>
                      <span className={`${
                        subscriptionData.active_subscription.level === 'gold'
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}>Days Left:</span>
                      <span className="ml-2 font-medium">
                        {subscriptionData.active_subscription.days_remaining}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subscription Plans */}
          {pricing && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Upgrade Your Plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(pricing).map(([level, details]) => (
                  <div
                    key={level}
                    className={`border rounded-lg p-6 ${
                      level === 'gold'
                        ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700'
                        : level === 'silver'
                        ? 'border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
                        : 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="flex justify-center mb-4">
                        {getSubscriptionIcon(level)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize mb-2">
                        {level}
                      </h3>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        ${details.price}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>
                      </div>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                        {details.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {level !== 'bronze' && (
                        <button
                          onClick={() => handleUpgradeSubscription(level)}
                          disabled={loading || subscriptionData?.subscription_level === level}
                          className={`w-full py-2 px-4 rounded-lg font-medium ${
                            subscriptionData?.subscription_level === level
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : level === 'gold'
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                              : 'bg-gray-500 hover:bg-gray-600 text-white'
                          } transition-colors duration-200`}
                        >
                          {loading ? (
                            <InlineLoader />
                          ) : subscriptionData?.subscription_level === level ? (
                            'Current Plan'
                          ) : (
                            `Upgrade to ${level}`
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-8">
          {!showPaymentForm ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
              <CreditCard className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Add Balance to Your Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add funds to your account to upgrade subscriptions and make purchases
              </p>
              <button
                onClick={startPaymentProcess}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Start Payment Process
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Form */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Payment Information
                </h2>
                <form onSubmit={handlePaymentFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (USD)
                    </label>
                    <select
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Amount</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(amount => (
                        <option key={amount} value={amount}>${amount}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={paymentForm.phone_no}
                      onChange={(e) => setPaymentForm({...paymentForm, phone_no: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={paymentForm.currency}
                      onChange={(e) => setPaymentForm({...paymentForm, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="wishmoney">Wish Money</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={paymentForm.transaction_id}
                      onChange={(e) => setPaymentForm({...paymentForm, transaction_id: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter transaction ID after payment"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <InlineLoader />
                      ) : (
                        'Submit Payment'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              {/* QR Code and Wish Number */}
              {qrData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Payment Details
                  </h2>
                  
                  {/* QR Code */}
                  {qrData.qr_image_url ? (
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Scan QR Code
                      </h3>
                      <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                        {}
                        <img 
                          src={qrData.qr_image_url} 
                          alt="Payment QR Code"
                          className="w-48 h-48 mx-auto"
                          onError={(e) => {
                            console.error('QR Code Image failed to load:', e);
                            console.error('Image src was:', e.target.src);
                          }}
                          onLoad={() => {}}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Scan QR Code
                      </h3>
                      <div className="inline-block p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {qrError ? (
                          <div className="text-red-600 dark:text-red-400">
                            <p className="mb-2">QR Code Error: {qrError}</p>
                            <p className="text-sm">Please contact admin to upload a QR code</p>
                          </div>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400">
                            <p>QR Code not available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Wish Number */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Or Use Wish Number
                    </h3>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={qrData.wish_number}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => copyToClipboard(qrData.wish_number)}
                        className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">
                      Payment Instructions
                    </h4>
                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                      <li>1. Scan the QR code or use the Wish number</li>
                      <li>2. Send the payment amount</li>
                      <li>3. Copy the transaction ID from your payment</li>
                      <li>4. Enter the transaction ID in the form</li>
                      <li>5. Submit the payment request</li>
                    </ol>
                    {qrData.description && (
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                        {qrData.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-8">
          {/* Payment History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Payment History
            </h2>
            {paymentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Transaction ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Reject Reason</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {getStatusIcon(payment.payment_status)}
                            <span className={`ml-2 capitalize ${
                              payment.payment_status === 'completed' ? 'text-green-600 dark:text-green-400' :
                              payment.payment_status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {payment.payment_status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          ${payment.amount} {payment.currency}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono">
                          {payment.transaction_id}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {payment.payment_status === 'rejected' && payment.reject_reason ? (
                            <div className="max-w-xs">
                              <span className="text-red-600 dark:text-red-400 text-sm">
                                {payment.reject_reason}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {payment.payment_status === 'pending' && (
                            <button
                              onClick={() => handleCancelPayment(payment.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No payment history found
              </p>
            )}
          </div>

          {/* Subscription History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Subscription History
            </h2>
            {subscriptionHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Plan</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Start Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">End Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Days Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionHistory.map((subscription) => (
                      <tr key={subscription.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {getSubscriptionIcon(subscription.level)}
                            <span className="ml-2 capitalize font-medium text-gray-900 dark:text-white">
                              {subscription.level}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {subscription.start_date}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {subscription.end_date}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            subscription.is_active 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                          }`}>
                            {subscription.is_active ? 'Active' : 'Expired'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {subscription.days_remaining > 0 ? subscription.days_remaining : 0} days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No subscription history found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPaymentPage; 