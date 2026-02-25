# PhysioEZ: Stripped-Down Hybrid Architecture Plan

This plan focuses on a fast, minimal implementation of the **Local Cache + PHP Bridge** architecture to eliminate UI latency.

## 1. Components
1. **PHP Bridge (Remote)**: Lightweight scripts on Hostinger to read/write MySQL via JSON.
2. **SQLite Cache (Local)**: A `physio_cache.db` file inside the Node.js sidecar.
3. **Sync Engine (Local)**: Node.js service that orchestrates data flow.

## 2. The PHP Bridge (Hosted on Hostinger)
We have prepared 5 core files in `/php-bridge/`:
- `config.php`: DB credentials + Security token.
- `read.php`: Single record or list fetching.
- `write.php`: Single Insert/Update.
- `sync.php`: Delta fetching (returns only what changed since last sync).
- `batch.php`: Processes multiple writes in one transaction.

**Security**: Every request must include a valid User Token in the `Authorization: Bearer <token>` header. The PHP bridge validates this token against the `api_tokens` table in MySQL to ensure the session is active and not revoked.

## 3. Local Node.js Implementation (The "Sync Engine")

### Phase 1: Local SQLite Setup
- Initialize a local SQLite database using `better-sqlite3`.
- Create tables that mirror the production MySQL schema.
- Add a `_sync_status` column to every table (values: `synced`, `pending`, `conflict`).

### Phase 2: The "Smart" Database Service
Instead of controllers calling `pool.query` (Remote MySQL) directly, they will use `DbService.js`:

- **READs**:
  1. Return data from **Local SQLite** immediately (Latency < 2ms).
  2. In background, check if data is "stale".
  3. If stale, fetch from **PHP Bridge**, update SQLite, and push an update to UI via WebSockets/Event.

- **WRITEs**:
  1. Write to **Local SQLite** immediately.
  2. Mark row as `_sync_status = 'pending'`.
  3. Respond "Success" to UI immediately (Latency < 10ms).
  4. Trigger background "Push" to **PHP Bridge**.
  5. On Bridge success, mark as `'synced'`.

### Phase 3: Background Sync Loop
- Every 30 seconds (or on app start):
  - **PULL**: Call `sync.php?since=LAST_TIMESTAMP`.
  - **PUSH**: Find all `pending` rows in SQLite and send to `batch.php`.

## 4. Why this is "Stripped Down"?
- **No Complex ORM**: We use raw SQL queries locally (SQLite) and basic JSON over HTTP.
- **No Websockets on Server**: Uses simple polling for sync, which works perfectly on shared hosting.
- **Node.js handles the heavy lifting**: The PHP bridge is "dumb" and just executes what it's told (with safety checks).

## 5. Next Steps
1. **Install Dependencies**: `npm install better-sqlite3 axios` in the `server` directory.
2. **Initialize Local DB**: Create a script to generate the SQLite schema.
3. **Redirect Controllers**: Slowly migrate controllers from `config/db.js` to the new `services/SyncService.js`.

---
**Status**: PHP files are ready in `/php-bridge/`. 
**Action Required**: Upload `/php-bridge/` contents to a folder (e.g., `/public_api/`) on your Hostinger server.


errors


[1] COMMIT
[1] INSERT INTO sync_history (table_name, last_sync_at) VALUES ('tests', CURRENT_TIMESTAMP) ON CONFLICT(table_name) DO UPDATE SET last_sync_at=excluded.last_sync_at
[1] [Sync] ✓ tests: 422 rows
[1] [Sync] Pulling table: attendance...
[1] Bridge Service Error [read.php]: Request failed with status code 500
[1] [Sync] ✗ attendance: Request failed with status code 500
[1] [Sync] Pulling table: payments...
[1] INSERT INTO sync_history (table_name, last_sync_at) VALUES ('payments', CURRENT_TIMESTAMP) ON CONFLICT(table_name) DO UPDATE SET last_sync_at=excluded.last_sync_at
[1] [Sync] ✓ payments: 0 rows
[1] [Sync] Pulling table: quick_inquiry...
[1] BEGIN

