-- Migration: Add designation column to employees table
USE accunite_attendance;

-- Add designation column
ALTER TABLE employees 
ADD COLUMN designation VARCHAR(255) NULL COMMENT 'Employee designation/position' AFTER name;

-- Verify the column was added
DESCRIBE employees;
