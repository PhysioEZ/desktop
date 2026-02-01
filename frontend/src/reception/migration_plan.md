# Migration Plan: Merging DashboardNew into Dashboard

**Objective:** Integrate the new UI design from `DashboardNew.tsx` into the existing functional `Dashboard.tsx`, effectively replacing the old layout while preserving all business logic, state management, modals, and forms.

**Source Files:**
-   **Source UI:** `DashboardNew.tsx` (New Layout, Sidebar, FAB, Dark Mode, Stats Cards)
-   **Target Logic:** `Dashboard.tsx` (Existing State, API calls, Modals, Forms, Webcam, Shortcuts)

**Backup:**
-   `Dashboard.tsx` has been backed up to `Dashboard.tsx.bak`.

---

## Step-by-Step Merge Plan

### Phase 1: Preparation & Imports
1.  **Analyze Imports:** Compare imports in both files.
    -   Add necessary UI library imports (e.g., `lucide-react` icons, `framer-motion` if used) from `DashboardNew` to `Dashboard`.
    -   Keep all functional imports (API, Stores, Components) in `Dashboard`.

### Phase 2: State & Styles Integration
2.  **Integrate Dark Mode State:**
    -   `Dashboard.tsx` already has `toggleTheme` (lines 245-255). Ensure it aligns with the `isDark` usage in `DashboardNew`.
    -   If `DashboardNew` uses a local `isDark` state, mapping it to the global/existing theme store or state in `Dashboard` is preferred.
    -   Add `isFabOpen` state from `DashboardNew` to `Dashboard`.

3.  **Layout Wrapper Update:**
    -   The `DashboardNew` uses a specific flex layout (Sidebar + Main Content).
    -   We need to replace the root container of `ReceptionDashboard` return statement with the new structure.

### Phase 3: Component Migration (The Render Block)
4.  **Sidebar Integration:**
    -   Replace the existing Sidebar (if any, or navigation menu) with the new `Sidebar` structure from `DashboardNew`.
    -   Ensure `navLinks` in the new Sidebar function correctly (using `navigate`).

5.  **Main Content Area - Header & Stats:**
    -   Replace the old "Dashboard" header and stats grids with the "Redesigned Stats Grid" from `DashboardNew` (Census, Lab Ops, Revenue, Dues).
    -   **Critical Data Mapping:**
        -   Map `dummyData.patients` -> Real `data.registration` & `data.patients` (if available).
        -   Map `dummyData.tests` -> Real `data.tests` (need to verify if this data exists in `DashboardData` interface or needs fetching).
        -   Map `dummyData.finance` (Revenue/Dues) -> Real `data.finance` (or wherever revenue data comes from).
        -   *Note:* If real data is missing for some new UI fields, we might need to modify the backend or use placeholders/derivations temporarily.

6.  **Main Content Area - Schedule & Activity:**
    -   Replace the old Schedule/Activity section with the new layout.
    -   Map `dummyData.schedule` -> Real `data.schedule` (or appointments list).
    -   Map `dummyData.weekly` -> Real `data.weekly` (chart data).

7.  **FAB & Modals:**
    -   Add the new **FAB Menu** (Floating Action Button) from `DashboardNew` to `Dashboard`.
    -   Ensure the FAB buttons (`Registration`, `Book Test`, etc.) trigger the **existing modals** (`handleOpenModal(...)`) instead of just being empty buttons.
    -   *Preserve* all existing Modals (`RegistrationModal`, `TestBookingModal`, `WebcamModal`, etc.) at the end of the return statement. They must remain rendered but hidden until triggered.

### Phase 4: Cleanup & Functional Verification
8.  **Re-attach Event Handlers:**
    -   Ensure "Refresh" button calls `fetchDashboardData`.
    -   Ensure Search inputs are wired to existing search logic.
    -   Ensure Theme Toggle button works.

9.  **Remove Legacy UI Code:**
    -   Delete the old layout code (old grids, old cards) that was replaced.
    -   Clean up unused styles or sub-components.

10. **Final Verification:**
    -   Check for TypeScript errors (missing properties).
    -   Verify responsiveness.
    -   Verify all modals open/close and submit correctly.

---

## Data Mapping Reference (Preliminary)

| UI Element (New) | Expected Real Data Field (Old) | Action Needed |
| :--- | :--- | :--- |
| **Census** (Attended) | `data.registration.today_total` | Direct Map |
| **Census** (Active/Inactive) | `?` | Check if available or derive |
| **Lab Ops** (Tests Today) | `data.tests.today_total` | Check availability |
| **Lab Ops** (Revenue) | `data.finance...?` | Check availability |
| **Revenue** (Total) | `?` | Check availability |
| **Dues** | `?` | Check availability |
| **Schedule** | `data.appointments` (implied) | Check structure match |

*Self-Correction during plan:* The `DashboardData` interface (lines 23-31) shows `registration` has `today_total`, `pending`, `consulted`. It doesn't explicitly show "Revenue" or "Census Active/Inactive". I will need to inspect the `DashboardData` interface more closely to see what's actually available, or ask the user if backend changes are needed. For now, I will map what exists and leave placeholders/comments for missing data.

## Execution Strategy
I will perform the merge in **small, verifiable chunks**:
1.  **Imports & State**: Add necessary imports and state variables.
2.  **Skeleton**: Replace the main layout wrapper and Sidebar. verify build.
3.  **Stats Grid**: Inject the new Stats Grid, mapping available data. verify build.
4.  **Schedule/Bottom**: Inject Schedule/Activity. verify build.
5.  **FAB**: Inject FAB and wire to modals. verify build.
