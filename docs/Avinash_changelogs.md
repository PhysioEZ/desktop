# Changelog - Avinash's Contributions to PhysioEZ Desktop App

All notable changes contributed by Avinash to this project are documented in this file.

## Changes - 2026-02-22

### Fixed

- **Test Details Modal Layout Constraints**:
  - **Scroll Propagation Fix**: Resolved an issue in `TestDetailsModal.tsx` where an inner, constrained scroll block inside expanded accordion items prevented the main record list from scrolling properly.
  - **Flexbox Constraints**: Applied proper bounding values (`min-h-0`) directly on the flex container, resolving a CSS layout issue that caused overflow properties to be ignored by the browser.
  - **Dynamic Accordion Height Locking**: Fixed an issue with accordion compression by utilizing the `shrink-0` flexbox property, ensuring that multiple open records fully expand without squishing the interface.

## Changes - 2026-02-21

### Added

- **Page Header Integration**: Implemented standardized `PageHeader` components across the `Billing` and `Support` modules for consistent navigation and unified header styling.
- **Split Billing Feature**: Introduced a split billing system that allows multiple payment methods per transaction, featuring auto amount-splitting that dynamically calculates balances.

### Changed

- **Sidebar & Navigation Updates**:
  - Updated navigation icons within the `Sidebar` component for a more modern look.
  - Renamed the "Schedule" module title to "Appointment" for clearer user expectations.

### Fixed

- **Treatment Plan Persistence Fixes**:
  - **24-Hour Time Standardization**: Resolved a time-format bug in `EditPlanModal.tsx` by implementing a dual-format system: storing values in a standardized 24-hour system (`HH:mm`) for database integrity while maintaining a 12-hour AM/PM display for clinicians.
  - **Session Storage Logic**: Fixed an issue where "Total Sessions" (days) were not consistently stored or validated, ensuring they are correctly persisted as non-negative integers.

### Added

- **Change Plan Modal Enhancements**:
  - **Intelligent Autofill System**: Developed a proactive autofill mechanism in `ChangePlanModal.tsx` that automatically reconstructs and populates the current patient's treatment rate, session count, and per-session discount from historical records.
  - **Safe Data Constraints**: Implemented strict non-negative restrictions across all financial and session inputs. Added preventative keyboard listeners to block negative signs (`-`) and scientific notation (`e`) in number fields.
  - **Split Payment Safety**: Enhanced the split payment calculation logic to ensure individual mode amounts are clamped to zero and above, preventing erroneous negative balance entries.

### Changed

- **Numeric Input UX**: Standardized the `FormInput` component to support dynamic HTML5 attributes like `min` and spread props, enabling more robust validation across the patient management modules.

