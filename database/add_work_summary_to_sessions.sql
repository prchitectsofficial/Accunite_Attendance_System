-- Add work_summary column to freelancer_sessions table
-- Run this in MySQL client: mysql -u root -p accunite_attendance < database/add_work_summary_to_sessions.sql
-- Or copy-paste into MySQL client

USE accunite_attendance;

-- Add work_summary column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'freelancer_sessions';
SET @columnname = 'work_summary';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT NULL COMMENT ''Summary of work completed during this session'' AFTER session_duration_minutes')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify the column was added
DESCRIBE freelancer_sessions;
