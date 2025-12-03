# 11. COMPONENT ARCHITECTURE & RELATIONSHIPS

This document describes the current architecture of components and how they connect with each other in the Trackify ASRS Dashboard system.

---

## 11.1. High-Level Architecture Overview

Trackify is an **Automated Storage and Retrieval System (ASRS)** monitoring dashboard built as a **Monorepo** with two main parts:

```
trackify/
├── backend/          # .NET Aspire + Clean Architecture
└── frontend/         # React + Vite + Three.js
```

---

## 11.2. Backend Architecture (Clean Architecture + .NET Aspire)

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Trackify.AppHost (Orchestrator)              │
│        Starts all services: API, PostgreSQL, Redis              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Trackify.API (Layer 4)                     │
│         Controllers, SignalR Hubs, OpenAPI Documentation        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Trackify.Application (Layer 2)                  │
│              Interfaces, Use Cases, DTOs, CQRS                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                Trackify.Infrastructure (Layer 3)                │
│         EF Core (Postgres), S7Net (PLC), Redis Cache            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Trackify.Domain (Layer 1)                     │
│               Entities, Value Objects (No dependencies)         │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Projects

| Project                    | Layer          | Responsibility                                            |
| -------------------------- | -------------- | --------------------------------------------------------- |
| `Trackify.AppHost`         | Orchestrator   | .NET Aspire host - starts PostgreSQL, Redis, and API      |
| `Trackify.API`             | Presentation   | REST endpoints, SignalR Hubs, OpenAPI docs                |
| `Trackify.Application`     | Application    | Business logic, Use Cases, DTOs, Validation               |
| `Trackify.Infrastructure`  | Infrastructure | Data access (EF Core), PLC communication (S7Net), Caching |
| `Trackify.Domain`          | Domain         | Core entities, Value Objects, Domain Events               |
| `Trackify.ServiceDefaults` | Shared         | OpenTelemetry, HealthChecks, Common configurations        |

### Dependency Flow

```
AppHost ──► API ──► Application ──► Domain
                        │              ▲
                        ▼              │
                 Infrastructure ───────┘
```

> **Note:** Infrastructure depends on Domain (not Application) following Clean Architecture's Dependency Inversion Principle.

---

## 11.3. Frontend Architecture (React + Vite + Zustand)

### Component Hierarchy

```
App.jsx
└── DashboardPage.jsx
        │
        ├── MainLayout
        │       └── GlobalHeader
        │               ├── BrandingArea (Logo + Title)
        │               ├── NavigationTabs (Dashboard, Devices, Orders...)
        │               └── StatusBar (Health, Throughput, Alarms, Clock, Theme)
        │
        ├── Canvas (React Three Fiber - 3D Scene)
        │       ├── WarehouseScene
        │       │       ├── WarehouseStructure
        │       │       │       ├── RackFrames (3D rack structure)
        │       │       │       ├── StorageCells (Storage bins)
        │       │       │       ├── Shuttle (Animated shuttle models)
        │       │       │       ├── Elevator (Vertical transport)
        │       │       │       ├── ShuttleRails (Track visualization)
        │       │       │       ├── AisleFloor (Floor plane)
        │       │       │       ├── Ground (Base surface)
        │       │       │       └── RowLabels (Row identifiers)
        │       │       │
        │       │       └── Lighting (Ambient + Directional)
        │       │
        │       ├── CameraController (Focus management)
        │       ├── OrbitControls (User camera control)
        │       └── Stats (Performance metrics - dev only)
        │
        ├── VisualizationDashboard (Stats overlay panel)
        │       └── WarehouseStats (Online/Error/Task counts)
        │
        ├── TaskListPanel (Active tasks list)
        │
        └── ShuttleFocusSelector (Shuttle selection dropdown)
```

### Directory Structure

