/**
 * @fileoverview Warehouse Inventory Management System
 * Handles real-time inventory state with logical LIFO storage patterns
 * - Block 1: Storage from back to front (depth 2 -> 1 -> 0)
 * - Block 2: Storage from front to back (depth 0 -> 1 -> ... -> 7)
 * - Real-time updates when tasks complete
 */

import { WAREHOUSE_CONFIG } from './mockData';

const { BLOCK1, BLOCK2 } = WAREHOUSE_CONFIG;

/**
 * Initialize inventory with realistic fill patterns
 * Items are stored LIFO - from innermost to outermost positions
 * @returns {Map<string, {occupied: boolean, palletId: string | null, block: number, layer: number, row: number, depth: number}>}
 */
export const initializeInventory = () => {
  const inventory = new Map();

  // Block 1: Fill from back (depth 2) towards aisle (depth 0) - LIFO storage
  for (let layer = 1; layer <= BLOCK1.LAYERS; layer++) {
    for (let row = 0; row < BLOCK1.ROWS; row++) {
      // Skip elevator row
      if (row === BLOCK1.ELEVATOR_ROW) continue;

      // Random fill level for this row (0-3 items)
      const fillLevel = Math.floor(Math.random() * 4);

      for (let depth = 0; depth <= 2; depth++) {
        const cellId = `B1-L${layer}-R${row.toString().padStart(2, '0')}-D${depth}`;
        // Fill from back: depth 2 fills first (when fillLevel >= 1)
        // depth 1 fills second (when fillLevel >= 2)
        // depth 0 fills last (when fillLevel >= 3)
        // So: isOccupied when (3 - depth) <= fillLevel
        // Or: depth >= (3 - fillLevel)
        const isOccupied = fillLevel > 0 && depth >= (3 - fillLevel);

        inventory.set(cellId, {
          occupied: isOccupied,
          palletId: isOccupied ? generatePalletId() : null,
          block: 1,
          layer,
          row,
          depth,
        });
      }
    }
  }

  // Block 2: Fill from back (depth 7) towards aisle (depth 0) - LIFO storage
  for (let layer = 1; layer <= BLOCK2.LAYERS; layer++) {
    for (let row = 0; row < BLOCK2.ROWS; row++) {
      // Random fill level for this row (0-8 items)
      const fillLevel = Math.floor(Math.random() * 9);

      for (let depth = 0; depth <= 7; depth++) {
        const cellId = `B2-L${layer}-R${row.toString().padStart(2, '0')}-D${depth}`;
        // Fill from back: depth 7 fills first (when fillLevel >= 1)
        // depth 0 fills last (when fillLevel >= 8)
        // So: isOccupied when depth >= (8 - fillLevel)
        const isOccupied = fillLevel > 0 && depth >= (8 - fillLevel);

        inventory.set(cellId, {
          occupied: isOccupied,
          palletId: isOccupied ? generatePalletId() : null,
          block: 2,
          layer,
          row,
          depth,
        });
      }
    }
  }

  return inventory;
};

/**
 * Generate a random pallet ID
 * @returns {string}
 */
