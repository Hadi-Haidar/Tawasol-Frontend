import React, { useRef, useEffect } from 'react';

const RoomTabs = ({ tabs, activeTab, onTabChange, disabled = false, headerHeight = 64 }) => {
  const scrollContainerRef = useRef(null);
  const activeTabRef = useRef(null);

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
      window.scrollY !== scrollY && window.scrollTo(0, scrollY);
    });
  };

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = activeTabRef.current;

      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();

      // Check if element is outside viewport
      if (elementRect.left < containerRect.left || elementRect.right > containerRect.right) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  // Calculate sticky top position based on header height
  const stickyTop = headerHeight || (window.innerWidth >= 1024 ? 72 : 64);

  return (
    <div
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky z-10 shadow-sm"
      style={{ top: `${stickyTop}px` }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Desktop Tabs (≥1024px): Standard Horizontal with Underline */}
        <nav
          className="hidden lg:flex items-center px-4 md:px-6 lg:px-8"
          aria-label="Tabs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={(e) => handleTabClick(e, tab.id)}
                disabled={disabled}
                type="button"
                className={`
                  group relative px-6 py-4 text-sm font-medium
                  transition-all duration-200
                  ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
                aria-selected={isActive}
                role="tab"
              >
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="text-base transition-transform duration-200"
                    role="img"
                    aria-label={tab.name}
                  >
                    {tab.icon}
                  </span>
                  <span className="whitespace-nowrap">
                    {tab.name}
                  </span>
                </div>

                {/* Active indicator - Underline */}
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile Tabs (≤768px): Scrollable Pill Tabs with Snap */}
        <div
          ref={scrollContainerRef}
          className="lg:hidden overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <nav
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 min-w-max"
            aria-label="Tabs"
            style={{
              scrollSnapType: 'x mandatory'
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeTabRef : null}
                  onClick={(e) => handleTabClick(e, tab.id)}
                  disabled={disabled}
                  type="button"
                  className={`
                    group relative flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 min-h-[40px] sm:min-h-[44px] rounded-full text-xs sm:text-sm font-medium
                    transition-all duration-200 flex-shrink-0 touch-manipulation
                    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    ${isActive
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300'
                    }
                  `}
                  aria-selected={isActive}
                  role="tab"
                  style={{
                    scrollSnapAlign: 'start'
                  }}
                >
                  <span
                    className="text-sm sm:text-base transition-transform duration-200"
                    role="img"
                    aria-label={tab.name}
                  >
                    {tab.icon}
                  </span>
                  <span className="whitespace-nowrap text-[11px] sm:text-sm">
                    {tab.name}
                  </span>

                  {/* Active indicator - Subtle glow */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-sm -z-10" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default RoomTabs;
