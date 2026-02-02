-- Migration: Add attendance columns
USE accunite_attendance;

-- Add break and working time columns to attendance_records table
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS break_start_time DATETIME NULL COMMENT 'Break start time' AFTER clock_out_time,
ADD COLUMN IF NOT EXISTS break_stop_time DATETIME NULL COMMENT 'Break stop time' AFTER break_start_time,
ADD COLUMN IF NOT EXISTS total_working_minutes INT NULL COMMENT 'Total working minutes (excluding breaks)' AFTER break_stop_time,
ADD COLUMN IF NOT EXISTS late_minutes INT NULL COMMENT 'Late minutes if worked less than 570 mins' AFTER total_working_minutes,
ADD COLUMN IF NOT EXISTS overtime_minutes INT NULL COMMENT 'Overtime minutes if worked more than 570 mins' AFTER late_minutes;

-- Verify columns were added
DESCRIBE attendance_records;
