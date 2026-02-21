-- 2024-05-24: Table for Reception Note Taking
CREATE TABLE IF NOT EXISTS reception_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    employee_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (branch_id),
    INDEX (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE reception_notes ADD COLUMN type ENUM('public', 'private') DEFAULT 'public' AFTER employee_id;
ALTER TABLE reception_notes ADD COLUMN attachment_path VARCHAR(255) DEFAULT NULL;
ALTER TABLE reception_notes ADD COLUMN attachment_type VARCHAR(50) DEFAULT NULL;
ALTER TABLE reception_notes ADD COLUMN mentions TEXT DEFAULT NULL;

-- 2026-02-21: Add Resolution Tracking columns to patient_feedback
ALTER TABLE patient_feedback ADD COLUMN is_resolved TINYINT(1) DEFAULT 0;
ALTER TABLE patient_feedback ADD COLUMN resolution_note TEXT DEFAULT NULL;
ALTER TABLE patient_feedback ADD COLUMN resolved_by INT DEFAULT NULL;
ALTER TABLE patient_feedback ADD COLUMN resolved_at TIMESTAMP NULL DEFAULT NULL;

-- 2026-02-21: Add print_count to tokens for reprint limiting
ALTER TABLE tokens ADD COLUMN print_count INT DEFAULT 1;