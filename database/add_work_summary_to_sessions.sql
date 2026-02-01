-- Add work_summary column to freelancer_sessions table
USE accunite_attendance;

-- Add work_summary column
ALTER TABLE freelancer_sessions 
ADD COLUMN work_summary TEXT NULL COMMENT 'Work summary/description for this session' AFTER session_duration_minutes;

-- Verify the column was added
DESCRIBE freelancer_sessions;