```
frontend/src/
├── main.jsx                    # Entry point
├── App.jsx                     # Root component
├── index.css                   # Global styles (Tailwind)
│
├── components/                 # Shared/Reusable UI Components
│   └── Header/
│       ├── index.js
│       └── GlobalHeader.jsx    # Navigation + Status bar
│
├── features/                   # Feature-based Modules
│   ├── dashboard/
│   │   ├── DashboardPage.jsx   # Main dashboard with 3D view
│   │   └── components/
│   │       ├── TaskListPanel.jsx
│   │       └── warehouse/      # 3D Warehouse components
│   │           ├── index.jsx
│   │           ├── constants.js
│   │           ├── hooks.jsx
│   │           ├── Shuttle.jsx
│   │           ├── RackFrames.jsx
│   │           ├── StorageCells.jsx
│   │           ├── Elevator.jsx
│   │           ├── ShuttleRails.jsx
│   │           ├── AisleFloor.jsx
│   │           ├── Ground.jsx
│   │           ├── RowLabels.jsx
│   │           ├── CameraFocus.jsx
│   │           ├── cameraFocusStore.js
│   │           ├── CellLegend.jsx
│   │           ├── CellTooltip.jsx
│   │           ├── Conveyor.jsx
│   │           ├── VisualizationDashboard.jsx
│   │           ├── WarehouseHeatmap.jsx
│   │           └── WarehouseStats.jsx
│   │
│   ├── devices/                # Device management (planned)
│   └── orders/                 # Order/Task management (planned)
│
├── layouts/
│   ├── index.js
│   └── MainLayout.jsx          # Page layout wrapper
│
├── store/
│   └── useDashboardStore.js    # Zustand state management
│
├── services/
│   └── mockData.js             # Mock data + Simulation logic
│
├── hooks/                      # Custom React hooks
├── types/
│   └── index.js                # JSDoc type definitions
└── utils/                      # Utility functions
```

---

## 11.4. State Management (Zustand)

### Store Structure

```javascript
useDashboardStore
├── State
│   ├── shuttles[]              # Array of shuttle objects
│   ├── tasks[]                 # Array of active tasks
│   ├── selectedShuttle         # Currently focused shuttle
│   ├── isSimulating            # Simulation running flag
│   └── simulationIntervalId    # Interval reference
│
├── Actions
│   ├── startSimulation()       # Begin shuttle movement simulation
│   ├── stopSimulation()        # Pause simulation
│   ├── toggleSimulation()      # Toggle on/off
│   └── selectShuttle(id)       # Focus on specific shuttle
│
└── Selectors
    ├── selectShuttles          # Get all shuttles
    ├── selectOnlineCount       # Count online shuttles
    ├── selectErrorCount        # Count shuttles with errors
    └── selectActiveTaskCount   # Count active tasks
```

### Data Flow

```
┌─────────────────┐
│   mockData.js   │  (Simulation source)
│  - Initial data │
│  - Movement sim │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│useDashboardStore│  (Central state)
│  - Zustand      │
│  - Selectors    │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    ▼         ▼            ▼            ▼
┌───────┐ ┌───────┐ ┌──────────┐ ┌──────────┐
│Shuttle│ │Header │ │TaskPanel │ │StatsPanel│
│  3D   │ │Status │ │          │ │          │
└───────┘ └───────┘ └──────────┘ └──────────┘
```

---

## 11.5. 3D Warehouse Components (React Three Fiber)

### Component Relationships

```
WarehouseStructure (index.jsx)
│
├── Instances Setup
│   └── MergedMeshes for performance (bins, frames)
│
├── Static Structure
│   ├── RackFrames          # Steel rack structure
│   │   └── Uses: WAREHOUSE_CONFIG.BLOCK1, BLOCK2
│   │
│   ├── StorageCells        # Storage bins with status colors
│   │   └── Uses: occupancy data, hover states
│   │
│   ├── ShuttleRails        # Track rails in aisle
│   │   └── Uses: WAREHOUSE_CONFIG.AISLE
│   │
│   ├── AisleFloor          # Floor between blocks
│   └── Ground              # Base plane
│
├── Dynamic Elements
│   ├── Shuttle[]           # Animated shuttle models
│   │   ├── Position: from store (shuttles[].position)
│   │   ├── Status: ONLINE/OFFLINE/ERROR
│   │   └── Animation: useFrame() for smooth movement
│   │
│   └── Elevator            # Vertical transport
│       └── Position: fixed at BLOCK1.ELEVATOR_ROW
│
├── Camera System
│   ├── CameraFocusProvider # Context for focus state
│   ├── CameraController    # Smooth camera transitions
│   └── ShuttleFocusSelector# UI for shuttle selection
│
└── UI Overlays (HTML)
    ├── CellTooltip         # Hover info on cells
    └── CellLegend          # Color legend
```

