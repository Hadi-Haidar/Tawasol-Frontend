import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * RootLayout - Main layout wrapper for internal pages
 * Provides consistent structure across all internal pages
 * Use this for pages that need a simple layout without sidebars
 */
const RootLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;

