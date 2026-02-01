-- Add new columns to attendance_records table
USE accunite_attendance;

ALTER TABLE attendance_records 
ADD COLUMN break_start_time DATETIME NULL COMMENT 'Break start time' AFTER clock_out_time,
ADD COLUMN break_stop_time DATETIME NULL COMMENT 'Break stop time' AFTER break_start_time,
ADD COLUMN total_working_minutes INT NULL COMMENT 'Total working minutes (excluding breaks)' AFTER break_stop_time,
ADD COLUMN late_minutes INT NULL COMMENT 'Late minutes if worked less than 570 mins' AFTER total_working_minutes,
ADD COLUMN overtime_minutes INT NULL COMMENT 'Overtime minutes if worked more than 570 mins' AFTER late_minutes;
