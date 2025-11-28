# 5. IMPLEMENTATION NOTES

## 5.1. PLC Memory Mapping
Collaboration with the Automation Team is required to aggregate data into contiguous Structs (avoiding fragmentation):

* **`DB_Shuttle_Status` (Array of Structs):**
    * Index: Shuttle ID
    * Fields: `PosX` (Int), `PosY` (Int), `PosZ` (Int), `BatteryLevel` (Int), `ErrorCode` (Word).
* **`DB_Active_Tasks` (Array of Structs):**
    * Index: Shuttle ID
    * Fields: `TaskID` (String[10]), `SourceAddr` (String), `TargetAddr` (String), `Status` (Int).

## 5.2. Backend Strategy (.NET Core)
1.  **Bulk Read:** Strictly use "ReadBytes" to fetch the entire DB Block in a single request. Avoid reading individual tags to prevent network overload.
2.  **Threading:** Separate threads for Position Polling (High Priority, short interval) and Task List Polling (Low Priority, longer interval).
3.  **Connection Keep-Alive:** Implement auto-reconnect logic to handle PLC network interruptions.

## 5.3. Frontend UX
* **Glassmorphism:** Use semi-transparent backgrounds for Task List panels to maintain visibility of the 3D scene.
* **Performance:** Utilize `InstancedMesh` in Three.js to render thousands of Bin locations efficiently without dropping FPS.