import React from 'react';

const RoomTabs = ({ tabs, activeTab, onTabChange, disabled = false }) => {
  const handleTabClick = (e, tabId) => {
    if (disabled || tabId === activeTab) return;
    
    // Prevent default to avoid any scroll behavior
    e.preventDefault();
    
    // Store scroll position before tab change
    const scrollY = window.scrollY;
    
    // Change tab
    onTabChange(tabId);
    
    // Restore scroll position immediately to prevent jump
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 md:space-x-6 lg:space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={(e) => handleTabClick(e, tab.id)}
                disabled={disabled}
                type="button"
                className={`
                  group relative min-w-0 overflow-hidden py-3 sm:py-4 px-3 sm:px-4 md:px-6 text-center text-xs sm:text-sm font-medium 
                  transition-all duration-200 flex-shrink-0 touch-manipulation
                  ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                `}
                aria-selected={isActive}
                role="tab"
              >
                <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
                  <span 
                    className={`text-base sm:text-lg transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`}
                    role="img" 
                    aria-label={tab.name}
                  >
                    {tab.icon}
                  </span>
                  <span className="hidden sm:inline whitespace-nowrap font-medium">
                    {tab.name}
                  </span>
                </div>
                
                {/* Active indicator - Thicker underline */}
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
                
                {/* Active background highlight */}
                {isActive && (
                  <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg -z-10" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default RoomTabs;
