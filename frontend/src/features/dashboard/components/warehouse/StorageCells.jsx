/**
 * @fileoverview Storage Cells component - renders pallets and carton boxes
 * Uses THREE.InstancedMesh for massive performance improvement
 */

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

import { useDarkMode } from './hooks';
import { getThemeColors, CELL_SIZE, CELL_STATES, binToPosition } from './constants';

/**
 * Optimized instanced mesh for storage cells with inox pallets and carton boxes
 * NO task-based highlighting - just static occupied/empty cells
 */
const StorageCells = () => {
  const isDark = useDarkMode();
  const COLORS = useMemo(() => getThemeColors(isDark), [isDark]);

  // Refs for instanced meshes
  const emptyMeshRef = useRef();
  const palletNormalRef = useRef();
  const cartonNormalRef = useRef();
  const tapeNormalRef = useRef();

  // Categorize all cells - just empty vs occupied
  const cellsByState = useMemo(() => {
    const empty = [];
    const occupied = [];

    CELL_STATES.forEach((cell, cellId) => {
      const position = binToPosition(cell.block, cell.layer, cell.row, cell.depth);
      const cellData = { position, cellId };

      if (cell.occupied) {
        occupied.push(cellData);
      } else {
        empty.push(cellData);
      }
    });

    return { empty, occupied };
  }, []);

  // Geometry dimensions
  const RAIL_HEIGHT = 0.04;
  const PALLET_HEIGHT = 0.08;
  const CARTON_HEIGHT = CELL_SIZE * 0.55;

  // Geometry for inox pallet
  const palletGeometry = useMemo(() => new THREE.BoxGeometry(
    CELL_SIZE * 0.88,
    PALLET_HEIGHT,
    CELL_SIZE * 0.88
  ), []);

  // Geometry for carton box
  const cartonGeometry = useMemo(() => new THREE.BoxGeometry(
    CELL_SIZE * 0.78,
    CARTON_HEIGHT,
    CELL_SIZE * 0.78
  ), []);

  // Geometry for packing tape stripe
  const tapeGeometry = useMemo(() => new THREE.BoxGeometry(
    CELL_SIZE * 0.79,
    CARTON_HEIGHT * 0.15,
    CELL_SIZE * 0.79
  ), []);

  // Geometry for empty slot indicator
  const emptyGeometry = useMemo(() => new THREE.BoxGeometry(
    CELL_SIZE * 0.3,
    CELL_SIZE * 0.05,
    CELL_SIZE * 0.3
  ), []);

  // Materials - reactive to theme changes
  const materials = useMemo(() => ({
    empty: new THREE.MeshStandardMaterial({
      color: COLORS.EMPTY,
      transparent: true,
      opacity: isDark ? 0.3 : 0.4,
      roughness: 0.9,
    }),
    palletNormal: new THREE.MeshStandardMaterial({
      color: COLORS.PALLET_INOX,
      roughness: 0.2,
      metalness: 0.9,
    }),
    cartonNormal: new THREE.MeshStandardMaterial({
      color: COLORS.CARTON_BOX,
      roughness: 0.85,
      metalness: 0,
    }),
    tapeNormal: new THREE.MeshStandardMaterial({
      color: COLORS.CARTON_TAPE,
      roughness: 0.5,
      metalness: 0.1,
    }),
  }), [COLORS, isDark]);

  // Update instanced mesh transforms
  useEffect(() => {
    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();

    const updateInstances = (meshRef, cells, yOffset) => {
      if (!meshRef.current || cells.length === 0) return;
      cells.forEach((cell, i) => {
        tempPosition.set(cell.position[0], cell.position[1] + yOffset, cell.position[2]);
        tempMatrix.setPosition(tempPosition);
        meshRef.current.setMatrixAt(i, tempMatrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    };

    // Update empty cells
    updateInstances(emptyMeshRef, cellsByState.empty, 0);

    // Update occupied cells
    const palletY = RAIL_HEIGHT + PALLET_HEIGHT / 2;
    const cartonY = RAIL_HEIGHT + PALLET_HEIGHT + CARTON_HEIGHT / 2;
    const tapeY = RAIL_HEIGHT + PALLET_HEIGHT + CARTON_HEIGHT / 2;

    updateInstances(palletNormalRef, cellsByState.occupied, palletY);
    updateInstances(cartonNormalRef, cellsByState.occupied, cartonY);
    updateInstances(tapeNormalRef, cellsByState.occupied, tapeY);

  }, [cellsByState, PALLET_HEIGHT, CARTON_HEIGHT, RAIL_HEIGHT]);

  return (
    <group name="storage-cells">
      {/* Empty slot indicators */}
      {cellsByState.empty.length > 0 && (
        <instancedMesh
          ref={emptyMeshRef}
          args={[emptyGeometry, materials.empty, cellsByState.empty.length]}
          frustumCulled={true}
        />
      )}

      {/* Occupied cells (Pallet + Carton + Tape) */}
      {cellsByState.occupied.length > 0 && (
        <>
          <instancedMesh
            ref={palletNormalRef}
            args={[palletGeometry, materials.palletNormal, cellsByState.occupied.length]}
            frustumCulled={true}
          />
          <instancedMesh
            ref={cartonNormalRef}
            args={[cartonGeometry, materials.cartonNormal, cellsByState.occupied.length]}
            frustumCulled={true}
          />
          <instancedMesh
            ref={tapeNormalRef}
            args={[tapeGeometry, materials.tapeNormal, cellsByState.occupied.length]}
            frustumCulled={true}
          />
        </>
      )}
    </group>
  );
};

export default StorageCells;
