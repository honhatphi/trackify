/**
 * @fileoverview Shared constants and utilities for warehouse 3D components
 */

import { WAREHOUSE_CONFIG } from '../../../../services/mockData';

// Re-export warehouse config
export const { BLOCK1, BLOCK2, AISLE, DIMENSIONS, GRID } = WAREHOUSE_CONFIG;

/** Cell size - slightly smaller than grid to show gaps */
export const CELL_SIZE = DIMENSIONS.BIN_SIZE * 0.9;

/**
 * Get current theme colors based on dark mode state
 * These colors are optimized for visibility in both modes
 */
export const getThemeColors = (isDark) => ({
  // Cell/Pallet states
  EMPTY: isDark ? '#475569' : '#CBD5E1',           // Slate-600 / Slate-300
  OCCUPIED: isDark ? '#E2E8F0' : '#F8FAFC',        // Slate-200 / Slate-50

  // Pallet & Cargo
  PALLET_INOX: isDark ? '#A1A1AA' : '#D4D4D8',     // Zinc-400 / Zinc-300 (Stainless steel look)
  PALLET_INOX_DARK: isDark ? '#71717A' : '#A1A1AA', // Zinc-500 / Zinc-400
  CARTON_BOX: isDark ? '#B45309' : '#D97706',       // Amber-700 / Amber-600 (Cardboard brown)
  CARTON_TAPE: isDark ? '#854D0E' : '#A16207',      // Yellow-800 / Yellow-700 (Packing tape)

  // Rail/Track for shuttle
  RAIL_STEEL: isDark ? '#52525B' : '#71717A',      // Zinc-600 / Zinc-500
  RAIL_GUIDE: isDark ? '#3F3F46' : '#52525B',      // Zinc-700 / Zinc-600

  // Rack structure
  FRAME_VERTICAL: isDark ? '#3B82F6' : '#1E40AF',  // Blue-500 / Blue-800
  FRAME_HORIZONTAL: isDark ? '#F97316' : '#EA580C', // Orange-500 / Orange-600

  // Environment
  AISLE_FLOOR: isDark ? '#334155' : '#94A3B8',     // Slate-700 / Slate-400
  AISLE_LINE: isDark ? '#FCD34D' : '#FBBF24',      // Amber-300 / Amber-400
  ELEVATOR: isDark ? '#A78BFA' : '#8B5CF6',        // Violet-400 / Violet-500
  GROUND: isDark ? '#1E293B' : '#64748B',          // Slate-800 / Slate-500
  CEILING: isDark ? '#334155' : '#F1F5F9',         // Slate-700 / Slate-100
});

/**
 * Parse bin ID to get coordinates
 * Format: "B1-L0-R05-D2" or "B2-L3-R18-D7"
 */
export const parseBinId = (binId) => {
  if (!binId) return null;
  const match = binId.match(/B(\d)-L(\d)-R(\d+)-D(\d+)/);
  if (!match) return null;
  return {
    block: parseInt(match[1]),
    layer: parseInt(match[2]),
    row: parseInt(match[3]),
    depth: parseInt(match[4]),
  };
};

/**
 * Convert bin coordinates to 3D position
 * Y position is at layer base (rail level), not cell center
 * Layer is 1-based (1-7)
 */
export const binToPosition = (block, layer, row, depth) => {
  const xStart = block === 1 ? BLOCK1.X_START : BLOCK2.X_START;
  return [
    xStart + depth,
    (layer - 1) * DIMENSIONS.LAYER_HEIGHT,  // Base at rail level (convert 1-based to 0-based for position)
    row,
  ];
};

/**
 * Generate initial cell states for the warehouse
 * Returns a Map of cellId -> { occupied: boolean }
 * Layer uses 1-7 (1-based)
 *
 * Storage logic: Items are stored from the back (highest depth) towards the front (aisle)
 * This simulates LIFO (Last In First Out) storage pattern
 *
 * Note: Excludes elevator (Depth 2/X=1), conveyor (Depth 3/X=0), and entry path (Depth 1/X=2) at Row 14
 */
export const generateCellStates = () => {
  const cells = new Map();

  // Block 1: 7 layers (1-7) × 24 rows × 3 depths
  for (let layer = 1; layer <= BLOCK1.LAYERS; layer++) {
    for (let row = 0; row < BLOCK1.ROWS; row++) {
      // Skip entire Row 14 - it's the elevator/entry row
      if (row === BLOCK1.ELEVATOR_ROW) {
        continue;
      }

      const maxDepth = BLOCK1.X_END - BLOCK1.X_START + 1; // 3 depths
      const fillLevel = Math.floor(Math.random() * (maxDepth + 1));

      for (let depth = 0; depth <= BLOCK1.X_END - BLOCK1.X_START; depth++) {
        const cellId = `B1-L${layer}-R${row.toString().padStart(2, '0')}-D${depth}`;
        const isOccupied = depth < fillLevel;

        cells.set(cellId, {
          occupied: isOccupied,
          block: 1,
          layer,
          row,
          depth,
        });
      }
    }
  }

  // Block 2: 7 layers (1-7) × 24 rows × 8 depths
  for (let layer = 1; layer <= BLOCK2.LAYERS; layer++) {
    for (let row = 0; row < BLOCK2.ROWS; row++) {
      const maxDepth = BLOCK2.X_END - BLOCK2.X_START + 1; // 8 depths
      const fillLevel = Math.floor(Math.random() * (maxDepth + 1));

      for (let depth = 0; depth <= BLOCK2.X_END - BLOCK2.X_START; depth++) {
        const cellId = `B2-L${layer}-R${row.toString().padStart(2, '0')}-D${depth}`;
        const isOccupied = depth >= (maxDepth - fillLevel);

        cells.set(cellId, {
          occupied: isOccupied,
          block: 2,
          layer,
          row,
          depth,
        });
      }
    }
  }

  return cells;
};

// Generate once and keep stable
export const CELL_STATES = generateCellStates();
