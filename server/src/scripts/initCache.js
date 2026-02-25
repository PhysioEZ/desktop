const sqlite = require('../config/sqlite');

/**
 * SQLite schemas — must match MySQL exactly so pullTable() INSERT works.
 * Column names are taken directly from `SHOW COLUMNS FROM <table>` on the prod DB.
 * Columns never used locally (password_hash, etc.) are still included so upserts don't fail.
 */
const tables = {
    // ─── Core Patient/Clinical Tables ───────────────────────────────────────
    patients: `
        patient_id INTEGER PRIMARY KEY,
        master_patient_id INTEGER, branch_id INTEGER, registration_id INTEGER,
        created_by_employee_id INTEGER, assigned_doctor TEXT,
        service_type TEXT, treatment_type TEXT, treatment_cost_per_day REAL,
        package_cost REAL, treatment_days INTEGER, total_amount REAL,
        payment_method TEXT, treatment_time_slot TEXT, advance_payment REAL,
        discount_amount REAL, discount_approved_by INTEGER,
        discount_approved_by_employee_id INTEGER, due_amount REAL,
        start_date TEXT, end_date TEXT, status TEXT, patient_photo_path TEXT,
        created_at TEXT, updated_at TEXT, remarks TEXT, plan_changed INTEGER,
        service_track_id INTEGER, discount_percentage REAL, custom_fields TEXT
    `,
    registration: `
        registration_id INTEGER PRIMARY KEY,
        master_patient_id INTEGER, branch_id INTEGER, inquiry_id INTEGER,
        created_by_employee_id INTEGER, patient_name TEXT, phone_number TEXT,
        email TEXT, gender TEXT, age TEXT, chief_complain TEXT,
        referralSource TEXT, reffered_by TEXT, occupation TEXT, address TEXT,
        consultation_type TEXT, appointment_date TEXT, appointment_time TEXT,
        consultation_amount REAL, payment_method TEXT, remarks TEXT,
        doctor_notes TEXT, prescription TEXT, follow_up_date TEXT,
        status TEXT, refund_status TEXT, created_at TEXT, updated_at TEXT,
        patient_photo_path TEXT, referral_partner_id INTEGER,
        commission_amount REAL, commission_status TEXT, approval_status TEXT
    `,
    tests: `
        test_id INTEGER PRIMARY KEY, test_uid TEXT, branch_id INTEGER,
        patient_id INTEGER, inquiry_id INTEGER, created_by_employee_id INTEGER,
        visit_date TEXT, assigned_test_date TEXT, patient_name TEXT,
        phone_number TEXT, gender TEXT, age TEXT, dob TEXT, parents TEXT,
        relation TEXT, alternate_phone_no TEXT, address TEXT, limb TEXT,
        test_name TEXT, referred_by TEXT, test_done_by TEXT,
        total_amount REAL, advance_amount REAL, due_amount REAL,
        discount REAL, payment_method TEXT, payment_status TEXT,
        refund_status TEXT, created_at TEXT, updated_at TEXT, test_status TEXT,
        referral_partner_id INTEGER, approval_status TEXT
    `,

    // attendance — PK attendance_id, has payment_id, approved_at, approved_by
    attendance: `
        attendance_id INTEGER PRIMARY KEY,
        patient_id INTEGER, marked_by_employee_id INTEGER,
        attendance_date TEXT, remarks TEXT, payment_id INTEGER,
        created_at TEXT, status TEXT, approval_request_at TEXT,
        approved_at TEXT, approved_by INTEGER
    `,

    payments: `
        payment_id INTEGER PRIMARY KEY, patient_id INTEGER,
        processed_by_employee_id INTEGER, payment_date TEXT,
        amount REAL, mode TEXT, remarks TEXT, created_at TEXT, branch_id INTEGER
    `,
    quick_inquiry: `
        inquiry_id INTEGER PRIMARY KEY, branch_id INTEGER,
        created_by_employee_id INTEGER, name TEXT, age TEXT, gender TEXT,
        inquiry_type TEXT, communication_type TEXT, referralSource TEXT,
        chief_complain TEXT, phone_number TEXT, review TEXT,
        expected_visit_date TEXT, status TEXT, created_at TEXT,
        referred_by TEXT, next_followup_date TEXT
    `,
    test_inquiry: `
        inquiry_id INTEGER PRIMARY KEY, branch_id INTEGER,
        created_by_employee_id INTEGER, name TEXT, testname TEXT,
        reffered_by TEXT, mobile_number TEXT, expected_visit_date TEXT,
        status TEXT, created_at TEXT, address TEXT, limb TEXT,
        test_done_by TEXT, assigned_test_date TEXT
    `,

    // patient_master — has first_registered_at (NOT first_registered_branch_id only)
    patient_master: `
        master_patient_id INTEGER PRIMARY KEY, patient_uid TEXT,
        full_name TEXT, phone_number TEXT, gender TEXT, age TEXT,
        first_registered_at TEXT, first_registered_branch_id INTEGER
    `,

    // patients_treatment — PK is treatment_id (not id!)
    patients_treatment: `
        treatment_id INTEGER PRIMARY KEY, patient_id INTEGER,
        treatment_type TEXT, treatment_cost_per_day REAL, package_cost REAL,
        treatment_days INTEGER, attendance_count INTEGER, consumed_amount REAL,
        total_amount REAL, advance_payment REAL, discount_amount REAL,
        discount_percentage REAL, due_amount REAL, start_date TEXT,
        end_date TEXT, status TEXT, created_at TEXT, remarks TEXT,
        treatment_time_slot TEXT, archived_reason TEXT,
        created_by_employee_id INTEGER
    `,

    // ─── Auth & Session ──────────────────────────────────────────────────────
    api_tokens: `
        token_id INTEGER PRIMARY KEY, employee_id INTEGER, token TEXT UNIQUE,
        created_at TEXT, expires_at TEXT, last_used_at TEXT,
        is_revoked INTEGER DEFAULT 0, user_agent TEXT, ip_address TEXT
    `,

    // ─── Staff & Config ──────────────────────────────────────────────────────
    // employees — has user_id, first_name, last_name, user_email, etc.
    employees: `
        employee_id INTEGER PRIMARY KEY, user_id INTEGER, branch_id INTEGER,
        role_id INTEGER, first_name TEXT, last_name TEXT, job_title TEXT,
        phone_number TEXT, email TEXT, user_email TEXT, password_hash TEXT,
        auth_version INTEGER, address TEXT, date_of_birth TEXT,
        date_of_joining TEXT, is_active INTEGER, photo_path TEXT,
        created_at TEXT, updated_at TEXT
    `,
    roles: `role_id INTEGER PRIMARY KEY, role_name TEXT`,

    // branches — has state, country, pincode, logo_secondary_path, is_active, admin_employee_id, created_by
    branches: `
        branch_id INTEGER PRIMARY KEY, branch_name TEXT, clinic_name TEXT,
        address_line_1 TEXT, address_line_2 TEXT, city TEXT, state TEXT,
        pincode TEXT, phone_primary TEXT, phone_secondary TEXT, email TEXT,
        logo_primary_path TEXT, logo_secondary_path TEXT,
        is_active INTEGER, created_at TEXT,
        admin_employee_id INTEGER, created_by INTEGER
    `,

    // payment_methods — PK is method_id (not id)
    payment_methods: `
        method_id INTEGER PRIMARY KEY, branch_id INTEGER,
        method_name TEXT, method_code TEXT, is_active INTEGER,
        display_order INTEGER, created_at TEXT
    `,

    service_tracks: `id INTEGER PRIMARY KEY, name TEXT, pricing TEXT, is_active INTEGER`,
    daily_patient_counter: `entry_date TEXT PRIMARY KEY, counter INTEGER`,

    // notifications — has link_url (not link), no title column
    notifications: `
        notification_id INTEGER PRIMARY KEY, employee_id INTEGER,
        created_by_employee_id INTEGER, branch_id INTEGER,
        message TEXT, link_url TEXT, is_read INTEGER DEFAULT 0,
        created_at TEXT
    `,

    // expenses — full schema from SHOW COLUMNS
    expenses: `
        expense_id INTEGER PRIMARY KEY, branch_id INTEGER,
        user_id INTEGER, employee_id INTEGER,
        voucher_no TEXT, manual_voucher_no TEXT, expense_date TEXT,
        paid_to TEXT, expense_done_by TEXT, expense_for TEXT,
        description TEXT, amount REAL, amount_in_words TEXT,
        status TEXT, approved_by_user_id INTEGER,
        approved_by_employee_id INTEGER, approved_at TEXT,
        authorized_by_user_id INTEGER, authorized_by_employee_id INTEGER,
        created_at TEXT, updated_at TEXT,
        payment_method TEXT, cheque_details TEXT, bill_image_path TEXT
    `,

    // system_settings — PK is setting_key (TEXT), no setting_id
    system_settings: `
        setting_key TEXT PRIMARY KEY, setting_value TEXT,
        updated_at TEXT, updated_by INTEGER
    `,
};

function init() {
    console.log('Initializing local SQLite cache tables...');

    // DROP + recreate — safe because this is a pure pull-cache.
    // All data is re-synced from MySQL; nothing is written here exclusively.
    for (const [table, schema] of Object.entries(tables)) {
        sqlite.exec(`DROP TABLE IF EXISTS ${table}`);
        sqlite.exec(`CREATE TABLE ${table} (${schema}, _sync_status TEXT DEFAULT 'synced', _last_synced_at TEXT)`);
        console.log(`  ✓ ${table}`);
    }

    // sync_history tracks when each table was last pulled
    sqlite.exec(`CREATE TABLE IF NOT EXISTS sync_history (table_name TEXT PRIMARY KEY, last_sync_at TEXT)`);
    console.log('All tables initialized.');
}

init();
