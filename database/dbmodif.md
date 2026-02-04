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