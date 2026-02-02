-- Update Admin User Credentials
-- Username: manish@prchitects.com
-- Password: Accu@1995!
-- Run this in MySQL client: mysql -u root -p accunite_attendance < database/update_admin_credentials.sql
-- Or copy-paste into MySQL client

USE accunite_attendance;

-- Update admin username and password hash
-- Password hash for 'Accu@1995!' (bcrypt, rounds=10)
UPDATE admin_users 
SET 
    username = 'manish@prchitects.com',
    password_hash = '$2a$10$IB5mTvzcGioE.9qxRo7Mp.xj9K9V4cpDuAvXSyfBdv6D/3xTGzZIy',
    email = 'manish@prchitects.com',
    full_name = 'Manish Bijalwan',
    updated_at = NOW()
WHERE username = 'admin' OR username = 'manish@prchitects.com';

-- If no admin user exists, create one
INSERT INTO admin_users (username, password_hash, full_name, email, status) 
VALUES ('manish@prchitects.com', '$2a$10$IB5mTvzcGioE.9qxRo7Mp.xj9K9V4cpDuAvXSyfBdv6D/3xTGzZIy', 'Manish Bijalwan', 'manish@prchitects.com', 'active')
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    full_name = VALUES(full_name),
    email = VALUES(email),
    updated_at = NOW();

-- Verify admin user was updated
SELECT admin_id, username, email, full_name, status FROM admin_users WHERE username = 'manish@prchitects.com';
