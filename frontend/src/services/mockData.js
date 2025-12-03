/**
 * @fileoverview Mock data service for Trackify ASRS Dashboard
 * Provides simulated shuttle data and movement simulation for frontend-first development
 *
 * WAREHOUSE LAYOUT:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                           Block 2 (8 depths)                        │
 * │  Row 0  ████████                                                    │
 * │  Row 1  ████████                                                    │
 * │  ...    ████████                                                    │
 * │  Row 23 ████████                                                    │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │                    AISLE (Shuttle Running Path)                     │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │                           Block 1 (3 depths)                        │
 * │  Row 0  ███                                                         │
 * │  ...    ███                                                         │
 * │  Row 14 ███ [ELEVATOR]                                              │
 * │  ...    ███                                                         │
 * │  Row 23 ███                                                         │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Coordinate System:
 * - X: Depth direction (Block1: 0-2, Aisle: 3-4, Block2: 5-12)
 * - Y: Row direction (0-23)
 * - Z: Layer/Floor (0-6, 7 layers total)
 */

// =============================================================================
// WAREHOUSE CONFIGURATION
// =============================================================================

/**
 * Warehouse layout configuration
 * Based on real ASRS system specifications
 */
export const WAREHOUSE_CONFIG = {
  /** Block 1: Smaller rack system with elevator */
  BLOCK1: {
    LAYERS: 7,           // 7 tầng (0-6)
    ROWS: 24,            // 24 dãy (0-23)
    DEPTHS: 3,           // 3 ô depth mỗi dãy
    ELEVATOR_ROW: 14,    // Thang máy ở dãy 14
    X_START: 0,          // X position bắt đầu
    X_END: 2,            // X position kết thúc (0, 1, 2)
  },

  /** Aisle: Running path for shuttles between blocks */
  AISLE: {
    WIDTH: 1,            // 1 grid unit wide (thu nhỏ)
    X_START: 3,          // X position bắt đầu aisle
    X_END: 3,            // X position kết thúc aisle (same as start - narrow)
    CENTER_X: 3,         // Tâm của aisle
  },

  /** Block 2: Larger rack system (forklift area in diagram) */
  BLOCK2: {
    LAYERS: 7,           // 7 tầng (0-6)
    ROWS: 24,            // 24 dãy (0-23)
    DEPTHS: 8,           // 8 ô depth mỗi dãy
    X_START: 4,          // X position bắt đầu (gần hơn)
    X_END: 11,           // X position kết thúc (4-11)
  },

  /** Overall grid dimensions */
  GRID: {
    X: 12,               // Total X: Block1(3) + Aisle(1) + Block2(8) = 12
    Y: 24,               // Total Y: 24 rows
    Z: 7,                // Total Z: 7 layers
  },

  /** Visual dimensions (in 3D units) */
  DIMENSIONS: {
    CELL_SIZE: 1,        // 1 unit per grid cell
    LAYER_HEIGHT: 1,   // Vertical spacing between layers (compact)
    BIN_SIZE: 0.85,      // Bin cube size (slightly smaller than cell)
    RACK_FRAME_WIDTH: 0.05, // Rack frame thickness
  },
};

// Shorthand for frequently used config
const { BLOCK1, BLOCK2, AISLE, GRID } = WAREHOUSE_CONFIG;

// =============================================================================
// SIMULATION CONSTANTS
// =============================================================================

/** Maximum movement per simulation tick (rows) */
const MAX_MOVE_STEP = 1;

/** Battery drain per movement (percentage) - very slow drain */
const BATTERY_DRAIN_PER_MOVE = 0.05;

/** Chance to randomly pause (0-1) - very low to keep shuttles moving */
const PAUSE_CHANCE = 0.005;

/** Chance to resume from IDLE (0-1) - high to keep shuttles active */
const RESUME_CHANCE = 0.8;

/** Shuttles operate on specific layers only (1-based) */
const SHUTTLE_ACTIVE_LAYERS = [1, 4]; // SH-001 on layer 1, SH-002 on layer 4

// =============================================================================
// MOCK DATA
// =============================================================================

