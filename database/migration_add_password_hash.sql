-- ============================================
-- MIGRATION: Add password_hash column to employees
-- Run this in MySQL
-- ============================================

USE accunite_attendance;

-- Add password_hash column if it doesn't exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL COMMENT 'Hashed password for employee login' AFTER email;

-- Verify the column was added
DESCRIBE employees;
