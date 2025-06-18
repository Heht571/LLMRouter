package postgres

import (
	"database/sql"
	"fmt"

	"api-trade-platform/internal/model"
)

// UserAccountStore 用户账户设置数据库操作
type UserAccountStore struct {
	*Store
}

// NewUserAccountStore 创建用户账户设置存储实例
func NewUserAccountStore(store *Store) *UserAccountStore {
	return &UserAccountStore{Store: store}
}

// --- UserProfile 相关操作 ---

// GetUserProfile 获取用户个人资料
func (uas *UserAccountStore) GetUserProfile(userID int64) (*model.UserProfile, error) {
	profile := &model.UserProfile{}
	query := `
		SELECT profile_id, user_id, display_name, avatar_url, bio, phone_number, 
		       company, website, location, timezone, created_at, updated_at
		FROM user_profiles WHERE user_id = $1`

	err := uas.DB.QueryRow(query, userID).Scan(
		&profile.ProfileID, &profile.UserID, &profile.DisplayName, &profile.AvatarURL,
		&profile.Bio, &profile.PhoneNumber, &profile.Company, &profile.Website,
		&profile.Location, &profile.Timezone, &profile.CreatedAt, &profile.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // 用户可能还没有创建个人资料
		}
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}
	return profile, nil
}

// CreateUserProfile 创建用户个人资料
func (uas *UserAccountStore) CreateUserProfile(profile *model.UserProfile) error {
	query := `
		INSERT INTO user_profiles (user_id, display_name, avatar_url, bio, phone_number, 
		                          company, website, location, timezone, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
		RETURNING profile_id, created_at, updated_at`

	err := uas.DB.QueryRow(query, profile.UserID, profile.DisplayName, profile.AvatarURL,
		profile.Bio, profile.PhoneNumber, profile.Company, profile.Website,
		profile.Location, profile.Timezone).Scan(
		&profile.ProfileID, &profile.CreatedAt, &profile.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create user profile: %w", err)
	}
	return nil
}

// UpdateUserProfile 更新用户个人资料
func (uas *UserAccountStore) UpdateUserProfile(userID int64, req *model.UpdateUserProfileRequest) (*model.UserProfile, error) {
	query := `
		UPDATE user_profiles 
		SET display_name = $2, avatar_url = $3, bio = $4, phone_number = $5,
		    company = $6, website = $7, location = $8, timezone = $9, updated_at = NOW()
		WHERE user_id = $1
		RETURNING profile_id, user_id, display_name, avatar_url, bio, phone_number,
		          company, website, location, timezone, created_at, updated_at`

	profile := &model.UserProfile{}
	err := uas.DB.QueryRow(query, userID, req.DisplayName, req.AvatarURL, req.Bio,
		req.PhoneNumber, req.Company, req.Website, req.Location, req.Timezone).Scan(
		&profile.ProfileID, &profile.UserID, &profile.DisplayName, &profile.AvatarURL,
		&profile.Bio, &profile.PhoneNumber, &profile.Company, &profile.Website,
		&profile.Location, &profile.Timezone, &profile.CreatedAt, &profile.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user profile not found")
		}
		return nil, fmt.Errorf("failed to update user profile: %w", err)
	}
	return profile, nil
}

// --- UserSettings 相关操作 ---

// GetUserSettings 获取用户设置
func (uas *UserAccountStore) GetUserSettings(userID int64) (*model.UserSettings, error) {
	settings := &model.UserSettings{}
	query := `
		SELECT settings_id, user_id, language, email_notifications, sms_notifications,
		       marketing_emails, api_usage_alerts, security_alerts, theme, date_format,
		       currency, created_at, updated_at
		FROM user_settings WHERE user_id = $1`

	err := uas.DB.QueryRow(query, userID).Scan(
		&settings.SettingsID, &settings.UserID, &settings.Language, &settings.EmailNotifications,
		&settings.SMSNotifications, &settings.MarketingEmails, &settings.APIUsageAlerts,
		&settings.SecurityAlerts, &settings.Theme, &settings.DateFormat, &settings.Currency,
		&settings.CreatedAt, &settings.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // 用户可能还没有创建设置
		}
		return nil, fmt.Errorf("failed to get user settings: %w", err)
	}
	return settings, nil
}

