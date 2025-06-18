import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { apiClient } from '../services/api';
import type {
  UserAccountResponse,
  AccountSettingsUpdateRequest,
} from '../types/account';

const BuyerAccountSettingsPage: React.FC = () => {
  const [userAccount, setUserAccount] = useState<UserAccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // 表单状态
  const [formData, setFormData] = useState<AccountSettingsUpdateRequest>({
    profile: {
      display_name: '',
      bio: '',
      phone_number: '',
      company: '',
      website: '',
      location: '',
      timezone: '',
    },
    settings: {
      language: 'zh-CN',
      email_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
      api_usage_alerts: true,
      security_alerts: true,
      date_format: 'YYYY-MM-DD',
      currency: 'CNY',
    },
    security: {
      two_factor_enabled: false,
      password_expiry_days: 90,
      login_notifications: true,
      session_timeout: 3600,
      allowed_ip_ranges: '',
    },
  });

  useEffect(() => {
    loadBuyerAccountSettings();
  }, []);

  const loadBuyerAccountSettings = async () => {
    try {
      setLoading(true);
      const account = await apiClient.getBuyerAccountSettings();
      setUserAccount(account);
      
      // 填充表单数据
      setFormData({
        profile: {
          display_name: account.profile?.display_name || '',
          bio: account.profile?.bio || '',
          phone_number: account.profile?.phone_number || '',
          company: account.profile?.company || '',
          website: account.profile?.website || '',
          location: account.profile?.location || '',
          timezone: account.profile?.timezone || '',
        },
        settings: {
          language: account.settings?.language || 'zh-CN',
          email_notifications: account.settings?.email_notifications ?? true,
          sms_notifications: account.settings?.sms_notifications ?? false,
          marketing_emails: account.settings?.marketing_emails ?? false,
          api_usage_alerts: account.settings?.api_usage_alerts ?? true,
          security_alerts: account.settings?.security_alerts ?? true,
          date_format: account.settings?.date_format || 'YYYY-MM-DD',
          currency: account.settings?.currency || 'CNY',
        },
        security: {
          two_factor_enabled: account.security?.two_factor_enabled ?? false,
          password_expiry_days: account.security?.password_expiry_days || 90,
          login_notifications: account.security?.login_notifications ?? true,
          session_timeout: account.security?.session_timeout || 3600,
          allowed_ip_ranges: account.security?.allowed_ip_ranges || '',
        },
      });
    } catch (error) {
      console.error('Failed to load buyer account settings:', error);
      toast.error('加载买家账户设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiClient.updateBuyerAccountSettings(formData);
      toast.success('买家账户设置更新成功');
      await loadBuyerAccountSettings();
    } catch (error) {
      console.error('Failed to update buyer account settings:', error);
      toast.error('买家账户设置更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const updateProfileField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile!,
        [field]: value,
      },
    }));
  };

  const updateSettingsField = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings!,
        [field]: value,
      },
    }));
  };

  const updateSecurityField = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      security: {
        ...prev.security!,
        [field]: value,
      },
    }));
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
      <h1 className="text-3xl font-bold mb-8">买家账户设置</h1>
      
      {/* 用户基本信息 */}
      {userAccount && (
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">账户信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <div className="text-gray-900">{userAccount.user.username}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <div className="text-gray-900">{userAccount.user.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <div className="text-gray-900 font-medium text-blue-600">买家</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 个人资料设置 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">个人资料</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="显示名称"
                value={formData.profile?.display_name || ''}
                onChange={(e) => updateProfileField('display_name', e.target.value)}
                placeholder="输入显示名称"
              />
              <Input
                label="电话号码"
                value={formData.profile?.phone_number || ''}
                onChange={(e) => updateProfileField('phone_number', e.target.value)}
                placeholder="输入电话号码"
              />
              <Input
                label="公司名称"
                value={formData.profile?.company || ''}
                onChange={(e) => updateProfileField('company', e.target.value)}
                placeholder="输入公司名称"
              />
              <Input
                label="网站地址"
                value={formData.profile?.website || ''}
                onChange={(e) => updateProfileField('website', e.target.value)}
                placeholder="输入网站地址"
              />
              <Input
                label="所在位置"
                value={formData.profile?.location || ''}
                onChange={(e) => updateProfileField('location', e.target.value)}
                placeholder="输入所在位置"
              />
              <Input
                label="时区"
                value={formData.profile?.timezone || ''}
                onChange={(e) => updateProfileField('timezone', e.target.value)}
                placeholder="例如：Asia/Shanghai"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
              <textarea
                value={formData.profile?.bio || ''}
                onChange={(e) => updateProfileField('bio', e.target.value)}
                placeholder="介绍您的业务需求和使用场景"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* 偏好设置 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">偏好设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">语言</label>
                <select
                  value={formData.settings?.language || 'zh-CN'}
                  onChange={(e) => updateSettingsField('language', e.target.value)}
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
                  value={formData.settings?.date_format || 'YYYY-MM-DD'}
                  onChange={(e) => updateSettingsField('date_format', e.target.value)}
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
                  value={formData.settings?.currency || 'CNY'}
                  onChange={(e) => updateSettingsField('currency', e.target.value)}
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
                { key: 'email_notifications', label: '邮件通知', desc: '接收重要的账户和订阅通知' },
                { key: 'sms_notifications', label: '短信通知', desc: '接收紧急通知和验证码' },
                { key: 'marketing_emails', label: '营销邮件', desc: '接收新API推荐和优惠信息' },
                { key: 'api_usage_alerts', label: 'API使用提醒', desc: '当API使用量接近限制时提醒' },
                { key: 'security_alerts', label: '安全提醒', desc: '接收账户安全相关通知' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-start">
                  <input
                    type="checkbox"
                    id={setting.key}
                    checked={formData.settings?.[setting.key as keyof typeof formData.settings] as boolean}
                    onChange={(e) => updateSettingsField(setting.key, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <div className="ml-2">
                    <label htmlFor={setting.key} className="block text-sm text-gray-900 font-medium">
                      {setting.label}
                    </label>
                    <p className="text-xs text-gray-500">{setting.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 安全设置 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">安全设置</h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="two_factor_enabled"
                    checked={formData.security?.two_factor_enabled || false}
                    onChange={(e) => updateSecurityField('two_factor_enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <div className="ml-2">
                    <label htmlFor="two_factor_enabled" className="block text-sm text-gray-900 font-medium">
                      启用双因素认证
                    </label>
                    <p className="text-xs text-gray-500">为您的账户添加额外的安全保护</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="login_notifications"
                    checked={formData.security?.login_notifications ?? true}
                    onChange={(e) => updateSecurityField('login_notifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <div className="ml-2">
                    <label htmlFor="login_notifications" className="block text-sm text-gray-900 font-medium">
                      登录通知
                    </label>
                    <p className="text-xs text-gray-500">当有新设备登录时通知您</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="密码过期天数"
                  type="number"
                  value={formData.security?.password_expiry_days?.toString() || '90'}
                  onChange={(e) => updateSecurityField('password_expiry_days', parseInt(e.target.value) || 90)}
                  placeholder="90"
                  min="1"
                  max="365"
                  helperText="建议定期更换密码以保证账户安全"
                />
                <Input
                  label="会话超时时间（秒）"
                  type="number"
                  value={formData.security?.session_timeout?.toString() || '3600'}
                  onChange={(e) => updateSecurityField('session_timeout', parseInt(e.target.value) || 3600)}
                  placeholder="3600"
                  min="300"
                  max="86400"
                  helperText="无操作后自动退出的时间"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  允许的IP范围（可选）
                </label>
                <textarea
                  value={formData.security?.allowed_ip_ranges || ''}
                  onChange={(e) => updateSecurityField('allowed_ip_ranges', e.target.value)}
                  placeholder="例如：192.168.1.0/24, 10.0.0.0/8"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  限制只能从指定IP地址访问账户，留空表示允许所有IP地址
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* API使用偏好 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">API使用偏好</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">使用提示：</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 启用API使用提醒可以帮助您及时了解使用情况</li>
                  <li>• 建议设置合理的通知频率，避免过度打扰</li>
                  <li>• 定期查看使用统计，优化API调用策略</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* 提交按钮 */}
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting} className="px-8">
            {submitting ? '保存中...' : '保存所有设置'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BuyerAccountSettingsPage;