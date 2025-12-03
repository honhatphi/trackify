/**
 * @fileoverview Type definitions for Trackify ASRS Dashboard
 * Using JSDoc for IDE autocompletion and type checking
 */

// =============================================================================
// SHUTTLE TYPES
// =============================================================================

/**
 * Shuttle status enum values
 * @typedef {'IDLE' | 'MOVING' | 'ERROR'} ShuttleStatus
 */

/**
 * Represents a 4-way shuttle in the ASRS system
 * @typedef {Object} Shuttle
 * @property {string} id - Unique identifier for the shuttle (e.g., 'SHT-001')
 * @property {number} x - X coordinate in the warehouse grid (column)
 * @property {number} y - Y coordinate in the warehouse grid (row)
 * @property {number} z - Z coordinate (layer/floor level, 0-indexed)
 * @property {number} battery - Battery level percentage (0-100)
 * @property {ShuttleStatus} status - Current operational status
 * @property {boolean} isOnline - Whether the shuttle is connected to the system
 */

// =============================================================================
// TASK TYPES
// =============================================================================

/**
 * Task type enum values
 * @typedef {'INBOUND' | 'OUTBOUND'} TaskType
 */

/**
 * Represents a warehouse task (move operation)
 * @typedef {Object} Task
 * @property {string} id - Unique identifier for the task (e.g., 'TSK-001')
 * @property {string} shuttleId - ID of the shuttle assigned to this task
 * @property {string} sourceBin - Source bin location (e.g., 'A-01-03')
 * @property {string} targetBin - Target bin location (e.g., 'B-05-02')
 * @property {TaskType} type - Type of task (INBOUND = storage, OUTBOUND = retrieval)
 */

// =============================================================================
// DASHBOARD STATE TYPES
// =============================================================================

/**
 * Dashboard store state
 * @typedef {Object} DashboardState
 * @property {Shuttle[]} shuttles - Array of all shuttles in the system
 * @property {Task[]} tasks - Array of active tasks
 * @property {Shuttle | null} selectedShuttle - Currently selected shuttle for details view
 */

/**
 * Dashboard store actions
 * @typedef {Object} DashboardActions
 * @property {() => void} startSimulation - Start the warehouse simulation loop
 * @property {() => void} stopSimulation - Stop the warehouse simulation loop
 * @property {(shuttles: Shuttle[]) => void} updateShuttles - Update shuttles state
 * @property {(shuttle: Shuttle | null) => void} selectShuttle - Select a shuttle for details
 */

// Export empty object to make this a module
export {};