COMMIT
[1] INSERT INTO sync_history (table_name, last_sync_at) VALUES ('quick_inquiry', CURRENT_TIMESTAMP) ON CONFLICT(table_name) DO UPDATE SET last_sync_at=excluded.last_sync_at
[1] [Sync] ✓ quick_inquiry: 7 rows
[1] [Sync] Pulling table: test_inquiry...
[1] BEGIN
[1] 
[1]                     INSERT INTO test_inquiry (inquiry_id,branch_id,created_by_employee_id,name,testname,reffered_by,mobile_number,expected_visit_date,status,created_at,address,limb,test_done_by,assigned_test_date, _last_synced_at)
[1]                     VALUES (3.0,1.0,2.0,'Rabiya khatoon','ncv','Dr P B Mishra MD (Ped)','9931259639','2025-12-31','pending','2025-12-30 05:19:34',NULL,NULL,NULL,NULL, CURRENT_TIMESTAMP)
[1]                     ON CONFLICT DO UPDATE SET inquiry_id=excluded.inquiry_id,branch_id=excluded.branch_id,created_by_employee_id=excluded.created_by_employee_id,name=excluded.name,testname=excluded.testname,reffered_by=excluded.reffered_by,mobile_number=excluded.mobile_number,expected_visit_date=excluded.expected_visit_date,status=excluded.status,created_at=excluded.created_at,address=excluded.address,limb=excluded.limb,test_done_by=excluded.test_done_by,assigned_test_date=excluded.assigned_test_date, _last_synced_at=CURRENT_TIMESTAMP
[1]                 
[1] COMMIT
[1] INSERT INTO sync_history (table_name, last_sync_at) VALUES ('test_inquiry', CURRENT_TIMESTAMP) ON CONFLICT(table_name) DO UPDATE SET last_sync_at=excluded.last_sync_at
[1] [Sync] ✓ test_inquiry: 1 rows
[1] [Sync] Pulling table: patients_treatment...
[1] [Sync] ✗ patients_treatment: table patients_treatment has no column named treatment_id
[1] [Sync] priority wave complete.
[1] [initSync] Priority wave complete.
[1] [Sync] Starting deferred wave (9 tables)...
[1] [Sync] Pulling table: patient_master...
[1] [Sync] ✗ patient_master: table patient_master has no column named first_registered_at
[1] [Sync] Pulling table: employees...
[1] [Sync] ✗ employees: table employees has no column named user_id
[1] [Sync] Pulling table: roles...
[1] BEGIN


 COMMIT
[1] INSERT INTO sync_history (table_name, last_sync_at) VALUES ('test_inquiry', CURRENT_TIMESTAMP) ON CONFLICT(table_name) DO UPDATE SET last_sync_at=excluded.last_sync_at
[1] [Sync] ✓ test_inquiry: 1 rows
[1] [Sync] Pulling table: patients_treatment...
[1] [Sync] ✗ patients_treatment: table patients_treatment has no column named treatment_id
[1] [Sync] priority wave complete.
[1] [initSync] Priority wave complete.
[1] [Sync] Starting deferred wave (9 tables)...
[1] [Sync] Pulling table: patient_master...
[1] [Sync] ✗ patient_master: table patient_master has no column named first_registered_at
[1] [Sync] Pulling table: employees...
[1] [Sync] ✗ employees: table employees has no column named user_id
[1] [Sync] Pulling table: roles...
[1] BEGIN
[1] 
[1]                     INSERT INTO roles (role_id,role_name, _last_synced_at)
[1]                     VALUES (1.0,'admin', CURRENT_TIMESTAMP)
[1]                     ON CONFLICT DO UPDATE SET role_id=excluded.role_id,role_name=excluded.role_name, _last_synced_at=CURRENT_TIMESTAMP
[1]                 
[1] 
[1]                     INSERT INTO roles (role_id,role_name, _last_synced_at)
[1]                     VALUES (3.0,'developer', CURRENT_TIMESTAMP)
[1]                     ON CONFLICT DO UPDATE SET role_id=excluded.role_id,role_name=excluded.role_name, _last_synced_at=CURRENT_TIMESTAMP
[1]                 
[1] 
[1]                     INSERT INTO roles (role_id,role_name, _last_synced_at)
[1]                     VALUES (2.0,'reception', CURRENT_TIMESTAMP)
[1]                     ON CONFLICT DO UPDATE SET role_id=excluded.role_id,role_name=excluded.role_name, _last_synced_at=CURRENT_TIMESTAMP
[1]                 
[1] COMMIT
[1] INSERT INTO sync_history (table_name, last_sync_at) VALUES ('roles', CURRENT_TIMESTAMP) ON CONFLICT(table_name) DO UPDATE SET last_sync_at=excluded.last_sync_at
[1] [Sync] ✓ roles: 3 rows
[1] [Sync] Pulling table: branches...
[1] [Sync] ✗ branches: table branches has no column named state
[1] [Sync] Pulling table: payment_methods...
[1] [Sync] ✗ payment_methods: table payment_methods has no column named method_id
[1] [Sync] Pulling table: service_tracks...
[1] INSERT INTO sync_history (table_name, last_sync_at) VALUES ('service_tracks', CURRENT_TIMESTAMP) ON CONFLICT(table_name) DO UPDATE SET last_sync_at=excluded.last_sync_at
[1] [Sync] ✓ service_tracks: 0 rows
[1] [Sync] Pulling table: notifications...
[1] [Sync] ✗ notifications: table notifications has no column named created_by_employee_id
[1] [Sync] Pulling table: expenses...
[1] [Sync] ✗ expenses: table expenses has no column named user_id
[1] [Sync] Pulling table: system_settings...
[1] [Sync] ✗ system_settings: table system_settings has no column named updated_by
[1] [Sync] deferred wave complete.
[1] [initSync] Deferred wave complete.

