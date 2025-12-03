/**
 * @fileoverview Shuttle Rails/Tracks component
 * Metal channels for shuttle movement across all layers
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

import { useDarkMode } from './hooks';
import { BLOCK1, BLOCK2, AISLE, DIMENSIONS } from './constants';

/**
 * Shuttle Rails/Tracks - Metal channels for shuttle movement
 *
 * Structure:
 * - Block 1: Rails run horizontally (X) and extend to connect with aisle
 * - Block 2: Rails run horizontally (X) and extend to connect with aisle
 * - Aisle: Rails run vertically (Z) connecting all rows
 */
const ShuttleRails = () => {
  const isDark = useDarkMode();

  // Rail materials
  const railMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: isDark ? '#E4E4E7' : '#A1A1AA',
    roughness: 0.25,
    metalness: 0.9,
  }), [isDark]);

  const meshMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: isDark ? '#D4D4D8' : '#E4E4E7',
    roughness: 0.3,
    metalness: 0.85,
  }), [isDark]);

  // Rail dimensions
  const RAIL_WIDTH = 0.10;
  const RAIL_HEIGHT = 0.04;
  const RAIL_LIP_HEIGHT = 0.025;
  const RAIL_LIP_WIDTH = 0.015;
  const RAIL_SPACING = 0.70;
  const MESH_THICKNESS = 0.012;

  // Generate rails for all rows on all layers
  const railsData = useMemo(() => {
    const rails = [];
    const lips = [];
    const meshPanels = [];

    for (let layer = 1; layer <= BLOCK1.LAYERS; layer++) {
      const layerY = (layer - 1) * DIMENSIONS.LAYER_HEIGHT;

      // BLOCK 1 RAILS
      for (let row = 0; row < BLOCK1.ROWS; row++) {
        const zPos = row;
        const b1StartX = BLOCK1.X_START - 0.15;
        const b1EndX = BLOCK1.X_END + 0.5;
        const b1Length = b1EndX - b1StartX;
        const b1CenterX = (b1StartX + b1EndX) / 2;

        rails.push({
          key: `rail-b1-l${layer}-r${row}-front`,
          position: [b1CenterX, layerY + RAIL_HEIGHT / 2, zPos - RAIL_SPACING / 2],
          size: [b1Length, RAIL_HEIGHT, RAIL_WIDTH],
        });
        rails.push({
          key: `rail-b1-l${layer}-r${row}-back`,
          position: [b1CenterX, layerY + RAIL_HEIGHT / 2, zPos + RAIL_SPACING / 2],
          size: [b1Length, RAIL_HEIGHT, RAIL_WIDTH],
        });
        lips.push({
          key: `lip-b1-l${layer}-r${row}-front`,
          position: [b1CenterX, layerY + RAIL_HEIGHT + RAIL_LIP_HEIGHT / 2, zPos - RAIL_SPACING / 2 + RAIL_WIDTH / 2 - RAIL_LIP_WIDTH / 2],
          size: [b1Length, RAIL_LIP_HEIGHT, RAIL_LIP_WIDTH],
        });
        lips.push({
          key: `lip-b1-l${layer}-r${row}-back`,
          position: [b1CenterX, layerY + RAIL_HEIGHT + RAIL_LIP_HEIGHT / 2, zPos + RAIL_SPACING / 2 - RAIL_WIDTH / 2 + RAIL_LIP_WIDTH / 2],
          size: [b1Length, RAIL_LIP_HEIGHT, RAIL_LIP_WIDTH],
        });
      }

      // BLOCK 2 RAILS
      for (let row = 0; row < BLOCK2.ROWS; row++) {
        const zPos = row;
        const b2StartX = BLOCK2.X_START - 0.5;
        const b2EndX = BLOCK2.X_END + 0.15;
        const b2Length = b2EndX - b2StartX;
        const b2CenterX = (b2StartX + b2EndX) / 2;

        rails.push({
          key: `rail-b2-l${layer}-r${row}-front`,
          position: [b2CenterX, layerY + RAIL_HEIGHT / 2, zPos - RAIL_SPACING / 2],
          size: [b2Length, RAIL_HEIGHT, RAIL_WIDTH],
        });
        rails.push({
          key: `rail-b2-l${layer}-r${row}-back`,
          position: [b2CenterX, layerY + RAIL_HEIGHT / 2, zPos + RAIL_SPACING / 2],
          size: [b2Length, RAIL_HEIGHT, RAIL_WIDTH],
        });
        lips.push({
          key: `lip-b2-l${layer}-r${row}-front`,
          position: [b2CenterX, layerY + RAIL_HEIGHT + RAIL_LIP_HEIGHT / 2, zPos - RAIL_SPACING / 2 + RAIL_WIDTH / 2 - RAIL_LIP_WIDTH / 2],
          size: [b2Length, RAIL_LIP_HEIGHT, RAIL_LIP_WIDTH],
        });
        lips.push({
          key: `lip-b2-l${layer}-r${row}-back`,
          position: [b2CenterX, layerY + RAIL_HEIGHT + RAIL_LIP_HEIGHT / 2, zPos + RAIL_SPACING / 2 - RAIL_WIDTH / 2 + RAIL_LIP_WIDTH / 2],
          size: [b2Length, RAIL_LIP_HEIGHT, RAIL_LIP_WIDTH],
        });
      }

      // AISLE RAILS
      const aisleStartZ = 0 - RAIL_SPACING / 2 - RAIL_WIDTH / 2;
      const aisleEndZ = (BLOCK1.ROWS - 1) + RAIL_SPACING / 2 + RAIL_WIDTH / 2;
      const aisleLength = aisleEndZ - aisleStartZ;
      const aisleCenterZ = (aisleStartZ + aisleEndZ) / 2;

      const leftRailX = AISLE.CENTER_X - 0.4;
      const rightRailX = AISLE.CENTER_X + 0.4;
      const narrowAisleWidth = rightRailX - leftRailX;

      rails.push({
        key: `rail-aisle-l${layer}-left`,
        position: [leftRailX, layerY + RAIL_HEIGHT / 2, aisleCenterZ],
        size: [RAIL_WIDTH, RAIL_HEIGHT, aisleLength],
      });
      rails.push({
        key: `rail-aisle-l${layer}-right`,
        position: [rightRailX, layerY + RAIL_HEIGHT / 2, aisleCenterZ],
        size: [RAIL_WIDTH, RAIL_HEIGHT, aisleLength],
      });

      // AISLE CROSS BEAMS
      for (let row = 0; row < BLOCK1.ROWS; row++) {
        const zPos = row;

        rails.push({
          key: `rail-cross-l${layer}-r${row}-front`,
          position: [AISLE.CENTER_X, layerY + RAIL_HEIGHT / 2, zPos - RAIL_SPACING / 2],
          size: [narrowAisleWidth, RAIL_HEIGHT, RAIL_WIDTH],
        });
        rails.push({
          key: `rail-cross-l${layer}-r${row}-back`,
          position: [AISLE.CENTER_X, layerY + RAIL_HEIGHT / 2, zPos + RAIL_SPACING / 2],
          size: [narrowAisleWidth, RAIL_HEIGHT, RAIL_WIDTH],
        });

        const meshWidth = narrowAisleWidth - RAIL_WIDTH;
        const meshLength = RAIL_SPACING - RAIL_WIDTH;
        meshPanels.push({
          key: `mesh-aisle-l${layer}-r${row}`,
          position: [AISLE.CENTER_X, layerY + MESH_THICKNESS / 2, zPos],
          size: [meshWidth, MESH_THICKNESS, meshLength],
          rowNumber: row + 1, // 1-based row number for display
          layer: layer,
        });
      }
    }

    return { rails, lips, meshPanels };
  }, []);

  return (
    <group name="shuttle-rails">
      {railsData.rails.map(rail => (
        <mesh key={rail.key} position={rail.position} material={railMaterial}>
          <boxGeometry args={rail.size} />
        </mesh>
      ))}
      {railsData.lips.map(lip => (
        <mesh key={lip.key} position={lip.position} material={railMaterial}>
          <boxGeometry args={lip.size} />
        </mesh>
      ))}
      {railsData.meshPanels.map(mesh => (
        <group key={mesh.key}>
          <mesh position={mesh.position} material={meshMaterial}>
            <boxGeometry args={mesh.size} />
          </mesh>
          {/* Row number label on every mesh panel */}
          <Text
            position={[mesh.position[0], mesh.position[1] + 0.015, mesh.position[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.08}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.012}
            outlineColor="#000000"
            fontWeight="bold"
          >
            {mesh.rowNumber}
          </Text>
        </group>
      ))}
    </group>
  );
};

export default ShuttleRails;
