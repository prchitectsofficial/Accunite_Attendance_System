-- Create admin_users table and add admin user
USE accunite_attendance;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, password_hash, full_name, email, status) 
VALUES ('admin', '$2a$10$rZ3QhN5Y.xJxJ6GjXxXxXexL8nL8nL8nL8nL8nL8nL8nL8nL8nL8n', 'System Administrator', 'admin@accunite.com', 'active')
ON DUPLICATE KEY UPDATE status = 'active';

-- Verify admin user was created
SELECT * FROM admin_users WHERE username = 'admin';