// CreateUserSettings 创建用户设置（使用默认值）
func (uas *UserAccountStore) CreateUserSettings(userID int64) (*model.UserSettings, error) {
	query := `
		INSERT INTO user_settings (user_id, created_at, updated_at)
		VALUES ($1, NOW(), NOW())
		RETURNING settings_id, user_id, language, email_notifications, sms_notifications,
		          marketing_emails, api_usage_alerts, security_alerts, theme, date_format,
		          currency, created_at, updated_at`

	settings := &model.UserSettings{}
	err := uas.DB.QueryRow(query, userID).Scan(
		&settings.SettingsID, &settings.UserID, &settings.Language, &settings.EmailNotifications,
		&settings.SMSNotifications, &settings.MarketingEmails, &settings.APIUsageAlerts,
		&settings.SecurityAlerts, &settings.Theme, &settings.DateFormat, &settings.Currency,
		&settings.CreatedAt, &settings.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create user settings: %w", err)
	}
	return settings, nil
}

// UpdateUserSettings 更新用户设置
func (uas *UserAccountStore) UpdateUserSettings(userID int64, req *model.UpdateUserSettingsRequest) (*model.UserSettings, error) {
	// 构建动态更新查询
	setClauses := []string{"updated_at = NOW()"}
	args := []interface{}{userID}
	argIndex := 2

	if req.Language != "" {
		setClauses = append(setClauses, fmt.Sprintf("language = $%d", argIndex))
		args = append(args, req.Language)
		argIndex++
	}
	if req.EmailNotifications != nil {
		setClauses = append(setClauses, fmt.Sprintf("email_notifications = $%d", argIndex))
		args = append(args, *req.EmailNotifications)
		argIndex++
	}
	if req.SMSNotifications != nil {
		setClauses = append(setClauses, fmt.Sprintf("sms_notifications = $%d", argIndex))
		args = append(args, *req.SMSNotifications)
		argIndex++
	}
	if req.MarketingEmails != nil {
		setClauses = append(setClauses, fmt.Sprintf("marketing_emails = $%d", argIndex))
		args = append(args, *req.MarketingEmails)
		argIndex++
	}
	if req.APIUsageAlerts != nil {
		setClauses = append(setClauses, fmt.Sprintf("api_usage_alerts = $%d", argIndex))
		args = append(args, *req.APIUsageAlerts)
		argIndex++
	}
	if req.SecurityAlerts != nil {
		setClauses = append(setClauses, fmt.Sprintf("security_alerts = $%d", argIndex))
		args = append(args, *req.SecurityAlerts)
		argIndex++
	}
	if req.Theme != "" {
		setClauses = append(setClauses, fmt.Sprintf("theme = $%d", argIndex))
		args = append(args, req.Theme)
		argIndex++
	}
	if req.DateFormat != "" {
		setClauses = append(setClauses, fmt.Sprintf("date_format = $%d", argIndex))
		args = append(args, req.DateFormat)
		argIndex++
	}
	if req.Currency != "" {
		setClauses = append(setClauses, fmt.Sprintf("currency = $%d", argIndex))
		args = append(args, req.Currency)
		argIndex++
	}

	query := fmt.Sprintf(`
		UPDATE user_settings 
		SET %s
		WHERE user_id = $1
		RETURNING settings_id, user_id, language, email_notifications, sms_notifications,
		          marketing_emails, api_usage_alerts, security_alerts, theme, date_format,
		          currency, created_at, updated_at`, 
		string(setClauses[0]))

	for i := 1; i < len(setClauses); i++ {
		query = fmt.Sprintf("%s, %s", query[:len(query)-len("WHERE user_id = $1\n\t\tRETURNING settings_id, user_id, language, email_notifications, sms_notifications,\n\t\t          marketing_emails, api_usage_alerts, security_alerts, theme, date_format,\n\t\t          currency, created_at, updated_at")], setClauses[i]) + "\n\t\tWHERE user_id = $1\n\t\tRETURNING settings_id, user_id, language, email_notifications, sms_notifications,\n\t\t          marketing_emails, api_usage_alerts, security_alerts, theme, date_format,\n\t\t          currency, created_at, updated_at"
	}

	settings := &model.UserSettings{}
	err := uas.DB.QueryRow(query, args...).Scan(
		&settings.SettingsID, &settings.UserID, &settings.Language, &settings.EmailNotifications,
		&settings.SMSNotifications, &settings.MarketingEmails, &settings.APIUsageAlerts,
		&settings.SecurityAlerts, &settings.Theme, &settings.DateFormat, &settings.Currency,
		&settings.CreatedAt, &settings.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user settings not found")
		}
		return nil, fmt.Errorf("failed to update user settings: %w", err)
	}
	return settings, nil
}

