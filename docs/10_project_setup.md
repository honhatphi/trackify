# PROJECT SETUP PROTOCOL: TRACKIFY

**Project Name:** Trackify\
**Architecture:** Monorepo (React + .NET Aspire + PostgreSQL)\
**Root Directory:** `trackify`

This document serves as the **Master Instruction** for initializing the
project.

------------------------------------------------------------------------

## 1. TARGET DIRECTORY STRUCTURE (REFERENCE)

``` text
trackify/
├── backend/
│   ├── src/
│   │   ├── Trackify.AppHost/
│   │   ├── Trackify.ServiceDefaults/
│   │   ├── Trackify.API/
│   │   ├── Trackify.Application/
│   │   ├── Trackify.Domain/
│   │   └── Trackify.Infrastructure/
└── frontend/
```

------------------------------------------------------------------------

## 2. EXECUTION INSTRUCTIONS

### STEP 1: ROOT INITIALIZATION

``` bash
mkdir trackify
cd trackify
git init
```

`.gitignore`:

``` plaintext
# Node & Frontend
node_modules/
dist/
build/
.env
.DS_Store

# .NET & Backend
bin/
obj/
.vs/
*.user
*.suo
[Dd]ebug/
[Rr]elease/
appsettings.Development.json
!appsettings.json
```

------------------------------------------------------------------------

### STEP 2: BACKEND SETUP (ASPIRE + CLEAN ARCHITECTURE)

``` bash
mkdir backend
cd backend
dotnet new sln -n Trackify
```

**Create Projects**

``` bash
dotnet new classlib -n Trackify.Domain -o src/Trackify.Domain
dotnet new classlib -n Trackify.Application -o src/Trackify.Application
dotnet new classlib -n Trackify.Infrastructure -o src/Trackify.Infrastructure
dotnet new webapi -n Trackify.API -o src/Trackify.API
dotnet new xunit -n Trackify.Tests -o tests/Trackify.Tests
dotnet new aspire-apphost -n Trackify.AppHost -o src/Trackify.AppHost
dotnet new aspire-servicedefaults -n Trackify.ServiceDefaults -o src/Trackify.ServiceDefaults
```

**Add Projects to Solution**

``` bash
dotnet sln add src/Trackify.Domain/Trackify.Domain.csproj
dotnet sln add src/Trackify.Application/Trackify.Application.csproj
dotnet sln add src/Trackify.Infrastructure/Trackify.Infrastructure.csproj
dotnet sln add src/Trackify.API/Trackify.API.csproj
dotnet sln add src/Trackify.AppHost/Trackify.AppHost.csproj
dotnet sln add src/Trackify.ServiceDefaults/Trackify.ServiceDefaults.csproj
dotnet sln add tests/Trackify.Tests/Trackify.Tests.csproj
```

**Add References**

``` bash
dotnet add src/Trackify.Application/Trackify.Application.csproj reference src/Trackify.Domain/Trackify.Domain.csproj
dotnet add src/Trackify.Infrastructure/Trackify.Infrastructure.csproj reference src/Trackify.Application/Trackify.Application.csproj
dotnet add src/Trackify.Infrastructure/Trackify.Infrastructure.csproj reference src/Trackify.Domain/Trackify.Domain.csproj
dotnet add src/Trackify.API/Trackify.API.csproj reference src/Trackify.Application/Trackify.Application.csproj
dotnet add src/Trackify.API/Trackify.API.csproj reference src/Trackify.Infrastructure/Trackify.Infrastructure.csproj
dotnet add src/Trackify.API/Trackify.API.csproj reference src/Trackify.ServiceDefaults/Trackify.ServiceDefaults.csproj
dotnet add src/Trackify.AppHost/Trackify.AppHost.csproj reference src/Trackify.API/Trackify.API.csproj
dotnet add tests/Trackify.Tests/Trackify.Tests.csproj reference src/Trackify.API/Trackify.API.csproj
dotnet add tests/Trackify.Tests/Trackify.Tests.csproj reference src/Trackify.Domain/Trackify.Domain.csproj
```

**Install Packages**

``` bash
dotnet add src/Trackify.Infrastructure package S7netplus
dotnet add src/Trackify.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add src/Trackify.Infrastructure package Microsoft.EntityFrameworkCore.Tools
dotnet add src/Trackify.Infrastructure package StackExchange.Redis
dotnet add src/Trackify.API package Serilog.AspNetCore
dotnet add src/Trackify.AppHost package Aspire.Hosting.PostgreSQL
dotnet add src/Trackify.AppHost package Aspire.Hosting.Redis
dotnet add src/Trackify.AppHost package Aspire.Hosting.NodeJs
```

------------------------------------------------------------------------

### STEP 3: FRONTEND SETUP (REACT + VITE)

``` bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom zustand axios clsx tailwind-merge lucide-react
npm install three @types/three @react-three/fiber @react-three/drei
npm install antd
npm install -D tailwindcss postcss autoprefixer prettier eslint-config-prettier
npx tailwindcss init -p
```

**Create Folders**

``` bash
mkdir -p src/assets src/components src/features/dashboard src/features/orders src/features/devices src/hooks src/layouts src/services src/store src/utils
```

------------------------------------------------------------------------

### STEP 4: FRONTEND CONFIGURATION

#### tailwind.config.js

``` javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1E40AF' },
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        neutral: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
```

#### vite.config.js

``` javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true, secure: false },
      '/hubs': { target: 'http://localhost:5000', ws: true }
    }
  }
})
```

#### .prettierrc

``` json
{
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "es5",
  "endOfLine": "auto"
}
```

------------------------------------------------------------------------

### STEP 5: VERIFICATION & RUNNING

``` bash
cd backend
dotnet run --project src/Trackify.AppHost
```

Open Aspire Dashboard URL (example: http://localhost:18888).

Expected running services:

-   PostgreSQL\
-   Redis\
-   Trackify.API\
-   Frontend (if configured)

------------------------------------------------------------------------

End of Protocol.
