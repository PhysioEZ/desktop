# PhysioEZ: Local-First SQLite Cache — Implementation Plan

**Goal**: Fetch all data once on login, serve everything from local SQLite, only re-sync specific tables when a write/change event occurs. Eliminates repeated server fetches for every modal/page open.

**Architecture**: Event-Driven Local-First
- **Reads** → Always from local SQLite (< 2ms)
- **Writes** → Local first → background push to PHP Bridge → mark `_sync_status = 'synced'`
- **Initial Sync** → On welcome screen, priority tables first, deferred tables after 10s

---

## 📦 Batch 1 — Backend Bootstrap Sync (Server-Side)
> **Goal**: Expose an `/init_sync` endpoint that the frontend calls once on login.

### Status: ✅ Complete

### Files Modified

#### `server/src/services/SyncService.js`
- [x] Refactored `initialSync()` to accept a `wave` param (`'priority'` or `'deferred'`)
- [x] **Priority wave tables** (fetch immediately on login): `registration`, `patients`, `tests`, `attendance`, `payments`, `quick_inquiry`, `test_inquiry`
- [x] **Deferred wave tables** (fetch after 10s delay): `patient_master`, `employees`, `roles`, `branches`, `payment_methods`, `service_tracks`
- [x] Added `pullTablePaginated` logic (500 rows/page with loop) to avoid Hostinger timeouts
- [x] Added `syncTable(table, userToken)` — event-driven public method

#### `server/src/api/reception/router.js`
- [x] Added route: `POST /api/reception/init_sync`
- [x] Added route: `POST /api/reception/sync_table`

#### `server/src/api/reception/syncController.js` (NEW FILE)
- [x] `initSync` — responds immediately, runs priority wave, fires deferred wave after 10s
- [x] `syncTable` — accepts `table` or `tables[]`, responds immediately, syncs in background

#### `php-bridge/read.php`
- [x] Added `branch_id` filter support
- [x] Added `since` param support (delta sync)
- [x] Added `order_by` param support

#### `server/src/services/BridgeService.js`
- [x] `read()` now forwards `branch_id`, `since`, `order_by` to the bridge

---

## 📦 Batch 2 — Frontend Welcome Screen Sync Trigger
> **Goal**: Call `init_sync` during the welcome/splash screen, show progress.

### Status: ✅ Complete

### Files Modified

#### `frontend/src/screens/WelcomeScreen.tsx`
- [x] Calls `POST /api/reception/init_sync` on mount via `authFetch`
- [x] Shows live per-table sync status messages ("Syncing registration...", etc.)
- [x] Database icon status line shows real sync state
- [x] Navigates to dashboard after 4.5s regardless of sync speed
- [x] Gracefully handles offline state ("Proceeding offline...")
- [x] `syncFired` ref prevents double-fire in React StrictMode

---

## 📦 Batch 3 — Event-Driven Invalidation on Writes
> **Goal**: After any write action, trigger a targeted table re-sync instead of a full fetch.

### Status: ✅ Complete

### Files Modified

| Controller | Write Actions Covered | Tables Synced |
|---|---|---|
| `registration_submit_logic.js` | `submitRegistration` | `registration`, `patient_master` |
| `inquiry.js` | `submitInquiry`, `submitTestInquiry` | `quick_inquiry`, `test_inquiry` |
| `tests.js` | `addTestForPatient`, metadata update, item update, payment | `tests` |
| `attendance.js` | mark, revert | `attendance`, `patients` |
| `payments.js` | `handleAddPayment` | `payments`, `patients` |
| `treatmentPlans.js` | edit plan, change plan | `patients`, `payments` |

> All calls use `.catch(() => {})` — zero impact on response time. Sync fires in background after `res.json()`.

---

## 📦 Batch 4 — Migrate Page/Modal Reads to Local SQLite
> **Goal**: Every modal and list that currently calls the remote DB must now read from local SQLite.

### Status: ✅ Complete

### Files Migrated

#### `patients.js`
- [x] `fetchPatients` (list + pagination) — fully local SQLite
- [x] `fetchFilters` (doctors, treatments, statuses, counts) — fully local SQLite

#### `inquiry.js`
- [x] `fetchInquiries` (quick_inquiry + test_inquiry list) — local with remote fallback

#### `formOptions.js`
- [x] Referrers, payment_methods, employees — local SQLite
- [x] Config tables (test_staff, limb_types, etc.) — still remote but now **parallel** via `Promise.all`
- [x] Time slots (booked check) — local from registration table

#### `getAttendanceData.js`
- [x] Full attendance list + stats — fully local SQLite

#### `getAttendanceHistory.js`
- [x] Patient verify + history + stats — fully local SQLite

#### Previously done
- [x] `registration_manager.js` fetchRegistrations, fetchFilterOptions
- [x] `schedule.js` partially migrated

