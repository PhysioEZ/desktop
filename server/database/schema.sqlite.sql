CREATE TABLE IF NOT EXISTS `api_tokens` (
  `token_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `employee_id` INTEGER,
  `token` TEXT,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `expires_at` TEXT,
  `last_used_at` TEXT,
  `is_revoked` INTEGER DEFAULT 0,
  `user_agent` TEXT,
  `ip_address` TEXT
);

CREATE TABLE IF NOT EXISTS `appointment_requests` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `fullName` TEXT,
  `phone` TEXT,
  `location` TEXT,
  `branch_id` INTEGER DEFAULT 1,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `status` TEXT DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS `appointments` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `patient_id` INTEGER,
  `branch_id` INTEGER DEFAULT 1,
  `consultationType` TEXT,
  `fullName` TEXT,
  `email` TEXT,
  `phone` TEXT,
  `gender` TEXT,
  `dob` TEXT,
  `age` TEXT,
  `occupation` TEXT,
  `address` TEXT,
  `medical_condition` TEXT,
  `conditionType` TEXT DEFAULT 'other',
  `referralSource` TEXT DEFAULT 'self',
  `contactMethod` TEXT DEFAULT 'Phone',
  `location` TEXT,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `status` TEXT DEFAULT 'pending',
  `payment_status` TEXT DEFAULT 'pending',
  `payment_amount` REAL,
  `payment_method` TEXT,
  `payment_date` TEXT,
  `transaction_id` TEXT
);

CREATE TABLE IF NOT EXISTS `attendance` (
  `attendance_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `patient_id` INTEGER,
  `marked_by_employee_id` INTEGER,
  `attendance_date` TEXT,
  `remarks` TEXT,
  `payment_id` INTEGER,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `status` TEXT DEFAULT 'present',
  `approval_request_at` TEXT,
  `approved_at` TEXT,
  `approved_by` INTEGER
);