### Coordinate System

```
        Y (Row: 0-23)
        ▲
        │
        │    ┌─────────────────────────────────┐
        │    │          Block 2 (8 depths)     │
        │    │         X: 4-11                 │
        │    ├─────────────────────────────────┤
        │    │      AISLE (X: 3)               │
        │    ├─────────────────────────────────┤
        │    │          Block 1 (3 depths)     │
        │    │         X: 0-2                  │
        │    │         [Elevator @ Row 14]     │
        │    └─────────────────────────────────┘
        │
        └──────────────────────────────────────► X (Depth: 0-11)

        Z (Layer: 0-6) - Vertical axis
```

---

## 11.6. Real-time Data Architecture (Planned)

### Communication Flow

```
┌──────────────┐                    ┌──────────────┐
│   PLC S7     │                    │   .NET API   │
│              │◄── Polling 200ms ──│              │
│ DB_Shuttle   │                    │  SignalR Hub │
│ DB_Tasks     │                    │              │
└──────────────┘                    └──────────────┘
                                           │
                                           │ WebSocket
                                           │ (SignalR Client)
                                           ▼
                                    ┌──────────────┐
                                    │    React     │
                                    │   Frontend   │
                                    │              │
                                    │ useDashboard │
                                    │    Store     │
                                    └──────────────┘
```

### Data Types

| Data Type        | Source                | Update Frequency | Transport |
| ---------------- | --------------------- | ---------------- | --------- |
| Shuttle Position | PLC `DB_Shuttle_Map`  | 200ms            | SignalR   |
| Shuttle Status   | PLC                   | 200ms            | SignalR   |
| Active Tasks     | PLC `DB_Active_Tasks` | On change        | SignalR   |
| Pending Tasks    | Database              | On request       | REST API  |
| Historical Data  | Database              | On request       | REST API  |

---

## 11.7. Key Integration Points

### 1. Store ↔ 3D Components

```jsx
// In Shuttle.jsx
const shuttles = useDashboardStore(selectShuttles);

// Render shuttles at their positions
{
  shuttles.map((shuttle) => <Shuttle key={shuttle.id} data={shuttle} />);
}
```

### 2. Store ↔ UI Components

```jsx
// In GlobalHeader.jsx
const onlineCount = useDashboardStore(selectOnlineCount);
const shuttles = useDashboardStore(selectShuttles);

// Display in status bar
<span>{onlineCount} Online</span>;
```

### 3. Simulation → Store

```javascript
// In useDashboardStore.js
startSimulation: () => {
  const intervalId = setInterval(() => {
    set((state) => ({
      shuttles: simulateWarehouseState(state.shuttles),
      tasks: updateTasks(state.tasks),
    }));
  }, 200);
};
```

### 4. Layout → Features

```jsx
// In DashboardPage.jsx
<MainLayout activeTab="dashboard">
  <Canvas>
    <WarehouseScene />
  </Canvas>
  <TaskListPanel />
</MainLayout>
```

---

## 11.8. Technology Stack Summary

| Layer            | Technology                   | Purpose                      |
| ---------------- | ---------------------------- | ---------------------------- |
| **3D Rendering** | React Three Fiber + Three.js | WebGL 3D visualization       |
| **UI Framework** | React 18 + Vite              | Component-based UI           |
| **Styling**      | Tailwind CSS                 | Utility-first CSS            |
| **State**        | Zustand                      | Lightweight state management |
| **Icons**        | Lucide React                 | Icon library                 |
| **Backend**      | .NET 8 + Aspire              | API + Orchestration          |
| **Database**     | PostgreSQL                   | Persistent storage           |
| **Cache**        | Redis                        | Real-time data caching       |
| **Real-time**    | SignalR                      | WebSocket communication      |
| **PLC**          | S7Net                        | Siemens PLC communication    |

---

## 11.9. Future Considerations

1. **SignalR Integration**: Replace mock data with real-time PLC data
2. **Authentication**: Add user authentication layer
3. **Multi-floor View**: Support for viewing multiple warehouse floors
4. **Analytics Dashboard**: Historical data visualization
5. **Mobile Responsive**: Optimize for tablet/mobile viewing
6. **Dark/Light Theme**: Already implemented, needs refinement
