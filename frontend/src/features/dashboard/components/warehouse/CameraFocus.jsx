/**
 * @fileoverview Camera Focus components for shuttle tracking
 * Uses Zustand store to solve React Three Fiber context bridge issue
 */

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCameraFocusStore } from './cameraFocusStore';

// =============================================================================
// HOOK FOR EASY ACCESS
// =============================================================================

/**
 * Hook to access camera focus functionality
 * Works both inside and outside Canvas
 */
export const useCameraFocus = () => {
  const isFollowing = useCameraFocusStore(state => state.isFollowing);
  const targetId = useCameraFocusStore(state => state.targetId);
  const followMode = useCameraFocusStore(state => state.followMode);
  const focusOnShuttle = useCameraFocusStore(state => state.focusOnShuttle);
  const clearFocus = useCameraFocusStore(state => state.clearFocus);
  const registerShuttle = useCameraFocusStore(state => state.registerShuttle);
  const unregisterShuttle = useCameraFocusStore(state => state.unregisterShuttle);
  const getShuttlePosition = useCameraFocusStore(state => state.getShuttlePosition);
  const getAllShuttles = useCameraFocusStore(state => state.getAllShuttles);

  return {
    isFollowing,
    targetId,
    followMode,
    focusOnShuttle,
    clearFocus,
    registerShuttle,
    unregisterShuttle,
    getShuttlePosition,
    getAllShuttles,
  };
};

// =============================================================================
// PROVIDER (now just a passthrough for compatibility)
// =============================================================================

/**
 * Provider component - kept for API compatibility
 * With Zustand, no actual provider is needed
 */
export const CameraFocusProvider = ({ children }) => {
  return children;
};

// =============================================================================
// CAMERA CONTROLLER COMPONENT
// =============================================================================

/**
 * Camera controller that follows focused shuttle
 * Smart camera:
 * - When shuttle moves along rail: camera follows from behind
 * - When shuttle enters rack: camera stays opposite to see the action
 * - Smooth transitions between positions
 */
export const CameraController = ({ orbitControlsRef, defaultTarget, defaultPosition }) => {
  const { camera } = useThree();
  // Get state values with selectors for proper reactivity
  const isFollowing = useCameraFocusStore(state => state.isFollowing);
  const targetId = useCameraFocusStore(state => state.targetId);
  const getShuttlePosition = useCameraFocusStore(state => state.getShuttlePosition);

  // Smoothing refs
  const currentTarget = useRef(new THREE.Vector3(...defaultTarget));
  const currentPosition = useRef(new THREE.Vector3(...defaultPosition));
  const isTransitioning = useRef(false);

  // Track shuttle movement for smart camera positioning
  const lastShuttlePos = useRef(null);
  const cameraZSide = useRef(1); // Which side of Z axis camera is on (1 = positive Z, -1 = negative Z)

  // Camera settings - side view, easier to follow
  const CAMERA_DISTANCE_Z = 3;    // Distance along Z axis (closer)
  const CAMERA_HEIGHT = 0.6;      // Height above shuttle (lower for better view)
  const CAMERA_SIDE_X = 0;        // Side offset (0 to stay in aisle)
  const TARGET_SMOOTHING = 0.06;  // Smooth target following
  const CAMERA_SMOOTHING = 0.04;  // Smooth camera movement
  const SIDE_SWITCH_THRESHOLD = 0.2; // How much Z movement before considering side switch

  useFrame(() => {
    if (!isFollowing || !targetId) {
      // Smoothly return to default view when not following
      if (isTransitioning.current) {
        currentTarget.current.lerp(new THREE.Vector3(...defaultTarget), 0.03);
        currentPosition.current.lerp(new THREE.Vector3(...defaultPosition), 0.03);

        if (orbitControlsRef?.current) {
          orbitControlsRef.current.target.copy(currentTarget.current);
        }
        camera.position.copy(currentPosition.current);

        // Check if we've arrived at default position
        if (currentTarget.current.distanceTo(new THREE.Vector3(...defaultTarget)) < 0.1) {
          isTransitioning.current = false;
          lastShuttlePos.current = null;
          if (orbitControlsRef?.current) {
            orbitControlsRef.current.enabled = true;
          }
        }
      }
      return;
    }

    const shuttlePos = getShuttlePosition(targetId);
    if (!shuttlePos) {
      // Only warn occasionally to avoid console spam
      return;
    }

    // Disable orbit controls while following
    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = false;
    }
    isTransitioning.current = true;

    // Detect sustained movement direction to decide camera side
    if (lastShuttlePos.current) {
      const deltaZ = shuttlePos.z - lastShuttlePos.current.z;

      // Only switch camera side on significant, sustained movement
      if (deltaZ > SIDE_SWITCH_THRESHOLD) {
        cameraZSide.current = -1;
      } else if (deltaZ < -SIDE_SWITCH_THRESHOLD) {
        cameraZSide.current = 1;
      }
    }
    lastShuttlePos.current = { ...shuttlePos };

    // Target: look at shuttle position
    const targetPos = new THREE.Vector3(
      shuttlePos.x,
      shuttlePos.y + 0.3, // Slightly above shuttle center
      shuttlePos.z
    );

    // Camera position: side view with good height
    const cameraTargetPos = new THREE.Vector3(
      shuttlePos.x + CAMERA_SIDE_X,              // Side offset
      shuttlePos.y + CAMERA_HEIGHT,              // Above shuttle
      shuttlePos.z + (cameraZSide.current * CAMERA_DISTANCE_Z) // Behind based on direction
    );

    // Smooth interpolation for fluid camera movement
    currentTarget.current.lerp(targetPos, TARGET_SMOOTHING);
    currentPosition.current.lerp(cameraTargetPos, CAMERA_SMOOTHING);

    // Update camera
    camera.position.copy(currentPosition.current);
    camera.lookAt(currentTarget.current);

    // Update orbit controls target
    if (orbitControlsRef?.current) {
      orbitControlsRef.current.target.copy(currentTarget.current);
    }
  });

  return null;
};

// =============================================================================
// SHUTTLE SELECTOR UI COMPONENT
// =============================================================================

/**
 * UI component for selecting which shuttle to focus on
 * Renders outside Canvas
 */
export const ShuttleFocusSelector = ({ shuttles = [] }) => {
  const { isFollowing, targetId, focusOnShuttle, clearFocus } = useCameraFocus();

  // Default shuttle list if not provided
  const shuttleList = shuttles.length > 0 ? shuttles : [
    { id: 'SH-001', layer: 1 },
    { id: 'SH-002', layer: 4 },
  ];

  return (
    <div className="overlay-panel p-3 animate-fade-in-scale">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Camera Focus
          </span>
          {isFollowing && (
            <button
              onClick={clearFocus}
              className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-600 dark:text-red-400
                       hover:bg-red-500/30 transition-colors font-medium"
            >
              Exit Focus
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {shuttleList.map((shuttle) => (
            <button
              key={shuttle.id}
              onClick={() => focusOnShuttle(shuttle.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                       transition-all duration-200 border
                       ${targetId === shuttle.id
                         ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/30'
                         : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                       }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                targetId === shuttle.id ? 'bg-white animate-pulse' : 'bg-amber-500'
              }`} />
              <span>{shuttle.id}</span>
              <span className="text-xs opacity-70">L{shuttle.layer}</span>
            </button>
          ))}
        </div>

        {isFollowing && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Following {targetId}
          </div>
        )}
      </div>
    </div>
  );
};