/**
 * Initial mock shuttles array
 * 2 shuttles operating in the aisle between blocks
 * Positions spread out for easy observation:
 * - SH-001: Layer 1 (ground floor), Row 5 (front area)
 * - SH-002: Layer 4 (middle floor), Row 18 (back area)
 * @type {import('../types/index.js').Shuttle[]}
 */
export const MOCK_SHUTTLES = [
  {
    id: 'SH-001',
    x: AISLE.CENTER_X,   // Shuttle runs in aisle center
    y: 5,                // Row 5 (front area - dễ quan sát)
    z: 1,                // Ground floor (layer 1)
    battery: 95,
    status: 'MOVING',
    isOnline: true,
  },
  {
    id: 'SH-002',
    x: AISLE.CENTER_X,   // Shuttle runs in aisle center
    y: 18,               // Row 18 (back area - tách biệt với SH-001)
    z: 4,                // Layer 4 (middle floor)
    battery: 82,
    status: 'MOVING',
    isOnline: true,
  },
];

/**
 * Mock tasks for initial state
 * Tasks are assigned to the 2 shuttles based on their operating layers
 * Layer: 1-7 (consistent throughout the system)
 * @type {import('../types/index.js').Task[]}
 */
export const MOCK_TASKS = [
  {
    id: 'TSK-001',
    shuttleId: 'SH-001',
    sourceBin: 'B1-L1-R05-D2',    // Block1, Layer1, Row5, Depth2
    targetBin: 'B2-L1-R10-D5',    // Block2, Layer1, Row10, Depth5
    type: 'OUTBOUND',
    status: 'pending',
    eta: '~2 min',
  },
  {
    id: 'TSK-002',
    shuttleId: 'SH-002',
    sourceBin: 'B2-L4-R18-D7',    // Block2, Layer4, Row18, Depth7
    targetBin: 'B1-L4-R20-D1',    // Block1, Layer4, Row20, Depth1
    type: 'INBOUND',
    status: 'pending',
    eta: '~4 min',
  },
  {
    id: 'TSK-003',
    shuttleId: 'SH-001',
    sourceBin: 'B1-L1-R08-D1',    // Keep on same layer as shuttle (L1)
    targetBin: 'B2-L1-R15-D3',
    type: 'TRANSFER',
    status: 'pending',
    eta: '~8 min',
  },
  {
    id: 'TSK-004',
    shuttleId: 'SH-002',
    sourceBin: 'B2-L4-R22-D6',    // Keep on same layer as shuttle (L4)
    targetBin: 'B1-L4-R14-D2',
    type: 'OUTBOUND',
    status: 'pending',
    eta: '~12 min',
  },
];

/**
 * Generate mock bin states for the warehouse
 * Creates occupancy data for all bins in both blocks
 * Layer uses 1-7 (1-based)
 * @returns {Map<string, {occupied: boolean, palletId: string | null}>}
 */
export const generateMockBins = () => {
  const bins = new Map();

  // Generate bins for Block 1 (layer 1-7)
  for (let layer = 1; layer <= BLOCK1.LAYERS; layer++) {
    for (let y = 0; y < BLOCK1.ROWS; y++) {
      for (let x = BLOCK1.X_START; x <= BLOCK1.X_END; x++) {
        const binId = `B1-L${layer}-R${y.toString().padStart(2, '0')}-D${x}`;
        bins.set(binId, {
          occupied: Math.random() > 0.4, // 60% occupied
          palletId: Math.random() > 0.4 ? `PLT-${Math.random().toString(36).substr(2, 6).toUpperCase()}` : null,
        });
      }
    }
  }

  // Generate bins for Block 2 (layer 1-7)
  for (let layer = 1; layer <= BLOCK2.LAYERS; layer++) {
    for (let y = 0; y < BLOCK2.ROWS; y++) {
      for (let x = BLOCK2.X_START; x <= BLOCK2.X_END; x++) {
        const binId = `B2-L${layer}-R${y.toString().padStart(2, '0')}-D${x - BLOCK2.X_START}`;
        bins.set(binId, {
          occupied: Math.random() > 0.5, // 50% occupied
          palletId: Math.random() > 0.5 ? `PLT-${Math.random().toString(36).substr(2, 6).toUpperCase()}` : null,
        });
      }
    }
  }

  return bins;
};

