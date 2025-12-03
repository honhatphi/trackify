/**
 * @fileoverview Zustand store for Dashboard state management
 * Manages shuttles, tasks, and simulation controls
 */

import { create } from 'zustand';
import {
  getInitialShuttles,
  getInitialTasks,
  simulateWarehouseState,
} from '../services/mockData';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Simulation interval in milliseconds */
const SIMULATION_INTERVAL_MS = 200;

// =============================================================================
// STORE DEFINITION
// =============================================================================

/**
 * Dashboard store with state and actions
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<
 *   import('../types/index.js').DashboardState &
 *   import('../types/index.js').DashboardActions &
 *   { isSimulating: boolean; simulationIntervalId: number | null }
 * >>}
 */
export const useDashboardStore = create((set, get) => ({
  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Array of all shuttles in the warehouse */
  shuttles: getInitialShuttles(),

  /** Array of active tasks */
  tasks: getInitialTasks(),

  /** Currently selected shuttle (for detail panel) */
  selectedShuttle: null,

  /** Whether simulation is currently running */
  isSimulating: false,

  /** Reference to simulation interval (internal use) */
  simulationIntervalId: null,

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Start the warehouse simulation loop
   * Calls simulateWarehouseState every SIMULATION_INTERVAL_MS
   * to create continuous movement effect
   */
  startSimulation: () => {
    const { isSimulating } = get();

    // Prevent multiple intervals
    if (isSimulating) {
      console.warn('[Dashboard] Simulation already running');
      return;
    }

    console.log('[Dashboard] Starting simulation...');

    // Create interval that updates shuttle positions
    const intervalId = setInterval(() => {
      set((state) => ({
        shuttles: simulateWarehouseState(state.shuttles),
      }));
    }, SIMULATION_INTERVAL_MS);

    set({
      isSimulating: true,
      simulationIntervalId: intervalId,
    });
  },

  /**
   * Stop the warehouse simulation loop
   * Clears the interval and freezes shuttle positions
   */
  stopSimulation: () => {
    const { simulationIntervalId, isSimulating } = get();

    if (!isSimulating) {
      console.warn('[Dashboard] Simulation is not running');
      return;
    }

    console.log('[Dashboard] Stopping simulation...');

    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
    }

    set({
      isSimulating: false,
      simulationIntervalId: null,
    });
  },

  /**
   * Update shuttles array (for external data integration)
   * @param {import('../types/index.js').Shuttle[]} newShuttles - New shuttles data
   */
  updateShuttles: (newShuttles) => {
    set({ shuttles: newShuttles });
  },

  /**
   * Select a shuttle for the details panel
   * @param {import('../types/index.js').Shuttle | null} shuttle - Shuttle to select, or null to deselect
   */
  selectShuttle: (shuttle) => {
    set({ selectedShuttle: shuttle });
  },

  /**
   * Reset store to initial state
   * Stops simulation and resets all data
   */
  reset: () => {
    const { simulationIntervalId } = get();

    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
    }

    set({
      shuttles: getInitialShuttles(),
      tasks: getInitialTasks(),
      selectedShuttle: null,
      isSimulating: false,
      simulationIntervalId: null,
    });
  },

  /**
   * Update a task's status
   * @param {string} taskId - Task ID to update
   * @param {string} newStatus - New status ('pending', 'in_progress', 'completed', 'failed')
   */
  updateTaskStatus: (taskId, newStatus) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ),
    }));
  },

  /**
   * Start the next pending task for a shuttle (mark as in_progress)
   * Called when shuttle picks up cargo
   * @param {string} shuttleId - Shuttle ID that starts task
   * @returns {object|null} - The task that was started, or null if none
   */
  startNextTask: (shuttleId) => {
    const { tasks } = get();
    // Find the first pending task for this shuttle
    const taskToStart = tasks.find(
      (t) => t.shuttleId === shuttleId && t.status === 'pending'
    );

    if (taskToStart) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskToStart.id ? { ...task, status: 'in_progress' } : task
        ),
      }));
      console.log(`[Task] Started task ${taskToStart.id} for ${shuttleId}`);
      return taskToStart;
    }
    return null;
  },

  /**
   * Complete the current in_progress task for a shuttle
   * Called when shuttle finishes a delivery
   * @param {string} shuttleId - Shuttle ID that completed delivery
   */
  completeNextTask: (shuttleId) => {
    const { tasks } = get();
    // Find the first in_progress task for this shuttle
    const taskToComplete = tasks.find(
      (t) => t.shuttleId === shuttleId && t.status === 'in_progress'
    );

    if (taskToComplete) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskToComplete.id ? { ...task, status: 'completed' } : task
        ),
      }));
      console.log(`[Task] Completed task ${taskToComplete.id} for ${shuttleId}`);

      // Auto-generate a new task for this shuttle after completion
      const newTaskId = `TSK-${String(Date.now()).slice(-6)}`;
      const layer = shuttleId === 'SH-001' ? 1 : 4;
      const taskTypes = ['OUTBOUND', 'INBOUND', 'TRANSFER'];
      const randomType = taskTypes[Math.floor(Math.random() * taskTypes.length)];

      const newTask = {
        id: newTaskId,
        shuttleId: shuttleId,
        sourceBin: `B1-L${layer}-R${String(Math.floor(Math.random() * 24)).padStart(2, '0')}-D${Math.floor(Math.random() * 3)}`,
        targetBin: `B2-L${layer}-R${String(Math.floor(Math.random() * 24)).padStart(2, '0')}-D${Math.floor(Math.random() * 8)}`,
        type: randomType,
        status: 'pending',
        eta: `~${Math.floor(Math.random() * 10) + 2} min`,
      };

      set((state) => ({
        tasks: [...state.tasks, newTask],
      }));
      console.log(`[Task] Created new task ${newTaskId} for ${shuttleId}`);
    }
  },

  /**
   * Add a new task dynamically
   * @param {object} task - New task object
   */
  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
    }));
  },
}));

// =============================================================================
// SELECTORS (for performance optimization)
// =============================================================================

/**
 * Select only shuttles array (prevents re-render on other state changes)
 * @param {ReturnType<typeof useDashboardStore.getState>} state
 * @returns {import('../types/index.js').Shuttle[]}
 */
export const selectShuttles = (state) => state.shuttles;

/**
 * Select only tasks array
 * @param {ReturnType<typeof useDashboardStore.getState>} state
 * @returns {import('../types/index.js').Task[]}
 */
export const selectTasks = (state) => state.tasks;

/**
 * Select online shuttle count
 * @param {ReturnType<typeof useDashboardStore.getState>} state
 * @returns {number}
 */
export const selectOnlineCount = (state) =>
  state.shuttles.filter((s) => s.isOnline).length;

/**
 * Select error shuttle count
 * @param {ReturnType<typeof useDashboardStore.getState>} state
 * @returns {number}
 */
export const selectErrorCount = (state) =>
  state.shuttles.filter((s) => s.status === 'ERROR').length;

/**
 * Select active task count
 * @param {ReturnType<typeof useDashboardStore.getState>} state
 * @returns {number}
 */
export const selectActiveTaskCount = (state) => state.tasks.length;
