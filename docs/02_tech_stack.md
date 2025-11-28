# 2. TECH STACK

## A. Frontend (User Interface)
* **Core Framework:** **React.js** (Latest version).
* **Visualization (3D Engine):** **Three.js** combined with **React Three Fiber (R3F)**.
    * *Purpose:* Rendering the 3D warehouse layout, Shuttles, Lifters, and movement animations.
* **State Management:** **Zustand**.
    * *Purpose:* Managing high-frequency state updates (coordinates) to ensure smooth 60 FPS performance.
* **UI Components:** **Ant Design**.
    * *Purpose:* Displaying professional data grids for Task Lists and standard UI elements.
* **Build Tool:** **Vite**.

## B. Backend (Core Processing)
* **Runtime:** **.NET 8 (C#)**.
* **Architecture:** **Clean Architecture** (Separated into Domain, Application, Infrastructure, API).
* **Orchestration:** **.NET Aspire**.
    * *Purpose:* Managing local development environment, service discovery, and deployment configuration.
* **Communication Library:** **S7NetPlus (S7.Net)**.
    * *Function:* Direct Read/Write communication with Siemens S7-1200/1500 PLCs via TCP/IP.
* **Real-time Protocol:** **SignalR**.
    * *Function:* Pushing data from Backend to Frontend via WebSocket.

## C. Database
* **Hot Data (Cache):** **Redis**.
    * *Usage:* Storing real-time snapshots of the warehouse state and Active Tasks.
    * *Management:* Provisioned via .NET Aspire container.
* **Cold Data (Persist):** **PostgreSQL**.
    * *Usage:* Storing error logs, throughput reports, and pending task queues.
    * *Driver:* `Npgsql` (Entity Framework Core provider).
    * *Management:* Provisioned via .NET Aspire container.

## D. DevOps & Observability
* **Dashboard:** **Aspire Dashboard**.
    * *Features:* Centralized Logs, Distributed Tracing, and Metrics for all services (API, Worker, Database, Cache).
* **Containerization:** **Docker** (Required for Aspire & Production Deployment).