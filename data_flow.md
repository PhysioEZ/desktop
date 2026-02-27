# Data Flow Architecture & Sync Strategy

## 1. Welcome Page Initialization (Prefetch)
- **Objective**: Populate the local cache immediately after login.
- **Behavior**:
    - Fetches `dashboard`, `inquiry`, `registration`, `patients`, `tests`, and all related sub-tables.
    - **Timeout**: Waits for a maximum of 3-4 seconds.
    - **Background Handover**: If fetching isn't complete within the timeout, the app navigates to the Dashboard while the fetch continues in the background.

## 2. Table Mapping & Storage
- **Local MySQL (Source)**: Primary data source.
- **Local SQLite (UI Cache)**: Used for instant rendering.
- **Mapping**: Fields and tables in SQLite must properly reflect the MySQL structure to ensure data integrity during sync.

## 3. On-Demand Fetching (Lazy Loading)
- **Check**: If a user navigates to a page (Patients, Tests, etc.) and the local SQLite data is missing/empty.
- **Fetch**: Request data from the server.
- **Immediate Cache**: Store the result in SQLite immediately.
- **Display**: Show data from SQLite after storage.

## 4. Hard Refresh Logic
- **Trigger**: User-initiated click on the Refresh button.
- **Mechanism**: Forces a server fetch (`x-force-remote` or similar headers).
- **Rule**: Fetches fresh data regardless of whether local changes exist.
- **Cooldown**: 20 seconds between refreshes to prevent server overload.

## 5. Local-First Mutations
- **Objective**: Instant UI feedback.
- **Behavior**: Updates (toggles, status changes, etc.) are applied to the local SQLite database first.
- **Queueing**: These changes are flagged or added to a queue for background synchronization.

## 6. Interleaved Background Sync
- **Timer 1 (Pull)**: Fetches updates from the source.
- **Timer 2 (Push/Post)**: Pushes local changes to the source.
- **Schedule**: 10-second interleaved cycle.
    - T+0s: **Fetch (Pull)**
    - T+10s: **Post (Push changes from queue)**
    - T+20s: **Fetch (Pull)**
    - ...
- **Post Logic**: 
    - Tracks a queue of 'POST' related queries.
    - Runs them sequentially for a maximum of 10 seconds.
    - If tasks remain after 10s, they are paused until the next 'Post' cycle.
