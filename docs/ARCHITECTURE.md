# System Architecture

## Overview

This project is a re-architecture of the ProSpine management system into a desktop-first application.

## Directory Structure

- **`desktop/`**: Root of the new application.
  - **`frontend/`**: The React application (UI).
    - Uses **Vite** for building.
    - Uses **Axios** for API communication.
    - **`src/reception/`**: Views and logic specific to Reception role.
    - **`src/admin/`**: Views and logic specific to Admin role.
    - **`src/config.ts`**: Environment configuration (Dev/Prod API URLs).
  - **`server/`**: The PHP API layer.
    - **`api/`**: JSON endpoints (No HTML rendering).
      - `reception/`: Endpoints for front-desk operations.
      - `admin/`: Endpoints for management operations.
    - **`common/`**: Shared resources (DB connection, Helpers).
  - **`docs/`**: Project documentation and changelogs.

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS (Pending), Vite.
- **Backend API**: Native PHP 8.x (Stateless JSON API).
- **Database**:
  - **Development**: MySQL (Localhost `prospine`).
  - **Production/Offline**: SQLite (Planned for Phase 3).
- **Desktop Wrapper**: Tauri (Planned for Phase 4).

## Data Flow

1. **Request**: React Frontend via Axios -> PHP API (`/desktop/server/api/...`).
2. **Process**: PHP authenticates (Session/Token) and queries MySQL.
3. **Response**: PHP returns JSON `{ "status": "success", "data": ... }`.
4. **Render**: React updates state and DOM.
