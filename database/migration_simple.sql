-- Simple migration - run these commands one by one in MySQL

USE accunite_attendance;

-- Add email column if it doesn't exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL COMMENT 'Employee email address' AFTER name;

-- Add clock_start_time column if it doesn't exist  
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS clock_start_time TIME NULL COMMENT 'Optional - can be set later if needed' AFTER attendance_type;

-- Add clock_end_time column if it doesn't exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS clock_end_time TIME NULL COMMENT 'Optional - can be set later if needed' AFTER clock_start_time;

-- Add grace_period_minutes column if it doesn't exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS grace_period_minutes INT DEFAULT 15 COMMENT 'Late arrival tolerance' AFTER clock_end_time;

-- Verify the columns
DESCRIBE employees;
