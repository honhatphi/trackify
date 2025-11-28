# 7. CODING CONVENTIONS

## 7.1. General Principles
* **Language:** English Only (Variables, Functions, Comments, Commits).
* **DRY (Don't Repeat Yourself):** Logic repeated more than twice must be refactored into a reusable function/component.
* **KISS (Keep It Simple, Stupid):** Prefer readable code over clever one-liners.

## 7.2. Frontend Guidelines (React + Three.js)

### A. File & Folder Structure
* **Grouping:** Group by **Feature**, not by file type.
    * *Bad:* `src/components/ShuttleList.jsx`
    * *Good:* `src/features/devices/components/ShuttleList.jsx`
* **Naming:**
    * **Components:** PascalCase (e.g., `WarehouseScene.jsx`).
    * **Hooks:** camelCase, prefix with 'use' (e.g., `useSocketStore.js`).
    * **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_BATTERY_LEVEL`).

### B. React Best Practices
* **State Management:** Use **Zustand** for global state (User, Socket Data). Use local `useState` for UI-only state (Modal Open/Close).
* **Prop Drilling:** Avoid passing props more than 2 levels deep. Use Context or Store instead.

### C. Three.js / React Three Fiber (R3F) Rules ⚠️
* **No Allocation in Loop:** NEVER create new objects (`new Vector3`, `new Material`) inside `useFrame`. This causes Garbage Collection spikes and frame drops.
    * *Solution:* Create objects outside the component or use `useMemo`.
* **Instancing:** Always use `<InstancedMesh>` for rendering repeating items like Bins/Pallets (e.g., rendering 10,000 bins).
* **Disposable:** Ensure Geometries and Materials are disposed of when the component unmounts to prevent memory leaks.

## 7.3. Backend Guidelines (.NET Core)

### A. Code Style
* **Async/Await:** Use `async/await` for all I/O operations (Database, PLC, File). Never use `.Result` or `.Wait()`.
* **Pattern:** Repository Pattern or Service Layer Pattern. Controllers should stay thin.

### B. PLC Communication (S7NetPlus)
* **Error Handling:** All PLC Read/Write operations must be wrapped in `try-catch` blocks.
* **Bulk Reading:** Always read full Data Blocks (Structs) into a byte array. **Do not** make multiple small requests.
* **DTOs:** Never return raw PLC bytes or Database Entities to the client. Map them to clear DTOs (e.g., `ShuttleStatusDto`).

### C. Variable Naming (C#)
* **Classes/Methods:** PascalCase (e.g., `GetShuttleStatus`).
* **Local Variables:** camelCase (e.g., `shuttlePosition`).
* **Interfaces:** Prefix with 'I' (e.g., `IShuttleService`).