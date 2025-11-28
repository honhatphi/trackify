# 3. FUNCTIONAL REQUIREMENTS

## 3.0. Global User Interface (GUI) & Navigation
The application must feature a persistent **Global Header** at the top of the screen to ensure consistent navigation and instant status awareness across the platform.

* **Branding Area (Left):**
    * **Project Name:** "Trackify".
    * **Subtitle:** "ASRS Warehouse Monitoring".
    * **Logo:** Minimalist grid/shuttle icon.
* **Main Navigation (Center - Tabs):**
    * The system must support rapid switching between modules without page reload (Single Page Application behavior):
        1.  **Dashboard:** The main 3D Real-time visualization view.
        2.  **Devices:** List of all Shuttles, Lifters, and Conveyors with detailed status and maintenance logs.
        3.  **Orders & History:** Management of active tasks and historical transaction logs.
        4.  **Analytics:** Charts and performance reports (Throughput, Utilization, Efficiency).
        5.  **Inventory:** Stock management view showing bin occupancy and SKU distribution.
* **System Status Indicators (Right - Real-time):**
    * **System Health:** Overall status indicator (e.g., Green for "Healthy", Red for "Critical").
    * **Throughput:** Real-time performance metric (e.g., "184 pallets/hour").
    * **Active Alarms:** Counter for active system alerts (e.g., "3 Alarms" displayed in Red).
* **Utilities:**
    * Real-time Digital Clock & Date (synchronized with Server time).
    * Theme Toggle (Dark/Light Mode).
    * User Profile & Logout menu.

---

## 3.1. Device Monitoring
* **3D Layout Visualization:**
    * Render the complete Racking System structure and Bin Locations.
    * **Color-coded Status:**
        * Blue: Occupied (Has Pallet).
        * Gray: Empty.
        * Red: Error/Blocked/Maintenance.
* **Real-time Tracking:**
    * Simulate **Shuttle** movement (X, Y axes) and **Lifter** movement (Z axis) smoothly using interpolation algorithms to avoid jitter.
    * **Interactive Elements:** Users can click on any equipment (Shuttle/Lifter) to open a detailed Pop-up showing:
        * Device ID.
        * Current Coordinates (X, Y, Z).
        * Battery Level (%).
        * Connection Status (Online/Offline).

---

## 3.2. Task & Order Monitoring
* **Task List UI:**
    * Display a live task list table via a semi-transparent Overlay or collapsible Side Panel to avoid obstructing the 3D view.
    * **Status Indication:**
        * 🟢 **Processing:** Currently active task (displaying progress %).
        * 🟡 **Pending:** Tasks in queue (sorted by priority/FIFO).
        * 🔴 **Error:** Suspended or failed tasks requiring intervention.
* **3D Visualization Support:**
    * **Path Rendering:** Draw a dynamic guide line or arrow from the current shuttle position to the target destination (Source or Destination Bin).
    * **Ghost Pallet:** Render a semi-transparent "ghost" pallet at the target location to visually indicate incoming cargo.
    * **Tooltip:** Hovering over a moving shuttle displays a quick info tooltip (e.g., "Task #101: Source A -> Target B").

---

## 3.3. System & Alerts
* **Instant Alerts:**
    * Display Toast/Snackbar notifications immediately when hardware errors, connection loss, or critical faults occur.
* **Battery Monitor:**
    * Visual warning when any Shuttle's battery level drops below a configurable threshold (e.g., < 20%).
* **Filtering & Slicing:**
    * **Layer Slicing:** Feature to toggle visibility of specific warehouse floors (layers), allowing operators to inspect lower levels without obstruction from upper levels.