CREATE TABLE IF NOT EXISTS `audit_log` (
  `log_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `log_timestamp` TEXT DEFAULT 'current_timestamp()',
  `user_id` INTEGER,
  `employee_id` INTEGER,
  `username` TEXT,
  `branch_id` INTEGER,
  `action_type` TEXT,
  `target_table` TEXT,
  `target_id` INTEGER,
  `details_before` TEXT,
  `details_after` TEXT,
  `ip_address` TEXT
);

CREATE TABLE IF NOT EXISTS `blocked_ips` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `ip_address` TEXT,
  `reason` TEXT,
  `blocked_by` TEXT,
  `blocked_at` TEXT
);

CREATE TABLE IF NOT EXISTS `branch_budgets` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `daily_budget_amount` REAL,
  `effective_from_date` TEXT,
  `created_by_user_id` INTEGER,
  `created_by_employee_id` INTEGER,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `branches` (
  `branch_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_name` TEXT,
  `clinic_name` TEXT,
  `address_line_1` TEXT,
  `address_line_2` TEXT,
  `city` TEXT,
  `state` TEXT,
  `pincode` TEXT,
  `phone_primary` TEXT,
  `phone_secondary` TEXT,
  `email` TEXT,
  `logo_primary_path` TEXT,
  `logo_secondary_path` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `admin_employee_id` INTEGER,
  `created_by` INTEGER
);

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `message_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `sender_employee_id` INTEGER,
  `receiver_employee_id` INTEGER,
  `message_type` TEXT DEFAULT 'text',
  `message_text` TEXT,
  `is_read` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `chief_complaints` (
  `complaint_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `complaint_name` TEXT,
  `complaint_code` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `display_order` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `clinic_settings` (
  `setting_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `setting_key` TEXT,
  `setting_value` TEXT,
  `updated_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `consultation_types` (
  `consultation_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `consultation_name` TEXT,
  `consultation_code` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `display_order` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `daily_patient_counter` (
  `entry_date` TEXT,
  `counter` INTEGER DEFAULT 0,
  PRIMARY KEY (`entry_date`)
);

CREATE TABLE IF NOT EXISTS `departments` (
  `department_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `department_name` TEXT,
  `description` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `employees` (
  `employee_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_id` INTEGER,
  `branch_id` INTEGER,
  `role_id` INTEGER,
  `first_name` TEXT,
  `last_name` TEXT,
  `job_title` TEXT,
  `phone_number` TEXT,
  `email` TEXT,
  `user_email` TEXT,
  `password_hash` TEXT,
  `auth_version` INTEGER DEFAULT 1,
  `address` TEXT,
  `date_of_birth` TEXT,
  `date_of_joining` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `photo_path` TEXT,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `updated_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `expense_categories` (
  `category_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `category_name` TEXT,
  `display_order` INTEGER DEFAULT 0,
  `is_active` INTEGER DEFAULT 1,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `expenses` (
  `expense_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `user_id` INTEGER,
  `employee_id` INTEGER,
  `voucher_no` TEXT,
  `manual_voucher_no` TEXT,
  `expense_date` TEXT,
  `paid_to` TEXT,
  `expense_done_by` TEXT,
  `expense_for` TEXT,
  `description` TEXT,
  `amount` REAL,
  `amount_in_words` TEXT,
  `status` TEXT DEFAULT 'pending',
  `approved_by_user_id` INTEGER DEFAULT 1,
  `approved_by_employee_id` INTEGER,
  `approved_at` TEXT,
  `authorized_by_user_id` INTEGER,
  `authorized_by_employee_id` INTEGER,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `updated_at` TEXT DEFAULT 'current_timestamp()',
  `payment_method` TEXT,
  `cheque_details` TEXT,
  `bill_image_path` TEXT
);

CREATE TABLE IF NOT EXISTS `inquiry_followups` (
  `followup_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `inquiry_id` INTEGER,
  `inquiry_type` TEXT,
  `branch_id` INTEGER,
  `employee_id` INTEGER,
  `note` TEXT,
  `next_followup_date` TEXT,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `inquiry_service_types` (
  `service_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `service_name` TEXT,
  `service_code` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `display_order` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `issue_attachments` (
  `attachment_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `issue_id` INTEGER,
  `file_path` TEXT,
  `uploaded_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `job_applications` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `full_name` TEXT,
  `email` TEXT,
  `phone` TEXT,
  `message` TEXT,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `status` TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS `limb_types` (
  `limb_type_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `limb_name` TEXT,
  `limb_code` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `display_order` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `username` TEXT,
  `ip` BLOB,
  `attempt_count` INTEGER DEFAULT 0,
  `last_attempt` TEXT,
  `locked_until` TEXT
);

CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `employee_id` INTEGER,
  `created_by_employee_id` INTEGER,
  `branch_id` INTEGER,
  `message` TEXT,
  `link_url` TEXT,
  `is_read` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `patient_appointments` (
  `appointment_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `patient_id` INTEGER,
  `branch_id` INTEGER,
  `created_by_employee_id` INTEGER,
  `appointment_date` TEXT,
  `time_slot` TEXT,
  `service_type` TEXT,
  `status` TEXT DEFAULT 'scheduled',
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `patient_feedback` (
  `feedback_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `patient_id` INTEGER,
  `branch_id` INTEGER,
  `feedback_type` TEXT DEFAULT 'Good',
  `patient_status_snapshot` TEXT,
  `comments` TEXT,
  `created_by_employee_id` INTEGER,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `is_resolved` INTEGER DEFAULT 0,
  `resolution_note` TEXT,
  `resolved_by` INTEGER,
  `resolved_at` TEXT
);

CREATE TABLE IF NOT EXISTS `patient_master` (
  `master_patient_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `patient_uid` TEXT,
  `full_name` TEXT,
  `phone_number` TEXT,
  `gender` TEXT,
  `age` TEXT,
  `first_registered_at` TEXT DEFAULT 'current_timestamp()',
  `first_registered_branch_id` INTEGER
);

CREATE TABLE IF NOT EXISTS `patients` (
  `patient_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `master_patient_id` INTEGER,
  `branch_id` INTEGER,
  `registration_id` INTEGER,
  `service_track_id` INTEGER,
  `created_by_employee_id` INTEGER,
  `assigned_doctor` TEXT DEFAULT 'Not Assigned',
  `service_type` TEXT DEFAULT 'physio',
  `treatment_type` TEXT,
  `treatment_cost_per_day` REAL,
  `package_cost` REAL,
  `treatment_days` INTEGER,
  `total_amount` REAL,
  `payment_method` TEXT DEFAULT 'cash',
  `treatment_time_slot` TEXT,
  `advance_payment` REAL DEFAULT 0.00,
  `discount_amount` REAL DEFAULT 0.00,
  `discount_percentage` REAL DEFAULT 0.00,
  `discount_approved_by` INTEGER,
  `discount_approved_by_employee_id` INTEGER,
  `due_amount` REAL,
  `start_date` TEXT,
  `end_date` TEXT,
  `status` TEXT DEFAULT 'active',
  `patient_photo_path` TEXT,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `updated_at` TEXT DEFAULT 'current_timestamp()',
  `remarks` TEXT,
  `custom_fields` TEXT,
  `plan_changed` INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `patients_treatment` (
  `treatment_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `patient_id` INTEGER,
  `treatment_type` TEXT,
  `treatment_cost_per_day` REAL DEFAULT 0.00,
  `package_cost` REAL DEFAULT 0.00,
  `treatment_days` INTEGER DEFAULT 0,
  `attendance_count` INTEGER DEFAULT 0,
  `consumed_amount` REAL DEFAULT 0.00,
  `total_amount` REAL DEFAULT 0.00,
  `advance_payment` REAL DEFAULT 0.00,
  `discount_amount` REAL DEFAULT 0.00,
  `discount_percentage` REAL DEFAULT 0.00,
  `due_amount` REAL DEFAULT 0.00,
  `start_date` TEXT,
  `end_date` TEXT,
  `status` TEXT DEFAULT 'active',
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `remarks` TEXT,
  `treatment_time_slot` TEXT,
  `archived_reason` TEXT,
  `created_by_employee_id` INTEGER
);

CREATE TABLE IF NOT EXISTS `payment_methods` (
  `method_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `method_name` TEXT,
  `method_code` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `display_order` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `payment_splits` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `payment_id` INTEGER,
  `payment_method` TEXT,
  `amount` REAL,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `patient_id` INTEGER,
  `branch_id` INTEGER,
  `processed_by_employee_id` INTEGER,
  `payment_date` TEXT,
  `amount` REAL,
  `mode` TEXT DEFAULT 'cash',
  `remarks` TEXT,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `quick_inquiry` (
  `inquiry_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `created_by_employee_id` INTEGER,
  `name` TEXT,
  `age` TEXT,
  `gender` TEXT,
  `inquiry_type` TEXT,
  `communication_type` TEXT,
  `referralSource` TEXT DEFAULT 'self',
  `referred_by` TEXT,
  `chief_complain` TEXT,
  `phone_number` TEXT,
  `review` TEXT,
  `expected_visit_date` TEXT,
  `status` TEXT DEFAULT 'pending',
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `next_followup_date` TEXT
);

CREATE TABLE IF NOT EXISTS `reception_notes` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `employee_id` INTEGER,
  `type` TEXT DEFAULT 'public',
  `content` TEXT,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `updated_at` TEXT DEFAULT 'current_timestamp()',
  `attachment_path` TEXT,
  `attachment_type` TEXT,
  `mentions` TEXT
);

CREATE TABLE IF NOT EXISTS `referral_partners` (
  `partner_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` TEXT,
  `phone` TEXT,
  `status` TEXT DEFAULT 'active',
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `updated_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `referral_rates` (
  `rate_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `partner_id` INTEGER,
  `service_type` TEXT,
  `service_item_name` TEXT,
  `commission_amount` REAL DEFAULT 0.00,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `referral_sources` (
  `source_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `source_name` TEXT,
  `source_code` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `display_order` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `registration` (
  `registration_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `master_patient_id` INTEGER,
  `branch_id` INTEGER,
  `inquiry_id` INTEGER,
  `created_by_employee_id` INTEGER,
  `patient_name` TEXT,
  `phone_number` TEXT,
  `email` TEXT,
  `gender` TEXT,
  `age` TEXT,
  `chief_complain` TEXT,
  `referralSource` TEXT DEFAULT 'self',
  `reffered_by` TEXT,
  `occupation` TEXT,
  `address` TEXT,
  `consultation_type` TEXT DEFAULT 'in_clinic',
  `appointment_date` TEXT,
  `appointment_time` TEXT,
  `consultation_amount` REAL,
  `payment_method` TEXT DEFAULT 'cash',
  `remarks` TEXT,
  `doctor_notes` TEXT,
  `prescription` TEXT,
  `follow_up_date` TEXT,
  `status` TEXT DEFAULT 'Pending',
  `refund_status` TEXT DEFAULT 'no',
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `updated_at` TEXT DEFAULT 'current_timestamp()',
  `patient_photo_path` TEXT,
  `referral_partner_id` INTEGER,
  `commission_amount` REAL DEFAULT 0.00,
  `commission_status` TEXT DEFAULT 'pending',
  `approval_status` TEXT DEFAULT 'approved'
);

CREATE TABLE IF NOT EXISTS `registration_payments` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `registration_id` INTEGER,
  `branch_id` INTEGER,
  `payment_method` TEXT,
  `amount` REAL,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `role_login_keys` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `key_name` TEXT,
  `password_hash` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `updated_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `role_name` TEXT
);

CREATE TABLE IF NOT EXISTS `service_tracks` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `name` TEXT,
  `button_label` TEXT,
  `icon` TEXT,
  `theme_color` TEXT,
  `fields` TEXT,
  `pricing` TEXT,
  `scheduling` TEXT,
  `permissions` TEXT,
  `is_active` INTEGER DEFAULT 1,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `updated_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `system_issues` (
  `issue_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `reported_by` INTEGER,
  `subject` TEXT,
  `description` TEXT,
  `priority` TEXT DEFAULT 'medium',
  `category` TEXT DEFAULT 'general',
  `status` TEXT DEFAULT 'pending',
  `release_schedule` TEXT DEFAULT 'next_release',
  `release_date` TEXT,
  `admin_response` TEXT,
  `system_metadata` TEXT,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `updated_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `system_services` (
  `service_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `service_name` TEXT,
  `service_slug` TEXT,
  `current_status` INTEGER DEFAULT 'operational',
  `last_updated` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` TEXT,
  `setting_value` TEXT,
  `updated_at` TEXT DEFAULT 'current_timestamp()',
  `updated_by` INTEGER,
  PRIMARY KEY (`setting_key`)
);

CREATE TABLE IF NOT EXISTS `test_inquiry` (
  `inquiry_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `created_by_employee_id` INTEGER,
  `name` TEXT,
  `testname` TEXT,
  `address` TEXT,
  `reffered_by` TEXT,
  `mobile_number` TEXT,
  `limb` TEXT,
  `test_done_by` TEXT,
  `assigned_test_date` TEXT,
  `expected_visit_date` TEXT,
  `status` TEXT DEFAULT 'pending',
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `test_items` (
  `item_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `test_id` INTEGER,
  `created_by_employee_id` INTEGER,
  `assigned_test_date` TEXT,
  `test_name` TEXT,
  `limb` TEXT,
  `referred_by` TEXT,
  `test_done_by` TEXT,
  `total_amount` REAL,
  `advance_amount` REAL DEFAULT 0.00,
  `due_amount` REAL DEFAULT 0.00,
  `discount` REAL,
  `payment_method` TEXT DEFAULT 'cash',
  `test_status` TEXT DEFAULT 'pending',
  `payment_status` TEXT DEFAULT 'pending',
  `refund_status` TEXT DEFAULT 'no',
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `referral_partner_id` INTEGER,
  `commission_amount` REAL DEFAULT 0.00,
  `commission_status` TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS `test_payments` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `test_id` INTEGER,
  `payment_method` TEXT,
  `amount` REAL,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `test_staff` (
  `staff_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `staff_name` TEXT,
  `job_title` TEXT DEFAULT 'Technician',
  `is_active` INTEGER DEFAULT 1,
  `display_order` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `test_types` (
  `test_type_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `test_name` TEXT,
  `test_code` TEXT,
  `default_cost` REAL DEFAULT 0.00,
  `requires_limb_selection` INTEGER DEFAULT 0,
  `is_active` INTEGER DEFAULT 1,
  `display_order` INTEGER DEFAULT 0,
  `created_at` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `tests` (
  `test_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `test_uid` TEXT,
  `branch_id` INTEGER,
  `patient_id` INTEGER,
  `inquiry_id` INTEGER,
  `created_by_employee_id` INTEGER,
  `visit_date` TEXT,
  `assigned_test_date` TEXT,
  `patient_name` TEXT,
  `phone_number` TEXT,
  `gender` TEXT,
  `age` TEXT,
  `dob` TEXT,
  `parents` TEXT,
  `relation` TEXT,
  `alternate_phone_no` TEXT,
  `address` TEXT,
  `limb` TEXT DEFAULT 'none',
  `test_name` TEXT,
  `referred_by` TEXT,
  `test_done_by` TEXT,
  `total_amount` REAL,
  `advance_amount` REAL DEFAULT 0.00,
  `due_amount` REAL DEFAULT 0.00,
  `discount` REAL,
  `payment_method` TEXT DEFAULT 'cash',
  `payment_status` TEXT DEFAULT 'pending',
  `refund_status` TEXT DEFAULT 'no',
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `updated_at` TEXT DEFAULT 'current_timestamp()',
  `test_status` TEXT DEFAULT 'pending',
  `referral_partner_id` INTEGER,
  `approval_status` TEXT DEFAULT 'approved'
);

CREATE TABLE IF NOT EXISTS `tests_lists` (
  `test_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `branch_id` INTEGER,
  `test_name` TEXT,
  `default_amount` REAL
);

CREATE TABLE IF NOT EXISTS `tokens` (
  `token_id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `token_uid` TEXT,
  `branch_id` INTEGER,
  `patient_id` INTEGER,
  `created_by_employee_id` INTEGER,
  `service_type` TEXT,
  `token_date` TEXT,
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `print_count` INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS `user_device_tokens` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `employee_id` INTEGER,
  `token` TEXT,
  `platform` TEXT DEFAULT 'android',
  `created_at` TEXT DEFAULT 'current_timestamp()',
  `last_updated` TEXT DEFAULT 'current_timestamp()'
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT
);


CREATE TABLE IF NOT EXISTS `pending_sync_queue` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `action` TEXT,
  `url` TEXT,
  `method` TEXT,
  `body` TEXT,
  `headers` TEXT,
  `created_at` TEXT DEFAULT (CURRENT_TIMESTAMP),
  `status` TEXT DEFAULT 'pending',
  `attempts` INTEGER DEFAULT 0,
  `last_error` TEXT
);
