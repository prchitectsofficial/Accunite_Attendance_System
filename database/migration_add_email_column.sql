-- ============================================
-- MIGRATION: Add email column to employees table
-- Run this script if you have an existing database
-- ============================================

USE accunite_attendance;

-- Add email column to employees table
ALTER TABLE employees 
ADD COLUMN email VARCHAR(255) NULL COMMENT 'Employee email address' 
AFTER name;

-- Verify the column was added
DESCRIBE employees;
