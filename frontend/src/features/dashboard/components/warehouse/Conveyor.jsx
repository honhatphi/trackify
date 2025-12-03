/**
 * @fileoverview Conveyor belt component
 * Horizontal belt with moving texture and cargo animation
 * Spawns new cargo periodically
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { useDarkMode, useSimulation, useIsSimulating } from './hooks';
import { getThemeColors, BLOCK1 } from './constants';

/**
 * Animated Conveyor belt at Block 1, Row 14, Depth 3 (X = 0)
 */
const Conveyor = () => {
  const isDark = useDarkMode();
  const COLORS = useMemo(() => getThemeColors(isDark), [isDark]);
  const [simState, setSimState] = useSimulation();
  const isSimulating = useIsSimulating();
  const beltRef = useRef();

  const conveyorX = BLOCK1.X_START - 0.5;
  const conveyorZ = BLOCK1.ELEVATOR_ROW;
  const conveyorLength = 1.5;

  const frameColor = isDark ? '#3F3F46' : '#52525B';
  const beltColor = isDark ? '#27272A' : '#3F3F46';

  useFrame((state, delta) => {
    // Skip animation if simulation is paused
    if (!isSimulating) return;

    const { conveyor } = simState;

    setSimState(prev => ({
      ...prev,
      conveyor: {
        ...prev.conveyor,
        beltOffset: (prev.conveyor.beltOffset + delta * 0.5) % 1,
      },
    }));

    if (conveyor.hasCargo && conveyor.cargoPosition < 0.5) {
      setSimState(prev => ({
        ...prev,
        conveyor: {
          ...prev.conveyor,
          cargoPosition: Math.min(prev.conveyor.cargoPosition + delta * 0.3, 0.5),
        },
      }));
    }

    if (!conveyor.hasCargo && !simState.elevator.hasCargo) {
      // Spawn new cargo more frequently - don't wait for elevator to stop moving
      const shouldSpawn = Math.random() < delta * 1.5; // Increased spawn rate
      if (shouldSpawn) {
        setSimState(prev => ({
          ...prev,
          conveyor: {
            ...prev.conveyor,
            hasCargo: true,
            cargoPosition: -0.5,
          },
        }));
      }
    }
  });

  return (
    <group name="conveyor" position={[conveyorX, 0, conveyorZ]}>
      {/* Conveyor frame - side rails */}
      {[-0.4, 0.4].map(z => (
        <mesh key={`rail-${z}`} position={[0, 0.25, z]}>
          <boxGeometry args={[conveyorLength, 0.15, 0.08]} />
          <meshStandardMaterial color={frameColor} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Conveyor legs */}
      {[-0.5, 0.5].map(offset => (
        <group key={`leg-${offset}`}>
          {[-0.4, 0.4].map(z => (
            <mesh key={`leg-${z}`} position={[offset, 0.1, z]}>
              <boxGeometry args={[0.06, 0.2, 0.06]} />
              <meshStandardMaterial color={frameColor} metalness={0.6} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Belt surface */}
      <mesh ref={beltRef} position={[0, 0.34, 0]}>
        <boxGeometry args={[conveyorLength - 0.1, 0.03, 0.72]} />
        <meshStandardMaterial color={beltColor} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Animated belt lines */}
      {Array.from({ length: 8 }).map((_, i) => {
        const baseX = -0.6 + i * 0.2;
        const animatedX = ((baseX + simState.conveyor.beltOffset * 0.2) % 1.4) - 0.6;
        return (
          <mesh key={`line-${i}`} position={[animatedX, 0.36, 0]}>
            <boxGeometry args={[0.02, 0.01, 0.7]} />
            <meshStandardMaterial color="#18181B" roughness={1} />
          </mesh>
        );
      })}

      {/* Cargo on conveyor */}
      {simState.conveyor.hasCargo && (
        <group position={[simState.conveyor.cargoPosition, 0.4, 0]}>
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

      {/* Status indicator */}
      <mesh position={[-0.7, 0.35, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial
          color={simState.conveyor.hasCargo ? '#22C55E' : '#6B7280'}
          emissive={simState.conveyor.hasCargo ? '#22C55E' : '#6B7280'}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
};

export default Conveyor;