// --- UserSecurity 相关操作 ---

// GetUserSecurity 获取用户安全设置
func (uas *UserAccountStore) GetUserSecurity(userID int64) (*model.UserSecurity, error) {
	security := &model.UserSecurity{}
	query := `
		SELECT security_id, user_id, two_factor_enabled, two_factor_secret, backup_codes,
		       last_password_change, password_expiry_days, login_notifications, session_timeout,
		       allowed_ip_ranges, created_at, updated_at
		FROM user_security WHERE user_id = $1`

	err := uas.DB.QueryRow(query, userID).Scan(
		&security.SecurityID, &security.UserID, &security.TwoFactorEnabled, &security.TwoFactorSecret,
		&security.BackupCodes, &security.LastPasswordChange, &security.PasswordExpiryDays,
		&security.LoginNotifications, &security.SessionTimeout, &security.AllowedIPRanges,
		&security.CreatedAt, &security.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // 用户可能还没有创建安全设置
		}
		return nil, fmt.Errorf("failed to get user security: %w", err)
	}
	return security, nil
}

// CreateUserSecurity 创建用户安全设置（使用默认值）
func (uas *UserAccountStore) CreateUserSecurity(userID int64) (*model.UserSecurity, error) {
	query := `
		INSERT INTO user_security (user_id, created_at, updated_at)
		VALUES ($1, NOW(), NOW())
		RETURNING security_id, user_id, two_factor_enabled, two_factor_secret, backup_codes,
		          last_password_change, password_expiry_days, login_notifications, session_timeout,
		          allowed_ip_ranges, created_at, updated_at`

	security := &model.UserSecurity{}
	err := uas.DB.QueryRow(query, userID).Scan(
		&security.SecurityID, &security.UserID, &security.TwoFactorEnabled, &security.TwoFactorSecret,
		&security.BackupCodes, &security.LastPasswordChange, &security.PasswordExpiryDays,
		&security.LoginNotifications, &security.SessionTimeout, &security.AllowedIPRanges,
		&security.CreatedAt, &security.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create user security: %w", err)
	}
	return security, nil
}