const generatePalletId = () => {
  return `PLT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

/**
 * Find the next available empty slot in a row (LIFO logic)
 * CRITICAL: Only returns accessible slots (not blocked by items in front)
 * Shuttle CANNOT drive through occupied cells to reach deeper empty slots!
 *
 * Example (Block 1 with 3 depths: D0=front, D1=middle, D2=back):
 * - [Empty, Empty, Empty] → Returns D2 (deepest, LIFO optimal)
 * - [Empty, Empty, Item] → Returns D1 (deepest accessible)
 * - [Empty, Item, Item] → Returns D0 (only accessible slot)
 * - [Item, Empty, Empty] → Returns null (D0 blocks access to D1,D2)
 * - [Item, Item, Empty] → Returns null (cannot reach D2)
 * - [Item, Empty, Item] → Returns null (cannot reach D1)
 *
 * @param {Map} inventory - Current inventory state
 * @param {number} block - Block number (1 or 2)
 * @param {number} layer - Layer number (1-7)
 * @param {number} row - Row number (0-23)
 * @returns {{cellId: string, depth: number} | null}
 */
export const findNextEmptySlot = (inventory, block, layer, row) => {
  const maxDepth = block === 1 ? 2 : 7;

  // LIFO Storage Logic: Fill from back to front
  // Check from deepest to frontmost (max -> 0)
  for (let depth = maxDepth; depth >= 0; depth--) {
    const cellId = `B${block}-L${layer}-R${row.toString().padStart(2, '0')}-D${depth}`;
    const cell = inventory.get(cellId);

    if (cell && !cell.occupied) {
      // Found an empty slot
      // CRITICAL: Check if shuttle can reach this slot (all front slots must be empty)
      let isAccessible = true;
      for (let d = 0; d < depth; d++) {
        const frontCellId = `B${block}-L${layer}-R${row.toString().padStart(2, '0')}-D${d}`;
        const frontCell = inventory.get(frontCellId);
        if (frontCell && frontCell.occupied) {
          // Blocked! Shuttle cannot drive through occupied cells
          isAccessible = false;
          break;
        }
      }

      if (isAccessible) {
        // This is the deepest accessible empty slot (LIFO optimal)
        return { cellId, depth };
      }
      // Not accessible - continue checking shallower slots
    }
  }

  // No accessible empty slots found
  return null;
};

/**
 * Find the next occupied slot to pick from (LIFO - take from front)
 * Block 1: Returns frontmost occupied slot (0 -> 1 -> 2)
 * Block 2: Returns frontmost occupied slot (0 -> 1 -> ... -> 7)
 * @param {Map} inventory - Current inventory state
 * @param {number} block - Block number (1 or 2)
 * @param {number} layer - Layer number (1-7)
 * @param {number} row - Row number (0-23)
 * @returns {{cellId: string, depth: number, palletId: string} | null}
 */
export const findNextOccupiedSlot = (inventory, block, layer, row) => {
  const maxDepth = block === 1 ? 2 : 7;

  // Check from front to back (0 -> max)
  for (let depth = 0; depth <= maxDepth; depth++) {
    const cellId = `B${block}-L${layer}-R${row.toString().padStart(2, '0')}-D${depth}`;
    const cell = inventory.get(cellId);
    if (cell && cell.occupied) {
      return { cellId, depth, palletId: cell.palletId };
    }
  }
  return null;
};

/**
 * Store a pallet in a specific cell (INBOUND operation)
 * @param {Map} inventory - Current inventory state
 * @param {string} cellId - Target cell ID
 * @returns {boolean} - Success status
 */
export const storePallet = (inventory, cellId) => {
  const cell = inventory.get(cellId);
  if (!cell || cell.occupied) {
    console.error(`[Inventory] Cannot store at ${cellId} - slot not available`);
    return false;
  }

  const palletId = generatePalletId();
  inventory.set(cellId, {
    ...cell,
    occupied: true,
    palletId,
  });

  console.log(`[Inventory] Stored ${palletId} at ${cellId}`);
  return true;
};

/**
 * Remove a pallet from a specific cell (OUTBOUND operation)
 * @param {Map} inventory - Current inventory state
 * @param {string} cellId - Source cell ID
 * @returns {string | null} - Pallet ID that was removed, or null if failed
 */
export const removePallet = (inventory, cellId) => {
  const cell = inventory.get(cellId);
  if (!cell || !cell.occupied) {
    console.error(`[Inventory] Cannot remove from ${cellId} - slot is empty`);
    return null;
  }

  const palletId = cell.palletId;
  inventory.set(cellId, {
    ...cell,
    occupied: false,
    palletId: null,
  });

  console.log(`[Inventory] Removed ${palletId} from ${cellId}`);
  return palletId;
};

/**
 * Move a pallet from one cell to another (TRANSFER operation)
 * @param {Map} inventory - Current inventory state
 * @param {string} sourceCellId - Source cell ID
 * @param {string} targetCellId - Target cell ID
 * @returns {boolean} - Success status
 */
export const transferPallet = (inventory, sourceCellId, targetCellId) => {
  const palletId = removePallet(inventory, sourceCellId);
  if (!palletId) return false;

  const targetCell = inventory.get(targetCellId);
  if (!targetCell || targetCell.occupied) {
    // Rollback - put pallet back
    inventory.set(sourceCellId, {
      ...inventory.get(sourceCellId),
      occupied: true,
      palletId,
    });
    console.error(`[Inventory] Transfer failed - target ${targetCellId} not available`);
    return false;
  }

  inventory.set(targetCellId, {
    ...targetCell,
    occupied: true,
    palletId,
  });

  console.log(`[Inventory] Transferred ${palletId} from ${sourceCellId} to ${targetCellId}`);
  return true;
};

/**
 * Get inventory statistics
 * @param {Map} inventory - Current inventory state
 * @returns {{total: number, occupied: number, empty: number, utilizationRate: number}}
 */
export const getInventoryStats = (inventory) => {
  let occupied = 0;
  let total = 0;

  inventory.forEach((cell) => {
    total++;
    if (cell.occupied) occupied++;
  });

  return {
    total,
    occupied,
    empty: total - occupied,
    utilizationRate: total > 0 ? (occupied / total) * 100 : 0,
  };
};

/**
 * Get block-specific statistics
 * @param {Map} inventory - Current inventory state
 * @param {number} block - Block number (1 or 2)
 * @returns {{total: number, occupied: number, empty: number, utilizationRate: number}}
 */
export const getBlockStats = (inventory, block) => {
  let occupied = 0;
  let total = 0;

  inventory.forEach((cell) => {
    if (cell.block === block) {
      total++;
      if (cell.occupied) occupied++;
    }
  });

  return {
    total,
    occupied,
    empty: total - occupied,
    utilizationRate: total > 0 ? (occupied / total) * 100 : 0,
  };
};

/**
 * Find optimal storage location for INBOUND task
 * Prefers balanced distribution across layers and rows
 * @param {Map} inventory - Current inventory state
 * @param {number} preferredBlock - Preferred block (1 or 2), or null for any
 * @returns {{block: number, layer: number, row: number, cellId: string} | null}
 */
export const findOptimalStorageLocation = (inventory, preferredBlock = null) => {
  const blocks = preferredBlock ? [preferredBlock] : [1, 2];
  const layers = [1, 2, 3, 4, 5, 6, 7];

  // Try to find a slot with good distribution
  for (const layer of layers) {
    for (const block of blocks) {
      const rows = block === 1 ?
        Array.from({length: BLOCK1.ROWS}, (_, i) => i).filter(r => r !== BLOCK1.ELEVATOR_ROW) :
        Array.from({length: BLOCK2.ROWS}, (_, i) => i);

      // Shuffle rows for randomness
      const shuffledRows = rows.sort(() => Math.random() - 0.5);

      for (const row of shuffledRows) {
        const slot = findNextEmptySlot(inventory, block, layer, row);
        if (slot) {
          return { block, layer, row, cellId: slot.cellId };
        }
      }
    }
  }

  return null;
};

/**
 * Find optimal pick location for OUTBOUND task
 * Prefers picking from fuller rows and lower layers
 * @param {Map} inventory - Current inventory state
 * @param {number} preferredBlock - Preferred block (1 or 2), or null for any
 * @returns {{block: number, layer: number, row: number, cellId: string, palletId: string} | null}
 */
export const findOptimalPickLocation = (inventory, preferredBlock = null) => {
  const blocks = preferredBlock ? [preferredBlock] : [1, 2];
  const layers = [1, 2, 3, 4, 5, 6, 7]; // Start from lower layers

  for (const layer of layers) {
    for (const block of blocks) {
      const rows = block === 1 ?
        Array.from({length: BLOCK1.ROWS}, (_, i) => i).filter(r => r !== BLOCK1.ELEVATOR_ROW) :
        Array.from({length: BLOCK2.ROWS}, (_, i) => i);

      // Shuffle for variety
      const shuffledRows = rows.sort(() => Math.random() - 0.5);

      for (const row of shuffledRows) {
        const slot = findNextOccupiedSlot(inventory, block, layer, row);
        if (slot) {
          return { block, layer, row, cellId: slot.cellId, palletId: slot.palletId };
        }
      }
    }
  }

  return null;
};
