-- Fix all database issues
USE accunite_attendance;

-- Add password_hash column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL COMMENT 'Hashed password for employee login' AFTER email;

-- Add deleted_at column (optional, for soft delete - but we're not using it currently)
-- ALTER TABLE employees 
-- ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp' AFTER updated_at;

-- Verify the column was added
DESCRIBE employees;
