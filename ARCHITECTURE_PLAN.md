# PhysioEZ: Desktop Application Optimization & Architecture Plan

## 1. Project Overview
PhysioEZ is a clinic management system being developed as a Desktop application (Tauri + React + Node.js sidecar). 
- **Frontend**: React (Vite-based)
- **Local Backend**: Node.js (running as a Tauri sidecar)
- **Remote Data**: MySQL database hosted on Hostinger.
- **Legacy Context**: There is an existing PHP-based web application on the same Hostinger server.

## 2. The Problem: Latency (The "Distance" Problem)
Currently, the Node.js server running on the user's desktop connects directly to the remote MySQL database on Hostinger via the internet.
- **Network Latency**: Every database query faces a round-trip time (RTT) of 150ms-500ms.
- **Sequential Bottleneck**: Even with optimizations like `Promise.all`, heavy pages (Dashboard) that perform multiple lookups are noticeably slower than the legacy PHP webapp (which sits on the same server as the DB).
- **Environment Constraint**: The Hostinger shared hosting environment does NOT support a persistent Node.js process, but it DOES support PHP.

## 3. Proposed Hybrid Architecture Plan
To solve the speed issue and work within hosting constraints, we plan to implement a **Local Cache + Sync Engine** architecture.

### A. The Setup
1. **Cloud Layer (Source of Truth)**: Hostinger MySQL + PHP API (lightweight bridge).
2. **Local Processing Layer (Node.js Sidecar)**: 
   - A local Node.js server (Tauri Sidecar).
   - A local **SQLite** database (file-based, zero setup) to store a copy of critical data.
3. **UI Layer (React)**: 
   - Requests data from the local Node.js server.
   - UI reflects data from the local SQLite cache (instant response).

### B. The Sync Mechanism
- **Cache-on-Read**: When the user views a patient, Node.js fetches from Remote MySQL, serves it to UI, AND saves a copy in local SQLite.
- **Background Sync**: Node.js runs a background task to fetch "recent updates" (delta sync) from the remote DB every X minutes/seconds.
- **Optimistic UI**: When a user saves data, it saves to local SQLite immediately (UI updates instantly) and queues a background request to the remote DB.

## 4. Implementation Blueprint

### Phase 1: Local Data Layer
- Integrate `better-sqlite3` or `sqlite3` in the Node.js sidecar.
- Create schemas in SQLite that mirror essential MySQL tables (`patients`, `registration`, `tests`, `attendance`).

### Phase 2: Performance-First Router
- Modify the local Node.js controllers (`src/api/reception/`):
  - **Read Pattern**: `Check SQLite` -> `If found + not expired: Return` -> `Else: Fetch from MySQL + Update SQLite + Return`.
  - **Write Pattern**: `Write to MySQL` -> `On Success: Update SQLite`.

### Phase 3: PHP Bridge (Optional but Recommended)
- Instead of Node.js connecting directly to MySQL via port 3306 (which is slow), create a simple PHP endpoint on Hostinger that returns JSON. 
- Node.js hits the PHP URL over HTTPS. This is often faster and more stable in shared hosting environments than a direct remote MySQL connection.

