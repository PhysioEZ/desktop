[1] [Smart Sync] Targeted PULL for attendance at 2:11:52 AM
[1] [Sync Engine] Change detected in: attendance
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] POST /api/reception/patients 200 3.110 ms - 4754
[1] POST /api/reception/patients 200 3.446 ms - 4754
[1] [Smart Sync] Targeted PULL for patients at 2:11:58 AM
[1] [Sync Engine] Change detected in: patients, patient_master, patients_treatment
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] POST /api/reception/sync 200 21.260 ms - 181
[1] [Mirror] Mirrored 7 rows to payment_methods
[1] [Source Error] SQL: 
[1]         SELECT 
[1]             COUNT(CASE WHEN DATE(created_at) = DATE('now', 'localtime') THEN 1 END)... Error: You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ' 'localtime') THEN 1 END) as new_today,
[1]             COUNT(CASE WHEN status = ...' at line 2
[1] Patients Controller Error: Error: Unable to fetch data from source.
[1]     at SqlitePool._hitSource (/srv/http/admin/desktop/server/src/config/db.js:326:19)
[1]     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
[1]     at async fetchFilters (/srv/http/admin/desktop/server/src/api/reception/patients.js:117:24)
[1]     at async exports.handlePatientsRequest (/srv/http/admin/desktop/server/src/api/reception/patients.js:25:17)
[1] POST /api/reception/patients 500 47.685 ms - 64
[1] [Mirror] Mirrored 16 rows to patients
[1] [Mirror] Mirrored 2 rows to service_tracks
[1] POST /api/reception/patients 200 67.078 ms - 12768
[1] POST /api/reception/patients 200 3.894 ms - 4501
[1] [Lazy Load] SQLite empty for SELECT attendance_id FROM attendance WHERE patient... Fetching from source to initialize.
[1] [Mirror] Mirrored 1 rows to attendance
[1] [Lazy Load] SQLite empty for SELECT attendance_id FROM attendance WHERE patient... Fetching from source to initialize.
[1] [Mirror] Mirrored 1 rows to attendance
[1] [Local-First] Saved data to local SQLite. Action: UPDATE attendance SET status = ?, remark... Successful.
[1] [Local-First] Saved data to local SQLite. Action: UPDATE patients SET 
[1]             advance... Successful.
[1] POST /api/reception/attendance 200 16.130 ms - 83
[1] [Sync Engine] Cycle: PUSH at 2:12:17 AM
[1] [Sync Engine] Found 2 pending items to push. Syncing queue to server mysql...
[1] [Sync Engine] PUSH Success: Item #152 (UPDATE attendance SET status =...)
[1] [Sync Engine] PUSH Success: Item #153 (UPDATE patients SET 
[1]          ...)
[1] [Smart Sync] Targeted PULL for attendance at 2:12:17 AM
[1] [Sync Engine] Change detected in: attendance
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] POST /api/reception/patients 200 2.916 ms - 3176
[1] [Smart Sync] Targeted PULL for patients at 2:12:24 AM
[1] [Sync Engine] Change detected in: patients, patient_master, patients_treatment
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] POST /api/reception/sync 200 12.167 ms - 181
[1] [Mirror] Mirrored 7 rows to payment_methods
[1] [Source Error] SQL: 
[1]         SELECT 
[1]             COUNT(CASE WHEN DATE(created_at) = DATE('now', 'localtime') THEN 1 END)... Error: You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ' 'localtime') THEN 1 END) as new_today,
[1]             COUNT(CASE WHEN status = ...' at line 2
[1] Patients Controller Error: Error: Unable to fetch data from source.
[1]     at SqlitePool._hitSource (/srv/http/admin/desktop/server/src/config/db.js:326:19)
[1]     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
[1]     at async fetchFilters (/srv/http/admin/desktop/server/src/api/reception/patients.js:117:24)
[1]     at async exports.handlePatientsRequest (/srv/http/admin/desktop/server/src/api/reception/patients.js:25:17)
[1] POST /api/reception/patients 500 38.722 ms - 64
[1] [Mirror] Mirrored 16 rows to patients
[1] [Mirror] Mirrored 2 rows to service_tracks
[1] POST /api/reception/patients 200 58.553 ms - 12768
[1] POST /api/reception/patients 200 2.155 ms - 3176
[1] [Lazy Load] SQLite empty for SELECT attendance_id FROM attendance WHERE patient... Fetching from source to initialize.
[1] [Mirror] Mirrored 1 rows to attendance
[1] [Lazy Load] SQLite empty for SELECT attendance_id FROM attendance WHERE patient... Fetching from source to initialize.
[1] [Mirror] Mirrored 1 rows to attendance
[1] [Local-First] Saved data to local SQLite. Action: UPDATE attendance SET status = ?, remark... Successful.
[1] [Local-First] Saved data to local SQLite. Action: UPDATE patients SET 
[1]             advance... Successful.
[1] POST /api/reception/attendance 200 14.807 ms - 83
[1] [Sync Engine] Cycle: PUSH at 2:12:33 AM
[1] [Sync Engine] Found 2 pending items to push. Syncing queue to server mysql...
[1] [Sync Engine] PUSH Success: Item #154 (UPDATE attendance SET status =...)
[1] [Sync Engine] PUSH Success: Item #155 (UPDATE patients SET 
[1]          ...)
[1] [Smart Sync] Targeted PULL for attendance at 2:12:33 AM
[1] [Sync Engine] Change detected in: attendance
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] POST /api/reception/patients 200 2.959 ms - 3176
[1] [Smart Sync] Targeted PULL for patients at 2:12:47 AM
[1] [Sync Engine] Change detected in: patients, patient_master, patients_treatment
[1] [Sync Engine] PULL Complete. Local SQLite synchronized. Status: Regular
[1] POST /api/reception/sync 200 17.530 ms - 181
[1] [Mirror] Mirrored 7 rows to payment_methods
[1] [Source Error] SQL: 
[1]         SELECT 
[1]             COUNT(CASE WHEN DATE(created_at) = DATE('now', 'localtime') THEN 1 END)... Error: You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ' 'localtime') THEN 1 END) as new_today,
[1]             COUNT(CASE WHEN status = ...' at line 2
[1] Patients Controller Error: Error: Unable to fetch data from source.
[1]     at SqlitePool._hitSource (/srv/http/admin/desktop/server/src/config/db.js:326:19)
[1]     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
[1]     at async fetchFilters (/srv/http/admin/desktop/server/src/api/reception/patients.js:117:24)
[1]     at async exports.handlePatientsRequest (/srv/http/admin/desktop/server/src/api/reception/patients.js:25:17)
[1] POST /api/reception/patients 500 40.417 ms - 64
[1] [Mirror] Mirrored 16 rows to patients
[1] [Mirror] Mirrored 2 rows to service_tracks
[1] POST /api/reception/patients 200 61.552 ms - 12768

