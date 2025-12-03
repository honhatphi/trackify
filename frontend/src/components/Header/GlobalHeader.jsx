/**
 * @fileoverview Global Header Component
 * Implements the persistent header per 03_functional_requirements.md section 3.0
 *
 * Structure:
 * ┌─────────────────────────────────────────────────────────────────────────────────┐
 * │  [Logo] Trackify          │ Dashboard │ Devices │ Orders │ Analytics │ Inventory │
 * │  ASRS Warehouse Monitoring │                                                     │
 * ├─────────────────────────────────────────────────────────────────────────────────┤
 * │                           │ 🟢 Healthy │ 184/hr │ 3 Alarms │ 14:32 │ 🌙 │ 👤    │
 * └─────────────────────────────────────────────────────────────────────────────────┘
 */

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Cpu,
  ClipboardList,
  BarChart3,
  Package,
  Bell,
  Moon,
  Sun,
  User,
  Activity,
  Gauge,
  AlertTriangle,
  Grid3X3,
  Truck,
} from 'lucide-react';
import {
  useDashboardStore,
  selectOnlineCount,
  selectShuttles,
} from '@/store/useDashboardStore';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Navigation tabs per functional requirements */
const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'devices', label: 'Devices', icon: Cpu },
  { id: 'orders', label: 'Orders & History', icon: ClipboardList },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'inventory', label: 'Inventory', icon: Package },
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Branding Area (Left)
 * Logo + Project Name + Subtitle
 */
const BrandingArea = () => (
  <div className="flex items-center gap-3 group cursor-pointer">
    {/* Logo - Minimalist grid/shuttle icon */}
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600
                    shadow-md shadow-primary/25 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/30
                    group-hover:scale-105">
      <Grid3X3 size={22} className="text-white" />
    </div>
    <div>
      <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
        Trackify
      </h1>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        ASRS Warehouse Monitoring
      </p>
    </div>
  </div>
);

/**
 * Main Navigation Tabs (Center)
 */
const NavigationTabs = ({ activeTab, onTabChange }) => (
  <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 dark:bg-gray-800/50 p-1 rounded-xl">
    {NAV_TABS.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;

      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-300 min-h-[40px] active-press
            ${isActive
              ? 'bg-white dark:bg-gray-700 text-primary shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/50'
            }
          `}
        >
          <Icon size={18} className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
          <span className="hidden lg:inline">{tab.label}</span>
        </button>
      );
    })}
  </nav>
);

/**
 * Shuttles Online Indicator
 */
const ShuttlesIndicator = () => {
  const onlineCount = useDashboardStore(selectOnlineCount);
  const shuttles = useDashboardStore(selectShuttles);
  const allOnline = onlineCount === shuttles.length && shuttles.length > 0;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
                    ${allOnline
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700'
                      : 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700'
                    }`}>
      <Truck size={16} className={allOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} />
      <span className={`text-sm font-bold ${allOnline ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
        {onlineCount}/{shuttles.length}
      </span>
    </div>
  );
};

/**
 * System Status Indicators (Right)
 * Health, Throughput, Active Alarms
 */
const StatusIndicators = ({ health, throughput, alarms }) => (
  <div className="hidden sm:flex items-center gap-3">
    {/* Shuttles Online */}
    <ShuttlesIndicator />
    {/* System Health */}
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg
                    transition-all duration-200 cursor-default border
                    ${
                      health === 'healthy'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700'
                        : health === 'warning'
                        ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700'
                        : 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700'
                    }`}>
      <div className={`relative w-2.5 h-2.5 rounded-full transition-all duration-300 ${
        health === 'healthy'
          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
          : health === 'warning'
          ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
          : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
      }`} />
      <span className={`text-sm font-bold ${
        health === 'healthy' ? 'text-emerald-700 dark:text-emerald-300' :
        health === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'
      }`}>
        {health === 'healthy' ? 'Healthy' : health === 'warning' ? 'Warning' : 'Critical'}
      </span>
    </div>

    {/* Throughput */}
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                    bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700
                    text-blue-700 dark:text-blue-300 transition-all duration-200
                    hover:bg-blue-200/80 dark:hover:bg-blue-800/50 cursor-default">
      <Gauge size={16} className="text-blue-600 dark:text-blue-400" />
      <span className="text-sm font-mono font-bold">{throughput}</span>
      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">pallets/hr</span>
    </div>

    {/* Active Alarms */}
    <button className={`
      flex items-center gap-1.5 px-3 py-1.5 rounded-lg min-h-[36px] border
      transition-all duration-200 hover-lift active-press
      ${alarms > 0
        ? 'bg-red-600 text-white border-red-700 shadow-md shadow-red-500/30 hover:bg-red-700'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
      }
    `}>
      <AlertTriangle size={16} className={alarms > 0 ? 'animate-pulse' : ''} />
      <span className="text-sm font-bold">{alarms} Alarms</span>
    </button>
  </div>
);

