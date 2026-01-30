# 🗺️ Patient Management Migration Plan (Node.js)

This document outlines the step-by-step refactoring of the Patient Management system to ensure it is dynamic, modular, and high-performance.

---

## 🏗️ Phase 1: Modular Backend Architecture

We will break down the monolithic `patients.js` into specialized, single-responsibility controllers.

### 1.1 Core Patients API (`patients.js`)

- **Responsibility**: Fetching list, filtering, search, and pagination.
- **Goal**: Zero database updates during GET requests. No side-effects.
- **Optimization**: Use an optimized SQL query to fetch "Effective Balance" in a single pass (avoiding the current loop-based N+1 query issue).

### 1.2 Treatment Plan API (`treatmentPlans.js`) - **New**

- **Responsibility**: Dynamic plan allocation and migration.
- **No Hardcoding**: Will fetch available pricing/track data from `service_tracks`.
- **Archive Logic**: Handle the "Closing" of old plans and starting new ones with carried-over credit.

### 1.3 Attendance API (`attendance.js`)

- **Responsibility**: Marking attendance, reverting sessions, and calculating progress.
- **Financial Validation**: Ensure a session cannot be marked without sufficient balance or admin approval (migrating the complex PHP logic).

### 1.4 Ledger & Finance API (`finance.js` / `payments.js`)

- **Responsibility**: Managing the "Patient Wallet", recording payments, and due amounts.

### 1.5 Token API (`tokens.js`) - **New**

- **Responsibility**: Generating daily sequence IDs and providing data for print modals.

---

## 🧬 Phase 2: Dynamic Treatment Logic

Removing "Daily", "Advance", and "Package" hardcodings.

1.  **Service Track Integration**: When registration or plan change occurs, the UI will fetch tracks from the DB.
2.  **Pricing Engine**: A centralized helper function in the backend to calculate `cost_per_session` or `total_package_cost` based on the JSON rules defined in `service_tracks.pricing`.
3.  **Dynamic Forms**: Plan migration and edit modals will build their fields based on the selected service's requirements.

---

## 🖨️ Phase 3: Enhanced Printing System

We will implement two distinct printing workflows:

### 3.1 Thermal Printer (3-inch / 80mm)

- **Goal**: High-speed, high-contrast, compact CSS.
- **Trigger**: Direct print to 80mm paper.
- **Use Case**: Quick daily visits, token collection.

### 3.2 Standard Printer (A4 / Normal)

- **Goal**: Professional formatted document with headers and footers.
- **Trigger**: Generate PDF or stylized A4 print view.
- **Use Case**: Full billing statements, treatment logs for patient records.

---

## 🚀 Phase 4: Performance & Cleanup

1.  **Worker Task**: Move "Auto-Deactivation" (the 3-day inactivity check) from the page-load logic to a centralized background worker or a dedicated "App Initialization" trigger.
2.  **Snapshotting**: Instead of recalculating a patient's entire lifetime history for every request, we will explore updating a cached `current_balance` column in the `patients` table during payment/attendance events.

---

## 🛠️ Step-by-Step Execution Order

1.  [ ] **Step 1**: Create `treatmentPlans.js` and move the migration logic there.
2.  [ ] **Step 2**: Create `tokens.js` and implement the sequence generator.
3.  [ ] **Step 3**: Re-write the "Effective Balance" query to be a single, high-performance SQL statement.
4.  [ ] **Step 4**: Update `attendance.js` with the financial validation "Guardian" logic.
5.  [ ] **Step 5**: Frontend: Implement the dual printing modals in the Patients Dashboard.
6.  [ ] **Step 6**: Final cleanup of `patients.php` references in the backend.
