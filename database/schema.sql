-- ============================================
-- ACCUNITE ATTENDANCE MANAGEMENT SYSTEM
-- Database Schema
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS accunite_attendance;
USE accunite_attendance;

-- ============================================
-- TABLE: employees
-- Stores employee master data
-- ============================================
CREATE TABLE employees (
    employee_code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL COMMENT 'Employee email address (used for login)',
    password_hash VARCHAR(255) NULL COMMENT 'Hashed password for employee login',
    salary DECIMAL(10, 2) NULL COMMENT 'Manual entry only - no auto calculation',
    salary_slip_reference VARCHAR(255) NULL COMMENT 'File path or record ID',
    attendance_type ENUM('clocking', 'non-clocking') NOT NULL,
    clock_start_time TIME NULL COMMENT 'Optional - can be set later if needed',
    clock_end_time TIME NULL COMMENT 'Optional - can be set later if needed',
    grace_period_minutes INT DEFAULT 15 COMMENT 'Late arrival tolerance',
    cl_balance DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Casual Leave balance',
    pl_balance DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Paid Leave balance',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp',
    
    INDEX idx_status (status),
    INDEX idx_attendance_type (attendance_type),
    
    -- Validation: Leave balances cannot be negative
    CHECK (cl_balance >= 0),
    CHECK (pl_balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: freelancers
-- Stores freelancer master data
-- ============================================
CREATE TABLE freelancers (
    freelancer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: attendance_records
-- Daily attendance tracking for employees
-- ============================================
CREATE TABLE attendance_records (
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

-- ============================================
-- TABLE: freelancer_sessions
-- Login/logout session tracking for freelancers
-- ============================================
CREATE TABLE freelancer_sessions (
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

-- ============================================
-- TABLE: leave_ledger
-- Transaction-based leave tracking
-- ============================================
CREATE TABLE leave_ledger (
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

-- ============================================
-- TABLE: attendance_edits
-- Audit trail for attendance modifications
-- ============================================
CREATE TABLE attendance_edits (
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

-- ============================================
-- TABLE: admin_users
-- Admin authentication
-- ============================================
CREATE TABLE admin_users (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: working_days
-- Define working days and holidays
-- ============================================
CREATE TABLE working_days (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    is_working_day BOOLEAN DEFAULT TRUE,
    holiday_name VARCHAR(255) NULL COMMENT 'Holiday description if applicable',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Calculate session duration when logout is recorded
DELIMITER //
CREATE TRIGGER calculate_session_duration
BEFORE UPDATE ON freelancer_sessions
FOR EACH ROW
BEGIN
    IF NEW.logout_time IS NOT NULL AND OLD.logout_time IS NULL THEN
        SET NEW.session_duration_minutes = TIMESTAMPDIFF(MINUTE, NEW.login_time, NEW.logout_time);
        SET NEW.is_complete = TRUE;
    END IF;
END//
DELIMITER ;

-- Trigger: Set session date from login time on insert
DELIMITER //
CREATE TRIGGER set_session_date
BEFORE INSERT ON freelancer_sessions
FOR EACH ROW
BEGIN
    SET NEW.session_date = DATE(NEW.login_time);
END//
DELIMITER ;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default admin user (password: admin123 - CHANGE THIS!)
INSERT INTO admin_users (username, password_hash, full_name, email) VALUES 
('admin', '$2a$10$rZ3QhN5Y.xJxJ6GjXxXxXexL8nL8nL8nL8nL8nL8nL8nL8nL8nL8n', 'System Administrator', 'admin@accunite.com');

-- Sample employees for testing
INSERT INTO employees (employee_code, name, salary, attendance_type, clock_start_time, clock_end_time, cl_balance, pl_balance) VALUES
('EMP001', 'John Doe', 50000.00, 'clocking', '09:00:00', '18:00:00', 12.00, 15.00),
('EMP002', 'Jane Smith', 60000.00, 'non-clocking', NULL, NULL, 10.00, 12.00),
('EMP003', 'Bob Johnson', 55000.00, 'clocking', '09:00:00', '18:00:00', 11.00, 14.00);

-- Sample freelancer
INSERT INTO freelancers (name, hourly_rate) VALUES
('Alice Freelancer', 25.00);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View: Employee Summary
CREATE OR REPLACE VIEW employee_summary AS
SELECT 
    e.employee_code,
    e.name,
    e.attendance_type,
    e.cl_balance,
    e.pl_balance,
    COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.attendance_date END) as days_present,
    COUNT(DISTINCT CASE WHEN ar.status = 'absent' THEN ar.attendance_date END) as days_absent,
    COUNT(DISTINCT CASE WHEN ar.status = 'cl' THEN ar.attendance_date END) as cl_used,
    COUNT(DISTINCT CASE WHEN ar.status = 'pl' THEN ar.attendance_date END) as pl_used,
    COUNT(DISTINCT CASE WHEN ar.is_late = TRUE THEN ar.attendance_date END) as late_arrivals,
    COUNT(DISTINCT ar.attendance_date) as total_working_days
FROM employees e
LEFT JOIN attendance_records ar ON e.employee_code = ar.employee_code
WHERE e.status = 'active' AND e.deleted_at IS NULL
GROUP BY e.employee_code, e.name, e.attendance_type, e.cl_balance, e.pl_balance;

-- View: Freelancer Session Summary
CREATE OR REPLACE VIEW freelancer_session_summary AS
SELECT 
    f.freelancer_id,
    f.name,
    f.hourly_rate,
    fs.session_date,
    fs.login_time,
    fs.logout_time,
    fs.session_duration_minutes,
    ROUND(fs.session_duration_minutes / 60.0 * f.hourly_rate, 2) as session_value,
    fs.is_complete
FROM freelancers f
INNER JOIN freelancer_sessions fs ON f.freelancer_id = fs.freelancer_id
WHERE f.status = 'active' AND f.deleted_at IS NULL
ORDER BY fs.session_date DESC, fs.login_time DESC;

-- ============================================
-- END OF SCHEMA
-- ============================================
