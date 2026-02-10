-- database-migration.sql
-- Database schema updates for MONETA-ICT platform upgrades

-- =====================================================
-- 1. Update Users Table
-- =====================================================

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS welcome_bonus_credited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS country VARCHAR(50),
ADD COLUMN IF NOT EXISTS telegram_user_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_telegram_user_id ON users(telegram_user_id);

-- =====================================================
-- 2. Update Transactions Table
-- =====================================================

-- Add new columns for enhanced deposit flow
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_proof_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS review_timer_start TIMESTAMP,
ADD COLUMN IF NOT EXISTS review_timer_end TIMESTAMP,
ADD COLUMN IF NOT EXISTS admin_action_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS admin_user_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS reference VARCHAR(100);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- =====================================================
-- 3. Add Transaction Types
-- =====================================================

-- If you're using ENUM for transaction types, update it:
-- ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'WELCOME_BONUS';
-- ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'DEPOSIT';
-- ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'WITHDRAWAL';

-- =====================================================
-- 4. Add Transaction Statuses
-- =====================================================

-- If you're using ENUM for status, update it:
-- ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'PENDING';
-- ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'REVIEWING';
-- ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'COMPLETED';
-- ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'REJECTED';
-- ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'CANCELLED';

-- =====================================================
-- 5. Create Settings Table (if doesn't exist)
-- =====================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('minimum_deposit_usd', '10', 'Minimum deposit amount in USD'),
('minimum_deposit_pen', '50', 'Minimum deposit amount in PEN (Peru Soles)'),
('deposit_timer_minutes', '15', 'Deposit payment timer in minutes'),
('review_timer_minutes', '5', 'Payment review timer in minutes'),
('bank_name', 'Sample Bank', 'Bank name for deposits'),
('account_number', '1234567890', 'Bank account number'),
('account_name', 'MONETA-ICT', 'Bank account name'),
('telegram_group_link', 'https://t.me/+K_NnbszDirQ2YTg0', 'Telegram community group link'),
('telegram_bot_token', '', 'Telegram bot token for notifications'),
('admin_telegram_id', '', 'Admin Telegram chat ID')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 6. Create Admin Users Table (if doesn't exist)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    telegram_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create default admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admin_users (username, email, password, full_name, role) VALUES
('admin', 'admin@moneta.com', '$2b$10$YourHashedPasswordHere', 'System Administrator', 'SUPER_ADMIN')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- 7. Create Audit Log Table
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    admin_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- 8. Create Notifications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- 9. Update Triggers for Updated_At
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. Data Migration - Credit Welcome Bonus to Existing Users
-- =====================================================

-- This is optional - only if you want to credit existing users
-- UPDATE users 
-- SET balance = balance + 5,
--     currency = 'USD',
--     welcome_bonus_credited = TRUE
-- WHERE welcome_bonus_credited = FALSE;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Verify transactions table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- Count users with welcome bonus
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN welcome_bonus_credited THEN 1 ELSE 0 END) as users_with_bonus
FROM users;

-- =====================================================
-- NOTES
-- =====================================================

-- 1. Remember to update the admin password hash
-- 2. Configure your Telegram bot token in system_settings
-- 3. Set your admin Telegram ID in system_settings
-- 4. Update bank account details in system_settings
-- 5. Backup your database before running this migration
-- 6. Test in a development environment first

-- =====================================================
-- Rollback Script (Use with caution!)
-- =====================================================

/*
-- To rollback this migration (if needed):

ALTER TABLE users 
DROP COLUMN IF EXISTS welcome_bonus_credited,
DROP COLUMN IF EXISTS country,
DROP COLUMN IF EXISTS telegram_user_id,
DROP COLUMN IF EXISTS last_login,
DROP COLUMN IF EXISTS currency;

ALTER TABLE transactions 
DROP COLUMN IF EXISTS payment_proof_url,
DROP COLUMN IF EXISTS review_timer_start,
DROP COLUMN IF EXISTS review_timer_end,
DROP COLUMN IF EXISTS admin_action_timestamp,
DROP COLUMN IF EXISTS admin_user_id,
DROP COLUMN IF EXISTS reference;

DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
*/
