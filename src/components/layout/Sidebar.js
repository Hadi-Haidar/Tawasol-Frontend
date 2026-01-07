import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  ChevronRight,
  X
} from 'lucide-react';

/**
 * Sidebar Component
 * Desktop: Fixed collapsible sidebar (240px → 72px)
 * Mobile: Hidden off-canvas drawer
 */
const Sidebar = ({ isCollapsed, onToggleCollapse, isOpen, onClose, isMobile }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const sidebarRef = useRef(null);

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

  const isActive = (href) => location.pathname === href;

  // Handle navigation click - close mobile drawer
  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Focus trap for accessibility (mobile only)
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const focusableElements = sidebar.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    sidebar.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => sidebar.removeEventListener('keydown', handleTab);
  }, [isMobile, isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, isOpen, onClose]);

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <aside
        className={`fixed top-0 left-0 h-screen-dvh bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out flex flex-col z-40 ${
          isCollapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {!isCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">
              Tawasol
            </h1>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-auto"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar min-h-0" role="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                aria-current={active ? 'page' : undefined}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                
                {/* Active indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 dark:bg-primary-400 rounded-r-full" />
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="group relative flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
            
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                Logout
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
              </div>
            )}
          </button>
        </div>
      </aside>
    );
  }

  // Mobile Drawer
  return (
    <aside
      ref={sidebarRef}
      className="fixed top-0 left-0 h-screen-dvh w-[85vw] max-w-[320px] bg-white dark:bg-gray-800 shadow-2xl flex flex-col z-50 transition-transform duration-250 ease-in-out rounded-r-2xl overflow-hidden"
      style={{
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}
      aria-label="Main navigation"
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 bg-clip-text text-transparent">
          Tawasol
        </h1>
        {/* Optional: Add close button for extra clarity */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors touch-manipulation"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar min-h-0" role="navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 touch-manipulation ${
                active
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={21} className="flex-shrink-0" />
              <span className="truncate">{item.name}</span>
              
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-9 bg-primary-600 dark:bg-primary-400 rounded-r-full shadow-sm" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <button
          onClick={handleLogout}
          className="relative flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[15px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-all duration-200 touch-manipulation"
        >
          <LogOut size={21} className="flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
