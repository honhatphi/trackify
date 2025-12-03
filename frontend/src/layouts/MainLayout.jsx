/**
 * @fileoverview Main Layout Component
 * Provides consistent layout structure across all pages
 * Implements glassmorphism and spacing per 06_ui_ux_design_system.md
 */

import { GlobalHeader } from '@/components/Header';

/**
 * MainLayout Component
 * Wraps pages with consistent header and layout structure
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.activeTab - Current active navigation tab
 * @param {function} props.onTabChange - Callback when tab changes
 * @param {Object} props.systemStatus - System status for header indicators
 */
export const MainLayout = ({
  children,
  activeTab = 'dashboard',
  onTabChange = () => {},
  systemStatus = { health: 'healthy', throughput: 184, alarms: 0 },
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Global Header - Fixed at top */}
      <GlobalHeader
        activeTab={activeTab}
        onTabChange={onTabChange}
        systemStatus={systemStatus}
      />

      {/* Main Content - With top padding for fixed header */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
