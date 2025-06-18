// 账户设置相关类型定义

// 用户个人资料
export interface UserProfile {
  profile_id: number;
  user_id: number;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  phone_number?: string;
  company?: string;
  website?: string;
  location?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

// 用户设置
export interface UserSettings {
  settings_id: number;
  user_id: number;
  language: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  api_usage_alerts: boolean;
  security_alerts: boolean;
  theme: string;
  date_format: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

// 用户安全设置
export interface UserSecurity {
  security_id: number;
  user_id: number;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  backup_codes?: string;
  last_password_change?: string;
  password_expiry_days: number;
  login_notifications: boolean;
  session_timeout: number;
  allowed_ip_ranges?: string;
  created_at: string;
  updated_at: string;
}

// 完整用户账户信息
export interface UserAccountResponse {
  user: {
    user_id: number;
    username: string;
    email: string;
    role: string;
  };
  profile?: UserProfile;
  settings?: UserSettings;
  security?: UserSecurity;
}

// 更新用户个人资料请求
export interface UpdateUserProfileRequest {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  phone_number?: string;
  company?: string;
  website?: string;
  location?: string;
  timezone?: string;
  email?: string;
  current_password?: string; // 修改邮箱时需要提供当前密码
}

// 更新用户设置请求
export interface UpdateUserSettingsRequest {
  language?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  marketing_emails?: boolean;
  api_usage_alerts?: boolean;
  security_alerts?: boolean;
  theme?: string;
  date_format?: string;
  currency?: string;
}

// 更新用户安全设置请求
export interface UpdateUserSecurityRequest {
  two_factor_enabled?: boolean;
  password_expiry_days?: number;
  login_notifications?: boolean;
  session_timeout?: number;
  allowed_ip_ranges?: string;
}

// 修改密码请求
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// 账户设置更新请求（用于卖家和买家的综合设置更新）
export interface AccountSettingsUpdateRequest {
  profile?: UpdateUserProfileRequest;
  settings?: UpdateUserSettingsRequest;
  security?: UpdateUserSecurityRequest;
}