- **Token Reprint Limiting**:
  - **Reprint Cap Implementation**: Introduced a strict limit on token reprints, capping them at 3 per patient per day to prevent paper waste and system abuse.
  - **Dynamic UI Controls**: The print icon in the Patients registry now automatically disables when the limit is reached, featuring a high-visibility grayscale effect.
  - **Live Remaining Count**: Integrated a dynamic tooltip that informs staff of the exact number of reprints remaining for each patient on hover.
  - **Security Watermarking**: Implemented a "REPRINT" watermark in the token preview and updated the footer to explicitly show the reprint sequence number (#1, #2, etc.).
  - **Enhanced Security Messaging**: Added visual indicators and status banners in the `TokenPreviewModal` to notify users when they are nearing or have reached the reprint threshold.

## Changes - 2026-02-18

### Added

- **Tests Module Enhancements**:
  - **Refactored Tests Layout**: Updated `Tests.tsx` to align with the premium glassmorphism aesthetic of the Dashboard, featuring a new 3-column layout (Sidebar, Stats Panel, and Main Content).
  - **Interactive Filter System**: Implemented custom `FilterDropdown` components for robust filtering by Test Type, Payment Status, and Test Status.
  - **Search & Stats**: Added a centered search bar in the new glassmorphism header and a dedicated stats panel for real-time overview of test quantities and statuses.
  - **Animated Transitions**: Integrated `framer-motion` for high-quality entrance animations and interactive hover effects on record rows.

- **Enhanced Test Management**:
  - **Test Details Modal**: Developed `TestDetailsModal.tsx` for comprehensive viewing of patient demographics, financial summaries, and technical test workflows.
  - **Payment Integration**: Added dedicated "Add Payment" and "Update Status" controls within the details modal for streamlined administrative tasks.

- **Advanced Billing & Printing**:
  - **Thermal Receipt System**: Engineered `ThermalReceiptModal.tsx` optimized for 80mm thermal printers, featuring a high-fidelity physical receipt design with boxed statuses and dashed separators.
  - **Unified Print Workflow**: Connected unified "Print Bill" triggers across the table and details view to the thermal receipt engine.

### Changed

- **Design Standardization**: Refined the overall aesthetic and layout of the laboratory tests registry to ensure parity with the core application design system.
- **Workflow UX**: Optimized the user journey for auditing test records and generating financial receipts through integrated, non-intrusive modals.

## Changes - 2026-02-09

### Added

- **Enhanced Attendance Data Fetching**:
  - **Date Selection Functionality**: Implemented date selection capability in the Attendance component (`frontend/src/reception/Attendance.tsx`) allowing users to view attendance data for any specific date
  - **Backend Date Validation**: Added date validation in the attendance data API endpoint (`server/src/api/reception/getAttendanceData.js`) to ensure proper date format (YYYY-MM-DD)
  - **Automatic Data Refresh**: Enhanced useEffect hook to automatically fetch attendance data when the selected date changes

### Changed

- **Frontend Implementation**: Modified the Attendance component to properly handle date selection and trigger data refresh when a new date is chosen
- **Backend Implementation**: Updated the attendance data endpoint to properly accept and validate date parameters from query strings

## Changes - 2026-02-07

### Added

- **Enhanced Refresh Functionality**:
  - **Inquiry Component**: Added `handleRefresh` function with cooldown mechanism to `frontend/src/reception/Inquiry.tsx` for better user experience during data refresh operations
  - **Registration Component**: Added `handleRefresh` function with cooldown mechanism to `frontend/src/reception/Registration.tsx` for improved data refresh operations
  - **Toast Notifications**: Integrated `sonnerToast` for promise-based notifications during refresh operations in both Inquiry and Registration components
  - **Refresh Cooldown**: Implemented refresh cooldown state to prevent excessive API calls with 20-second cooldown period

- **Improved Keyboard Shortcuts**:
  - **Inquiry Component**: Updated keyboard shortcut handler to properly detect Ctrl+R and Alt+Shift+R combinations for page and list refresh
  - **Registration Component**: Enhanced keyboard shortcut handler with more robust key detection logic supporting Ctrl, Alt, and Shift combinations

### Changed

- **Inquiry Component**:
  - Updated refresh action in `PageHeader` to use new `handleRefresh` function instead of direct `fetchInquiries` call
  - Renamed "Reload Page" to "Refresh Page" in keyboard shortcut descriptions
  - Added `refreshCooldown` prop to `PageHeader` component for visual feedback during refresh operations

- **Registration Component**:
  - Updated refresh action in `PageHeader` to use new `handleRefresh` function instead of direct `fetchRegistrations` call
  - Changed loading state from `isSearching` to `isLoading` for more accurate representation
  - Added `refreshCooldown` prop to `PageHeader` component for visual feedback during refresh operations
  - Removed unused `isSearching` state variable
  - Improved conditional rendering logic for "Operations Locked" status indicator

## [0.2.0] - 2026-02-06

### Added

- **Reception Module Expansion**:
  - **Attendance Component**: Created `frontend/src/reception/Attendance.tsx` with comprehensive attendance tracking features including patient lists, progress tracking, and status management.
  - **Tests Component**: Developed `frontend/src/reception/Tests.tsx` for laboratory test management with patient records, payment tracking, and test status monitoring.
  - **Feedback Component**: Implemented `frontend/src/reception/Feedback.tsx` for managing patient feedback and reviews.
  - **Expenses Component**: Built `frontend/src/reception/Expenses.tsx` for expense tracking and financial management.
  - **Support Component**: Created `frontend/src/reception/Support.tsx` for issue tracking and customer support management.
  - **Cancelled Registrations Component**: Added `frontend/src/reception/CancelledRegistrations.tsx` for managing cancelled patient registrations.

- **Routing Integration**:
  - Added new route paths to `frontend/src/App.tsx` for all the above components:
    - `/reception/attendance`
    - `/reception/tests`
    - `/reception/feedback`
    - `/reception/expenses`
    - `/reception/support`
    - `/reception/registration/cancelled`

### Changed

- Enhanced the application's navigation structure by integrating the new reception modules into the main routing system.

## [0.1.0] - 2026-02-02

### Added

- **Patient Billing System**:
  - **Billing Drawer Component**: Created `frontend/src/components/billing/BillingDrawer.tsx` with comprehensive financial overview and patient billing details.
  - **Billing Page**: Developed `frontend/src/reception/Billing.tsx` for comprehensive billing management with patient records, payment tracking, and financial statistics.
  - **Store Integration**: Enhanced `usePatientStore` with billing-specific state management for patient details and financial information.
- **Database Schema Updates**:
  - Modified `database/prospine.sql` with several important database improvements:
    - Changed collation from `utf8mb4_uca1400_ai_ci` to `utf8mb4_general_ci` for better compatibility
    - Added `SET FOREIGN_KEY_CHECKS = 0` and `SET FOREIGN_KEY_CHECKS = 1` statements to safely manage foreign key constraints during migration
    - Removed named foreign key constraints (e.g., `ADD CONSTRAINT '1'`) to standard foreign key references for better database portability

- **Package Management**:
  - Updated `frontend/package-lock.json` version from `0.0.0` to `0.6.0`
  - Enhanced billing drawer functionality with comprehensive patient financial details including treatment plans, payment history, and registration information

### Changed

- Improved the user experience in the billing system with better financial tracking and patient detail presentation.
- Enhanced database schema for better performance and compatibility.
