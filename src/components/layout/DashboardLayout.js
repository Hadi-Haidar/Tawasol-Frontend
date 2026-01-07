import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

/**
 * DashboardLayout Component
 * Responsive layout with sidebar navigation
 * Desktop: Fixed collapsible sidebar
 * Mobile: Off-canvas drawer with backdrop
 */
const DashboardLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Close mobile menu when switching to desktop
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileMenuOpen]);

  // Toggle sidebar collapse (desktop)
  const handleToggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  // Toggle mobile menu
  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Close mobile menu
  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Swipe gesture handlers
  const onTouchStart = useCallback((e) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, [isMobile]);

  const onTouchMove = useCallback((e) => {
    if (!isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  }, [isMobile]);

  const onTouchEnd = useCallback(() => {
    if (!isMobile || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Swipe left to close (only if menu is open and swipe starts from drawer area)
    if (isLeftSwipe && isMobileMenuOpen && touchStart < 320) {
      handleCloseMobileMenu();
    }
    
    // Swipe right to open (only if swipe starts from left edge)
    if (isRightSwipe && !isMobileMenuOpen && touchStart < 30) {
      handleToggleMobileMenu();
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [isMobile, touchStart, touchEnd, isMobileMenuOpen, handleCloseMobileMenu, handleToggleMobileMenu]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div 
      className="h-screen-dvh bg-gray-50 dark:bg-gray-900 flex overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          isMobile={false}
        />
      )}

      {/* Mobile Drawer Backdrop */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 h-screen-dvh bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-250 ease-in-out animate-fadeIn"
          onClick={handleCloseMobileMenu}
          aria-hidden="true"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={handleCloseMobileMenu}
          isMobile={true}
        />
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col h-screen-dvh transition-all duration-300 ease-in-out ${
          !isMobile ? (isSidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]') : ''
        }`}
      >
        {/* Top Navigation */}
        <TopNavbar
          onMobileMenuToggle={handleToggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
          isMobile={isMobile}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
