/**
 * @fileoverview Storage Cells component - renders pallets and carton boxes
 * Uses THREE.InstancedMesh for massive performance improvement
 */

import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

import { useDarkMode } from './hooks';
import { getThemeColors, CELL_SIZE, binToPosition } from './constants';
import { useDashboardStore } from '../../../../store/useDashboardStore';

/**
 * Optimized instanced mesh for storage cells with inox pallets and carton boxes
 * NO task-based highlighting - just static occupied/empty cells
 */
const StorageCells = () => {
  const isDark = useDarkMode();
  const COLORS = useMemo(() => getThemeColors(isDark), [isDark]);

  // Get inventory from store with version tracking
  const inventory = useDashboardStore((state) => state.inventory);
  const inventoryVersion = useDashboardStore((state) => state.inventoryVersion);

  // Refs for instanced meshes
  const emptyMeshRef = useRef();
  const palletNormalRef = useRef();
  const cartonNormalRef = useRef();
  const tapeNormalRef = useRef();

  // Categorize all cells - just empty vs occupied
  const cellsByState = useMemo(() => {
    const empty = [];
    const occupied = [];

    inventory.forEach((cell, cellId) => {
      const position = binToPosition(cell.block, cell.layer, cell.row, cell.depth);
      const cellData = { position, cellId };

      if (cell.occupied) {
        occupied.push(cellData);
      } else {
        empty.push(cellData);
      }
    });

    return { empty, occupied };
  }, [inventory, inventoryVersion]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [CELL_SIZE]);

  // Geometry for packing tape stripe
  const tapeGeometry = useMemo(() => new THREE.BoxGeometry(
    CELL_SIZE * 0.79,
    CARTON_HEIGHT * 0.15,
    CELL_SIZE * 0.79
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [CELL_SIZE]);

  // Geometry for empty slot indicator
  const emptyGeometry = useMemo(() => new THREE.BoxGeometry(
    CELL_SIZE * 0.3,
    CELL_SIZE * 0.05,
    CELL_SIZE * 0.3
  ), []);

  // Materials - create refs to maintain references across theme changes
  const materialsRef = useRef({
    empty: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
    palletNormal: new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.9 }),
    cartonNormal: new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 }),
    tapeNormal: new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1 }),
  });

  // Update material colors when theme changes (without recreating materials)
  useEffect(() => {
    materialsRef.current.empty.color.set(COLORS.EMPTY);
    materialsRef.current.empty.transparent = true;
    materialsRef.current.empty.opacity = isDark ? 0.3 : 0.4;
    materialsRef.current.empty.needsUpdate = true;

    materialsRef.current.palletNormal.color.set(COLORS.PALLET_INOX);
    materialsRef.current.palletNormal.needsUpdate = true;

    materialsRef.current.cartonNormal.color.set(COLORS.CARTON_BOX);
    materialsRef.current.cartonNormal.needsUpdate = true;

    materialsRef.current.tapeNormal.color.set(COLORS.CARTON_TAPE);
    materialsRef.current.tapeNormal.needsUpdate = true;
  }, [COLORS, isDark]);

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
          args={[emptyGeometry, materialsRef.current.empty, cellsByState.empty.length]}
          frustumCulled={true}
        />
      )}

      {/* Occupied cells (Pallet + Carton + Tape) */}
      {cellsByState.occupied.length > 0 && (
        <>
          <instancedMesh
            ref={palletNormalRef}
            args={[palletGeometry, materialsRef.current.palletNormal, cellsByState.occupied.length]}
            frustumCulled={true}
          />
          <instancedMesh
            ref={cartonNormalRef}
            args={[cartonGeometry, materialsRef.current.cartonNormal, cellsByState.occupied.length]}
            frustumCulled={true}
          />
          <instancedMesh
            ref={tapeNormalRef}
            args={[tapeGeometry, materialsRef.current.tapeNormal, cellsByState.occupied.length]}
            frustumCulled={true}
          />
        </>
      )}
    </group>
  );
};

export default StorageCells;
