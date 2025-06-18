-- Migration: Add User Account Settings Tables
-- Date: 2024-01-15
-- Description: Add tables for user profiles, settings, and security configurations

BEGIN;

-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
    profile_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT CHECK (LENGTH(bio) <= 500),
    phone_number VARCHAR(20),
    company VARCHAR(100),
    website TEXT,
    location VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create user_settings table for user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    settings_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'zh-CN',
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    marketing_emails BOOLEAN DEFAULT true,
    api_usage_alerts BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create user_security table for security settings
CREATE TABLE IF NOT EXISTS user_security (
    security_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT, -- encrypted TOTP secret
    backup_codes TEXT, -- JSON array of backup codes
    last_password_change TIMESTAMP WITH TIME ZONE,
    password_expiry_days INTEGER DEFAULT 0, -- 0 means no expiry
    login_notifications BOOLEAN DEFAULT true,
    session_timeout INTEGER DEFAULT 1440, -- minutes, default 24 hours
    allowed_ip_ranges TEXT, -- JSON array of IP ranges
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON user_security(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_two_factor ON user_security(two_factor_enabled);

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS '用户扩展个人资料信息';
COMMENT ON TABLE user_settings IS '用户偏好设置';
COMMENT ON TABLE user_security IS '用户安全设置';

COMMENT ON COLUMN user_profiles.display_name IS '用户显示名称';
COMMENT ON COLUMN user_profiles.avatar_url IS '用户头像URL';
COMMENT ON COLUMN user_profiles.bio IS '用户个人简介';
COMMENT ON COLUMN user_profiles.timezone IS '用户时区设置';

COMMENT ON COLUMN user_settings.language IS '界面语言偏好';
COMMENT ON COLUMN user_settings.email_notifications IS '邮件通知开关';
COMMENT ON COLUMN user_settings.api_usage_alerts IS 'API使用量警告开关';
COMMENT ON COLUMN user_settings.theme IS '界面主题偏好';

COMMENT ON COLUMN user_security.two_factor_enabled IS '两步验证开关';
COMMENT ON COLUMN user_security.session_timeout IS '会话超时时间（分钟）';
COMMENT ON COLUMN user_security.allowed_ip_ranges IS '允许的IP地址范围';

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all three tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_updated_at BEFORE UPDATE ON user_security
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;