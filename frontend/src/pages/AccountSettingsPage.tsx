import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { apiClient } from '../services/api';
import type {
  UserAccountResponse,
  UpdateUserProfileRequest,
  UpdateUserSettingsRequest,
  UpdateUserSecurityRequest,
  ChangePasswordRequest,
} from '../types/account';

const AccountSettingsPage: React.FC = () => {
  const [userAccount, setUserAccount] = useState<UserAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security' | 'password'>('profile');
  const { toast } = useToast();

  // 表单状态
  const [profileForm, setProfileForm] = useState<UpdateUserProfileRequest>({
    display_name: '',
    bio: '',
    phone_number: '',
    company: '',
    website: '',
    location: '',
    timezone: '',
  });

  const [settingsForm, setSettingsForm] = useState<UpdateUserSettingsRequest>({
    language: 'zh-CN',
    email_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
    api_usage_alerts: true,
    security_alerts: true,
    date_format: 'YYYY-MM-DD',
    currency: 'CNY',
  });

  const [securityForm, setSecurityForm] = useState<UpdateUserSecurityRequest>({
    two_factor_enabled: false,
    password_expiry_days: 90,
    login_notifications: true,
    session_timeout: 3600,
    allowed_ip_ranges: '',
  });

  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserAccount();
  }, []);

  const loadUserAccount = async () => {
    try {
      setLoading(true);
      const account = await apiClient.getUserAccount();
      console.log('API Response:', account); // 调试信息
      console.log('User email:', account.user?.email); // 调试邮箱字段
      setUserAccount(account);
      
      // 填充表单数据
      if (account.profile) {
        setProfileForm({
          display_name: account.profile.display_name || '',
          bio: account.profile.bio || '',
          phone_number: account.profile.phone_number || '',
          company: account.profile.company || '',
          website: account.profile.website || '',
          location: account.profile.location || '',
          timezone: account.profile.timezone || '',
        });
      }
      
      if (account.settings) {
        setSettingsForm({
          language: account.settings.language || 'zh-CN',
          email_notifications: account.settings.email_notifications ?? true,
          sms_notifications: account.settings.sms_notifications ?? false,
          marketing_emails: account.settings.marketing_emails ?? false,
          api_usage_alerts: account.settings.api_usage_alerts ?? true,
          security_alerts: account.settings.security_alerts ?? true,
          date_format: account.settings.date_format || 'YYYY-MM-DD',
          currency: account.settings.currency || 'CNY',
        });
      }
      
      if (account.security) {
        setSecurityForm({
          two_factor_enabled: account.security.two_factor_enabled ?? false,
          password_expiry_days: account.security.password_expiry_days || 90,
          login_notifications: account.security.login_notifications ?? true,
          session_timeout: account.security.session_timeout || 3600,
          allowed_ip_ranges: account.security.allowed_ip_ranges || '',
        });
      }
    } catch (error) {
      console.error('Failed to load user account:', error);
      toast.error('加载账户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.updateUserProfile(profileForm);
      toast.success('个人资料更新成功');
      await loadUserAccount();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('个人资料更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.updateUserSettings(settingsForm);
      toast.success('设置更新成功');
      await loadUserAccount();
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('设置更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.updateUserSecurity(securityForm);
      toast.success('安全设置更新成功');
      await loadUserAccount();
    } catch (error) {
      console.error('Failed to update security:', error);
      toast.error('安全设置更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('新密码和确认密码不匹配');
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      toast.error('新密码长度至少为8位');
      return;
    }
    
    try {
      setSubmitting(true);
      await apiClient.changePassword(passwordForm);
      toast.success('密码修改成功');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error('密码修改失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">账户设置</h1>
      
      {/* 用户基本信息 */}
      {userAccount && (
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">账户信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <div className="text-gray-900">{userAccount.user.username}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <div className="text-gray-900">
                  {userAccount.user.email || '邮箱信息未设置'}
                  {/* 调试信息 */}
                  <div className="text-xs text-gray-500 mt-1">
                    Debug: {JSON.stringify(userAccount.user.email)}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <div className="text-gray-900">
                  {userAccount.user.role === 'seller' ? '卖家' : '买家'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 标签页导航 */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'profile', label: '个人资料' },
            { key: 'settings', label: '偏好设置' },
            { key: 'security', label: '安全设置' },
            { key: 'password', label: '修改密码' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 个人资料表单 */}
      {activeTab === 'profile' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">个人资料</h3>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="显示名称"
                  value={profileForm.display_name || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                  placeholder="输入显示名称"
                />
                <Input
                  label="电话号码"
                  value={profileForm.phone_number || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                  placeholder="输入电话号码"
                />
                <Input
                  label="公司"
                  value={profileForm.company || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                  placeholder="输入公司名称"
                />
                <Input
                  label="网站"
                  value={profileForm.website || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  placeholder="输入网站地址"
                />
                <Input
                  label="位置"
                  value={profileForm.location || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  placeholder="输入所在位置"
                />
                <Input
                  label="时区"
                  value={profileForm.timezone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                  placeholder="输入时区"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
                <textarea
                  value={profileForm.bio || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="输入个人简介"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '保存个人资料'}
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* 偏好设置表单 */}
      {activeTab === 'settings' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">偏好设置</h3>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">语言</label>
                  <select
                    value={settingsForm.language || 'zh-CN'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="zh-CN">简体中文</option>
                    <option value="zh-TW">繁體中文</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日期格式</label>
                  <select
                    value={settingsForm.date_format || 'YYYY-MM-DD'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, date_format: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">货币</label>
                  <select
                    value={settingsForm.currency || 'CNY'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CNY">人民币 (CNY)</option>
                    <option value="USD">美元 (USD)</option>
                    <option value="EUR">欧元 (EUR)</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">通知设置</h4>
                {[
                  { key: 'email_notifications', label: '邮件通知' },
                  { key: 'sms_notifications', label: '短信通知' },
                  { key: 'marketing_emails', label: '营销邮件' },
                  { key: 'api_usage_alerts', label: 'API使用提醒' },
                  { key: 'security_alerts', label: '安全提醒' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={setting.key}
                      checked={settingsForm[setting.key as keyof UpdateUserSettingsRequest] as boolean}
                      onChange={(e) => setSettingsForm({ 
                        ...settingsForm, 
                        [setting.key]: e.target.checked 
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={setting.key} className="ml-2 block text-sm text-gray-900">
                      {setting.label}
                    </label>
                  </div>
                ))}
              </div>
              
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '保存设置'}
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* 安全设置表单 */}
      {activeTab === 'security' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">安全设置</h3>
            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="two_factor_enabled"
                    checked={securityForm.two_factor_enabled || false}
                    onChange={(e) => setSecurityForm({ 
                      ...securityForm, 
                      two_factor_enabled: e.target.checked 
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="two_factor_enabled" className="ml-2 block text-sm text-gray-900">
                    启用双因素认证
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="login_notifications"
                    checked={securityForm.login_notifications ?? true}
                    onChange={(e) => setSecurityForm({ 
                      ...securityForm, 
                      login_notifications: e.target.checked 
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="login_notifications" className="ml-2 block text-sm text-gray-900">
                    登录通知
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="密码过期天数"
                  type="number"
                  value={securityForm.password_expiry_days?.toString() || '90'}
                  onChange={(e) => setSecurityForm({ 
                    ...securityForm, 
                    password_expiry_days: parseInt(e.target.value) || 90 
                  })}
                  placeholder="90"
                  min="1"
                  max="365"
                />
                <Input
                  label="会话超时时间（秒）"
                  type="number"
                  value={securityForm.session_timeout?.toString() || '3600'}
                  onChange={(e) => setSecurityForm({ 
                    ...securityForm, 
                    session_timeout: parseInt(e.target.value) || 3600 
                  })}
                  placeholder="3600"
                  min="300"
                  max="86400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  允许的IP范围（可选）
                </label>
                <textarea
                  value={securityForm.allowed_ip_ranges || ''}
                  onChange={(e) => setSecurityForm({ 
                    ...securityForm, 
                    allowed_ip_ranges: e.target.value 
                  })}
                  placeholder="例如：192.168.1.0/24, 10.0.0.0/8"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  留空表示允许所有IP地址访问
                </p>
              </div>
              
              <Button type="submit" disabled={submitting}>
                {submitting ? '保存中...' : '保存安全设置'}
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* 修改密码表单 */}
      {activeTab === 'password' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">修改密码</h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="当前密码"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ 
                  ...passwordForm, 
                  current_password: e.target.value 
                })}
                placeholder="输入当前密码"
                required
              />
              <Input
                label="新密码"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ 
                  ...passwordForm, 
                  new_password: e.target.value 
                })}
                placeholder="输入新密码（至少8位）"
                required
                minLength={8}
              />
              <Input
                label="确认新密码"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ 
                  ...passwordForm, 
                  confirm_password: e.target.value 
                })}
                placeholder="再次输入新密码"
                required
                minLength={8}
              />
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">密码要求：</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 至少8个字符</li>
                  <li>• 建议包含大小写字母、数字和特殊字符</li>
                  <li>• 不要使用常见密码或个人信息</li>
                </ul>
              </div>
              
              <Button type="submit" disabled={submitting}>
                {submitting ? '修改中...' : '修改密码'}
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AccountSettingsPage;