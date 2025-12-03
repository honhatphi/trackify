/**
 * @fileoverview 3D Warehouse Structure component for React Three Fiber
 * Main component that combines all warehouse sub-components
 *
 * CELL STATES:
 * - EMPTY: Gray - No cargo
 * - OCCUPIED: Green/Blue - Has cargo
 *
 * WAREHOUSE LAYOUT (Top View - Looking Down):
 * ┌──────────────────────────────────────────────────────────────┐
 * │                                                              │
 * │   BLOCK 1 (3 depths)          AISLE         BLOCK 2 (8 depths)
 * │   ┌───┐                    ┌───────┐       ┌────────────────┐
 * │   │███│  Row 0            │       │       │████████████████│
 * │   │███│  Row 1            │       │       │████████████████│
 * │   │███│  ...              │ Shuttle│       │████████████████│
 * │   │███│  Row 14 [ELEVATOR]│  Path │       │████████████████│
 * │   │███│  ...              │       │       │████████████████│
 * │   │███│  Row 23           │       │       │████████████████│
 * │   └───┘                    └───────┘       └────────────────┘
 * │   X:0-2                    X:3-4           X:5-12
 * │                                                              │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Coordinate System (3D):
 * - X axis: Depth direction (Block1 → Aisle → Block2)
 * - Y axis: Height (Layers 0-6)
 * - Z axis: Row direction (0-23)
 */

import { SimulationProvider } from './hooks';
import { CameraFocusProvider } from './CameraFocus';
import { BLOCK1, AISLE } from './constants';

// Import sub-components
import Ground from './Ground';
import ShuttleRails from './ShuttleRails';
import StorageCells from './StorageCells';
import RackFrames from './RackFrames';
import AisleFloor from './AisleFloor';
import Elevator from './Elevator';
import Conveyor from './Conveyor';
import Shuttle from './Shuttle';
import CellLegend from './CellLegend';

/**
 * Complete warehouse structure
 * Renders storage cells, shuttle rails, rack frames, aisle, elevator and conveyor
 *
 * Now with only 2 shuttles - one on layer 0 and one on layer 3
 */
const WarehouseStructure = () => {
  return (
    <group name="warehouse-structure">
      {/* Ground */}
      <Ground />

      {/* Shuttle rails/tracks on each layer */}
      <ShuttleRails />

      {/* Storage cells for both blocks (pallets + carton boxes) */}
      <StorageCells />

      {/* Rack frame structure */}
      <RackFrames />

      {/* Aisle between blocks */}
      <AisleFloor />

      {/* Elevator at Block 1, Row 14, Depth 2 */}
      <Elevator />

      {/* Conveyor belt at Block 1, Row 14, Depth 3 (input/output) */}
      <Conveyor />

      {/* Only 2 shuttles - one on layer 0 (ground) and one on layer 3 (mid) */}
      <Shuttle
        position={[AISLE.CENTER_X, 0, BLOCK1.ELEVATOR_ROW]}
        layer={1}
        id="SH-001"
        battery={95}
        isMainShuttle={true}
      />
      <Shuttle
        position={[AISLE.CENTER_X, 0, BLOCK1.ELEVATOR_ROW]}
        layer={4}
        id="SH-002"
        battery={82}
        isMainShuttle={true}
      />

      {/* Cell state legend */}
      <CellLegend />
    </group>
  );
};

/**
 * Wrapper component that provides simulation context
 */
const WarehouseStructureWithSimulation = () => {
  return (
    <SimulationProvider>
      <WarehouseStructure />
    </SimulationProvider>
  );
};

export { WarehouseStructure, CameraFocusProvider };
export { useCameraFocus, CameraController, ShuttleFocusSelector } from './CameraFocus';
export default WarehouseStructureWithSimulation;
