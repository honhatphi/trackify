/**
 * @fileoverview Main App component for Trackify ASRS Dashboard
 * Entry point that renders the Dashboard with 3D visualization
 */

import DashboardPage from './features/dashboard/DashboardPage';

/**
 * Main App component
 * Renders the DashboardPage which auto-starts the shuttle simulation
 */
function App() {
  return <DashboardPage />;
}

export default App;
