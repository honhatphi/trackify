/**
 * @fileoverview Dashboard Page - Main 3D visualization with UI overlays
 * Renders the warehouse 3D scene with shuttles and glassmorphism UI panels
 * Per 03_functional_requirements.md and 06_ui_ux_design_system.md
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, Grid } from '@react-three/drei';
import {
  Play,
  Pause,
  ListTodo,
  BarChart3,
  Wifi,
  WifiOff,
  Pin,
  ChevronRight,
  X,
  Activity,
  AlertTriangle,
  Battery,
  Layers,
  Boxes,
} from 'lucide-react';

import WarehouseStructure, { CameraFocusProvider, CameraController, ShuttleFocusSelector } from './components/warehouse';
import VisualizationDashboard from './components/warehouse/VisualizationDashboard';
import { TaskListPanel } from './components/TaskListPanel';
import { MainLayout } from '@/layouts';
import { WAREHOUSE_CONFIG } from '@/services/mockData';
import {
  useDashboardStore,
  selectOnlineCount,
  selectErrorCount,
  selectActiveTaskCount,
  selectShuttles,
} from '@/store/useDashboardStore';

// =============================================================================
// CONSTANTS
// =============================================================================

const { GRID, AISLE, BLOCK1 } = WAREHOUSE_CONFIG;

/** Camera configuration for the warehouse view */
const CAMERA_CONFIG = {
  // Position: looking at warehouse from front-right-top angle
  position: [25, 20, 40],
  fov: 60,
  near: 0.1,
  far: 500,
};

