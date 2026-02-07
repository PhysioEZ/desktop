# Changelog

All notable changes to this project will be documented in this file.

## [0.6.6.5-alpha] - 2026-02-07 - Sumit

### Added
- **Client-Side Data Caching**: Implemented a robust client-side caching mechanism for the **Registration** and **Cancelled Registrations** modules.
  - Data is now fetched once on page load (with a limit of 1000 records) and stored in the global Zustand store (`useRegistrationStore`).
  - Subsequent searches and filter applications are performed instantly on the client-side, eliminating redundant API calls and providing a zero-latency user experience.
- **Manual Search & Filtering**: Refactored the search functionality to be strictly manual and client-side.
  - Typing in the search bar no longer triggers API requests.
  - Filtering logic (Search, Status, Referrer, Condition) is now computed locally using `useMemo`, ensuring immediate UI updates.
- **Optimized Cancelled Registrations**: Extended the caching and client-side filtering logic to the `CancelledRegistrations.tsx` page, ensuring consistency across the application.
- **Performance Improvements**: Reduced server load by minimizing backend hits for search and pagination, significantly improving the responsiveness of the reception module.

### Changed
- **Refactored `Registration.tsx`**: Moved data fetching logic to mount-only, replaced server-side pagination with local `useMemo` based pagination.
- **Refactored `CancelledRegistrations.tsx`**: Aligned with the main registration data flow, implementing the same caching and local filtering strategies.

## [0.6.6.4-alpha] - 2026-02-05 - Sumit

### Added
- **Global `PageHeader` Component**: Integrated a standardized, premium header across the Schedule and Inquiry pages. Features unified search, synchronized notifications, and adaptive page control.
- **Enhanced Data Density**: Refined side panels to be more information-dense while remaining aesthetically clean.

### Changed
- **Redesigned Inquiry Operations Center**:
  - Expanded the Inquiry left panel to **440px** for a cleaner, split-stats display.
  - Implemented **High-Fidelity Statistical Cards** matching the core Dashboard design.
  - Corrected statistical isolation between **Consultation** and **Test** inquiries to ensure accurate operational tracking.
  - Adopted premium **Serif & Italic typography** (text-5xl) for module headers.
- **Refined Reception Modules**:
  - Standardized font weights and color palettes across the entire reception workspace to ensure a seamless "Center of Operations" experience.
  - Optimized layout by reducing padding and scaling font sizes for a more compact yet premium feel.
  - Removed localized greeting placeholders in favor of professional module titles.
- **Desktop UI Polish**:
  - Implemented **Invisible Scroll functionality** in side panels, preserving scrolling capability while removing visual scrollbar clutter.
  - Fixed various Lucide icon imports (`Beaker`, `ClipboardList`, etc.) for robust module stability.
- **Schedule Page Refinement**: Integrated the global header and synchronized the "Daily Activity Tree" typography with the new brand language.

## [0.6.6.3-alpha] - 2026-02-05 - Shiv

### Added
- **Password Change Request Modal**: Implemented a dedicated modal for users to request password changes directly from their profile.
  - Features a mandatory "Reason" field for auditing purposes.
  - **Visual Feedback**: Added a transient "Request Pending" state to the submit button to provide immediate user feedback (currently frontend-only state).
- **Profile Page Enhancements**: Integrated the new modal into `Profile.tsx` and updated the "Request Password Change" button logic to trigger the modal and reflect the pending status.

## [0.6.6.2-alpha] - 2026-02-04 - Sumit

### Added
- **Unified ActionFAB Component**: Created a standalone, reusable `ActionFAB` component to centralize primary actions (Registration, Lab Test, Inquiry) across the application.
- **Enhanced Schedule Layout**: Completely redesigned the Schedule page's left panel.
  - Replaced the user greeting with a prominent "Today's Schedule" focal point.
  - Implemented a "Schedule Flow" visual tree for a clearer overview of daily appointments.
  - Redesigned appointment summary cards with high-prominence time displays and emerald-themed aesthetics.

### Changed
- **Schedule Grid Visuals**: Lightened the color palette for empty time slots to improve contrast and reduce visual fatigue in the main calendar view.
- **Dashboard Component Cleanup**: Refactored `Dashboard.tsx` to use the new `ActionFAB`, removing legacy inline action button logic.
- **Navigation Integration**: Synchronized the `ActionFAB` between Dashboard and Schedule, allowing users to trigger registrations and inquiries directly from either page.

### Fixed
- **Runtime Stability**: Resolved a critical `TypeError` in `Schedule.tsx` where `registration_id.slice` was not a function. Implemented robust string conversion and null checks for appointment data.
- **UI Consistency**: Standardized icon usage by replacing legacy `CheckCircle` with the modern `CheckCircle2` across the Dashboard module.
- **TypeScript Health**: Cleaned up unused imports and types (like `FABAction`) and resolved linting errors regarding unused icons.

## [0.6.6.1-alpha] - 2026-02-04 - Sumit

### Added
- **Centralized Note-Taking System**: Implemented a comprehensive `NotesDrawer` for branch-wide communication.
  - Supports both **Public** (all staff) and **Private** (authenticated user) note streams.
  - Full CRUD functionality with granular delete permissions.
  - Integrated a **File Attachment** system with a built-in `FileViewer` for medical documents and receipts.
  - Added **User Mentions** logic and intelligent pagination (Offset-based "Load More") for high-volume environments.
  - Backend integration via specialized `/reception/notes` endpoints with automatic branch context scoping.