---

## 📦 Batch 5 — SQLite Schema Expansion
> **Goal**: Add all missing tables needed to serve modal data locally.

### Status: ✅ Complete

### What was done

#### `server/src/scripts/initCache.js` — 8 new tables added:
- [x] `notifications` — notification bell
- [x] `expenses` — expenses page
- [x] `notes` — patient notes
- [x] `referral_partners` — commission tracking
- [x] `system_settings` — maintenance mode flag
- [x] `app_updates` — update banner
- [x] `patients_treatment` — plan history (needed for financial calcs, now in PRIORITY wave)
- [x] Enhanced existing tables: `attendance` (+remarks, +approval_request_at), `employees` (+job_title, +photo_path), `payment_methods` (+method_code)

#### `php-bridge/config.php`
- [x] Added `patients_treatment` and `app_updates` to `$ALLOWED_TABLES`

#### `services/SyncService.js`
- [x] `patients_treatment` added to PRIORITY wave
- [x] `notifications`, `expenses`, `notes`, `referral_partners`, `system_settings`, `app_updates` added to DEFERRED wave
- [x] All new tables added to `PK_MAP`

> Script confirmed all tables created: `node server/src/scripts/initCache.js` output showed all new tables ready.

---

## 📦 Batch 6 — checkUpdates Optimization
> **Goal**: Replace the current polling approach with a smarter, lightweight check.

### Status: ✅ Complete

### What was done

#### `server/src/api/reception/checkUpdates.js`
- [x] **Completely rewrote** — removed all 8 parallel MySQL `COUNT(*)` queries
- [x] Now reads from the **local `sync_history` SQLite table** (single query, zero network)
- [x] If `sync_history.last_sync_at > client's last_sync`, that table has new data
- [x] Accepts optional `tables[]` query param — checks only requested tables
- [x] Returns `{ table: { updated: true, last_sync_at } }` (richer info for frontend)

#### `frontend/src/reception/Dashboard.tsx`
- [x] Restored 30s minimum interval guard (was 15s and commented out)
- [x] `handleSmartUpdate` now passes only dashboard-relevant tables in `tables[]` param
- [x] Avoids checking tables unrelated to the current page

> **Net result**: `check_updates` went from 8 MySQL trips → 1 SQLite read in <1ms.

---

## 📦 Batch 7 — PHP Bridge Optimizations
> **Goal**: Improve the bridge to support filtered/paginated fetching needed for large tables.

### Status: ❌ Not Started

### Files to Modify

#### `php-bridge/read.php`
- [ ] Add `branch_id` filter: `WHERE branch_id = ?` when param is provided
- [ ] Add `since` filter: `WHERE updated_at > ?` for delta pulls
- [ ] Add `order_by` param support (e.g., `ORDER BY created_at DESC`)

#### `php-bridge/sync.php`
- [ ] Filter by `branch_id` when provided (currently fetches across all branches)
- [ ] Return total row count alongside data (for pagination progress on welcome screen)

---

## 🗂️ Current State Summary

| Layer | Status |
|---|---|
| SQLite schema | ✅ Created (15 tables) |
| SyncService.pullTable | ✅ Exists |
| SyncService.initialSync | ✅ Exists (not filtered by branch) |
| SyncService.syncTable (event-driven) | ✅ Done |
| `/init_sync` endpoint | ✅ Done |
| `/sync_table` endpoint | ✅ Done |
| Dashboard reads (local) | ✅ Done |
| Registration manager reads (local) | ✅ Done |
| Schedule reads (local) | ✅ Done |
| Welcome screen sync trigger | ✅ Done |
| branch_id filter in PHP bridge | ✅ Done |
| Patients controller (local) | ❌ Still uses pool/remote |
| Tests controller (local) | ❌ Still uses pool/remote |
| Inquiry controller (local) | ❌ Still uses pool/remote |
| fetchData.js (slots, search) | ❌ Still uses pool/remote |
| formOptions.js (dropdowns) | ❌ Still uses pool/remote |
| Event-driven sync after writes | ✅ Done (Batch 3) |

---

## 🏃 Recommended Execution Order

1. **Batch 1 + 2** — Bootstrap sync + welcome screen (highest impact, unblocks everything)
2. **Batch 3** — Event-driven invalidation after writes
3. **Batch 4** — Migrate reads to local (can be parallelized across controllers)
4. **Batch 5** — Schema expansion (prerequisite: knowing what Batch 4 needs)
5. **Batch 6** — checkUpdates optimization
6. **Batch 7** — PHP bridge fine-tuning (lowest priority)

---

*Last updated: 2026-02-25*
*Batches 1–6 complete. Batch 7 (PHP bridge optimization) is optional and can be done on demand.*
