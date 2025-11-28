# 9. PROJECT STRUCTURE & CONFIGURATION

This document defines the architectural layout and the required content for configuration files in the **Trackify** Monorepo, utilizing **.NET Aspire** and **Clean Architecture**.

## 9.1. Directory Tree (Monorepo)

```text
trackify/                       # Root Repository
├── .git/
├── .gitignore                  # Combined gitignore
├── README.md                   # Project documentation
├── docs/                       # Documentation folder
├── backend/                    # .NET Solution
│   ├── Trackify.sln
│   ├── src/
│   │   ├── Trackify.AppHost/           # [Orchestrator] Aspire Host Project (Start here)
│   │   ├── Trackify.ServiceDefaults/   # [Shared] OpenTelemetry & HealthChecks
│   │   ├── Trackify.Domain/            # [Layer 1] Entities, Value Objects (No dependencies)
│   │   ├── Trackify.Application/       # [Layer 2] Interfaces, Use Cases, DTOs
│   │   ├── Trackify.Infrastructure/    # [Layer 3] EF Core (Postgres), PLC (S7Net), Redis
│   │   └── Trackify.API/               # [Layer 4] Controllers, SignalR Hubs
│   └── tests/                  # Unit Tests
└── frontend/                   # React + Vite Application
    ├── public/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .eslintrc.cjs
    ├── .prettierrc
    └── src/
        ├── assets/
        ├── components/         # Shared UI (Buttons, Cards)
        ├── features/           # Feature Modules
        │   ├── dashboard/      # 3D Scene logic
        │   ├── devices/        # Shuttle/Lifter lists
        │   └── orders/         # Task management
        ├── hooks/              # Global Hooks (useStore)
        ├── layouts/            # MainLayout, Header
        ├── services/           # API & SignalR services
        ├── store/              # Zustand Store
        ├── App.jsx
        └── main.jsx