- **Search Result Caching**: Integrated a shared `searchCache` in the global store to store recent query results, providing instant retrieval and zero-latency UI responses for repeat searches.
- **Reception Note Table**: Added a new table `reception_notes` to store note-taking data.
  - **Database Modifications File**: See `database/dbmodif.md` for details.
  - **Note Drawer**: Added a new `NotesDrawer` component for note-taking and management.

### Changed
- **Optimized Search Experience**: Replaced the performance-heavy auto-fetch logic with a **Manual Search Trigger**.
  - Searches now only fire on **Enter key** or **Search button click**, drastically reducing unnecessary API load.
  - Added an `isSearchLoading` visual feedback state within the search modal.
- **Responsive Header Redesign**: Overhauled the Dashboard header for modern devices.
  - Implemented a **horizontal scroll container** for action buttons on mobile to prevent layout squashing.
  - Unified the search bar and utility alignment using a flexible, wrap-aware grid system.
  - Refined paddings and font-scaling for small-screen accessibility.

### Fixed
- **Stale Data Prevention**: Implemented proactive **Cache Invalidation** across the dashboard. The search cache is now automatically purged on system refreshes or successful new record submissions (Registration/Tests).
- **Search UI Stability**: Fixed a bug where the search modal would unexpectedly close when clearing input or typing short queries.

## [0.6.6.0-alpha] - 2026-02-04 - Sumit

### Added
- **Reusable Sidebar**: Extracted the hardcoded sidebar into a standalone `Sidebar` component, ensuring uniform navigation and actions across the application.
- **Node.js Profile API**: Created a robust backend controller for profile and branch data fetching, replacing legacy dependencies.
- **Security Center**: Integrated a dedicated section in the profile for managed security requests and password change workflows.
- **Avatar Initials Fallback**: Implemented a smart fallback mechanism to generate initials-based avatars when user photos are unavailable.

### Changed
- **Profile Redesign**: Completely overhauled `Profile.tsx` with a premium split-panel layout, aligning the visual language with the core Dashboard.
- **Read-Only Aesthetic**: Refined profile details to use a non-editable, high-clarity display style, removing the input-field appearance for better UX.
- **Dashboard Refactor**: Cleaned up `Dashboard.tsx` by offloading sidebar logic and state to the new shared component.
- **Glowing Active Status**: Added a pulsing visual indicator to the account status for a "live" system feel.

### Fixed
- **TypeScript Health**: Resolved critical typing errors in Framer Motion variants and cleaned up unused imports across the reception module.
- **API Integration**: Fixed data fetching logic to correctly interface with the new Node.js endpoints using `authFetch`.

## [0.6.5.9-alpha] - 2026-02-04 - Sumit

### Changed
- Refined Dashboard Animations: Implemented 'animate once' logic using persistent `hasDashboardAnimated` state to prevent repetitive entrance animations.
- Enhanced UX: Added directional entrance animations (Sidebar slide-in, Left Panel slide-in, Main Content slide-up) for a smoother page transitions.
- Improved Interactions: Merged entrance and interactive (hover/tap) animation states for all dashboard cards using unified `cardVariants`.
- Fixed Layout: Corrected Sidebar icon spacing and positioning, restyled bottom utility icons (Chat & Chat) with distinct visual tones and added tooltips.
- Codebase Health: Resolved critical nesting issues and missing closing tags in `Dashboard.tsx`, ensuring a valid component tree.

## [0.6.5.8-alpha] - 2026-02-04 - Sumit

### Added
- Added manual "Refresh Chat" button to Chat Modal with a 10-second cooldown timer to prevent API spamming.
- Removed automatic polling for chat messages to reduce server load and improve performance.
- Implemented intelligent caching for chat users and messages using `useChatStore` (5-minute validity).
- Added message deletion capability for senders with UI confirmation.

## [0.6.5.7-alpha] - 2026-02-04 - Sumit

### Added
- Optimized "Daily Intelligence" fetching: moved insights to global Zustand store to prevent refetching on every open/close.
- Implemented persistent caching for system alerts and actionable insights.

## [0.6.5.6-alpha] - 2026-02-04 - Sumit

### Added
- Optimized "Pending Approvals" fetching: removed mount/page-switch fetches and integrated it into the granular refresh logic.
- Globalized Notification State: Moved notifications and unread counts to `useDashboardStore` for persistence across pages.
- Eliminated redundant notification fetches in both Dashboard and Schedule modules.
- Refactored `fetchAll` to include initial approvals load only when cache is missing.
- Enhanced UI stability by using safe derived state (`notifList`) for global notification rendering.

## [0.6.5.5-alpha] - 2026-02-04 - Sumit

### Added
- Implemented "Zero Noise" dashboard refresh mechanism using granular `check_updates` API.
- Fixed MySQL/Node.js timezone synchronization mismatch for accurate change detection.
- Centralized Zustand stores with a new directory index and implemented persistent caching for time slots.
- Optimized appointment slot fetching with smart date-based caching and proactive invalidation on submission.
- Hardened TypeScript type safety by resolving implicit `any` errors across `Dashboard.tsx` and `Schedule.tsx`.
- Synchronized frontend search result handling with the unified backend `search_patients` response.

## [0.6.2.4-alpha] - 2026-02-04 - Avinash

### Added
- Added `concurrently` package to run frontend and backend simultaneously.
- Added `npm start` and `npm run dev` scripts to the root `package.json` to orchestrate the dev environment.
