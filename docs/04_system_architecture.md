# 4. SYSTEM ARCHITECTURE & DATA FLOW

## 4.1. Hybrid Data Flow
The system employs a hybrid model to optimize Siemens S7 PLC performance:

1.  **Real-time Device Data:**
    * **Source:** PLC S7 (`DB_Shuttle_Map`).
    * **Flow:** `.NET Polling (200ms)` -> `Parse` -> `SignalR` -> `React (3D View)`.
    * **Content:** Coordinates (X/Y/Z), Battery Level, Error Codes, Online Status.

2.  **Task/Order Data:**
    * **Active Tasks:** Read directly from **PLC** (`DB_Active_Tasks`) to synchronize with physical movement.
    * **Pending Tasks:** Read from **Database** or a small PLC Buffer (`DB_Next_Tasks`) to reduce bandwidth overhead.

## 4.2. Technical Comparison: S7 Direct vs. MQTT
*(Reference for architectural decisions)*

| Feature | S7 Direct Polling (Current) | MQTT / IIoT Gateway (Best Practice) |
| :--- | :--- | :--- |
| **Mechanism** | **Request-Response:** Server constantly queries the PLC. | **Pub-Sub:** PLC reports only on data change (Report by Exception). |
| **Coupling** | **Tight:** App relies on specific memory addresses. | **Loose:** App only subscribes to Topics. |
| **Use Case** | Rapid deployment, internal network, standalone. | Large scale, multi-app integration, standardized IoT. |