/** OrbitControls configuration */
const CONTROLS_CONFIG = {
  // Target: center of warehouse (aisle center, ground level, middle row)
  target: [GRID.X / 2, 2, GRID.Y / 2],
  minDistance: 5,
  maxDistance: 100,
  maxPolarAngle: Math.PI / 2.1,
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Custom hook to detect dark mode changes
 * Observes the 'dark' class on document.documentElement
 */
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

// =============================================================================
// 3D SCENE COMPONENTS
// =============================================================================

/**
 * Warehouse 3D scene with structure and lighting
 * Shuttles are now rendered inside WarehouseStructure component
 */
const WarehouseScene = ({ orbitControlsRef }) => {
  const isDark = useDarkMode();

  // Theme-reactive scene colors
  const sceneColors = useMemo(() => ({
    background: isDark ? '#0f172a' : '#f1f5f9',      // Slate-900 / Slate-100
    gridCell: isDark ? '#334155' : '#94a3b8',        // Slate-700 / Slate-400
    gridSection: isDark ? '#475569' : '#64748b',    // Slate-600 / Slate-500
    hemisphereGround: isDark ? '#1e293b' : '#94a3b8', // Slate-800 / Slate-400
    ambientIntensity: isDark ? 0.8 : 1.2,
    mainLightIntensity: isDark ? 1.0 : 1.5,
    pointLightIntensity: isDark ? 30 : 50,
  }), [isDark]);

  return (
    <>
      {/* Industrial warehouse lighting - adjusted for theme */}
      <ambientLight intensity={sceneColors.ambientIntensity} />
      <directionalLight position={[30, 50, 30]} intensity={sceneColors.mainLightIntensity} castShadow />
      <directionalLight position={[-20, 40, -20]} intensity={isDark ? 0.5 : 0.8} />
      <directionalLight position={[0, 30, 50]} intensity={isDark ? 0.4 : 0.6} />
      <hemisphereLight intensity={isDark ? 0.5 : 0.8} color="#ffffff" groundColor={sceneColors.hemisphereGround} />

      {/* Spot lights simulating warehouse ceiling lights */}
      <pointLight position={[3, 15, 6]} intensity={sceneColors.pointLightIntensity} distance={25} color="#fff5e6" />
      <pointLight position={[9, 15, 12]} intensity={sceneColors.pointLightIntensity} distance={25} color="#fff5e6" />
      <pointLight position={[3, 15, 18]} intensity={sceneColors.pointLightIntensity} distance={25} color="#fff5e6" />
      <pointLight position={[9, 15, 6]} intensity={sceneColors.pointLightIntensity} distance={25} color="#fff5e6" />

      {/* Theme-reactive background */}
      <color attach="background" args={[sceneColors.background]} />

      {/* Grid helper - theme reactive */}
      <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={isDark ? 0.2 : 0.3}
        cellColor={sceneColors.gridCell}
        sectionSize={5}
        sectionThickness={isDark ? 0.4 : 0.6}
        sectionColor={sceneColors.gridSection}
        fadeDistance={80}
        position={[GRID.X / 2, -0.01, GRID.Y / 2]}
      />

      {/* Warehouse structure (racks, bins, aisle, elevator, shuttles) */}
      <WarehouseStructure />

      {/* Camera focus controller - follows selected shuttle */}
      <CameraController
        orbitControlsRef={orbitControlsRef}
        defaultTarget={CONTROLS_CONFIG.target}
        defaultPosition={CAMERA_CONFIG.position}
      />

      {/* Camera controls - Improved for smooth interaction */}
      <OrbitControls
        ref={orbitControlsRef}
        // Enable all interaction modes
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
        // Smooth damping
        enableDamping
        dampingFactor={0.08}
        // Distance limits
        minDistance={CONTROLS_CONFIG.minDistance}
        maxDistance={CONTROLS_CONFIG.maxDistance}
        // Allow full rotation - remove polar angle restriction for free movement
        maxPolarAngle={Math.PI}  // Allow viewing from any angle
        minPolarAngle={0}
        // Speed adjustments for better control
        rotateSpeed={0.8}
        panSpeed={0.8}
        zoomSpeed={0.8}
        // Smooth zoom
        zoomToCursor={true}
        // Initial target
        target={CONTROLS_CONFIG.target}
        // Keyboard controls
        enableKeys={true}
        keys={{
          LEFT: 'ArrowLeft',
          UP: 'ArrowUp',
          RIGHT: 'ArrowRight',
          DOWN: 'ArrowDown'
        }}
      />
    </>
  );
};

// =============================================================================
// UI OVERLAY COMPONENTS
// =============================================================================

/**
 * Simulation Control Panel - Minimal version for bottom-left corner
 * Will be removed in production
 */
const SimulationControls = () => {
  const isSimulating = useDashboardStore((state) => state.isSimulating);
  const startSimulation = useDashboardStore((state) => state.startSimulation);
  const stopSimulation = useDashboardStore((state) => state.stopSimulation);

  return (
    <div className="overlay-panel p-2 opacity-70 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${isSimulating ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
          SIM
        </span>
        <span
          className={`h-2 w-2 rounded-full ${isSimulating
            ? 'bg-emerald-500 animate-pulse'
            : 'bg-red-500'
            }`}
        />
        <button
          onClick={isSimulating ? stopSimulation : startSimulation}
          className={`p-1.5 rounded-lg text-white transition-all ${isSimulating
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
        >
          {isSimulating ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>
    </div>
  );
};

/**
 * Compact Stats Bar - Horizontal bar with key metrics
 */
const CompactStatsBar = () => {
  const onlineCount = useDashboardStore(selectOnlineCount);
  const errorCount = useDashboardStore(selectErrorCount);
  const taskCount = useDashboardStore(selectActiveTaskCount);
  const shuttles = useDashboardStore(selectShuttles);

  const avgBattery = shuttles.length
    ? Math.round(shuttles.reduce((sum, s) => sum + s.battery, 0) / shuttles.length)
    : 0;

  return (
    <div className="overlay-panel px-3 py-2 flex items-center gap-4">
      {/* Shuttles */}
      <div className="flex items-center gap-1.5" title="Shuttles Online">
        <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-900/40">
          <Activity size={14} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {onlineCount}/{shuttles.length}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />

      {/* Errors */}
      <div className="flex items-center gap-1.5" title="Errors">
        <div className={`p-1 rounded ${errorCount > 0 ? 'bg-red-100 dark:bg-red-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
          <AlertTriangle size={14} className={errorCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'} />
        </div>
        <span className={`text-sm font-bold ${errorCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
          {errorCount}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />

      {/* Tasks */}
      <div className="flex items-center gap-1.5" title="Active Tasks">
        <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/40">
          <Boxes size={14} className="text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {taskCount}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />

      {/* Battery */}
      <div className="flex items-center gap-1.5" title="Avg. Battery">
        <div className={`p-1 rounded ${avgBattery > 50 ? 'bg-emerald-100 dark:bg-emerald-900/40' : avgBattery > 20 ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
          <Battery size={14} className={avgBattery > 50 ? 'text-emerald-600 dark:text-emerald-400' : avgBattery > 20 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'} />
        </div>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {avgBattery}%
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />

      {/* Layers */}
      <div className="flex items-center gap-1.5" title="Storage Layers">
        <div className="p-1 rounded bg-purple-100 dark:bg-purple-900/40">
          <Layers size={14} className="text-purple-600 dark:text-purple-400" />
        </div>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {BLOCK1.LAYERS}
        </span>
      </div>
    </div>
  );
};

/**
 * Stats panel showing key metrics (legacy - now replaced by CompactStatsBar)
 */
const StatsPanel = () => {
  const onlineCount = useDashboardStore(selectOnlineCount);
  const errorCount = useDashboardStore(selectErrorCount);
  const taskCount = useDashboardStore(selectActiveTaskCount);
  const shuttles = useDashboardStore(selectShuttles);

  // Calculate average battery
  const avgBattery = shuttles.length
    ? Math.round(shuttles.reduce((sum, s) => sum + s.battery, 0) / shuttles.length)
    : 0;

  const stats = [
    {
      label: 'Shuttles Online',
      value: onlineCount,
      total: shuttles.length,
      icon: Activity,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Errors',
      value: errorCount,
      icon: AlertTriangle,
      color: 'text-error',
      bgColor: 'bg-error/10',
    },
    {
      label: 'Active Tasks',
      value: taskCount,
      icon: Boxes,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Avg. Battery',
      value: `${avgBattery}%`,
      icon: Battery,
      color: avgBattery > 50 ? 'text-success' : avgBattery > 20 ? 'text-warning' : 'text-error',
      bgColor: avgBattery > 50 ? 'bg-success/10' : avgBattery > 20 ? 'bg-warning/10' : 'bg-error/10',
    },
    {
      label: 'Storage Layers',
      value: BLOCK1.LAYERS,
      icon: Layers,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="overlay-panel p-4 w-full">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Quick Stats
      </h2>
      <div className="space-y-2.5 animate-stagger">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3
                         dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800
                         transition-all duration-200 cursor-pointer hover-lift
                         border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          >
            <div className={`rounded-xl p-2.5 ${stat.bgColor} transition-transform duration-200 group-hover:scale-110`}>
              <stat.icon size={20} className={`${stat.color} transition-transform duration-200`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {stat.value}
                {stat.total !== undefined && (
                  <span className="text-sm font-medium text-gray-400 ml-0.5">
                    /{stat.total}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Selected shuttle details panel
 */
const ShuttleDetails = () => {
  const selectedShuttle = useDashboardStore((state) => state.selectedShuttle);
  const selectShuttle = useDashboardStore((state) => state.selectShuttle);

  if (!selectedShuttle) return null;

  return (
    <div className="overlay-panel p-4 w-full animate-slide-in-up mt-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Shuttle Details
        </h2>
        <button
          onClick={() => selectShuttle(null)}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
                       dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-all duration-200"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Shuttle ID */}
        <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-4 text-center
                         border border-primary/20">
          <p className="font-mono text-2xl font-bold text-primary tracking-tight">
            {selectedShuttle.id}
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold transition-all duration-200 shadow-sm ${selectedShuttle.status === 'ERROR'
              ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700'
              : selectedShuttle.status === 'MOVING'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
              }`}
          >
            {selectedShuttle.status === 'MOVING' ? 'MOVING' : selectedShuttle.status === 'ERROR' ? 'ERROR' : 'IDLE'}
          </span>
        </div>

        {/* Position */}
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</span>
          <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white
                           bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            ({selectedShuttle.x}, {selectedShuttle.y}, L{selectedShuttle.z})
          </span>
        </div>

        {/* Battery */}
        <div className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Battery</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {selectedShuttle.battery.toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all duration-500 ease-out rounded-full ${selectedShuttle.battery > 50
                ? 'bg-success'
                : selectedShuttle.battery > 20
                  ? 'bg-warning'
                  : 'bg-error'
                }`}
              style={{ width: `${selectedShuttle.battery}%` }}
            />
          </div>
        </div>

        {/* Online Status */}
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Connection</span>
          <span
            className={`flex items-center gap-1.5 text-sm font-semibold ${selectedShuttle.isOnline ? 'text-success' : 'text-error'
              }`}
          >
            {selectedShuttle.isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {selectedShuttle.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to detect screen size for responsive layout
 */
const useResponsiveLayout = () => {
  const [layout, setLayout] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1280) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setLayout('mobile');
      else if (width < 1280) setLayout('tablet');
      else setLayout('desktop');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return layout;
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

/**
 * Dashboard Page - Full screen 3D visualization with UI overlays
 * Auto-starts simulation on mount
 */
const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const layout = useResponsiveLayout();
  // On mobile/tablet, visualization starts unpinned; on desktop, starts pinned
  const [isVisualizationPinned, setIsVisualizationPinned] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1280; // Only pinned on desktop (xl)
  });
  const startSimulation = useDashboardStore((state) => state.startSimulation);
  const stopSimulation = useDashboardStore((state) => state.stopSimulation);
  const errorCount = useDashboardStore(selectErrorCount);

  // OrbitControls ref for camera focus
  const orbitControlsRef = useRef(null);

  // Calculate system status for header
  const systemStatus = {
    health: errorCount > 0 ? 'warning' : 'healthy',
    throughput: 184, // Mock throughput
    alarms: errorCount,
  };

  // Responsive panel width based on screen size
  const panelWidth = layout === 'mobile' ? 'w-full' : layout === 'tablet' ? 'w-[360px]' : 'w-[420px]';

  // Auto-start simulation on mount
  useEffect(() => {
    startSimulation();

    // Cleanup on unmount
    return () => {
      stopSimulation();
    };
  }, [startSimulation, stopSimulation]);

  return (
    <CameraFocusProvider>
      <MainLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        systemStatus={systemStatus}
      >
        <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-50 dark:bg-slate-900">
          {/* Layer 0: 3D Canvas (Background) */}
          <Canvas
            shadows
            camera={{
              position: CAMERA_CONFIG.position,
              fov: CAMERA_CONFIG.fov,
              near: CAMERA_CONFIG.near,
              far: CAMERA_CONFIG.far,
            }}
            className="absolute inset-0"
          >
            <WarehouseScene orbitControlsRef={orbitControlsRef} />
            {/* FPS Stats for development - comment out in production */}
            <Stats className="!absolute !left-auto !right-4 !bottom-4 !top-auto" />
          </Canvas>

          {/* Top Bar: Task Toggle (Stats moved to Header) */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowTaskPanel(!showTaskPanel)}
              className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold
                       transition-all duration-300 ease-out border backdrop-blur-xl
                       ${showTaskPanel
                  ? 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-md'
                }`}
            >
              <ListTodo size={16} />
              <span className="hidden sm:inline">Tasks</span>
              {!showTaskPanel && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                  3
                </span>
              )}
            </button>
          </div>

          {/* Task Panel - Slides from right */}
          {showTaskPanel && (
            <div className="absolute top-16 right-4 z-20 pointer-events-auto animate-slide-in-right">
              <TaskListPanel
                isOpen={showTaskPanel}
                onClose={() => setShowTaskPanel(false)}
              />
            </div>
          )}

          {/* Visualization Panel - Left Side (Pinned = open), responsive width */}
          {isVisualizationPinned && (
            <div className={`absolute left-0 sm:left-4 top-0 sm:top-4 bottom-0 sm:bottom-16 ${panelWidth} z-20 pointer-events-auto animate-slide-in-left`}>
              <div className="h-full overlay-panel overflow-hidden shadow-2xl sm:rounded-xl">
                {/* Header with Pin toggle only */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 size={16} className="text-purple-500" />
                    <span className="hidden xs:inline">Warehouse</span> Analytics
                  </h3>
                  {/* Pin/Unpin Button - Unpin will close */}
                  <button
                    onClick={() => setIsVisualizationPinned(false)}
                    className="p-1.5 rounded-lg transition-colors bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/40"
                    title="Unpin to close"
                  >
                    <Pin size={14} />
                  </button>
                </div>
                {/* Content */}
                <div className="h-[calc(100%-40px)] overflow-hidden">
                  <VisualizationDashboard />
                </div>
              </div>
            </div>
          )}

          {/* Visualization Toggle (when unpinned/closed) - Left edge */}
          {!isVisualizationPinned && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 pointer-events-auto">
              <button
                onClick={() => setIsVisualizationPinned(true)}
                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white
                         px-2 py-3 rounded-r-xl shadow-lg transition-all group"
                title="Pin Analytics Panel"
              >
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                <BarChart3 size={16} />
              </button>
            </div>
          )}

          {/* Shuttle Details (when selected) - Shows as floating card, hidden on mobile when viz is open */}
          {!(layout === 'mobile' && isVisualizationPinned) && (
            <div className={`absolute ${isVisualizationPinned && layout !== 'mobile' ? 'left-[440px]' : 'left-4'} bottom-16 z-10 pointer-events-auto transition-all`}>
              <ShuttleDetails />
            </div>
          )}

          {/* Camera Focus Selector - Bottom Center */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
            <ShuttleFocusSelector
              shuttles={[
                { id: 'SH-001', layer: 1 },
                { id: 'SH-002', layer: 4 },
              ]}
            />
          </div>

          {/* Simulation Controls - Bottom Left Corner (less prominent, for dev only) */}
          <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
            <SimulationControls />
          </div>

          {/* Footer with instructions */}
          <footer className="absolute bottom-4 right-4 z-10 animate-fade-in pointer-events-none hidden md:block">
            <div className="rounded-xl bg-gray-900/60 px-4 py-2 text-[10px] text-white backdrop-blur-xl border border-white/10 shadow-lg">
              <span className="opacity-80 flex items-center gap-3">
                <span>🖱️ Drag to rotate</span>
                <span className="w-px h-3 bg-white/30"></span>
                <span>⚙️ Scroll to zoom</span>
                <span className="w-px h-3 bg-white/30"></span>
                <span>🔄 Right-click to pan</span>
              </span>
            </div>
          </footer>
        </div>
      </MainLayout>
    </CameraFocusProvider>
  );
};

export default DashboardPage;
