/**
 * @fileoverview Rack Frame Structure component
 * Blue vertical posts + Orange horizontal beams (like real ASRS)
 */

import { useMemo } from 'react';
import * as THREE from 'three';

import { useDarkMode } from './hooks';
import { getThemeColors, BLOCK1, BLOCK2, DIMENSIONS } from './constants';

/**
 * Realistic Rack Frame Structure
 * Blue vertical posts + Orange horizontal beams
 */
const RackFrames = () => {
  const isDark = useDarkMode();
  const COLORS = useMemo(() => getThemeColors(isDark), [isDark]);

  const verticalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.FRAME_VERTICAL,
    roughness: 0.3,
    metalness: 0.7,
  }), [COLORS]);

  const horizontalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.FRAME_HORIZONTAL,
    roughness: 0.3,
    metalness: 0.6,
  }), [COLORS]);

  const frames = useMemo(() => {
    const verticals = [];
    const horizontals = [];
    const postThickness = 0.08;
    const beamThickness = 0.06;
    const beamHeight = 0.12;

    const addVerticalPost = (x, z, height, key) => {
      verticals.push({
        key,
        position: [x, height / 2, z],
        size: [postThickness, height, postThickness],
      });
    };

    const addHorizontalBeam = (x1, x2, y, z, key) => {
      const length = Math.abs(x2 - x1);
      horizontals.push({
        key,
        position: [(x1 + x2) / 2, y, z],
        size: [length, beamHeight, beamThickness],
      });
    };

    const totalHeight = BLOCK1.LAYERS * DIMENSIONS.LAYER_HEIGHT;

    // Block 1 structure
    for (let row = 0; row <= BLOCK1.ROWS; row += 1) {
      addVerticalPost(BLOCK1.X_START - 0.4, row - 0.5, totalHeight, `v-b1-front-${row}`);
      addVerticalPost(BLOCK1.X_END + 0.4, row - 0.5, totalHeight, `v-b1-back-${row}`);

      for (let layer = 1; layer <= BLOCK1.LAYERS; layer++) {
        const y = (layer - 1) * DIMENSIONS.LAYER_HEIGHT + DIMENSIONS.LAYER_HEIGHT - 0.1;
        addHorizontalBeam(
          BLOCK1.X_START - 0.4,
          BLOCK1.X_END + 0.4,
          y,
          row - 0.5,
          `h-b1-${layer}-${row}`
        );
      }
    }

    // Block 2 structure
    for (let row = 0; row <= BLOCK2.ROWS; row += 1) {
      addVerticalPost(BLOCK2.X_START - 0.4, row - 0.5, totalHeight, `v-b2-front-${row}`);
      addVerticalPost(BLOCK2.X_END + 0.4, row - 0.5, totalHeight, `v-b2-back-${row}`);
      addVerticalPost((BLOCK2.X_START + BLOCK2.X_END) / 2, row - 0.5, totalHeight, `v-b2-mid-${row}`);

      for (let layer = 1; layer <= BLOCK2.LAYERS; layer++) {
        const y = (layer - 1) * DIMENSIONS.LAYER_HEIGHT + DIMENSIONS.LAYER_HEIGHT - 0.1;
        addHorizontalBeam(
          BLOCK2.X_START - 0.4,
          BLOCK2.X_END + 0.4,
          y,
          row - 0.5,
          `h-b2-${layer}-${row}`
        );
      }
    }

    // Cross beams for stability
    for (let row = 0; row < BLOCK1.ROWS; row += 6) {
      for (let layer = 1; layer <= BLOCK1.LAYERS; layer++) {
        const y = (layer - 1) * DIMENSIONS.LAYER_HEIGHT + DIMENSIONS.LAYER_HEIGHT - 0.1;
        horizontals.push({
          key: `side-b1-${layer}-${row}`,
          position: [BLOCK1.X_START - 0.4, y, row + 2.5],
          size: [beamThickness, beamHeight, 6],
        });
        horizontals.push({
          key: `side-b2-${layer}-${row}`,
          position: [BLOCK2.X_END + 0.4, y, row + 2.5],
          size: [beamThickness, beamHeight, 6],
        });
      }
    }

    return { verticals, horizontals };
  }, []);

  return (
    <group name="rack-frames">
      {frames.verticals.map(frame => (
        <mesh key={frame.key} position={frame.position} material={verticalMaterial}>
          <boxGeometry args={frame.size} />
        </mesh>
      ))}
      {frames.horizontals.map(frame => (
        <mesh key={frame.key} position={frame.position} material={horizontalMaterial}>
          <boxGeometry args={frame.size} />
        </mesh>
      ))}
    </group>
  );
};

export default RackFrames;
