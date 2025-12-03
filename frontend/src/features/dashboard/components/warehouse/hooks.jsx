/**
 * @fileoverview Shared hooks and context for warehouse simulation
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useDashboardStore } from '../../../../store/useDashboardStore';

// =============================================================================
// SIMULATION CONTEXT - Shared state for warehouse operations
// =============================================================================

const SimulationContext = createContext(null);

/**
 * Simulation state manager for coordinated warehouse operations
 * Manages: Conveyor → Elevator → Shuttle → Storage workflow
 */
const useSimulationState = () => {
  const [state, setState] = useState({
    // Elevator state
    elevator: {
      currentY: 0,
      targetLayer: 1,  // Layer 1 (1-based)
      isMoving: false,
      hasCargo: false,
      cargoId: null,
    },
    // Conveyor state
    conveyor: {
      beltOffset: 0,
      hasCargo: true,  // Start with cargo on conveyor
      cargoPosition: -0.5, // Position along conveyor (-0.5 to 0.5)
      isMoving: true,
    },
    // Pending cargo to be picked up by shuttle
    pendingCargo: null, // { layer, position }
    // Cargo counter for unique IDs
    cargoCounter: 0,
    // Track last target layer for round-robin distribution
    lastTargetLayer: 4, // Start with 4 so first cargo goes to layer 1
    // Track completed deliveries for task sync
    completedDeliveries: [],
  });

  return [state, setState];
};

export const SimulationProvider = ({ children }) => {
  const simulationState = useSimulationState();
  return (
    <SimulationContext.Provider value={simulationState}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
};

/**
 * Hook to check if simulation is running (from dashboard store)
 * Used by 3D components to pause/resume animations
 */
export const useIsSimulating = () => {
  return useDashboardStore((state) => state.isSimulating);
};

// =============================================================================
// DARK MODE HOOK
// =============================================================================

/**
 * Custom hook to detect dark mode
 */
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return isDark;
};
