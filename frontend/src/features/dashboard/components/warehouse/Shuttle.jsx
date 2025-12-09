/**
 * @fileoverview Shuttle Vehicle component - Main transportation unit in ASRS
 *
 * Features:
 * - Animated movement along rails (X and Z axes)
 * - Wheel rotation based on movement direction
 * - LIFTING animation for pickup/dropoff
 * - Complete workflow: pickup from elevator → deliver to storage
 *
 * This component handles complex state machine logic for shuttle operations:
 * - waitAtElevator: Waiting for cargo from elevator
 * - moveToElevator: Moving to elevator position
 * - liftingUp: Lifting platform to pick up cargo
 * - exitElevator: Moving back to aisle after pickup
 * - moveToStorage: Moving along aisle to target row
 * - enterStorage: Entering storage block
 * - loweringDown: Lowering platform to drop cargo
 * - waitingDrop: Waiting after cargo drop
 * - returnToAisle: Returning to aisle
 * - returnToElevator: Going back to elevator for next cargo
 *
 * For non-main shuttles (patrol mode):
 * - moveOnAisle: Random patrol movement
 * - enterBlock: Entering a block
 * - waiting: Working in block
 * - exitBlock: Exiting block
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';

import { useDarkMode, useSimulation, useIsSimulating } from './hooks';
import { getThemeColors, BLOCK1, BLOCK2, AISLE, DIMENSIONS, CELL_SIZE } from './constants';
import { useCameraFocus } from './CameraFocus';
import { useCameraFocusStore } from './cameraFocusStore';
import { useDashboardStore } from '../../../../store/useDashboardStore';

/**
 * Realistic Shuttle Vehicle with Pallet and Cargo
 */
