-- Add freelancer_code and email columns to freelancers table
-- Run this in MySQL client: mysql -u root -p accunite_attendance < database/add_freelancer_fields.sql
-- Or copy-paste into MySQL client

USE accunite_attendance;

-- Add freelancer_code column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'freelancers';
SET @columnname = 'freelancer_code';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL UNIQUE COMMENT ''Unique code for freelancer (e.g., FL001)'' AFTER freelancer_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add email column if it doesn't exist
SET @columnname = 'email';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(255) NULL COMMENT ''Freelancer email address (used for login)'' AFTER name')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for freelancer_code if column was added
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = @dbname 
    AND TABLE_NAME = @tablename 
    AND INDEX_NAME = 'idx_freelancer_code'
);
SET @sql = IF(@index_exists = 0,
    CONCAT('CREATE INDEX idx_freelancer_code ON ', @tablename, '(freelancer_code)'),
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the columns were added
DESCRIBE freelancers;
