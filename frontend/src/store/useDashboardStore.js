/**
 * @fileoverview Zustand store for Dashboard state management
 * Manages shuttles, tasks, inventory, and simulation controls with real-time updates
 */

import { create } from 'zustand';
import {
  getInitialShuttles,
  simulateWarehouseState,
} from '../services/mockData';
import {
  initializeInventory,
  storePallet,
  removePallet,
  transferPallet,
  getInventoryStats,
  getBlockStats,
} from '../services/inventoryManager';
import {
  generateIntelligentTask,
  generateInitialTasks,
  shouldGenerateNewTask,
} from '../services/taskGenerator';

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
  tasks: [],

  /** Inventory state - Map of cellId to cell data */
  inventory: new Map(),

  /** Inventory version - incremented on each change to trigger re-renders */
  inventoryVersion: 0,

  /** Inventory statistics (cached for performance) */
  inventoryStats: { total: 0, occupied: 0, empty: 0, utilizationRate: 0 },

  /** Currently selected shuttle (for detail panel) */
  selectedShuttle: null,

  /** Whether simulation is currently running */
  isSimulating: false,

  /** Reference to simulation interval (internal use) */
  simulationIntervalId: null,

  /** Initialization flag */
  isInitialized: false,

  // ===========================================================================
  // ACTIONS
  // ===========================================================================

  /**
   * Initialize the warehouse system with inventory and tasks
   */
  initializeWarehouse: () => {
    const { isInitialized } = get();
    if (isInitialized) {
      console.warn('[Dashboard] Warehouse already initialized');
      return;
    }

    console.log('[Dashboard] Initializing warehouse...');

    // Initialize inventory
    const inventory = initializeInventory();
    const inventoryStats = getInventoryStats(inventory);

    // Generate initial tasks based on inventory
    const shuttles = getInitialShuttles();
    const tasks = generateInitialTasks(inventory, shuttles);

    set({
      inventory,
      inventoryStats,
      tasks,
      shuttles,
      isInitialized: true,
      inventoryVersion: 1,
    });

    console.log('[Dashboard] Warehouse initialized:', {
      inventoryStats,
      tasksGenerated: tasks.length,
    });
  },

  /**
   * Update inventory statistics (call after inventory changes)
   */
  updateInventoryStats: () => {
    const { inventory } = get();
    const inventoryStats = getInventoryStats(inventory);
    set({ inventoryStats });
  },

  /**
   * Start the warehouse simulation loop
   * Calls simulateWarehouseState every SIMULATION_INTERVAL_MS
   * to create continuous movement effect with intelligent task handling
   */
  startSimulation: () => {
    const { isSimulating } = get();

    // Prevent multiple intervals
    if (isSimulating) {
      console.warn('[Dashboard] Simulation already running');
      return;
    }

    console.log('[Dashboard] Starting simulation...');

    // Create interval that updates shuttle positions with task-driven logic
    const intervalId = setInterval(() => {
      const { tasks, shuttles, startNextTask, completeNextTask } = get();

      set((state) => ({
        shuttles: simulateWarehouseState(
          state.shuttles,
          state.tasks,
          startNextTask,
          completeNextTask
        ),
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

    const inventory = initializeInventory();
    const inventoryStats = getInventoryStats(inventory);
    const shuttles = getInitialShuttles();
    const tasks = generateInitialTasks(inventory, shuttles);

    set({
      shuttles,
      tasks,
      inventory,
      inventoryStats,
      selectedShuttle: null,
      isSimulating: false,
      simulationIntervalId: null,
      isInitialized: true,
      inventoryVersion: 1,
    });

    console.log('[Dashboard] Reset complete');
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
   * Updates inventory based on task type
   * @param {string} shuttleId - Shuttle ID that completed delivery
   */
  completeNextTask: (shuttleId) => {
    const { tasks, inventory, shuttles } = get();

    // Find the first in_progress task for this shuttle
    const taskToComplete = tasks.find(
      (t) => t.shuttleId === shuttleId && t.status === 'in_progress'
    );

    if (!taskToComplete) return;

    // Clone inventory Map to ensure React detects changes
    const newInventory = new Map(inventory);
    let inventoryUpdated = false;

    switch (taskToComplete.type) {
      case 'INBOUND':
        // Store pallet at target location (source is AISLE, doesn't affect inventory)
        inventoryUpdated = storePallet(newInventory, taskToComplete.targetBin);
        break;
      case 'OUTBOUND':
        // Remove pallet from source location (target is AISLE, doesn't affect inventory)
        const removedPallet = removePallet(newInventory, taskToComplete.sourceBin);
        inventoryUpdated = removedPallet !== null;
        break;
      case 'TRANSFER':
        // Move pallet from source to target (both are rack positions)
        inventoryUpdated = transferPallet(newInventory, taskToComplete.sourceBin, taskToComplete.targetBin);
        break;
    }

    // Mark task as completed and update inventory
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskToComplete.id ? { ...task, status: 'completed' } : task
      ),
      inventory: inventoryUpdated ? newInventory : state.inventory,
      inventoryVersion: inventoryUpdated ? state.inventoryVersion + 1 : state.inventoryVersion,
    }));

    // Update stats
    get().updateInventoryStats();

    console.log(`[Task] Completed task ${taskToComplete.id} (${taskToComplete.type}) for ${shuttleId}`);

    // Generate new task if needed (use updated inventory)
    const shuttle = shuttles.find(s => s.id === shuttleId);
    if (shuttle) {
      const shuttleTasks = tasks.filter(t => t.shuttleId === shuttleId);
      if (shouldGenerateNewTask(shuttleTasks)) {
        const currentInventory = inventoryUpdated ? newInventory : inventory;
        const newTask = generateIntelligentTask(currentInventory, shuttleId, shuttle.z);
        if (newTask) {
          set((state) => ({
            tasks: [...state.tasks, newTask],
          }));
          console.log(`[Task] Created new task ${newTask.id} (${newTask.type}) for ${shuttleId}`);
        }
      }
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
