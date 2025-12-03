/**
 * @fileoverview Aisle Floor component
 * Floor between blocks with guide lines
 */

import { useMemo } from 'react';

import { useDarkMode } from './hooks';
import { getThemeColors, BLOCK1, AISLE, DIMENSIONS, GRID } from './constants';

/**
 * Renders the aisle floor between blocks with guide lines
 */
const AisleFloor = () => {
  const isDark = useDarkMode();
  const COLORS = useMemo(() => getThemeColors(isDark), [isDark]);

  return (
    <group name="aisle">
      {Array.from({ length: BLOCK1.LAYERS }, (_, i) => i + 1).map((layer) => (
        <group key={`aisle-layer-${layer}`}>
          {/* Floor surface */}
          <mesh
            position={[
              AISLE.CENTER_X,
              (layer - 1) * DIMENSIONS.LAYER_HEIGHT - 0.02,
              GRID.Y / 2 - 0.5,
            ]}
          >
            <boxGeometry args={[AISLE.WIDTH + 0.5, 0.04, GRID.Y]} />
            <meshStandardMaterial color={COLORS.AISLE_FLOOR} roughness={0.9} />
          </mesh>

          {/* Yellow safety lines */}
          <mesh
            position={[
              AISLE.CENTER_X - AISLE.WIDTH / 2 - 0.1,
              (layer - 1) * DIMENSIONS.LAYER_HEIGHT + 0.01,
              GRID.Y / 2 - 0.5,
            ]}
          >
            <boxGeometry args={[0.1, 0.02, GRID.Y]} />
            <meshBasicMaterial color={COLORS.AISLE_LINE} />
          </mesh>
          <mesh
            position={[
              AISLE.CENTER_X + AISLE.WIDTH / 2 + 0.1,
              (layer - 1) * DIMENSIONS.LAYER_HEIGHT + 0.01,
              GRID.Y / 2 - 0.5,
            ]}
          >
            <boxGeometry args={[0.1, 0.02, GRID.Y]} />
            <meshBasicMaterial color={COLORS.AISLE_LINE} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default AisleFloor;
