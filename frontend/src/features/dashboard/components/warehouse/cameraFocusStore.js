/**
 * @fileoverview Camera Focus Store using Zustand
 * This solves the React Context bridge issue between Canvas and DOM
 * Zustand stores work across React boundaries including React Three Fiber Canvas
 */

import { create } from 'zustand';

// Shuttle positions registry (outside React)
const shuttlePositions = new Map();

export const useCameraFocusStore = create((set) => ({
  // State
  isFollowing: false,
  targetId: null,
  followMode: 'smooth',

  // Actions
  focusOnShuttle: (shuttleId) => {
    console.log('[CameraFocusStore] focusOnShuttle:', shuttleId);
    console.log('[CameraFocusStore] Available shuttles:', Array.from(shuttlePositions.keys()));
    console.log('[CameraFocusStore] Position:', shuttlePositions.get(shuttleId));
    set({
      isFollowing: true,
      targetId: shuttleId,
    });
  },

  clearFocus: () => {
    set({
      isFollowing: false,
      targetId: null,
    });
  },

  // Shuttle position management (using external Map for performance)
  registerShuttle: (id, position) => {
    shuttlePositions.set(id, position);
  },

  unregisterShuttle: (id) => {
    shuttlePositions.delete(id);
  },

  getShuttlePosition: (id) => {
    return shuttlePositions.get(id);
  },

  getAllShuttles: () => {
    return Array.from(shuttlePositions.entries()).map(([id, pos]) => ({
      id,
      position: pos,
    }));
  },
}));
