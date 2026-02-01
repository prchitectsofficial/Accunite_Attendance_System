-- Check if admin user exists
USE accunite_attendance;

SELECT * FROM admin_users WHERE username = 'admin';

-- If no admin user exists, create one:
-- Password: admin123
INSERT INTO admin_users (username, password_hash, full_name, email, status) 
VALUES ('admin', '$2a$10$rZ3QhN5Y.xJxJ6GjXxXxXexL8nL8nL8nL8nL8nL8nL8nL8nL8nL8n', 'System Administrator', 'admin@accunite.com', 'active')
ON DUPLICATE KEY UPDATE status = 'active';