### Phase 4: Dashboard Aggregation
- Move the heavy Dashboard logic (counting today's totals, revenue, etc.) to the local SQLite database.
- Since SQLite is on the local SSD, calculating these stats will take < 1ms, compared to the multiple network calls currently being made.

## 5. Key File References for the AI
- **Backend Configuration**: `/srv/http/admin/desktop/server/src/config/db.js` (Current MySQL Pool config).
- **Dashboard Logic**: `/srv/http/admin/desktop/server/src/api/reception/dashboard.js` (Currently optimized with `Promise.all` but still hits remote DB).
- **Search & Stats**: `/srv/http/admin/desktop/server/src/api/reception/fetchData.js`.
- **Frontend Config**: `/srv/http/admin/desktop/frontend/src/config.ts` (Toggle between local/remote URLs).

## 6. Goal
To provide the user with a "Zero Latency" experience where data loads instantly (from local cache) while ensuring the remote Hostinger database remains the absolute source of truth for multi-user consistency.


----------------------------------------------------------------------------------------------------------

Plan:

Ahhh got it.
You don’t want hype. You want a clean, structured spec file you can hand to an AI agent so it can execute without guessing.

Perfect. Here’s a concise, implementation-ready architecture summary you can drop into a project doc.

---

# PhysioEZ – Hybrid Desktop Architecture Specification

## Objective

Eliminate remote MySQL latency in the Tauri desktop application while maintaining Hostinger MySQL as the source of truth.

The system must:

* Provide near-zero UI latency.
* Maintain multi-user consistency.
* Avoid reliance on persistent Node.js processes on Hostinger.
* Keep all business logic inside the Node.js sidecar.

---

# 1. System Architecture

## Cloud Layer (Hostinger)

Components:

* MySQL database (source of truth)
* Minimal PHP API layer (stateless HTTPS endpoints)

Responsibilities:

* Execute SQL queries via prepared statements.
* Return JSON responses.
* Perform no business logic.
* Validate authentication token.
* Support delta synchronization via `updated_at` filtering.

PHP must not:

* Contain aggregation logic.
* Enforce business rules.
* Contain UI-specific logic.

---

## Desktop Layer

Components:

* Tauri
* Node.js sidecar (primary backend)
* SQLite (local cache database)
* React frontend

Responsibilities:

* All business logic
* All data validation
* All aggregation logic
* Sync engine
* Conflict detection
* Optimistic updates
* Local caching

Frontend must communicate only with local Node.js server.

No direct frontend → cloud communication.

---

# 2. Data Flow

## Read Flow

1. React requests data from Node.
2. Node queries SQLite.
3. If data exists → return immediately.
4. If not found:

   * Node calls PHP read endpoint.
   * PHP executes query against MySQL.
   * Node stores result in SQLite.
   * Node returns data to UI.

All UI reads must prefer SQLite.

---

## Write Flow (Optimistic)

1. User submits update.
2. Node writes to SQLite immediately.
3. Node marks row as `sync_status = pending`.
4. UI updates instantly.
5. Background sync queue pushes change to PHP.
6. On success → mark `sync_status = synced`.
7. On failure → retry with exponential backoff.

No write should block UI on network latency.

---

# 3. Synchronization Strategy

All MySQL tables participating in sync must include:

```sql
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

Optional:

```sql
version INT DEFAULT 1
```

Delta Sync Process:

* Node tracks `last_sync_timestamp`.
* Periodically calls PHP delta endpoint:

```sql
SELECT * FROM table WHERE updated_at > :last_sync
```

* Updates local SQLite copy.

Conflict Handling (Recommended):

* Compare `version` or `updated_at`.
* If remote is newer → overwrite local.
* If local is newer → push update.
* Log conflicts if detected.

---

# 4. PHP API Design

PHP must remain minimal.

Recommended Endpoints:

* `read.php`
* `write.php`
* `delta.php`
* `batch.php` (optional for grouped writes)

All endpoints must:

* Require Bearer token authentication.
* Use table whitelist.
* Use prepared statements.
* Return structured JSON.

No raw SQL strings accepted from client.

No arbitrary query execution allowed.

---

# 5. SQLite Schema

SQLite must mirror critical MySQL tables:

Examples:

* patients
* registration
* tests
* attendance

Additional local-only fields allowed:

* sync_status
* last_synced_at

Local DB acts as:

* Primary read source
* Write buffer
* Aggregation engine

---

# 6. Dashboard Optimization

All dashboard metrics must be calculated from SQLite.

No dashboard page should trigger remote calls.

Remote sync happens independently in background.

---

# 7. Security Requirements

* All PHP endpoints must require a secure API token.
* Token must not be hardcoded in frontend.
* Table access must be restricted via whitelist.
* All inputs must be validated.
* Only HTTPS communication allowed.

---

# 8. Hosting Constraints

Hostinger shared hosting:

* No persistent Node.js process allowed.
* PHP supported.
* MySQL accessible locally to PHP.

Architecture must comply with shared hosting limitations.

---

# 9. Non-Functional Goals

* UI response time: < 50ms for reads.
* No blocking network calls during UI interaction.
* Automatic background sync.
* Resilient to intermittent internet.
* Safe multi-user operation.

---

# 10. Design Principles

* Cloud = durability
* Desktop = performance
* PHP = database bridge only
* Node.js = business logic engine
* SQLite = performance layer
* MySQL = source of truth

---