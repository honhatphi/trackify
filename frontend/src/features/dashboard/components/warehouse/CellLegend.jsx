/**
 * @fileoverview Legend component for cell states
 */

import { useMemo } from 'react';

import { useDarkMode } from './hooks';
import { getThemeColors } from './constants';

/**
 * Legend for cell states - positioned to not block view
 */
const CellLegend = () => {
  const isDark = useDarkMode();
  const COLORS = useMemo(() => getThemeColors(isDark), [isDark]);

  const legendItems = [
    { color: COLORS.CARTON_BOX, label: 'Carton Box', y: 0, emissive: false },
    { color: COLORS.PALLET_INOX, label: 'Inox Pallet', y: -1.0, emissive: false, metalness: 0.9 },
  ];

  return (
    <group name="legend" position={[-4, 4, -2]}>
      {legendItems.map((item) => (
        <group key={item.label} position={[0, item.y, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.5, 0.35, 0.5]} />
            <meshStandardMaterial
              color={item.color}
              emissive={item.emissive ? item.color : undefined}
              emissiveIntensity={item.emissive ? (isDark ? 0.6 : 0.3) : 0}
              metalness={item.metalness || 0}
              roughness={item.metalness ? 0.2 : 0.7}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default CellLegend;
