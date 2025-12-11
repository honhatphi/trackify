/**
 * @fileoverview Intelligent Task Generator
 * Generates realistic warehouse tasks based on inventory state
 * - INBOUND: Store items in optimal empty locations
 * - OUTBOUND: Pick items from accessible locations
 * - TRANSFER: Move items between blocks for optimization
 */

import {
  findOptimalStorageLocation,
  findOptimalPickLocation,
  findNextOccupiedSlot,
} from './inventoryManager';
import { WAREHOUSE_CONFIG } from './mockData';

const { AISLE } = WAREHOUSE_CONFIG;

/**
 * Parse cellId to extract position components
 * @param {string} cellId - Cell ID like "B1-L2-R05-D1"
 * @returns {{block: number, layer: number, row: number, depth: number} | null}
 */
export const parseCellId = (cellId) => {
  if (!cellId) return null;
  const match = cellId.match(/B(\d+)-L(\d+)-R(\d+)-D(\d+)/);
  if (!match) return null;
  return {
    block: parseInt(match[1]),
    layer: parseInt(match[2]),
    row: parseInt(match[3]),
    depth: parseInt(match[4]),
  };
};

/**
 * Calculate distance between two positions (rows only, same layer)
 * @param {number} fromRow - Starting row
 * @param {number} toRow - Target row
 * @returns {number} - Distance in rows
 */
export const calculateDistance = (fromRow, toRow) => {
  return Math.abs(toRow - fromRow);
};

/**
 * Generate a new task based on current inventory state
 * @param {Map} inventory - Current inventory state
 * @param {string} shuttleId - Shuttle ID to assign task to
 * @param {number} shuttleLayer - Layer the shuttle operates on (1-7)
 * @returns {object | null} - Generated task or null if no valid task
 */
