➜  desktop git:(main) ✗ npm run dev

> physioez-app@0.6.6.4-alpha dev
> concurrently "npm run dev --prefix frontend" "npm run dev --prefix server"

[1] 
[1] > phsyioez@1.0.0 dev
[1] > nodemon src/server.js
[1] 
[0] 
[0] > frontend@0.6.6.4-alpha dev
[0] > vite
[0] 
[1] [nodemon] 3.1.14
[1] [nodemon] to restart at any time, enter `rs`
[1] [nodemon] watching path(s): *.*
[1] [nodemon] watching extensions: js,mjs,cjs,json
[1] [nodemon] starting `node src/server.js`
[0] 
[0]   VITE v7.3.0  ready in 100 ms
[0] 
[0]   ➜  Local:   http://localhost:5173/
[0]   ➜  Network: use --host to expose
[1] [Sync Engine] Starting Event-Driven Service...
[1] Server running on port 3000
[1] Test Health: http://localhost:3000/health
[1] Test Login: http://localhost:3000/api/auth/login
[1] [Sync Engine] Cycle: PULL at 3:56:30 PM
[1] [Sync Engine] Change detected in: patients, registration, tests, attendance, payments, quick_inquiry, test_inquiry, patient_master, employees, patients_treatment, notifications, expenses, reception_notes, test_staff, test_types, limb_types, chief_complaints, referral_sources, consultation_types, inquiry_service_types, expense_categories, service_tracks, referral_partners, branches, system_settings, test_items, test_payments, payment_methods, system_issues, system_services, registration_payments, payment_splits, patient_appointments
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] GET /api/system/status 200 3.977 ms - 263
[1] GET /api/system/status 200 4.927 ms - 263
[1] POST /api/auth/login 200 71.557 ms - 330
[1] GET /uploads/profile_photos/emp_2_1764639676.jpg 404 1.667 ms - 182
[1] [DiffCheck] Data is 154min old. Full sync recommended.
[1] POST /api/reception/diff_check 200 2.516 ms - 123
[1] [DiffCheck] Data is 154min old. Full sync recommended.
[1] POST /api/reception/diff_check 200 2.025 ms - 123
[1] [ClearCache] Cleared 54 tables from SQLite.
[1] POST /api/auth/clear-cache 200 249.298 ms - 70
[1] [ClearCache] Cleared 54 tables from SQLite.
[1] POST /api/auth/clear-cache 200 250.840 ms - 70
[1] [Sync Engine] Cycle: PULL at 3:56:38 PM
[1] POST /api/reception/sync 200 2.660 ms - 185
[1] [Sync Engine] Initializing Bootstrap Pull for 33 tables...
[1] [Local-First] Saved data to local SQLite. Action: 
[1]                 UPDATE patients 
[1]       ... Successful.
[1] [Local-First] Saved data to local SQLite. Action: 
[1]             UPDATE patients 
[1]           ... Successful.
[1] [Lazy Load] SQLite empty for 
[1]                 SELECT 
[1]                     r.reg... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]                 SELECT 
[1]                     DATE(... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT assigned_doctor FROM patients WHER... Fetching from source to initialize.
[1] GET /api/reception/dashboard?branch_id=1 200 24.359 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]             test_id as uid, pa... Fetching from source to initialize.
[1] POST /api/reception/tests?action=fetch 200 23.204 ms - 86
[1] [Lazy Load] SQLite empty for SELECT DISTINCT treatment_type FROM patients WHERE... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT status FROM patients WHERE (branch... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT service_type FROM patients WHERE (... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT method_id, method_name FROM payment_methods... Fetching from source to initialize.
[1] [Mirror] Mirrored 7 rows to payment_methods
[1] [Lazy Load] SQLite empty for 
[1]         SELECT DISTINCT reffered_by FROM registra... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT id, pricing FROM service_tracks... Fetching from source to initialize.
[1] [Mirror] Mirrored 2 rows to service_tracks
[1] POST /api/reception/patients 200 51.575 ms - 527
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Bootstrap
[1] [syncAndVerify] Pushing 2 pending local changes...
[1] [Sync Engine] Cycle: PUSH at 3:56:38 PM
[1] [Sync Engine] Found 2 pending items to push. Syncing queue to server mysql...
[1] [Sync Engine] PUSH Success: Item #398 (
[1]                 UPDATE patien...)
[1] [Sync Engine] PUSH Success: Item #399 (
[1]             UPDATE patients 
[1] ...)
[1] [syncAndVerify] Re-syncing from server to capture post-push mutations...
[1] [Sync Engine] Cycle: PULL at 3:56:38 PM
[1] [Sync Engine] Initializing Bootstrap Pull for 33 tables...
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Bootstrap
[1] POST /api/reception/sync 200 137.773 ms - 185
[1] [Local-First] Saved data to local SQLite. Action: 
[1]             UPDATE patients 
[1]           ... Successful.
[1] [Local-First] Saved data to local SQLite. Action: 
[1]                 UPDATE patients 
[1]       ... Successful.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]             test_id as uid, pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]                 SELECT 
[1]                     r.reg... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]                 SELECT 
[1]                     DATE(... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT assigned_doctor FROM patients WHER... Fetching from source to initialize.
[1] POST /api/reception/tests?action=fetch 200 11.001 ms - 86
[1] GET /api/reception/dashboard?branch_id=1 200 13.267 ms - 1060
[1] [Lazy Load] SQLite empty for SELECT DISTINCT treatment_type FROM patients WHERE... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT status FROM patients WHERE (branch... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT service_type FROM patients WHERE (... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]         SELECT DISTINCT reffered_by FROM registra... Fetching from source to initialize.
[1] POST /api/reception/patients 200 15.565 ms - 527
[1] [Smart Sync] Targeted PULL for patients at 3:56:38 PM
[1] [Sync Engine] Change detected in: patients, patient_master, patients_treatment, attendance, payments
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] [Sync Engine] Cycle: PUSH at 3:56:39 PM
[1] [Sync Engine] Found 2 pending items to push. Syncing queue to server mysql...
[1] [Sync Engine] PUSH Success: Item #400 (
[1]             UPDATE patients 
[1] ...)
[1] [Sync Engine] PUSH Success: Item #401 (
[1]                 UPDATE patien...)
[1] [Sync Engine] Cycle: PUSH at 3:56:39 PM
[1] [Smart Sync] Targeted PULL for patients at 3:56:39 PM
[1] [Sync Engine] Change detected in: patients, patient_master, patients_treatment, attendance, payments
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] GET /api/system/status 200 0.630 ms - 263
[1] GET /api/system/status 200 0.458 ms - 263
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/notifications?employee_id=2 200 17.961 ms - 71
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 19.631 ms - 55
[1] GET /api/reception/dashboard?branch_id=1 200 27.444 ms - 1060
[1] GET /api/reception/dashboard?branch_id=1 200 12.685 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 39.219 ms - 3642
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.557 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 3.385 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 7.026 ms - 3642
[1] GET /api/system/status 200 1.324 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.236 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 3.566 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/dashboard?branch_id=1 200 7.943 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 10.978 ms - 3642
[1] GET /api/system/status 200 1.247 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.044 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 3.647 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/dashboard?branch_id=1 200 8.262 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 11.520 ms - 3642
[1] [Lazy Load] SQLite empty for 
[1]             SELECT appointment_time 
[1]             ... Fetching from source to initialize.
[1] GET /api/reception/get_slots?date=2026-03-01 200 2.252 ms - 1086
[1] GET /api/system/status 200 0.704 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.042 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 2.769 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/dashboard?branch_id=1 200 8.810 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 11.445 ms - 3642
[1] GET /api/system/status 200 1.069 ms - 263
[1] GET /api/reception/notifications?employee_id=2 200 5.338 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 4.198 ms - 55
[1] GET /api/reception/dashboard?branch_id=1 200 11.990 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 16.357 ms - 3642
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]                 r.registration... Fetching from source to initialize.
[1] GET /api/reception/schedule?week_start=2026-03-01&branch_id=1&employee_id=2 200 3.376 ms - 84
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]                 r.registration... Fetching from source to initialize.
[1] GET /api/reception/schedule?week_start=2026-03-01&branch_id=1&employee_id=2 200 1.876 ms - 84
[1] [Lazy Load] SQLite empty for 
[1]             SELECT 
[1]                 *, 
[1]          ... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT 
[1]                 *, 
[1]          ... Fetching from source to initialize.
[1] POST /api/reception/inquiry 200 2.486 ms - 30
[1] POST /api/reception/inquiry 200 2.527 ms - 30
[1] [Lazy Load] SQLite empty for SELECT DISTINCT reffered_by FROM registration WHER... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT reffered_by FROM registration WHER... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]         SELECT reg.*, pm.patient_uid, pm.full_nam... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]         SELECT reg.*, pm.patient_uid, pm.full_nam... Fetching from source to initialize.
[1] POST /api/reception/registration 200 4.891 ms - 93
[1] POST /api/reception/registration 200 4.782 ms - 93
[1] [Lazy Load] SQLite empty for SELECT DISTINCT chief_complain FROM registration W... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT chief_complain FROM registration W... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT consultation_type FROM registratio... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT consultation_type FROM registratio... Fetching from source to initialize.
[1] POST /api/reception/registration 200 8.145 ms - 2099
[1] POST /api/reception/registration 200 7.976 ms - 2099
[1] [Local-First] Saved data to local SQLite. Action: 
[1]             UPDATE patients 
[1]           ... Successful.
[1] [Local-First] Saved data to local SQLite. Action: 
[1]             UPDATE patients 
[1]           ... Successful.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT assigned_doctor FROM patients WHER... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]                 p.patient_id, ... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT treatment_type FROM patients WHERE... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT status FROM patients WHERE (branch... Fetching from source to initialize.
[1] POST /api/reception/patients 200 10.709 ms - 91
[1] [Lazy Load] SQLite empty for SELECT DISTINCT service_type FROM patients WHERE (... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]         SELECT DISTINCT reffered_by FROM registra... Fetching from source to initialize.
[1] POST /api/reception/patients 200 13.279 ms - 527
[1] [Local-First] Saved data to local SQLite. Action: 
[1]             UPDATE patients 
[1]           ... Successful.
[1] [Local-First] Saved data to local SQLite. Action: 
[1]             UPDATE patients 
[1]           ... Successful.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT assigned_doctor FROM patients WHER... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]                 p.patient_id, ... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT treatment_type FROM patients WHERE... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT status FROM patients WHERE (branch... Fetching from source to initialize.
[1] POST /api/reception/patients 200 8.892 ms - 91
[1] [Lazy Load] SQLite empty for SELECT DISTINCT service_type FROM patients WHERE (... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]         SELECT DISTINCT reffered_by FROM registra... Fetching from source to initialize.
[1] POST /api/reception/patients 200 12.470 ms - 527
[1] [Sync Engine] Cycle: PUSH at 3:57:15 PM
[1] [Sync Engine] Found 4 pending items to push. Syncing queue to server mysql...
[1] [Sync Engine] PUSH Success: Item #402 (
[1]             UPDATE patients 
[1] ...)
[1] [Sync Engine] PUSH Success: Item #403 (
[1]             UPDATE patients 
[1] ...)
[1] [Sync Engine] PUSH Success: Item #404 (
[1]             UPDATE patients 
[1] ...)
[1] [Sync Engine] PUSH Success: Item #405 (
[1]             UPDATE patients 
[1] ...)
[1] [Sync Engine] Cycle: PUSH at 3:57:15 PM
[1] [Smart Sync] Targeted PULL for patients at 3:57:16 PM
[1] [Sync Engine] Change detected in: patients, patient_master, patients_treatment, attendance, payments
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] [Smart Sync] Targeted PULL for patients at 3:57:16 PM
[1] [Sync Engine] Change detected in: patients, patient_master, patients_treatment, attendance, payments
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] [Lazy Load] SQLite empty for 
[1]             SELECT 
[1]                 p.patient_id,... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT 
[1]                 p.patient_id,... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT 
[1]                 t.patient_id,... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT 
[1]                 t.patient_id,... Fetching from source to initialize.
[1] POST /api/reception/billing 200 5.961 ms - 153
[1] POST /api/reception/billing 200 6.570 ms - 153
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]                 p.patient_id,
[1] ... Fetching from source to initialize.
[1] GET /api/reception/attendance_data?date=2026-03-01 200 3.872 ms - 145
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]                 p.patient_id,
[1] ... Fetching from source to initialize.
[1] GET /api/reception/attendance_data?date=2026-03-01 200 3.101 ms - 145
[1] [Lazy Load] SQLite empty for 
[1]                 SELECT 
[1]                     'regi... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]                 SELECT 
[1]                     'test... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]             test_id as uid, pa... Fetching from source to initialize.
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 4.326 ms - 55
[1] POST /api/reception/tests?action=fetch 200 3.872 ms - 86
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]             test_id as uid, pa... Fetching from source to initialize.
[1] POST /api/reception/tests?action=fetch 200 3.778 ms - 86
[1] [Lazy Load] SQLite empty for 
[1]                 SELECT 
[1]                     'regi... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]                 SELECT 
[1]                     'test... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]                 SELECT 
[1]                     'test... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]                 SELECT 
[1]                     'regi... Fetching from source to initialize.
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 12.072 ms - 55
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 11.750 ms - 55
[0] 3:57:53 PM [vite] (client) hmr update /src/reception/Tests.tsx, /src/index.css
[1] GET /api/reception/feedback?page=1&limit=15 200 2.540 ms - 135
[1] GET /api/reception/feedback?page=1&limit=15 200 1.638 ms - 135
[1] [Lazy Load] SQLite empty for 
[1]             SELECT 
[1]                 t.test_id, t.... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT t.test_name as name FROM tests t W... Fetching from source to initialize.
[1] GET /api/reception/reports/tests?start_date=2026-03-01&end_date=2026-03-01 200 4.561 ms - 107
[1] [Lazy Load] SQLite empty for SELECT DISTINCT referred_by as referralSource FROM... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT referred_by as reffered_by FROM te... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT test_status as status FROM tests W... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT payment_status FROM tests WHERE br... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT 
[1]                 t.test_id, t.... Fetching from source to initialize.
[1] GET /api/reception/reports/filters/tests 200 10.475 ms - 170
[1] GET /api/reception/reports/tests?start_date=2026-03-01&end_date=2026-03-01 200 3.029 ms - 107
[1] [Lazy Load] SQLite empty for SELECT DISTINCT t.test_name as name FROM tests t W... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT referred_by as referralSource FROM... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT referred_by as reffered_by FROM te... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT test_status as status FROM tests W... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT DISTINCT payment_status FROM tests WHERE br... Fetching from source to initialize.
[1] GET /api/reception/reports/filters/tests 200 4.956 ms - 170
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] POST /api/reception/expenses 200 5.277 ms - 187
[1] POST /api/reception/expenses 200 5.463 ms - 187
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options 200 8.369 ms - 3642
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options 200 7.758 ms - 3642
[1] POST /api/reception/support 200 4.850 ms - 826
[1] POST /api/reception/support 200 4.414 ms - 826
[1] POST /api/reception/support 200 6.028 ms - 1041
[1] POST /api/reception/support 200 5.342 ms - 1041
[1] GET /api/reception/sync_status 200 1.473 ms - 148
[1] GET /api/reception/sync_status 200 0.684 ms - 148
[1] GET /api/system/status 200 0.575 ms - 263
[1] GET /api/system/status 200 0.464 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.506 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 3.746 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/dashboard?branch_id=1 200 11.196 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.858 ms - 55
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 16.500 ms - 3642
[1] GET /api/reception/notifications?employee_id=2 200 4.114 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 7.875 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 9.691 ms - 3642
[1] GET /api/system/status 200 1.784 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 4.273 ms - 55
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/notifications?employee_id=2 200 6.906 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 12.966 ms - 1060
[1] GET /api/system/status 200 1.227 ms - 263
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.816 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 4.200 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 9.466 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 25.845 ms - 3642
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 13.153 ms - 3642
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]                 p.patient_id,
[1] ... Fetching from source to initialize.
[1] GET /api/reception/attendance_data?date=2026-03-01 200 4.315 ms - 145
[1] [Lazy Load] SQLite empty for 
[1]             SELECT
[1]                 p.patient_id,
[1] ... Fetching from source to initialize.
[1] GET /api/reception/attendance_data?date=2026-03-01 200 2.761 ms - 145
[1] GET /api/system/status 200 0.536 ms - 263
[1] GET /api/system/status 200 0.663 ms - 263
[1] GET /api/reception/notifications?employee_id=2 200 5.074 ms - 71
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.880 ms - 55
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/dashboard?branch_id=1 200 14.043 ms - 1060
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 8.972 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 12.579 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 16.920 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 21.688 ms - 3642
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 24.717 ms - 3642
[1] GET /api/system/status 200 1.818 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.718 ms - 55
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/notifications?employee_id=2 200 9.165 ms - 71
[1] GET /api/system/status 200 1.558 ms - 263
[1] GET /api/reception/dashboard?branch_id=1 200 15.695 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.118 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 5.199 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 11.246 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 25.505 ms - 3642
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 15.356 ms - 3642
[1] GET /api/system/status 200 1.774 ms - 263
[1] GET /api/system/status 200 2.011 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.794 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 6.098 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/dashboard?branch_id=1 200 16.056 ms - 1060
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 9.085 ms - 55
[1] GET /api/reception/dashboard?branch_id=1 200 16.142 ms - 1060
[1] GET /api/reception/notifications?employee_id=2 200 12.692 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 23.475 ms - 3642
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 18.797 ms - 3642
[1] GET /api/system/status 200 0.997 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.531 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 2.949 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/dashboard?branch_id=1 200 7.850 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 10.605 ms - 3642
[1] GET /api/system/status 200 1.138 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.066 ms - 55
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/notifications?employee_id=2 200 12.825 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 20.968 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 25.747 ms - 3642
[1] [Intelligence] Hit for branch: 1
[1] [Intelligence] Branch: 1, Today: 2026-03-01, Yesterday: 2026-02-28
[1] [Lazy Load] SQLite empty for 
[1]             SELECT p.patient_id, r.patient_name, ... Fetching from source to initialize.
[1] [Intelligence] Retention count: 0
[1] [Lazy Load] SQLite empty for 
[1]             SELECT p.patient_id, r.patient_name, ... Fetching from source to initialize.
[1] [Intelligence] Debtor count: 0
[1] [Lazy Load] SQLite empty for 
[1]             SELECT p.patient_id, r.patient_name, ... Fetching from source to initialize.
[1] [Intelligence] Expiry count: 0
[1] [Lazy Load] SQLite empty for 
[1]             SELECT t.test_id, t.patient_name, t.t... Fetching from source to initialize.
[1] [Intelligence] Test count: 0
[1] [Lazy Load] SQLite empty for 
[1]             SELECT i.inquiry_id, i.name, i.phone_... Fetching from source to initialize.
[1] [Intelligence] Inquiry count: 0
[1] GET /api/reception/daily_intelligence 200 5.577 ms - 30
[1] [Intelligence] Hit for branch: 1
[1] [Intelligence] Branch: 1, Today: 2026-03-01, Yesterday: 2026-02-28
[1] [Lazy Load] SQLite empty for 
[1]             SELECT p.patient_id, r.patient_name, ... Fetching from source to initialize.
[1] [Intelligence] Retention count: 0
[1] [Lazy Load] SQLite empty for 
[1]             SELECT p.patient_id, r.patient_name, ... Fetching from source to initialize.
[1] [Intelligence] Debtor count: 0
[1] [Lazy Load] SQLite empty for 
[1]             SELECT p.patient_id, r.patient_name, ... Fetching from source to initialize.
[1] [Intelligence] Expiry count: 0
[1] [Lazy Load] SQLite empty for 
[1]             SELECT t.test_id, t.patient_name, t.t... Fetching from source to initialize.
[1] [Intelligence] Test count: 0
[1] [Lazy Load] SQLite empty for 
[1]             SELECT i.inquiry_id, i.name, i.phone_... Fetching from source to initialize.
[1] [Intelligence] Inquiry count: 0
[1] GET /api/reception/daily_intelligence 200 5.662 ms - 30
[1] GET /api/reception/notes?branch_id=1&type=public&limit=15&offset=0 200 3.891 ms - 43
[1] GET /api/reception/notes?branch_id=1&type=private&limit=15&offset=0 200 3.901 ms - 43
[1] GET /api/reception/notes/users?branch_id=1 200 3.952 ms - 265
[1] GET /api/reception/notes?branch_id=1&type=public&limit=15&offset=0 200 3.552 ms - 43
[1] GET /api/reception/notes/users?branch_id=1 200 3.107 ms - 265
[1] GET /api/reception/notes?branch_id=1&type=private&limit=15&offset=0 200 3.883 ms - 43
[1] GET /api/reception/notes/users?branch_id=1 200 2.001 ms - 265
[1] GET /api/reception/notes?branch_id=1&type=public&limit=15&offset=0 200 1.541 ms - 43
[1] GET /api/reception/notes?branch_id=1&type=private&limit=15&offset=0 200 1.521 ms - 43
[1] GET /api/system/status 200 0.747 ms - 263
[1] GET /api/system/status 200 0.661 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 1.895 ms - 55
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 1.876 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 3.865 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/dashboard?branch_id=1 200 10.594 ms - 1060
[1] GET /api/reception/notifications?employee_id=2 200 7.659 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 13.090 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 21.048 ms - 3642
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 20.829 ms - 3642
[1] GET /api/system/status 200 1.466 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.061 ms - 55
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/notifications?employee_id=2 200 3.953 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 7.610 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 10.817 ms - 3642
[1] GET /api/system/status 200 0.768 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.012 ms - 55
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] GET /api/reception/notifications?employee_id=2 200 3.658 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 8.494 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 11.087 ms - 3642
[1] [Lazy Load] SQLite empty for 
[1]             SELECT DISTINCT reffered_by AS name F... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01 200 7.568 ms - 3642
[1] [Lazy Load] SQLite empty for SELECT master_patient_id FROM patient_master WHERE... Fetching from source to initialize.
[1] [Local-First] Saved data to local SQLite. Action: 
[1]                 INSERT INTO patient_mas... Successful.
[1] [Local-First] Saved data to local SQLite. Action: 
[1]             INSERT INTO registration 
[1]  ... Successful.
[1] [Local-First] Saved data to local SQLite. Action: 
[1]                         INSERT INTO reg... Successful.
[1] [Lazy Load] SQLite empty for SELECT partner_id FROM referral_partners WHERE TRI... Fetching from source to initialize.
[1] [Local-First] Saved data to local SQLite. Action: UPDATE registration SET patient_photo_pa... Successful.
[1] POST /api/reception/registration_submit 200 29.597 ms - 106
[1] [Local-First] Saved data to local SQLite. Action: 
[1]                 UPDATE patients 
[1]       ... Successful.
[1] GET /api/reception/dashboard?branch_id=1 200 8.269 ms - 1231
[1] GET /api/system/status 200 0.930 ms - 263
[1] GET /api/reception/dashboard?branch_id=1 200 9.630 ms - 1060
[1] GET /api/reception/notifications?employee_id=2 200 3.932 ms - 71
[1] [Sync Engine] Cycle: PULL at 4:04:49 PM
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.189 ms - 55
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 10.953 ms - 3646
[1] GET /api/reception/get_slots?date=2026-03-01 200 1.398 ms - 1085
[1] [Sync Engine] Initializing Bootstrap Pull for 33 tables...
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Bootstrap
[1] [syncAndVerify] Pushing 5 pending local changes...
[1] [Sync Engine] Cycle: PUSH at 4:04:49 PM
[1] [Sync Engine] Found 5 pending items to push. Syncing queue to server mysql...
[1] [Sync Engine] PUSH Success: Item #406 (
[1]                 INSERT INTO p...)
[1] [Source Error] SQL: 
[1]             INSERT INTO registration 
[1]             (master_patient_id, branch_id, created_by_employe... Error: Cannot add or update a child row: a foreign key constraint fails (`prospine`.`registration`, CONSTRAINT `fk_registration_master_patient` FOREIGN KEY (`master_patient_id`) REFERENCES `patient_master` (`master_patient_id`) ON DELETE SET NULL)
[1] [Sync Engine] PUSH Fail: Item #407 Unable to save to source.
[1] [Source Error] SQL: 
[1]                         INSERT INTO registration_payments (registration_id, payment_method, amount,... Error: Cannot add or update a child row: a foreign key constraint fails (`prospine`.`registration_payments`, CONSTRAINT `1` FOREIGN KEY (`registration_id`) REFERENCES `registration` (`registration_id`) ON DELETE CASCADE)
[1] [Sync Engine] PUSH Fail: Item #408 Unable to save to source.
[1] [Sync Engine] PUSH Success: Item #409 (UPDATE registration SET patien...)
[1] [Sync Engine] PUSH Success: Item #410 (
[1]                 UPDATE patien...)
[1] [syncAndVerify] Re-syncing from server to capture post-push mutations...
[1] [Sync Engine] Cycle: PULL at 4:04:50 PM
[1] [Sync Engine] Initializing Bootstrap Pull for 33 tables...
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Bootstrap
[1] POST /api/reception/sync 200 107.759 ms - 185
[1] [Smart Sync] Targeted PULL for patient_master at 4:04:50 PM
[1] [Sync Engine] Change detected in: patient_master
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] [Smart Sync] Targeted PULL for registration at 4:04:50 PM
[1] [Sync Engine] Change detected in: registration, patients, payments, registration_payments, attendance
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] [Sync Engine] Cycle: PUSH at 4:04:50 PM
[1] [Sync Engine] Found 2 pending items to push. Syncing queue to server mysql...
[1] [Source Error] SQL: 
[1]             INSERT INTO registration 
[1]             (master_patient_id, branch_id, created_by_employe... Error: Cannot add or update a child row: a foreign key constraint fails (`prospine`.`registration`, CONSTRAINT `fk_registration_master_patient` FOREIGN KEY (`master_patient_id`) REFERENCES `patient_master` (`master_patient_id`) ON DELETE SET NULL)
[1] [Sync Engine] PUSH Fail: Item #407 Unable to save to source.
[1] [Source Error] SQL: 
[1]                         INSERT INTO registration_payments (registration_id, payment_method, amount,... Error: Cannot add or update a child row: a foreign key constraint fails (`prospine`.`registration_payments`, CONSTRAINT `1` FOREIGN KEY (`registration_id`) REFERENCES `registration` (`registration_id`) ON DELETE CASCADE)
[1] [Sync Engine] PUSH Fail: Item #408 Unable to save to source.
[1] [Sync Engine] Cycle: PUSH at 4:04:50 PM
[1] [Sync Engine] Found 2 pending items to push. Syncing queue to server mysql...
[1] [Source Error] SQL: 
[1]             INSERT INTO registration 
[1]             (master_patient_id, branch_id, created_by_employe... Error: Cannot add or update a child row: a foreign key constraint fails (`prospine`.`registration`, CONSTRAINT `fk_registration_master_patient` FOREIGN KEY (`master_patient_id`) REFERENCES `patient_master` (`master_patient_id`) ON DELETE SET NULL)
[1] [Sync Engine] PUSH Fail: Item #407 Unable to save to source.
[1] [Source Error] SQL: 
[1]                         INSERT INTO registration_payments (registration_id, payment_method, amount,... Error: Cannot add or update a child row: a foreign key constraint fails (`prospine`.`registration_payments`, CONSTRAINT `1` FOREIGN KEY (`registration_id`) REFERENCES `registration` (`registration_id`) ON DELETE CASCADE)
[1] [Sync Engine] PUSH Fail: Item #408 Unable to save to source.
[1] [Sync Engine] Cycle: PUSH at 4:04:50 PM
[1] [Sync Engine] Found 2 pending items to push. Syncing queue to server mysql...
[1] [Source Error] SQL: 
[1]             INSERT INTO registration 
[1]             (master_patient_id, branch_id, created_by_employe... Error: Cannot add or update a child row: a foreign key constraint fails (`prospine`.`registration`, CONSTRAINT `fk_registration_master_patient` FOREIGN KEY (`master_patient_id`) REFERENCES `patient_master` (`master_patient_id`) ON DELETE SET NULL)
[1] [Sync Engine] PUSH Fail: Item #407 Unable to save to source.
[1] [Source Error] SQL: 
[1]                         INSERT INTO registration_payments (registration_id, payment_method, amount,... Error: Cannot add or update a child row: a foreign key constraint fails (`prospine`.`registration_payments`, CONSTRAINT `1` FOREIGN KEY (`registration_id`) REFERENCES `registration` (`registration_id`) ON DELETE CASCADE)
[1] [Sync Engine] PUSH Fail: Item #408 Unable to save to source.
[1] GET /api/system/status 200 1.134 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.524 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 3.924 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 8.671 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 12.417 ms - 3646
[1] GET /api/system/status 200 0.821 ms - 263
[1] GET /api/system/status 200 0.809 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.022 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 4.900 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 16.878 ms - 1060
[1] GET /api/reception/notifications?employee_id=2 200 6.493 ms - 71
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.287 ms - 55
[1] GET /api/reception/dashboard?branch_id=1 200 13.168 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 27.184 ms - 3646
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 16.996 ms - 3646
[1] GET /api/system/status 200 1.201 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.127 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 4.558 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 8.283 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] GET /api/system/status 200 1.385 ms - 263
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 14.061 ms - 3646
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.890 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 5.171 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 9.613 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 13.539 ms - 3646
[1] GET /api/system/status 200 1.785 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.453 ms - 55
[1] GET /api/system/status 200 1.740 ms - 263
[1] GET /api/reception/notifications?employee_id=2 200 5.016 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 13.194 ms - 1060
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 6.707 ms - 55
[1] GET /api/reception/dashboard?branch_id=1 200 13.819 ms - 1060
[1] GET /api/reception/notifications?employee_id=2 200 5.631 ms - 71
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 23.585 ms - 3646
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 17.954 ms - 3646
[1] GET /api/system/status 200 1.531 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 2.487 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 3.815 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 9.164 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 12.449 ms - 3646
[1] GET /api/system/status 200 1.631 ms - 263
[1] GET /api/reception/get_pending_approvals?branch_id=1 200 3.228 ms - 55
[1] GET /api/reception/notifications?employee_id=2 200 4.486 ms - 71
[1] GET /api/reception/dashboard?branch_id=1 200 11.165 ms - 1060
[1] [Lazy Load] SQLite empty for 
[1]             SELECT time_slot 
[1]             FROM pa... Fetching from source to initialize.
[1] [Lazy Load] SQLite empty for SELECT category_name FROM expense_categories WHERE... Fetching from source to initialize.
[1] GET /api/reception/form_options?branch_id=1&appointment_date=2026-03-01&service_type=physio 200 16.133 ms - 3646

