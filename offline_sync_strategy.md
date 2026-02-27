# Offline-First Sync Strategy

This document outlines the architecture and data flow for the offline-first synchronization system.

## 1. Primary Data Flow
1.  **Welcome Page Prefetch**:
    *   Upon login, the system initiates a background prefetch of Dashboard, Registration, Patients, and Test data.
    *   **Strict Timeout**: The Welcome screen waits for any API responses for a maximum of **4 seconds**.
    *   **Handover**: After 4s (or if all fetches complete sooner), the UI transitions to the Dashboard, handing over any pending fetches to the background.

2.  **Local-First UI**:
    *   All UI reads (SELECT) are served from the **Local SQLite** database by default.
    *   This ensures near-instant page transitions and full offline capability.

3.  **Local-First Mutations**:
    *   Updates (INSERT, UPDATE, DELETE) are applied to the Local SQLite database immediately for instant UI feedback.
    *   Mutations are queued in the `pending_sync_queue` table in SQLite for background synchronization.
    *   *Exception*: Auth and System Settings bypass the queue and hit the source immediately for consistency.

4.  **On-Demand / Lazy Loading**:
    *   If a user navigates to a page where local data is missing (0 rows in SQLite for a main table), the backend automatically triggers a one-time remote fetch to initialize the local cache.

## 2. Background Sync Engine
The sync engine runs in the background with interleaved cycles:
*   **Pull Cycle (T+0s, every 20s)**: Fetches new records from the Source (MySQL/Bridge) based on timestamps and merges them into Local SQLite using `REPLACE INTO`.
*   **Push Cycle (T+10s, every 20s)**: Processes the `pending_sync_queue`, executing queued queries against the Source.
    *   **Time Limit**: Each Push cycle is limited to **10 seconds** to prevent blocking the Pull cycle.
    *   **Retry Logic**: Failed pushes are retried up to 5 times before being marked as 'error'.

## 3. Hard Refresh (Manual)
*   Manual refresh buttons in the UI trigger a **Hard Refresh**.
*   This sends an `X-Refresh: true` header to the server, which:
    1.  Bypasses the Local SQLite cache.
    2.  Fetches fresh data directly from the Source.
    3.  Mirrors the fresh data to SQLite.
*   **Cooldown**: Refresh buttons have a **20-30s cooldown** to prevent source rate-limiting.

## 4. Login Cache Reset
*   On every login, both **frontend stores** and **server-side SQLite** are fully cleared:
    1.  **Frontend**: `useAuthStore.login()` calls `clearStore()`/`clearCache()` on all 6 data stores (Dashboard, Registration, Patient, Test, Inquiry, Config) before setting the new user. This wipes persisted localStorage data.
    2.  **Server**: `WelcomeScreen` calls `POST /api/auth/clear-cache` which truncates all SQLite tables **except** `pending_sync_queue` (to preserve unsynced mutations).
    3.  **Prefetch**: After clearing, `WelcomeScreen` fetches fresh data from the server into both the frontend stores and SQLite.
*   **Result**: The first page load after login always shows current data from the source with no stale cache.

## 5. Conflict Resolution
*   **Source Priority for Pull**: Pull operations treat the Source as the truth for new records.
*   **Local Priority for Push**: Local changes are eventually pushed back to the Source. In case of a conflict where a record is modified both locally and on the server, the interleaved nature ensures that local changes are re-applied to the server in the next Push cycle.

## 6. Environment Configuration
*   `USE_LOCAL_MYSQL=true`: Directs the server to communicate with the local MySQL instance.
*   `BRIDGE_URL`/`TOKEN`: Used when connecting to the remote PHP bridge.