/**
 * Real-time Digital Clock
 */
const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex flex-col items-end px-3 py-1 rounded-lg
                    bg-gray-100/80 dark:bg-gray-800/50 transition-colors duration-200">
      <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
        {time.toLocaleTimeString('en-US', { hour12: false })}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
    </div>
  );
};

/**
 * Theme Toggle Button
 */
const ThemeToggle = ({ isDark, onToggle }) => (
  <button
    onClick={onToggle}
    className="relative flex items-center justify-center w-10 h-10 rounded-xl
               text-gray-600 hover:bg-gray-100 bg-gray-100/80
               dark:text-yellow-400 dark:hover:bg-gray-700 dark:bg-gray-800/50
               transition-all duration-300 min-h-[40px] overflow-hidden
               hover:scale-105 active:scale-95"
    aria-label="Toggle theme"
  >
    <span className={`absolute transition-all duration-500 ${isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`}>
      <Sun size={20} />
    </span>
    <span className={`absolute transition-all duration-500 ${isDark ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}>
      <Moon size={20} />
    </span>
  </button>
);

/**
 * User Profile Menu
 */
const UserProfile = () => (
  <button className="flex items-center gap-2 px-3 py-2 rounded-xl
                     text-gray-600 hover:bg-gray-100 bg-gray-100/80
                     dark:text-gray-300 dark:hover:bg-gray-700 dark:bg-gray-800/50
                     transition-all duration-200 min-h-[40px]
                     hover:scale-105 active:scale-95">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600
                    flex items-center justify-center shadow-md shadow-primary/25">
      <User size={16} className="text-white" />
    </div>
    <span className="hidden xl:inline text-sm font-semibold text-gray-700 dark:text-gray-200">Operator</span>
  </button>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Global Header Component
 * Persistent navigation and status bar across all pages
 *
 * @param {Object} props
 * @param {string} props.activeTab - Current active navigation tab
 * @param {function} props.onTabChange - Callback when tab changes
 * @param {Object} props.systemStatus - System status data
 */
export const GlobalHeader = ({
  activeTab = 'dashboard',
  onTabChange = () => {},
  systemStatus = { health: 'healthy', throughput: 184, alarms: 0 },
}) => {
  // Initialize dark mode from localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem('trackify-theme');
    if (stored) {
      return stored === 'dark';
    }
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme on mount and when changed
  useEffect(() => {
    // Add transition class for smooth theme change
    document.documentElement.classList.add('theme-transition');

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('trackify-theme', isDarkMode ? 'dark' : 'light');

    // Remove transition class after animation completes
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 350);

    return () => clearTimeout(timer);
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 animate-slide-in-down">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
                      border-b border-gray-200/50 dark:border-gray-700/50
                      shadow-sm dark:shadow-gray-900/50
                      transition-all duration-300" />

      {/* Content */}
      <div className="relative h-full max-w-[1920px] mx-auto px-4 flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <BrandingArea />

        {/* Center: Navigation */}
        <NavigationTabs activeTab={activeTab} onTabChange={onTabChange} />

        {/* Right: Status + Utilities */}
        <div className="flex items-center gap-2">
          <StatusIndicators
            health={systemStatus.health}
            throughput={systemStatus.throughput}
            alarms={systemStatus.alarms}
          />

          <div className="hidden md:block w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <DigitalClock />
          <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
          <UserProfile />
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;
