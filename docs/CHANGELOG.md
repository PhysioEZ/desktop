# Changelog - ProSpine Desktop App

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-12-24

### Added

- **Inquiry Management System**:
  - **Professional Rename**: Rebranded "Quick Inquiry" to **"Consultation Inquiry"** for a more medical-grade user experience.
  - **Diagnostic Terminal**: Integrated a specialized view for "Test Inquiries" (Diagnostic), including limb specification and assigned test dates.
  - **High-Density Table**: Built a searchable list with real-time status updating (Pending, Visited, Cancelled) and quick-action modals.
  - **Unified API**: Devised a single backend controller (`inquiry.php`) for all inquiry operations including dynamic option fetching for complaints and referral sources.
- **Registration Management**:
  - **Table Modernization**: Built a high-density, searchable registration list with multi-criteria filtering (Referrers, Conditions, Inquiry Types).
  - **Details Terminal**: Implemented a comprehensive view-only modal for reviewing patient demographics, clinical history, and doctor notes.
  - **Consolidated API**: Developed a unified backend controller (`registration.php`) for data orchestration, filtering, and status management.
  - **UI/UX Excellence**: Integrated glassmorphic UI elements, high-fidelity iconography, and smooth `framer-motion` transitions.
- **Schedule Modernization**:
  - **Weekly Calendar**: Implemented a professional 7-day responsive grid with 30-minute time slots (9 AM - 7 PM).
  - **Drag-and-Drop**: Integrated `@dnd-kit` for real-time appointment rescheduling directly on the grid.
  - **Reschedule Modal**: Created a premium, high-density modal with a horizontal time-slot selection grid and `framer-motion` animations.
  - **Consolidated API**: Developed a unified backend endpoint (`schedule.php`) for fetching data, checking slots, and rescheduling.
  - **Dashboard Integration**: Added direct navigation from the Dashboard's "Today's Schedule" widget to the full weekly view.
  - **Manual Sync**: Added manual "Reload" / "Sync Now" buttons to both Schedule and Dashboard headers for live data synchronization.
