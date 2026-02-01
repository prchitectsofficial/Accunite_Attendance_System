-- ============================================
-- Fix leave_ledger table (with collation fix)
-- Run this in MySQL to ensure the table exists with correct structure
-- ============================================

USE accunite_attendance;

-- Drop table if it exists
DROP TABLE IF EXISTS leave_ledger;

-- Create leave_ledger table WITHOUT foreign key first
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
    
    INDEX idx_employee (employee_code),
    INDEX idx_type (transaction_type),
    INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Now add the foreign key constraint with explicit collation matching
ALTER TABLE leave_ledger 
ADD CONSTRAINT leave_ledger_ibfk_1 
FOREIGN KEY (employee_code) 
REFERENCES employees(employee_code) 
ON DELETE CASCADE;

-- Verify the table was created
DESCRIBE leave_ledger;

-- Show foreign keys
SHOW CREATE TABLE leave_ledger;
