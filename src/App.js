import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/ui/ToastContainer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import GoogleCallback from './pages/GoogleCallback';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import RoomsPage from './pages/RoomsPage';
import RoomPage from './pages/RoomPage';
import ManageRoomPage from './pages/ManageRoomPage';
import EditRoomPage from './pages/EditRoomPage';
import PostsPage from './pages/PostsPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPaymentPage from './pages/SubscriptionPaymentPage';
import CoinPage from './pages/CoinPage';
import CoinPurchasePage from './pages/CoinPurchasePage';
import CoinRewardsPage from './pages/CoinRewardsPage';
import CoinActivityPage from './pages/CoinActivityPage';
import CoinHistoryPage from './pages/CoinHistoryPage';
import StorePage from './pages/StorePage';
import SupportPage from './pages/SupportPage';
import NotificationsPage from './pages/NotificationsPage';

// Admin Components
import AdminLayout from './admin/components/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import UserManagement from './admin/pages/UserManagement';
import RoomManagement from './admin/pages/RoomManagement';
import ContentModeration from './admin/pages/ContentModeration';
import PaymentSubscriptions from './admin/pages/PaymentSubscriptions';
import Notifications from './admin/pages/Notifications';
import ActivityLogs from './admin/pages/ActivityLogs';
import SupportSystem from './admin/pages/SupportSystem';

import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <NotificationProvider>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<EmailVerificationPage />} />
                  <Route path="/auth/google/callback" element={<GoogleCallback />} />
                  
                  {/* Protected User Routes */}
                  <Route path="/user" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/user/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="rooms" element={<RoomsPage />} />
                    <Route path="rooms/:roomId" element={<RoomPage />} />
                    <Route path="rooms/:roomId/manage" element={<ManageRoomPage />} />
                    <Route path="rooms/:roomId/edit" element={<EditRoomPage />} />
                    <Route path="posts" element={<PostsPage />} />
                    <Route path="support" element={<SupportPage />} />
                    <Route path="store" element={<StorePage />} />
                    <Route path="subscription-payment" element={<SubscriptionPaymentPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="coins" element={<CoinPage />} />
                    <Route path="coins/purchase" element={<CoinPurchasePage />} />
                    <Route path="coins/rewards" element={<CoinRewardsPage />} />
                    <Route path="coins/activity" element={<CoinActivityPage />} />
                    <Route path="coins/history" element={<CoinHistoryPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                  </Route>

                  {/* Protected Admin Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="rooms" element={<RoomManagement />} />
                    <Route path="moderation" element={<ContentModeration />} />
                    <Route path="payments" element={<PaymentSubscriptions />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="logs" element={<ActivityLogs />} />
                    <Route path="support" element={<SupportSystem />} />
                  </Route>
                </Routes>
                
                {/* Toast Container */}
                <ToastContainer />
              </div>
            </NotificationProvider>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