- **Dependencies**: Added `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, and `date-fns`.

### Fixed

- **CORS & Auth**: Resolved 401 Unauthorized errors by moving from session-based to parameter-based authentication and adding explicit CORS headers.
- **Infinite Loop**: Fixed "Maximum update depth exceeded" error by stabilizing the `fetchSchedule` dependency array and date formatting.
- **Date Formatting**: Corrected `date-fns` formatting from `Y-m-d` to `yyyy-MM-dd` to ensure backend compatibility.

### Changed

- **UI/UX Refinement**:
  - **Compact Grid**: Optimized schedule scale by reducing slot height (`100px` -> `80px`) and tightening padding for better information density.
  - **Premium Cards**: Enlarged appointment items with high-contrast typography while maintaining a compact footprint.
- **Modal Layout**: Completely redesigned the reschedule modal to a vertical flow with a full-width **6-column horizontal time-slot grid**, eliminating vertical scrolling.
- **Navigation**: Renamed "Appointments" to "Schedule" in the sidebar with updated routing.

## [Unreleased] - 2025-12-24

### Fixed

- **Splash Screen**: Fixed issue where splash screen would reappear on every page refresh using `sessionStorage`.
- **Welcome Screen**: Simplified messaging to remove technical jargon. Removed display of Branch ID and sync details.
- **Version Number**: Corrected app version to `v0.1.0` in Splash and Login screens.
- **Build Error**: Fixed Tailwind CSS v4 compatibility issue by installing `@tailwindcss/postcss`.

### Added

- **Welcome Screen**: Added `WelcomeScreen.tsx` with smooth progress animation and auto-redirect.
- **Navigation Flow**: Updated `LoginScreen` to redirect to `/welcome`.
- **Authentication**:
  - **Backend**: Implemented `/api/auth/login.php` (Standard + Role-based Master Key).
  - **Frontend Store**: Added `useAuthStore` (Zustand).
  - **Login Logic**: Connected `LoginScreen` to real API.
- **Project Structure**:
  - Initialized `desktop` directory.
  - created `frontend` (Vite+React) and `server` (PHP).
- **Components**: `SplashScreen`, `LoginScreen` (with Aurora effect), `ReceptionDashboard`.
- **Database**: Connected `server/common/db.php` to local `prospine` DB.

# Changelog - ProSpine Desktop App

## [Unreleased] - 2025-12-24

### Fixed

- **Version Number**: Corrected app version to `v0.1.0` in Splash and Login screens.
- **Build Error**: Fixed Tailwind CSS v4 compatibility issue by installing `@tailwindcss/postcss`.

### Added

- **Authentication**:
  - **Backend**: Implemented `/api/auth/login.php` validating credentials against `employees` table (Standard + Role-based Master Key checks).
  - **Frontend Store**: Added `useAuthStore` (Zustand) to manage session state and token.
  - **Login Logic**: Updated `LoginScreen.tsx` to authenticate via API and store user session.
- **Project Structure**: Initialized `desktop` directory.
- **Frontend**: Created `frontend` directory using Vite + React + TypeScript template.
- **Components**: `SplashScreen`, `LoginScreen`, `ReceptionDashboard`.
- **Database**: Connected to local `prospine` database.

## [Unreleased] - 2025-12-24

### Fixed

- **Build Error**: Fixed Tailwind CSS v4 compatibility issue by installing `@tailwindcss/postcss` and updating `postcss.config.js`. Updated `index.css` to use the new `@import "tailwindcss";` syntax.

### Added

- **Dependencies**: Installed `react-router-dom` for navigation and `tailwindcss` for styling.
- **Project Structure**: Initialized `desktop` directory to house the new application execution environment.
- **Frontend**: Created `frontend` directory using Vite + React + TypeScript template.
- **Backend structure**: Created `server` directory with `api` (admin/reception) and `common` subdirectories.
- **Database Connection**:
  - Created `server/common/db.php` for centralized PDO connection to `prospine` database (localhost).
  - Implemented `server/api/reception/test_connection.php` to verify database connectivity.
- **Configuration**: Added `frontend/src/config.ts` to manage API base URLs.
- **Components**:
  - `SplashScreen.tsx`: Animated launch screen with logo placeholder.
  - `LoginScreen.tsx`: Modern login form with Tailwind styling.
  - `App.tsx`: Updated to handle routing (Splash -> Login -> Dashboard).
- **Test UI**: Added `ReceptionDashboard` component in `frontend/src/reception/Dashboard.tsx`.

### Changed

- **Dashboard API**: Updated `dashboard.php` to fetch comprehensive legacy metrics (patients, inquiries, tests, finance breakdown).
- **Dashboard UI**: Redesigned `ReceptionDashboard.tsx` to exactly match legacy content with a modern, card-based layout. Added sections for Patient Activity, Lab Tests, and Detailed Financials.
- **Dashboard Styling**: Refined dashboard cards to use a modern, clean SaaS aesthetic (Bento-grid style, crisper borders, improved typography).
- **Layout**: Removed default padding from `ReceptionLayout` to prevent double padding issues. Reduced top spacing on Dashboard specific page to maximize screen real estate.
- **Sidebar**:
  - **Functionality**: Fixed jittery collapse animation by using `framer-motion` for smoother width transitions and `whitespace-nowrap` for text.
  - **Navigation**: Added all legacy menu links (Inquiry, Registration, Attendance, Tests, Billing, Feedback, Reports, Expenses, Support).
- **Sidebar Redesign (Second Pass)**:
  - **Visuals**: Matched "Manipal" screenshot exactly (Logo/Collapse at top, Branch/Tools at bottom).
  - **Dynamic**: Fetching Branch Name & Logo from API.
  - **Refinements**:
    - Moved Date to Top Bar.
    - Removed "Dashboard" page title for cleaner look.
    - Redesigned Search Bar (Minimalist).
    - Compacted Card Layout (Smaller Padding/Fonts).
    - **Dashboard API**: Updated `dashboard.php` to return daily schedule data (appointments/registrations) alongside KPI metrics.
    - **Dashboard UI Breakdown**:
      - **Card Compactness**: Reduced padding and font sizes across all 4 key metric cards (`p-4` -> `p-3`, `text-2xl` -> `text-xl`) to increase information density.
      - **Schedule Section**: Implemented a scrollable "Today's Schedule" widget displaying time-indexed appointments with status indicators (Pending/Consulted).
      - **Quick Actions**: Added a new "Quick Actions" panel with a prominent "New Registration" card and shortcuts for Lab Tests and Reports.
    - **Code Cleanup**: Removed unused imports (`ArrowUpRight`, `AnimatePresence`) from Dashboard and Layout components.
