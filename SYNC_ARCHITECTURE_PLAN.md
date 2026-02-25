# Global Sync Architecture & Local First Implementation Plan

## Objective
Convert all Reception modules to use a unified "Local-First" architecture where:
1. The UI strictly reads from the local SQLite database.
2. The UI performs mutations against the local database instantly (optimistic updates).
3. A global, intelligent background worker queues, batches, and pushes mutations to the central Hostinger MySQL server.
4. The background worker intelligently handles Delta Pulls to retrieve remote changes since the last sync.

## Current Progress (Completed)
- ✅ Dashboard (Reading local stats optionally, Needs full standardization)
- ✅ Inquiry (Reading local, Optimistic Updates, Local DB mutations)
- ✅ Registration (Reading local, Optimistic Updates, Local DB mutations)

## Modules Remaining for Local-First Conversion
- [ ] Schedule Page
- [ ] Patients List
- [ ] Tests and Diagnostics
- [ ] Attendance
- [ ] Payments/Wallet
- [ ] Expenses

## Phase 1: Global Background Sync Service Enhancements
The current `SyncService.js` mechanism relies on hard-reloading tokens and forced `.catch()` promises spread out across individual route handlers. We need to centralize this.

### Requirements:
1. **Intelligent Triggers:** Define sync intervals. E.g., Auto-sync every 60 seconds IF idle, OR immediately upon `_sync_status = 'pending'` mutation threshold (e.g., 5 pending actions) OR specifically requested by critical user flows.
2. **Conflict Resolution & Queueing:** Secure the `pushChanges` and `deltaPull` methodologies to never overlap or race condition against each other.
3. **Delta Pull Precision:** Guarantee that `_last_synced_at` correctly fetches only new data remotely without overriding local un-pushed `pending` rows.

## Phase 2: Refactoring Remaining Pages (UI & API)
For each remaining page (Schedule, Patients, etc.):

### API Refactoring (e.g., `patients.js`)
1. **Fetch:** Replace `pool.query` with `sqlite.prepare().all()` as the primary data return. If local read fails, fallback to remote `pool.query` and trigger an emergency background cache refill.
2. **Mutations (Create/Update/Delete):** 
   - Execute the mutation via `sqlite.prepare().run()`
   - Immediately set `_sync_status = 'pending'` on that local SQLite row.
   - Fire a `SyncService.triggerSync()` operation in the background.
   - Return 200 OK instantly. NEVER force the user to wait for `BridgeService.js` or `pool.query`.

### Frontend Refactoring (e.g., `Patients.tsx`)
1. **Optimistic Updates:** Upon mutating a record, immediately update the local Zustand/React state array using `.map()` or `.filter()`. 
2. **Remove Artificial Loading:** Stop wiping the internal array and triggering full screen `Loading...` spinners when saving a change. Trust the optimistic update and let the silent background `fetch()` refresh the grid natively.

## Phase 3: Push Events & Real-time Update Strategy
Define precisely WHEN the local database fetches newly created data from the Hostinger Web Server (created by OTHER branches or users):
1. **App Initialization:** On `WelcomeScreen.tsx` load (Priority Tables).
2. **Periodic Polling:** A global `useEffect` interval (e.g., every 3 minutes) calling `/api/reception/sync/delta`.
3. **Manual Trigger:** Refresh buttons on individual pages (e.g., Alt + R). 
4. **WebSocket/SSE (Optional Future):** If true real-time multi-branch collaboration is highly dependent, consider SSE triggers that simply tell the desktop app to "Run Delta Pull Now".