// =============================================================================
// SIMULATION FUNCTIONS
// =============================================================================

/**
 * Clamp a value within bounds
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Simulate warehouse state by updating shuttle positions and statuses
 *
 * Movement Rules:
 * 1. Shuttles move continuously along Y-axis (rows) in the aisle
 * 2. Each shuttle stays on its assigned layer (no layer changes in simulation)
 * 3. X position stays in aisle center (shuttle doesn't enter racks in this sim)
 * 4. Shuttles patrol back and forth along the rows
 *
 * @param {import('../types/index.js').Shuttle[]} currentShuttles - Current shuttles array
 * @returns {import('../types/index.js').Shuttle[]} New shuttles array with updated positions
 */
export const simulateWarehouseState = (currentShuttles) => {
  return currentShuttles.map((shuttle) => {
    // Skip offline shuttles - they don't move or update
    if (!shuttle.isOnline) {
      return shuttle;
    }

    // Handle ERROR shuttles - chance to recover
    if (shuttle.status === 'ERROR') {
      // Good chance to recover from error and resume
      if (Math.random() < 0.1) {
        return { ...shuttle, status: 'MOVING', battery: Math.max(shuttle.battery, 20) };
      }
      return shuttle;
    }

    // Calculate new position
    let newX = AISLE.CENTER_X;
    let newY = shuttle.y;
    let newZ = shuttle.z; // Stay on assigned layer
    let newBattery = shuttle.battery;
    let newStatus = shuttle.status;

    // IDLE shuttles have high chance to resume moving
    if (shuttle.status === 'IDLE') {
      if (Math.random() < RESUME_CHANCE) {
        newStatus = 'MOVING';
      }
    }

    // MOVING shuttles patrol along the aisle
    if (newStatus === 'MOVING') {
      // Determine movement direction based on current position
      // Use shuttle direction stored in a simple pattern: move toward center, then to edges
      const centerRow = Math.floor(GRID.Y / 2);
      const distanceToCenter = centerRow - shuttle.y;

      // Move toward a target, creating patrol behavior
      let moveDirection = 0;
      if (Math.abs(distanceToCenter) < 2) {
        // Near center, randomly pick direction
        moveDirection = Math.random() > 0.5 ? 1 : -1;
      } else {
        // Move based on which half of aisle we're in, occasionally reverse
        moveDirection = distanceToCenter > 0 ? 1 : -1;
        if (Math.random() < 0.2) moveDirection *= -1; // Occasionally reverse
      }

      // Apply movement with randomness
      const moveAmount = Math.random() < 0.8 ? MAX_MOVE_STEP : 0; // 80% chance to move
      newY = clamp(shuttle.y + (moveDirection * moveAmount), 0, GRID.Y - 1);

      // Drain battery slowly when moving
      if (newY !== shuttle.y) {
        newBattery = Math.max(10, shuttle.battery - BATTERY_DRAIN_PER_MOVE);
      }

      // Very small chance to pause momentarily
      if (Math.random() < PAUSE_CHANCE) {
        newStatus = 'IDLE';
      }
    }

    // Recharge battery slowly when idle (simulating quick charge stations)
    if (newStatus === 'IDLE' && shuttle.battery < 100) {
      newBattery = Math.min(100, shuttle.battery + 0.5);
    }

    return {
      ...shuttle,
      x: newX,
      y: newY,
      z: newZ,
      battery: newBattery,
      status: newStatus,
    };
  });
};

/**
 * Create a deep copy of shuttles array (for initial state)
 * @returns {import('../types/index.js').Shuttle[]} Copy of mock shuttles
 */
export const getInitialShuttles = () => MOCK_SHUTTLES.map((s) => ({ ...s }));

/**
 * Create a deep copy of tasks array (for initial state)
 * @returns {import('../types/index.js').Task[]} Copy of mock tasks
 */
export const getInitialTasks = () => MOCK_TASKS.map((t) => ({ ...t }));
