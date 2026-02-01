-- Fix missing columns in employees table
USE accunite_attendance;

-- Add password_hash column if it doesn't exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL COMMENT 'Hashed password for employee login' AFTER email;

-- Add deleted_at column if it doesn't exist (for soft delete)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL COMMENT 'Soft delete timestamp' AFTER updated_at;

-- Verify columns were added
DESCRIBE employees;
