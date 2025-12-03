/**
 * @fileoverview Elevator component for ASRS warehouse
 * Vertical lift system with smooth animation between layers
 * Carries cargo from conveyor level to any storage layer
 */

import { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';

import { useDarkMode, useSimulation, useIsSimulating } from './hooks';
import { getThemeColors, BLOCK1, DIMENSIONS } from './constants';

// Layers where shuttles are operating - only deliver to these layers
const SHUTTLE_ACTIVE_LAYERS = [1, 4];

/**
 * Animated Elevator at Block 1, Row 14, Depth 2 (X = 1)
 */
const Elevator = () => {
  const isDark = useDarkMode();
  const COLORS = useMemo(() => getThemeColors(isDark), [isDark]);
  const totalHeight = BLOCK1.LAYERS * DIMENSIONS.LAYER_HEIGHT;
  const [simState, setSimState] = useSimulation();
  const isSimulating = useIsSimulating();

  const [platformY, setPlatformY] = useState(0);
  const [localCargo, setLocalCargo] = useState(false);

  const elevatorX = BLOCK1.X_START + 1;
  const elevatorZ = BLOCK1.ELEVATOR_ROW;

  useFrame((state, delta) => {
    // Skip animation if simulation is paused
    if (!isSimulating) return;

    const { elevator, conveyor } = simState;
    const targetY = (elevator.targetLayer - 1) * DIMENSIONS.LAYER_HEIGHT;
    const speed = 1.5;

    // Check if elevator reached target position
    const reachedTarget = Math.abs(platformY - targetY) <= 0.01;

    if (!reachedTarget) {
      // Still moving - animate platform
      const dir = Math.sign(targetY - platformY);
      setPlatformY(prev => prev + dir * delta * speed);
    } else if (elevator.isMoving) {
      // Just arrived at target - snap to exact position and notify
      setPlatformY(targetY);
      setSimState(prev => ({
        ...prev,
        elevator: {
          ...prev.elevator,
          isMoving: false,
          currentY: targetY,
        },
        pendingCargo: prev.elevator.hasCargo ? {
          layer: prev.elevator.targetLayer,
          position: [elevatorX, targetY, elevatorZ],
          cargoId: prev.elevator.cargoId,
        } : null,
      }));
    }

    if (conveyor.cargoPosition >= 0.4 && !elevator.hasCargo && !elevator.isMoving) {
      // Round-robin distribution: alternate between layers 1 and 4
      setSimState(prev => {
        const newTargetLayer = prev.lastTargetLayer === 1 ? 4 : 1;
        return {
          ...prev,
          conveyor: {
            ...prev.conveyor,
            hasCargo: false,
            cargoPosition: -0.5,
          },
          elevator: {
            ...prev.elevator,
            hasCargo: true,
            cargoId: prev.cargoCounter + 1,
            targetLayer: newTargetLayer,
            isMoving: true,
          },
          cargoCounter: prev.cargoCounter + 1,
          lastTargetLayer: newTargetLayer,
        };
      });
      setLocalCargo(true);
    }

    setLocalCargo(elevator.hasCargo);
  });

  return (
    <group name="elevator" position={[elevatorX, 0, elevatorZ]}>
      {/* Elevator shaft - vertical guide rails */}
      {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => (
        <mesh key={`rail-${i}`} position={[x, totalHeight / 2, z]}>
          <boxGeometry args={[0.08, totalHeight, 0.08]} />
          <meshStandardMaterial color={COLORS.ELEVATOR} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Cross beams at top */}
      {[-0.4, 0.4].map(z => (
        <mesh key={`beam-${z}`} position={[0, totalHeight - 0.1, z]}>
          <boxGeometry args={[0.88, 0.1, 0.06]} />
          <meshStandardMaterial color={COLORS.ELEVATOR} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Animated Elevator platform */}
      <group position={[0, platformY, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.85, 0.12, 0.85]} />
          <meshStandardMaterial
            color={COLORS.ELEVATOR}
            emissive={COLORS.ELEVATOR}
            emissiveIntensity={simState.elevator.isMoving ? 0.6 : 0.2}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>

        {/* Platform forks */}
        {[-0.25, 0.25].map(x => (
          <mesh key={`fork-${x}`} position={[x, 0.18, 0]}>
            <boxGeometry args={[0.1, 0.04, 0.7]} />
            <meshStandardMaterial color="#71717A" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* Cargo on elevator */}
        {localCargo && (
          <group position={[0, 0.25, 0]}>
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[0.5, 0.025, 0.5]} />
              <meshStandardMaterial color={COLORS.PALLET_INOX} roughness={0.2} metalness={0.9} />
            </mesh>
            {[-0.18, 0, 0.18].map(x => (
              <mesh key={`leg-${x}`} position={[x, 0.02, 0]}>
                <boxGeometry args={[0.08, 0.04, 0.45]} />
                <meshStandardMaterial color={COLORS.PALLET_INOX_DARK} roughness={0.3} metalness={0.85} />
              </mesh>
            ))}
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.4, 0.35, 0.4]} />
              <meshStandardMaterial color={COLORS.CARTON_BOX} roughness={0.85} metalness={0.05} />
            </mesh>
          </group>
        )}

        {/* Layer indicator light */}
        <mesh position={[0.4, 0.25, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color={simState.elevator.isMoving ? '#FBBF24' : '#22C55E'}
            emissive={simState.elevator.isMoving ? '#FBBF24' : '#22C55E'}
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>
    </group>
  );
};

export default Elevator;
