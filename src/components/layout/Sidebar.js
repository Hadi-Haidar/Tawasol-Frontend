import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// Note: Direct message unread count is now room-specific and shown in individual room contexts
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Bell,
  HelpCircle,
  Store, 
  Coins,
  CreditCard,
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { logout } = useAuth();
  const location = useLocation();


  const navigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
    { name: 'Rooms', href: '/user/rooms', icon: Users },
    { name: 'Posts', href: '/user/posts', icon: MessageSquare },
    { name: 'Store', href: '/user/store', icon: Store },
    { name: 'Coins', href: '/user/coins', icon: Coins },
    { name: 'Subscription & Payment', href: '/user/subscription-payment', icon: CreditCard },
    { name: 'Notifications', href: '/user/notifications', icon: Bell },
    { name: 'Profile', href: '/user/profile', icon: User },
    { name: 'Support', href: '/user/support', icon: HelpCircle },
  ];

  const isActive = (href) => {
    return location.pathname === href;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if there's an error
    }
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col fixed lg:sticky top-0 z-40 shadow-lg lg:shadow-none`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400 truncate">
            Tawasol
          </h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation - Scrollable with enhanced styling */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`inline-flex items-center space-x-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                active
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
               }`}
              title={isCollapsed ? item.name : ''}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && (
                <span className="truncate transition-opacity duration-200">
                  {item.name}
                </span>
              )}
              
              {/* Unread Badge */}
              {item.badge > 0 && (
                <div className={`${isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full`}>
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
              
              {/* Enhanced active indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-400 rounded-r-full"></div>
              )}
              
              {/* Enhanced tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {item.name}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Enhanced Logout Button - Always visible at bottom */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={handleLogout}
          className={`inline-flex items-center space-x-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 group relative`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && (
            <span className="transition-opacity duration-200">Logout</span>
          )}
          
          {/* Enhanced tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
              Logout
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 