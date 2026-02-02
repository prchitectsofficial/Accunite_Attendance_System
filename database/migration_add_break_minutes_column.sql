-- Migration: Add total_break_minutes column to track cumulative break time
USE accunite_attendance;

-- Add column to track cumulative break minutes (for multiple breaks)
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS total_break_minutes INT NULL DEFAULT 0 COMMENT 'Cumulative break minutes for the day (supports multiple breaks)' AFTER break_stop_time;

-- Verify column was added
DESCRIBE attendance_records;