// UpdateUserSecurity 更新用户安全设置
func (uas *UserAccountStore) UpdateUserSecurity(userID int64, req *model.UpdateUserSecurityRequest) (*model.UserSecurity, error) {
	// 构建动态更新查询
	setClauses := []string{"updated_at = NOW()"}
	args := []interface{}{userID}
	argIndex := 2

	if req.TwoFactorEnabled != nil {
		setClauses = append(setClauses, fmt.Sprintf("two_factor_enabled = $%d", argIndex))
		args = append(args, *req.TwoFactorEnabled)
		argIndex++
	}
	if req.PasswordExpiryDays != nil {
		setClauses = append(setClauses, fmt.Sprintf("password_expiry_days = $%d", argIndex))
		args = append(args, *req.PasswordExpiryDays)
		argIndex++
	}
	if req.LoginNotifications != nil {
		setClauses = append(setClauses, fmt.Sprintf("login_notifications = $%d", argIndex))
		args = append(args, *req.LoginNotifications)
		argIndex++
	}
	if req.SessionTimeout != nil {
		setClauses = append(setClauses, fmt.Sprintf("session_timeout = $%d", argIndex))
		args = append(args, *req.SessionTimeout)
		argIndex++
	}
	if req.AllowedIPRanges != "" {
		setClauses = append(setClauses, fmt.Sprintf("allowed_ip_ranges = $%d", argIndex))
		args = append(args, req.AllowedIPRanges)
		argIndex++
	}

	query := fmt.Sprintf(`
		UPDATE user_security 
		SET %s
		WHERE user_id = $1
		RETURNING security_id, user_id, two_factor_enabled, two_factor_secret, backup_codes,
		          last_password_change, password_expiry_days, login_notifications, session_timeout,
		          allowed_ip_ranges, created_at, updated_at`, 
		string(setClauses[0]))

	for i := 1; i < len(setClauses); i++ {
		query = fmt.Sprintf("%s, %s", query[:len(query)-len("WHERE user_id = $1\n\t\tRETURNING security_id, user_id, two_factor_enabled, two_factor_secret, backup_codes,\n\t\t          last_password_change, password_expiry_days, login_notifications, session_timeout,\n\t\t          allowed_ip_ranges, created_at, updated_at")], setClauses[i]) + "\n\t\tWHERE user_id = $1\n\t\tRETURNING security_id, user_id, two_factor_enabled, two_factor_secret, backup_codes,\n\t\t          last_password_change, password_expiry_days, login_notifications, session_timeout,\n\t\t          allowed_ip_ranges, created_at, updated_at"
	}

	security := &model.UserSecurity{}
	err := uas.DB.QueryRow(query, args...).Scan(
		&security.SecurityID, &security.UserID, &security.TwoFactorEnabled, &security.TwoFactorSecret,
		&security.BackupCodes, &security.LastPasswordChange, &security.PasswordExpiryDays,
		&security.LoginNotifications, &security.SessionTimeout, &security.AllowedIPRanges,
		&security.CreatedAt, &security.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user security not found")
		}
		return nil, fmt.Errorf("failed to update user security: %w", err)
	}
	return security, nil
}

// UpdateUserPassword 更新用户密码
func (uas *UserAccountStore) UpdateUserPassword(userID int64, newPasswordHash string) error {
	tx, err := uas.DB.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 更新用户表中的密码
	userQuery := `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2`
	_, err = tx.Exec(userQuery, newPasswordHash, userID)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	// 更新安全表中的最后修改密码时间
	securityQuery := `
		UPDATE user_security 
		SET last_password_change = NOW(), updated_at = NOW() 
		WHERE user_id = $1`
	_, err = tx.Exec(securityQuery, userID)
	if err != nil {
		// 如果安全设置不存在，先创建一个
		createSecurityQuery := `
			INSERT INTO user_security (user_id, last_password_change, created_at, updated_at)
			VALUES ($1, NOW(), NOW(), NOW())
			ON CONFLICT (user_id) DO UPDATE SET 
			last_password_change = NOW(), updated_at = NOW()`
		_, err = tx.Exec(createSecurityQuery, userID)
		if err != nil {
			return fmt.Errorf("failed to update security settings: %w", err)
		}
	}

	return tx.Commit()
}

// GetCompleteUserAccount 获取用户完整账户信息
func (uas *UserAccountStore) GetCompleteUserAccount(userID int64) (*model.UserAccountResponse, error) {
	// 获取基本用户信息
	userStore := NewUserStore(uas.Store)
	user, err := userStore.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// 获取个人资料
	profile, err := uas.GetUserProfile(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}

	// 获取用户设置
	settings, err := uas.GetUserSettings(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user settings: %w", err)
	}

	// 获取安全设置
	security, err := uas.GetUserSecurity(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user security: %w", err)
	}

	// 构建响应
	userResponse := &model.UserResponse{
		UserID:   user.UserID,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
	}

	return &model.UserAccountResponse{
		User:     *userResponse,
		Profile:  profile,
		Settings: settings,
		Security: security,
	}, nil
}