export const generateIntelligentTask = (inventory, shuttleId, shuttleLayer) => {
  // Determine task type based on inventory state and randomness
  const taskType = selectTaskType(inventory);

  const taskId = `TSK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  switch (taskType) {
    case 'INBOUND':
      return generateInboundTask(taskId, shuttleId, shuttleLayer, inventory);
    case 'OUTBOUND':
      return generateOutboundTask(taskId, shuttleId, shuttleLayer, inventory);
    case 'TRANSFER':
      return generateTransferTask(taskId, shuttleId, shuttleLayer, inventory);
    default:
      return null;
  }
};

/**
 * Select task type based on warehouse state
 * - If warehouse is < 30% full, prioritize INBOUND
 * - If warehouse is > 80% full, prioritize OUTBOUND
 * - Otherwise, balanced mix
 * @param {Map} inventory - Current inventory state
 * @returns {'INBOUND' | 'OUTBOUND' | 'TRANSFER'}
 */
const selectTaskType = (inventory) => {
  let occupied = 0;
  let total = 0;

  inventory.forEach((cell) => {
    total++;
    if (cell.occupied) occupied++;
  });

  const utilizationRate = total > 0 ? (occupied / total) : 0;

  if (utilizationRate < 0.3) {
    // Low inventory - mostly INBOUND
    const rand = Math.random();
    if (rand < 0.7) return 'INBOUND';
    if (rand < 0.9) return 'TRANSFER';
    return 'OUTBOUND';
  } else if (utilizationRate > 0.8) {
    // High inventory - mostly OUTBOUND
    const rand = Math.random();
    if (rand < 0.7) return 'OUTBOUND';
    if (rand < 0.9) return 'TRANSFER';
    return 'INBOUND';
  } else {
    // Balanced
    const rand = Math.random();
    if (rand < 0.4) return 'INBOUND';
    if (rand < 0.8) return 'OUTBOUND';
    return 'TRANSFER';
  }
};

/**
 * Generate INBOUND task (receiving goods from external source, storing in warehouse)
 * Source: Elevator position (aisle at row 14)
 * Target: Optimal empty slot (must be frontmost accessible position - LIFO compliant)
 */
const generateInboundTask = (taskId, shuttleId, shuttleLayer, inventory) => {
  // Find optimal storage location
  const targetLocation = findOptimalStorageLocation(inventory);

  if (!targetLocation) {
    console.warn('[TaskGen] No empty slots available for INBOUND');
    return null;
  }

  // Source is the aisle position at elevator row (shuttle picks up from external source)
  // Shuttle is in aisle, not inside rack
  const sourceBin = `AISLE-L${shuttleLayer}-R14`;

  const eta = calculateETA(14, targetLocation.row);

  console.log(`[TaskGen] INBOUND task: ${sourceBin} → ${targetLocation.cellId} (Block ${targetLocation.block}, Row ${targetLocation.row})`);

  return {
    id: taskId,
    shuttleId,
    sourceBin,
    targetBin: targetLocation.cellId,
    type: 'INBOUND',
    status: 'pending',
    eta,
  };
};

/**
 * Generate OUTBOUND task (removing goods from warehouse to external destination)
 * Source: Occupied slot (must be frontmost accessible - LIFO compliant)
 * Target: Aisle position at elevator (for shipping out)
 */
const generateOutboundTask = (taskId, shuttleId, shuttleLayer, inventory) => {
  // Find item to pick (findOptimalPickLocation already returns frontmost occupied)
  const sourceLocation = findOptimalPickLocation(inventory);

  if (!sourceLocation) {
    console.warn('[TaskGen] No occupied slots available for OUTBOUND');
    return null;
  }

  // Target is aisle position at elevator (shuttle delivers to external)
  const targetBin = `AISLE-L${shuttleLayer}-R14`;

  const eta = calculateETA(sourceLocation.row, 14);

  console.log(`[TaskGen] OUTBOUND task: ${sourceLocation.cellId} → ${targetBin} (Row ${sourceLocation.row} → Elevator)`);

  return {
    id: taskId,
    shuttleId,
    sourceBin: sourceLocation.cellId,
    targetBin,
    type: 'OUTBOUND',
    status: 'pending',
    eta,
  };
};

/**
 * Generate TRANSFER task (moving goods between locations for optimization)
 * Source: Occupied slot
 * Target: Empty slot (could be different block for load balancing)
 */
const generateTransferTask = (taskId, shuttleId, shuttleLayer, inventory) => {
  // Find source - prefer Block 2 (more items)
  const sourceLocation = findOptimalPickLocation(inventory, 2) || findOptimalPickLocation(inventory, 1);

  if (!sourceLocation) {
    console.warn('[TaskGen] No source available for TRANSFER');
    return null;
  }

  // Find target in different block if possible
  const preferredTargetBlock = sourceLocation.block === 1 ? 2 : 1;
  const targetLocation = findOptimalStorageLocation(inventory, preferredTargetBlock) ||
                         findOptimalStorageLocation(inventory);

  if (!targetLocation) {
    console.warn('[TaskGen] No target available for TRANSFER');
    return null;
  }

  const eta = calculateETA(sourceLocation.row, targetLocation.row);

  return {
    id: taskId,
    shuttleId,
    sourceBin: sourceLocation.cellId,
    targetBin: targetLocation.cellId,
    type: 'TRANSFER',
    status: 'pending',
    eta,
  };
};

/**
 * Calculate estimated time of arrival based on distance
 * @param {number} fromRow - Starting row
 * @param {number} toRow - Target row
 * @returns {string} - ETA string like "~3 min"
 */
const calculateETA = (fromRow, toRow) => {
  const distance = Math.abs(toRow - fromRow);
  // Assume ~10 seconds per row + 1 minute for pickup/dropoff
  const seconds = distance * 10 + 60;
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes} min`;
};

/**
 * Generate initial set of tasks for system startup
 * @param {Map} inventory - Current inventory state
 * @param {Array} shuttles - Array of shuttles with their assigned layers
 * @returns {Array} - Array of initial tasks
 */
export const generateInitialTasks = (inventory, shuttles) => {
  const tasks = [];

  shuttles.forEach((shuttle) => {
    // Generate 2 tasks per shuttle initially
    for (let i = 0; i < 2; i++) {
      const task = generateIntelligentTask(inventory, shuttle.id, shuttle.z);
      if (task) {
        tasks.push(task);
      }
    }
  });

  return tasks;
};

/**
 * Check if a new task should be generated (to maintain task queue)
 * @param {Array} tasks - Current tasks for a shuttle
 * @returns {boolean}
 */
export const shouldGenerateNewTask = (tasks) => {
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  // Maintain at least 1 pending task per shuttle
  return pendingTasks.length < 2;
};
