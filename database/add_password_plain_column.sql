-- Add password_plain column to store password in plain text for admin viewing
USE accunite_attendance;

ALTER TABLE employees 
ADD COLUMN password_plain VARCHAR(255) NULL COMMENT 'Plain text password for admin viewing (stored for convenience)' AFTER password_hash;
