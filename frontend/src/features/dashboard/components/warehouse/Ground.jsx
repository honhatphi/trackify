/**
 * @fileoverview Ground and Ceiling component
 * Concrete warehouse floor and ceiling
 */

import { useMemo } from 'react';

import { useDarkMode } from './hooks';
import { getThemeColors, BLOCK1, DIMENSIONS, GRID } from './constants';

/**
 * Ground plane - Concrete warehouse floor
 */
const Ground = () => {
  const isDark = useDarkMode();
  const COLORS = useMemo(() => getThemeColors(isDark), [isDark]);

  return (
    <group name="ground-ceiling">
      {/* Ground floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[GRID.X / 2, -0.1, GRID.Y / 2 - 0.5]}
        receiveShadow
      >
        <planeGeometry args={[GRID.X + 10, GRID.Y + 10]} />
        <meshStandardMaterial color={COLORS.GROUND} roughness={0.9} />
      </mesh>

      {/* Ceiling */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[GRID.X / 2, BLOCK1.LAYERS * DIMENSIONS.LAYER_HEIGHT + 2, GRID.Y / 2 - 0.5]}
      >
        <planeGeometry args={[GRID.X + 10, GRID.Y + 10]} />
        <meshStandardMaterial color={COLORS.CEILING} roughness={0.8} />
      </mesh>
    </group>
  );
};

export default Ground;
