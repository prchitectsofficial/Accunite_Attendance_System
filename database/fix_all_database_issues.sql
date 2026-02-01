-- ============================================
-- Fix All Database Issues
-- Run this in MySQL to fix missing columns and tables
-- ============================================

USE accunite_attendance;

-- 1. Add password_hash column to employees (if not exists)
ALTER TABLE employees 
ADD COLUMN password_hash VARCHAR(255) NULL COMMENT 'Hashed password for employee login' AFTER email;

-- 2. Add status column to freelancers (if not exists)
ALTER TABLE freelancers 
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER hourly_rate;

-- 3. Create attendance_records table (if not exists)
CREATE TABLE IF NOT EXISTS attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'cl', 'pl') NOT NULL,
    is_off_day_login BOOLEAN DEFAULT FALSE COMMENT 'Logged in on off day',
    clock_in_time DATETIME NULL COMMENT 'For clocking employees',
    clock_out_time DATETIME NULL COMMENT 'For clocking employees',
    is_late BOOLEAN DEFAULT FALSE COMMENT 'Arrived after grace period',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_code) REFERENCES employees(employee_code) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_date (employee_code, attendance_date),
    INDEX idx_date (attendance_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create leave_ledger table (if not exists)
CREATE TABLE IF NOT EXISTS leave_ledger (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(50) NOT NULL,
    transaction_type ENUM('debit', 'credit', 'encash', 'carryforward', 'conversion') NOT NULL,
    leave_type ENUM('cl', 'pl') NOT NULL,
    amount DECIMAL(5, 2) NOT NULL,
    balance_after DECIMAL(5, 2) NOT NULL COMMENT 'Balance after this transaction',
    notes TEXT NOT NULL COMMENT 'Mandatory for manual actions',
    admin_user VARCHAR(100) NULL COMMENT 'Who performed the action',
    reference_date DATE NULL COMMENT 'Related attendance date if applicable',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_code) REFERENCES employees(employee_code) ON DELETE CASCADE,
    INDEX idx_employee (employee_code),
    INDEX idx_type (transaction_type),
    INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create attendance_edits table (if not exists)
CREATE TABLE IF NOT EXISTS attendance_edits (
    edit_id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_record_id INT NOT NULL,
    employee_code VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    reason TEXT NOT NULL COMMENT 'Mandatory notes for edit',
    admin_user VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_code) REFERENCES employees(employee_code) ON DELETE CASCADE,
    INDEX idx_employee (employee_code),
    INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create freelancer_sessions table (if not exists)
CREATE TABLE IF NOT EXISTS freelancer_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    freelancer_id INT NOT NULL,
    login_time DATETIME NOT NULL,
    logout_time DATETIME NULL,
    session_duration_minutes INT NULL COMMENT 'Auto-calculated, read-only',
    session_date DATE NOT NULL COMMENT 'Derived from login_time',
    is_complete BOOLEAN DEFAULT FALSE COMMENT 'Has logout time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(freelancer_id) ON DELETE CASCADE,
    INDEX idx_freelancer (freelancer_id),
    INDEX idx_date (session_date),
    INDEX idx_complete (is_complete)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify all tables exist
SHOW TABLES;

-- Verify columns were added
DESCRIBE employees;
DESCRIBE freelancers;