const Shuttle = ({
  position = [AISLE.CENTER_X, 0, 10],
  layer = 1,
  id = 'SH-001',
  battery = 85,
  isMainShuttle = false,
}) => {
  const isDark = useDarkMode();
  const groupRef = useRef();
  const COLORS = useMemo(() => getThemeColors(isDark), [isDark]);
  const [simState, setSimState] = useSimulation();
  const isSimulating = useIsSimulating();
  const completeNextTask = useDashboardStore(state => state.completeNextTask);
  const startNextTask = useDashboardStore(state => state.startNextTask);

  // Camera focus integration - use store directly for useFrame compatibility
  const { focusOnShuttle, isFollowing, targetId } = useCameraFocus();
  const registerShuttle = useCameraFocusStore(state => state.registerShuttle);
  const unregisterShuttle = useCameraFocusStore(state => state.unregisterShuttle);
  const isFocused = isFollowing && targetId === id;

  const [hovered, setHovered] = useState(false);

  // Elevator position for this layer
  const elevatorX = (BLOCK1?.X_START ?? 0) + 1;
  const elevatorZ = BLOCK1?.ELEVATOR_ROW ?? 14;
  const aisleCenterX = AISLE?.CENTER_X ?? 3;

  // Animation state with lifting mechanism
  const [animState, setAnimState] = useState({
    phase: isMainShuttle ? 'waitAtElevator' : 'moveOnAisle',
    currentX: isMainShuttle ? aisleCenterX : position[0],
    currentZ: isMainShuttle ? elevatorZ : position[2],
    targetX: position[0],
    targetZ: position[2],
    targetStorageX: 0,
    targetStorageZ: 0,
    wheelRotation: 0,
    movingOnX: false,
    hasCargo: false,
    liftHeight: 0,
    isLifting: false,
  });

  // Shuttle dimensions - redesigned to match reference
  const BODY_LENGTH = 0.8;
  const BODY_WIDTH = 0.6;
  const BODY_HEIGHT = 0.08;  // Thinner, more modern
  const LIFT_MAX = 0.08;

  // Colors - Industrial red-orange design
  const bodyColor = '#FF4500';        // Bright red-orange (primary)
  const bodyColorDark = '#CC3700';    // Darker red-orange
  const wheelColor = '#1A1A1A';       // Dark wheels
  const platformColor = '#C0C0C0';    // Silver metal grid
  const detailColor = '#505050';      // Dark gray details
  const cyanAccent = '#00CED1';       // Cyan blue panel

  // Pallet & Box dimensions
  const PALLET_WIDTH = 0.5;
  const PALLET_DEPTH = 0.5;
  const BOX_WIDTH = 0.4;
  const BOX_DEPTH = 0.4;
  const BOX_HEIGHT = 0.35;

  const layerY = (layer - 1) * DIMENSIONS.LAYER_HEIGHT;

  // Debug logging for shuttle position
  useEffect(() => {
    console.log(`[Shuttle ${id}] Initialized at Layer ${layer} (Y=${layerY})`);
    console.log(`[Shuttle ${id}] Position: [${animState.currentX}, ${layerY}, ${animState.currentZ}]`);
    console.log(`[Shuttle ${id}] Phase: ${animState.phase}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, layer, layerY]);

  // Boundary limits for shuttle movement
  const BOUNDS = {
    minX: BLOCK1.X_START,
    maxX: BLOCK2.X_START + BLOCK2.DEPTHS - 1,
    minZ: 0,
    maxZ: BLOCK1.ROWS - 1, // 0-23
  };

  // Clamp value within bounds
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  // Main animation loop
  useFrame((state, delta) => {
    const speed = 1.2;
    const liftSpeed = 0.5;
    let { currentX, currentZ, targetX, targetZ, phase, wheelRotation, movingOnX, liftHeight, targetStorageX, targetStorageZ } = animState;
    const _hasCargo = animState.hasCargo; // Prefixed with _ to indicate intentionally unused

    // Register shuttle position immediately to ensure it's tracked even if we return early
    registerShuttle(id, {
      x: currentX,
      y: layerY,
      z: currentZ
    });

    // Skip animation if simulation is paused
    if (!isSimulating) return;

    let moved = false;
    let newMovingOnX = movingOnX;

    // For main shuttle - coordinate with elevator
    if (isMainShuttle && phase === 'waitAtElevator') {
      const { pendingCargo, elevator } = simState;
      // Check if there's cargo waiting for this layer
      if (pendingCargo && pendingCargo.layer === layer && !elevator.isMoving) {
        // Move to elevator to pick up cargo
        setAnimState(prev => ({
          ...prev,
          phase: 'moveToElevator',
          targetX: elevatorX,
          targetZ: elevatorZ,
        }));
        return;
      }
      // If already at elevator position, stay in wait mode
      return;
    }

    switch (phase) {
      case 'moveToElevator': {
        const distX = Math.abs(currentX - elevatorX);
        const distZ = Math.abs(currentZ - elevatorZ);

        // If already at elevator, immediately start lifting
        if (distX <= 0.05 && distZ <= 0.05) {
          setAnimState(prev => ({
            ...prev,
            phase: 'liftingUp',
            currentX: elevatorX,
            currentZ: elevatorZ,
            movingOnX: true,
            isLifting: true,
          }));
          return;
        }

        if (distZ > 0.05 && !movingOnX) {
          const dir = Math.sign(elevatorZ - currentZ);
          currentZ += dir * delta * speed;
          wheelRotation += Math.abs(dir) * delta * 15;
          moved = true;
        } else if (distX > 0.05) {
          const dir = Math.sign(elevatorX - currentX);
          currentX += dir * delta * speed;
          wheelRotation += Math.abs(dir) * delta * 15;
          moved = true;
          newMovingOnX = true;
        }
        break;
      }

      case 'liftingUp': {
        if (liftHeight < LIFT_MAX) {
          liftHeight = Math.min(liftHeight + delta * liftSpeed, LIFT_MAX);
          setAnimState(prev => ({ ...prev, liftHeight }));
        } else {
          // Mark task as in_progress when shuttle picks up cargo
          startNextTask(id);

          setSimState(prev => ({
            ...prev,
            elevator: { ...prev.elevator, hasCargo: false },
            pendingCargo: null,
          }));

          const useBlock1 = Math.random() > 0.5;
          let newTargetX, newTargetZ;

          if (useBlock1) {
            newTargetX = BLOCK1.X_START + Math.floor(Math.random() * BLOCK1.DEPTHS);
            do {
              newTargetZ = Math.floor(Math.random() * BLOCK1.ROWS);
            } while (newTargetZ === BLOCK1.ELEVATOR_ROW);
          } else {
            newTargetX = BLOCK2.X_START + Math.floor(Math.random() * BLOCK2.DEPTHS);
            newTargetZ = Math.floor(Math.random() * BLOCK2.ROWS);
          }

          setAnimState(prev => ({
            ...prev,
            phase: 'exitElevator',
            hasCargo: true,
            targetStorageX: newTargetX,
            targetStorageZ: newTargetZ,
          }));
        }
        break;
      }

      case 'exitElevator': {
        if (Math.abs(currentX - AISLE.CENTER_X) > 0.05) {
          const dir = Math.sign(AISLE.CENTER_X - currentX);
          currentX += dir * delta * speed;
          wheelRotation += Math.abs(dir) * delta * 15;
          moved = true;
          newMovingOnX = true;
        } else {
          setAnimState(prev => ({
            ...prev,
            phase: 'moveToStorage',
            currentX: AISLE.CENTER_X,
            targetZ: targetStorageZ,
            movingOnX: false,
          }));
          return;
        }
        break;
      }

      case 'moveToStorage': {
        const distZ = Math.abs(currentZ - targetStorageZ);
        if (distZ > 0.05) {
          const dir = Math.sign(targetStorageZ - currentZ);
          currentZ += dir * delta * speed;
          wheelRotation += Math.abs(dir) * delta * 15;
          moved = true;
          newMovingOnX = false;
        } else {
          setAnimState(prev => ({
            ...prev,
            phase: 'enterStorage',
            currentZ: targetStorageZ,
            targetX: targetStorageX,
          }));
          return;
        }
        break;
      }

      case 'enterStorage': {
        if (Math.abs(currentX - targetStorageX) > 0.05) {
          const dir = Math.sign(targetStorageX - currentX);
          currentX += dir * delta * speed;
          wheelRotation += Math.abs(dir) * delta * 15;
          moved = true;
          newMovingOnX = true;
        } else {
          setAnimState(prev => ({
            ...prev,
            phase: 'loweringDown',
            currentX: targetStorageX,
            isLifting: true,
          }));
          return;
        }
        break;
      }

      case 'loweringDown': {
        if (liftHeight > 0) {
          liftHeight = Math.max(liftHeight - delta * liftSpeed, 0);
          setAnimState(prev => ({ ...prev, liftHeight }));
        } else {
          // Mark task as completed when cargo is dropped
          completeNextTask(id);

          setTimeout(() => {
            setAnimState(prev => ({
              ...prev,
              phase: 'returnToAisle',
              hasCargo: false,
              isLifting: false,
            }));
          }, 500);
          setAnimState(prev => ({
            ...prev,
            phase: 'waitingDrop',
            liftHeight: 0,
          }));
        }
        break;
      }

      case 'waitingDrop':
        break;

      case 'returnToAisle': {
        if (Math.abs(currentX - AISLE.CENTER_X) > 0.05) {
          const dir = Math.sign(AISLE.CENTER_X - currentX);
          currentX += dir * delta * speed;
          wheelRotation += Math.abs(dir) * delta * 15;
          moved = true;
          newMovingOnX = true;
        } else {
          setAnimState(prev => ({
            ...prev,
            phase: 'returnToElevator',
            currentX: AISLE.CENTER_X,
            targetZ: elevatorZ,
            movingOnX: false,
          }));
          return;
        }
        break;
      }

      case 'returnToElevator': {
        const distZ = Math.abs(currentZ - elevatorZ);
        if (distZ > 0.05) {
          const dir = Math.sign(elevatorZ - currentZ);
          currentZ += dir * delta * speed;
          wheelRotation += Math.abs(dir) * delta * 15;
          moved = true;
          newMovingOnX = false;
        } else {
          setAnimState(prev => ({
            ...prev,
            phase: 'waitAtElevator',
            currentZ: elevatorZ,
          }));
          return;
        }
        break;
      }

      // Non-main shuttles - random patrol
      case 'moveOnAisle': {
        if (Math.abs(currentZ - targetZ) > 0.05) {
          const dir = Math.sign(targetZ - currentZ);
          currentZ += dir * delta * speed;
          wheelRotation += Math.abs(dir) * delta * 15;
          moved = true;
          newMovingOnX = false;
        } else {
          // Keep targetZ within warehouse bounds (0 to ROWS-1)
          const newTargetZ = Math.floor(Math.random() * (BOUNDS.maxZ - 2)) + 1;
          if (Math.random() > 0.7) {
            setAnimState(prev => ({
              ...prev,
              phase: 'enterBlock',
              targetX: Math.random() > 0.5 ? (BLOCK1.X_START + 1) : (BLOCK2.X_START + Math.floor(Math.random() * 4)),
              currentZ: clamp(currentZ, BOUNDS.minZ, BOUNDS.maxZ),
            }));
            return;
          }
          setAnimState(prev => ({ ...prev, targetZ: newTargetZ, currentZ: clamp(currentZ, BOUNDS.minZ, BOUNDS.maxZ) }));
          return;
        }
        break;
      }

      case 'enterBlock': {
        if (Math.abs(currentX - targetX) > 0.05) {
          const dir = Math.sign(targetX - currentX);
          currentX += dir * delta * speed;
          wheelRotation += Math.abs(dir) * delta * 15;
          moved = true;
          newMovingOnX = true;
        } else {
          setTimeout(() => {
            setAnimState(prev => ({ ...prev, phase: 'exitBlock', targetX: AISLE.CENTER_X }));
          }, 800);
          setAnimState(prev => ({ ...prev, phase: 'waiting', currentX: targetX }));
          return;
        }
        break;
      }

      case 'waiting':
        break;

      case 'exitBlock': {
        if (Math.abs(currentX - AISLE.CENTER_X) > 0.05) {
          const dir = Math.sign(AISLE.CENTER_X - currentX);
          currentX += dir * delta * speed;
          wheelRotation += Math.abs(dir) * delta * 15;
          moved = true;
          newMovingOnX = true;
        } else {
          setAnimState(prev => ({
            ...prev,
            phase: 'moveOnAisle',
            currentX: AISLE.CENTER_X,
            targetZ: Math.floor(Math.random() * (BOUNDS.maxZ - 2)) + 1, // Keep within bounds
            movingOnX: false,
          }));
          return;
        }
        break;
      }
    }

    // Clamp positions to stay within warehouse bounds
    currentX = clamp(currentX, BOUNDS.minX, BOUNDS.maxX);
    currentZ = clamp(currentZ, BOUNDS.minZ, BOUNDS.maxZ);

    if (moved) {
      setAnimState(prev => ({
        ...prev,
        currentX,
        currentZ,
        wheelRotation,
        movingOnX: newMovingOnX,
      }));
    }

  });

  // Cleanup: unregister shuttle when unmounted
  useEffect(() => {
    return () => {
      unregisterShuttle(id);
    };
  }, [id, unregisterShuttle]);

  // Handle click to focus camera
  const handleClick = (e) => {
    e.stopPropagation();
    focusOnShuttle(id);
  };

  // Get current phase display text
  const getPhaseText = () => {
    switch (animState.phase) {
      case 'waitAtElevator': return 'Waiting at elevator';
      case 'moveToElevator': return 'Moving to elevator';
      case 'liftingUp': return 'Lifting cargo';
      case 'exitElevator': return 'Exiting elevator';
      case 'moveToStorage': return 'Moving to storage';
      case 'enterStorage': return 'Entering storage';
      case 'loweringDown': return 'Lowering cargo';
      case 'waitingDrop': return 'Dropping cargo';
      case 'returnToAisle': return 'Returning';
      case 'returnToElevator': return 'Going to elevator';
      case 'moveOnAisle': return 'Patrolling';
      case 'enterBlock': return 'Entering block';
      case 'waiting': return 'Working';
      case 'exitBlock': return 'Exiting block';
      default: return 'Running';
    }
  };

  // Status color indicator
  const getStatusColor = () => {
    if (animState.isLifting) return '#A855F7';
    if (animState.hasCargo) return '#3B82F6';
    if (animState.phase === 'waiting' || animState.phase === 'waitingDrop') return '#F59E0B';
    return '#22C55E';
  };

  // Calculate path points for visualization
  const getPathPoints = useMemo(() => {
    const { phase, currentX, currentZ, targetStorageX, targetStorageZ } = animState;
    const points = [];

    // Only show path when shuttle is actively moving with a destination
    const movingPhases = ['moveToStorage', 'enterStorage', 'exitElevator', 'returnToAisle', 'returnToElevator', 'moveToElevator'];

    if (!movingPhases.includes(phase)) return null;

    // Current position
    const startPoint = [currentX, layerY + 0.5, currentZ];
    points.push(startPoint);

    switch (phase) {
      case 'moveToStorage':
        // First go along aisle (Z), then enter storage (X)
        // Waypoint at aisle intersection
        if (Math.abs(currentZ - targetStorageZ) > 0.1) {
          points.push([AISLE.CENTER_X, layerY + 0.5, targetStorageZ]);
        }
        points.push([targetStorageX, layerY + 0.5, targetStorageZ]);
        break;

      case 'enterStorage':
        points.push([targetStorageX, layerY + 0.5, targetStorageZ]);
        break;

      case 'exitElevator':
        points.push([AISLE.CENTER_X, layerY + 0.5, currentZ]);
        // Add next destination (storage)
        points.push([AISLE.CENTER_X, layerY + 0.5, targetStorageZ]);
        points.push([targetStorageX, layerY + 0.5, targetStorageZ]);
        break;

      case 'returnToAisle':
        points.push([AISLE.CENTER_X, layerY + 0.5, currentZ]);
        points.push([AISLE.CENTER_X, layerY + 0.5, elevatorZ]);
        break;

      case 'returnToElevator':
        points.push([AISLE.CENTER_X, layerY + 0.5, elevatorZ]);
        break;

      case 'moveToElevator':
        if (Math.abs(currentZ - elevatorZ) > 0.1) {
          points.push([currentX, layerY + 0.5, elevatorZ]);
        }
        points.push([elevatorX, layerY + 0.5, elevatorZ]);
        break;

      default:
        return null;
    }

    return points.length > 1 ? points : null;
  }, [animState, layerY, elevatorX, elevatorZ]);

  // Get final destination for marker
  const getFinalDestination = () => {
    const { phase, targetStorageX, targetStorageZ } = animState;

    switch (phase) {
      case 'moveToStorage':
      case 'enterStorage':
      case 'exitElevator':
        return { x: targetStorageX, z: targetStorageZ, label: `Storage R${targetStorageZ}` };
      case 'returnToAisle':
      case 'returnToElevator':
      case 'moveToElevator':
        return { x: elevatorX, z: elevatorZ, label: 'Elevator' };
      default:
        return null;
    }
  };

  const destination = getFinalDestination();
  const pathColor = animState.hasCargo ? '#3B82F6' : '#22C55E'; // Blue if carrying, green if empty

  return (
    <>
      {/* Path visualization - drawn at world coordinates, not relative to shuttle */}
      {getPathPoints && getPathPoints.length > 1 && (
        <group name={`path-${id}`}>
          {/* Dashed line showing planned route */}
          <Line
            points={getPathPoints}
            color={pathColor}
            lineWidth={2}
            dashed
            dashSize={0.3}
            dashScale={2}
            opacity={0.8}
            transparent
          />

          {/* Animated dots along path */}
          {getPathPoints.slice(1).map((point, i) => (
            <mesh key={`waypoint-${i}`} position={point}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial color={pathColor} transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      )}

      {/* Target destination marker */}
      {destination && (
        <group position={[destination.x, layerY, destination.z]} name={`target-${id}`}>
          {/* Pulsing ring on ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.3, 0.4, 32]} />
            <meshBasicMaterial color={pathColor} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>

          {/* Target box outline */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshBasicMaterial color={pathColor} wireframe transparent opacity={0.4} />
          </mesh>

          {/* Vertical beam */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 2.5, 8]} />
            <meshBasicMaterial color={pathColor} transparent opacity={0.3} />
          </mesh>

          {/* Target label */}
          <Html position={[0, 3, 0]} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
            <div
              className="px-2 py-1 rounded text-xs font-bold whitespace-nowrap"
              style={{
                backgroundColor: pathColor,
                color: 'white',
                boxShadow: `0 0 10px ${pathColor}`,
              }}
            >
              {destination.label}
            </div>
          </Html>
        </group>
      )}

      <group
        ref={groupRef}
        name={`shuttle-${id}`}
        position={[animState.currentX, layerY + 0.06, animState.currentZ]}
        rotation={[0, animState.movingOnX ? Math.PI / 2 : 0, 0]}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        {/* Focus indicator ring */}
        {isFocused && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
            <ringGeometry args={[0.8, 1.0, 32]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Hover tooltip */}
        {hovered && (
          <Html position={[0, 1, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
            <div className="bg-slate-900/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap text-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: getStatusColor() }} />
                <span className="font-bold text-amber-400">{id}</span>
              </div>
              <div className="text-slate-300 text-xs space-y-0.5">
                <div>Layer: <span className="text-white font-medium">{layer}</span></div>
                <div>Status: <span className="text-white font-medium">{getPhaseText()}</span></div>
                <div>Battery: <span className={`font-medium ${battery > 50 ? 'text-green-400' : battery > 20 ? 'text-amber-400' : 'text-red-400'}`}>{battery}%</span></div>
                <div>Cargo: <span className={`font-medium ${animState.hasCargo ? 'text-blue-400' : 'text-slate-400'}`}>{animState.hasCargo ? 'Loaded' : 'Empty'}</span></div>
                {animState.isLifting && <div className="text-purple-400 font-medium">⬆ Lifting...</div>}
              </div>
            </div>
          </Html>
        )}

        {/* REDESIGNED SHUTTLE - Based on Reference Image */}

        {/* Main body - Red-Orange base */}
        <mesh position={[0, BODY_HEIGHT / 2, 0]}>
          <boxGeometry args={[BODY_LENGTH, BODY_HEIGHT, BODY_WIDTH]} />
          <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.5} />
        </mesh>

        {/* Large CYAN CARGO PLATFORM on top - Main feature */}
        <mesh position={[0, BODY_HEIGHT + 0.04, 0]}>
          <boxGeometry args={[BODY_LENGTH - 0.08, 0.05, BODY_WIDTH - 0.08]} />
          <meshStandardMaterial
            color={cyanAccent}
            emissive={cyanAccent}
            emissiveIntensity={0.15}
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>

        {/* Cyan platform border/edge */}
        <mesh position={[0, BODY_HEIGHT + 0.065, 0]}>
          <boxGeometry args={[BODY_LENGTH - 0.06, 0.005, BODY_WIDTH - 0.06]} />
          <meshStandardMaterial color="#0099BB" roughness={0.4} metalness={0.4} />
        </mesh>

        {/* Metal grid loading area - FRONT (smaller, realistic) */}
        <group position={[-BODY_LENGTH / 2 + 0.15, BODY_HEIGHT + 0.01, 0]}>
          {/* Grid base */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.2, 0.015, BODY_WIDTH - 0.1]} />
            <meshStandardMaterial color={platformColor} roughness={0.3} metalness={0.85} />
          </mesh>
          {/* Grid bars */}
          {[-0.15, -0.05, 0.05, 0.15].map(z => (
            <mesh key={`front-grid-${z}`} position={[0, 0.008, z]}>
              <boxGeometry args={[0.18, 0.005, 0.01]} />
              <meshStandardMaterial color={detailColor} roughness={0.4} metalness={0.7} />
            </mesh>
          ))}
        </group>

        {/* Side Control Panels - Orange/Red with details */}
        {/* Left side panel */}
        <mesh position={[0, BODY_HEIGHT / 2, -BODY_WIDTH / 2 - 0.005]}>
          <boxGeometry args={[BODY_LENGTH - 0.15, BODY_HEIGHT - 0.02, 0.01]} />
          <meshStandardMaterial color={bodyColorDark} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Right side panel */}
        <mesh position={[0, BODY_HEIGHT / 2, BODY_WIDTH / 2 + 0.005]}>
          <boxGeometry args={[BODY_LENGTH - 0.15, BODY_HEIGHT - 0.02, 0.01]} />
          <meshStandardMaterial color={bodyColorDark} roughness={0.5} metalness={0.3} />
        </mesh>

        {/* Control buttons/indicators on side panel (right side) */}
        {[
          { x: -0.15, y: BODY_HEIGHT / 2, color: '#22C55E' },  // Green
          { x: -0.05, y: BODY_HEIGHT / 2, color: '#EAB308' },  // Yellow
          { x: 0.05, y: BODY_HEIGHT / 2, color: '#EF4444' },   // Red
          { x: 0.15, y: BODY_HEIGHT / 2, color: '#3B82F6' },   // Blue
        ].map((btn, i) => (
          <mesh key={`btn-${i}`} position={[btn.x, btn.y, BODY_WIDTH / 2 + 0.016]}>
            <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
            <meshStandardMaterial
              color={btn.color}
              emissive={btn.color}
              emissiveIntensity={0.4}
              roughness={0.6}
            />
          </mesh>
        ))}

        {/* White circular indicators (like in reference) */}
        {[0.25, 0.32].map((x, i) => (
          <mesh key={`indicator-${i}`} position={[x, BODY_HEIGHT / 2 + 0.02, BODY_WIDTH / 2 + 0.016]}>
            <cylinderGeometry args={[0.012, 0.012, 0.008, 12]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.6} />
          </mesh>
        ))}

        {/* Logo/Label area (white rectangle like in reference) */}
        <mesh position={[-0.2, BODY_HEIGHT / 2 - 0.01, BODY_WIDTH / 2 + 0.016]}>
          <boxGeometry args={[0.15, 0.03, 0.005]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
        </mesh>
        {/* Small black text area on logo */}
        <mesh position={[-0.2, BODY_HEIGHT / 2 - 0.01, BODY_WIDTH / 2 + 0.018]}>
          <boxGeometry args={[0.12, 0.018, 0.002]} />
          <meshStandardMaterial color="#000000" roughness={0.8} />
        </mesh>

        {/* Lifting platform (animated) - FIXED POSITION */}
        <group position={[0, animState.liftHeight, 0]}>
          {/* Lifting arms - simplified */}
          <mesh position={[0, BODY_HEIGHT + 0.02, -0.2]}>
            <boxGeometry args={[BODY_LENGTH - 0.12, 0.02, 0.04]} />
            <meshStandardMaterial
              color={animState.isLifting ? '#A855F7' : platformColor}
              emissive={animState.isLifting ? '#A855F7' : '#000000'}
              emissiveIntensity={animState.isLifting ? 0.3 : 0}
              roughness={0.25}
              metalness={0.85}
            />
          </mesh>
          <mesh position={[0, BODY_HEIGHT + 0.02, 0.2]}>
            <boxGeometry args={[BODY_LENGTH - 0.12, 0.02, 0.04]} />
            <meshStandardMaterial
              color={animState.isLifting ? '#A855F7' : platformColor}
              emissive={animState.isLifting ? '#A855F7' : '#000000'}
              emissiveIntensity={animState.isLifting ? 0.3 : 0}
              roughness={0.25}
              metalness={0.85}
            />
          </mesh>

          {/* Platform forks */}
          {[-0.25, 0, 0.25].map(x => (
            <mesh key={`fork-${x}`} position={[x, BODY_HEIGHT + 0.03, 0]}>
              <boxGeometry args={[0.04, 0.015, 0.45]} />
              <meshStandardMaterial color={platformColor} roughness={0.2} metalness={0.9} />
            </mesh>
          ))}

          {/* Cargo (Pallet + Carton Box) - ADJUSTED POSITION */}
          {animState.hasCargo && (
            <group position={[0, BODY_HEIGHT + 0.05, 0]}>
              {/* Inox Pallet */}
              <mesh position={[0, 0.015, 0]}>
                <boxGeometry args={[PALLET_WIDTH, 0.025, PALLET_DEPTH]} />
                <meshStandardMaterial color={COLORS.PALLET_INOX} roughness={0.2} metalness={0.9} />
              </mesh>
              {[-0.18, 0, 0.18].map(x => (
                <mesh key={`leg-${x}`} position={[x, 0.01, 0]}>
                  <boxGeometry args={[0.08, 0.02, 0.45]} />
                  <meshStandardMaterial color={COLORS.PALLET_INOX_DARK} roughness={0.3} metalness={0.85} />
                </mesh>
              ))}

              {/* Carton Box */}
              <group position={[0, 0.04 + BOX_HEIGHT / 2, 0]}>
                <mesh>
                  <boxGeometry args={[BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH]} />
                  <meshStandardMaterial color={COLORS.CARTON_BOX} roughness={0.85} metalness={0.05} />
                </mesh>
                {/* Packing tape */}
                <mesh position={[0, 0, BOX_DEPTH / 2 + 0.001]}>
                  <boxGeometry args={[BOX_WIDTH + 0.01, 0.04, 0.002]} />
                  <meshStandardMaterial color={COLORS.CARTON_TAPE} roughness={0.6} />
                </mesh>
                <mesh position={[0, BOX_HEIGHT / 2 + 0.001, 0]}>
                  <boxGeometry args={[BOX_WIDTH + 0.01, 0.002, 0.04]} />
                  <meshStandardMaterial color={COLORS.CARTON_TAPE} roughness={0.6} />
                </mesh>
              </group>
            </group>
          )}
        </group>

        {/* Wheels with rotation animation - positioned correctly */}
        {[
          [-BODY_LENGTH / 2 + 0.12, -BODY_WIDTH / 2 + 0.08],
          [-BODY_LENGTH / 2 + 0.12, BODY_WIDTH / 2 - 0.08],
          [BODY_LENGTH / 2 - 0.12, -BODY_WIDTH / 2 + 0.08],
          [BODY_LENGTH / 2 - 0.12, BODY_WIDTH / 2 - 0.08],
        ].map(([x, z], i) => (
          <mesh
            key={`wheel-${i}`}
            position={[x, 0.04, z]}
            rotation={[animState.wheelRotation, 0, 0]}
          >
            <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
            <meshStandardMaterial color={wheelColor} roughness={0.7} metalness={0.3} />
          </mesh>
        ))}

        {/* Wheel housings */}
        {[
          [-BODY_LENGTH / 2 + 0.12, -BODY_WIDTH / 2],
          [-BODY_LENGTH / 2 + 0.12, BODY_WIDTH / 2],
          [BODY_LENGTH / 2 - 0.12, -BODY_WIDTH / 2],
          [BODY_LENGTH / 2 - 0.12, BODY_WIDTH / 2],
        ].map(([x, z], i) => (
          <mesh key={`housing-${i}`} position={[x, 0.045, z * 0.85]}>
            <boxGeometry args={[0.12, 0.04, 0.07]} />
            <meshStandardMaterial color={bodyColorDark} roughness={0.4} metalness={0.4} />
          </mesh>
        ))}

        {/* Front/Back edge details */}
        {/* Front edge - darker */}
        <mesh position={[-BODY_LENGTH / 2 - 0.005, BODY_HEIGHT / 2, 0]}>
          <boxGeometry args={[0.01, BODY_HEIGHT, BODY_WIDTH]} />
          <meshStandardMaterial color={bodyColorDark} roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Back edge */}
        <mesh position={[BODY_LENGTH / 2 + 0.005, BODY_HEIGHT / 2, 0]}>
          <boxGeometry args={[0.01, BODY_HEIGHT, BODY_WIDTH]} />
          <meshStandardMaterial color={bodyColorDark} roughness={0.3} metalness={0.5} />
        </mesh>

        {/* Status lights - front (green) and back (red) */}
        <mesh position={[-BODY_LENGTH / 2 - 0.012, BODY_HEIGHT / 2 + 0.02, 0]}>
          <boxGeometry args={[0.008, 0.025, 0.06]} />
          <meshStandardMaterial
            color="#22C55E"
            emissive="#22C55E"
            emissiveIntensity={isDark ? 0.9 : 0.5}
          />
        </mesh>
        <mesh position={[BODY_LENGTH / 2 + 0.012, BODY_HEIGHT / 2 + 0.02, 0]}>
          <boxGeometry args={[0.008, 0.025, 0.06]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#EF4444"
            emissiveIntensity={isDark ? 0.7 : 0.4}
          />
        </mesh>
      </group>
    </>
  );
};

export default Shuttle;
