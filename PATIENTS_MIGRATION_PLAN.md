# Patients Module Migration Plan - Comprehensive Correction

**Status:** IN PROGRESS (Corrections Required)
**Priority:** CRITICAL - Feature Parity Missing

## 1. Situation Analysis & Apology

The initial migration attempt failed to capture the full depth of the legacy `patients.js` and `patients.php` implementation. The legacy system contains a highly sophisticated set of modals, calculations, and interactions ("tons of data") that were missed in the initial "read-only" React port. This document rectifies that by listing EVERY feature found in the legacy code.

## 2. Legacy Feature Audit (The "Missing" Features)

The following features exist in the legacy system and MUST be ported to React:

### A. Patient Details Drawer (The "Pop-up")

The drawer is not just a view; it is a **control center**.

- **Split View Layout**: Left column (Personal, Medical, Remarks), Right column (Financial, Attendance, History).
- **Collapsible Sections**: Headers click to fold/unfold.
- **Status Management**:
  - **Editable Status**: A dropdown/button to toggle Active/Inactive directly.
  - **Logic**: AJAX call to `update_patient_status.php` or `toggle_patient_status.php`.
- **Action Buttons (Toolbar)**:
  1.  **Print Bill**: Redirects to `patients_bill.php`.
  2.  **View Profile**: Redirects to `patients_profile.php`.
  3.  **Toggle Status**: Quick action button.
  4.  **Add Test**: Opens `AddTestModal` (New Feature).
  5.  **Change Plan**: Opens `ChangePlanModal` (Complex Logic).
  6.  **Pay Dues**: Opens `PayDuesModal`.
  7.  **Edit Plan**: Opens `EditPlanModal`.

### B. Change Plan Modal (`#change-plan-modal`)

- **Purpose**: Switches a patient to a new plan while carrying over their current financial state.
- **Inputs**:
  - **Treatment Type**: Radio (Package, Daily, Advance).
  - **Treatment Days**: Input (Required for Package).
  - **Discount %**: Input.
  - **Advance Payment**: Input.
  - **Payment Method**: Dropdown (Required if Advance > 0).(get the payment methods from the db)
  - **Reason**: Textarea.
- **Logic (CRITICAL)**:
  - **Carry Over**: Calculates `Effective Balance` from the OLD plan.
  - **Color Code**: Green (Surplus/Credit) vs Red (Due) for old balance.
  - **New Cost**: Calculates `New Plan Cost` (Package Cost or Daily Rate \* Days).
  - **Net Cost**: Applies Discount.
  - **Final Due Calculation**: `(Net Cost - Old Balance - New Advance)`.
- **Backend**: `change_treatment_plan.php`.

### C. Edit Plan Modal (`#edit-plan-modal`)

- **Purpose**: Corrects mistakes in the _current_ plan without starting a new one.
- **Inputs**:
  - Treatment Days, Time Slot, Start Date, End Date, Doctor, Discount.
- **Logic**:
  - **Auto-End Date**: `Start Date + Days - 1`.
  - **Price Recalculation**: If days change, shows "New Total will be..." note.
- **Backend**: `edit_treatment_plan.php`.

### D. Pay Dues Modal (`#pay-dues-modal`)

- **Purpose**: Settle outstanding dues.
- **Inputs**: Amount, Payment Method.
- **Logic**: Pre-fills with `due_amount`. Only allows paying if `due > 0`.
- **Backend**: `add_payment.php`.

### E. Add Test Modal (`#add-test-modal`)

- **Purpose**: Create a test inquiry/record for an existing patient.
- **Inputs**: Total Amount, Advance, Due (Auto-calc).
- **Backend**: `add_test_for_patient.php`.

### F. Token Printing (Main Grid)

- **Feature**: Generates a daily token number (e.g., T241228-05).
- **Logic**:
  - Fetches `get_token_data.php`.
  - Calculates `Next Token`.
  - **Thermal Print Logic**: Creates a hidden `<iframe>`, writes specifically styled CSS (72mm width), and invokes `window.print()`.
  - **Data on Token**: Token ID, Name, Doctor, Date, Paid Today, Dues, Total Paid.
- **Backend**: `generate_token.php`.

### G. Smart Attendance (Main Grid)

- **Feature**: "Mark Attendance" button handles two flows.
- **Flow 1 (Auto)**: If `Effective Balance >= Cost Per Day`, calls `add_attendance.php` mode='auto' (deducts from balance).
- **Flow 2 (Manual Modal)**: If balance is low.
  - Opens `AttendanceModal`.
  - Shows "Amount to Pay Today" (Cost - Balance).
  - "Mark as Due" checkbox (sets amount=0, adds remark). [mark as due will set the attendance to pending which will approved by the admin, already present in the code.]
  - Payment Mode.
- **Backend**: `add_attendance.php`.

## 3. Implementation Roadmap

### Phase 1: Modals Implementation (The UI Heavy Lifting)

1.  **Create `ChangePlanModal.tsx`**: Implement the complex carry-over logic.
2.  **Create `EditPlanModal.tsx`**: Implement the date/cost correction logic.
3.  **Create `PayDuesModal.tsx`**: Simple payment form.
4.  **Create `AddTestModal.tsx`**: Test entry form.
5.  **Create `AttendanceModal.tsx`**: Manual attendance marking with payment.
6.  **Refine `PatientDetailsModal.tsx`**:
    - Add the Toolbar Actions.
    - Make the "Patient Status" dropdown functional.
    - Integrate the above sub-modals.

### Phase 2: Action Logic Integration

1.  **Token Printing**: Implement a `usePrinter` hook or helper to handle the iframe generation and printing logic exactly as legacy does (CSS copy-paste).
2.  **Smart Attendance**: Update `Patients.tsx` "Mark" button to check `effective_balance` (already in store!) and decide: Auto-API vs Open Modal.

### Phase 3: Backend Verification

- Ensure `change_treatment_plan.php`, `edit_treatment_plan.php`, `add_payment.php` endpoints are accessible and working with JSON inputs (React uses JSON, Legacy used FormData/JSON mixed).
- _Note_: `change_treatment_plan.php` might need review if it expects specific legacy POST fields.

## 4. Immediate Next Step

Do not write code yet. Present this plan to the user to confirm that **THIS** is the scope they expected.
