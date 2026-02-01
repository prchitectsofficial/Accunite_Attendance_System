-- Create attendance_records table WITHOUT foreign key (to avoid compatibility issues)
USE accunite_attendance;

-- Drop table if exists (optional - only if you want to recreate)
-- DROP TABLE IF EXISTS attendance_records;

-- Create attendance_records table without foreign key
CREATE TABLE IF NOT EXISTS attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'cl', 'pl') NOT NULL,
    is_off_day_login BOOLEAN DEFAULT FALSE,
    clock_in_time DATETIME NULL,
    clock_out_time DATETIME NULL,
    is_late BOOLEAN DEFAULT FALSE,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_employee_date (employee_code, attendance_date),
    INDEX idx_date (attendance_date),
    INDEX idx_status (status),
    INDEX idx_employee_code (employee_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Now create attendance_edits table
CREATE TABLE IF NOT EXISTS attendance_edits (
    edit_id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_record_id INT NOT NULL,
    employee_code VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    reason TEXT NOT NULL,
    admin_user VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_employee (employee_code),
    INDEX idx_date (created_at),
    INDEX idx_attendance_record (attendance_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create freelancer_sessions table (without foreign key for now)
CREATE TABLE IF NOT EXISTS freelancer_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    freelancer_id INT NOT NULL,
    login_time DATETIME NOT NULL,
    logout_time DATETIME NULL,
    session_duration_minutes INT NULL,
    session_date DATE NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_date (session_date),
    INDEX idx_complete (is_complete)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables
SHOW TABLES;
