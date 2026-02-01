-- Add freelancer_code column to freelancers table
-- This script handles both cases: if freelancer_id exists or if primary key is different
USE accunite_attendance;

-- First, check if freelancer_code already exists
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'accunite_attendance' 
    AND TABLE_NAME = 'freelancers' 
    AND COLUMN_NAME = 'freelancer_code'
);

-- Add freelancer_code column if it doesn't exist
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE freelancers ADD COLUMN freelancer_code VARCHAR(50) NULL UNIQUE COMMENT ''Unique code for freelancer (e.g., FL001)'' FIRST',
    'SELECT ''Column freelancer_code already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index if column was added
SET @sql2 = IF(@column_exists = 0,
    'CREATE INDEX idx_freelancer_code ON freelancers(freelancer_code)',
    'SELECT ''Index already exists or column not added'' AS message'
);

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Verify the column was added
DESCRIBE freelancers;
