import React from 'react';

const RoomTabs = ({ tabs, activeTab, onTabChange, disabled = false }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !disabled && onTabChange(tab.id)}
              disabled={disabled}
              className={`
                group relative min-w-0 overflow-hidden py-4 px-1 text-center text-sm font-medium 
                hover:text-gray-700 dark:hover:text-gray-300 focus:z-10 transition-colors duration-200
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg" role="img" aria-label={tab.name}>
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.name}</span>
              </div>
              
              {/* Active indicator line */}
              {activeTab === tab.id && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default RoomTabs; 