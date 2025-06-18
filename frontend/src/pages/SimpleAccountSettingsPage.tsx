import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { apiClient } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface UpdateEmailData {
  email: string;
  password: string; // 需要当前密码确认
}

const SimpleAccountSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // 邮箱修改表单
  const [emailData, setEmailData] = useState<UpdateEmailData>({
    email: user?.email || '',
    password: '',
  });

  // 密码修改表单
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // 显示状态
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmailData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailData.email || !emailData.password) {
      toast.error(t('account_settings.email_password_required'));
      return;
    }

    try {
      setSubmitting(true);
      // 调用更新邮箱的API
      await apiClient.updateUserProfile({
        email: emailData.email,
        current_password: emailData.password,
      });
      
      // 更新本地用户信息
      if (user) {
        // 这里可以重新获取用户信息或者手动更新store
        // 暂时跳过本地更新，依赖后端数据
      }
      
      toast.success(t('account_settings.email_update_success'));
      setShowEmailForm(false);
      setEmailData(prev => ({ ...prev, password: '' }));
    } catch (error) {
      console.error('Failed to update email:', error);
      toast.error(t('account_settings.email_update_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast.error(t('account_settings.password_info_required'));
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error(t('account_settings.password_mismatch'));
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error(t('account_settings.password_too_short'));
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      });
      
      toast.success(t('account_settings.password_change_success'));
      setShowPasswordForm(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(t('account_settings.password_change_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEmailEdit = () => {
    setShowEmailForm(false);
    setEmailData({
      email: user?.email || '',
      password: '',
    });
  };

  const cancelPasswordEdit = () => {
    setShowPasswordForm(false);
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">{t('account_settings.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">{t('account_settings.title')}</h1>
      
      {/* 基本信息显示 */}
      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">{t('account_settings.basic_info')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('account_settings.username')}</label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.username}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('account_settings.role')}</label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md capitalize">
                {user.role === 'seller' ? t('account_settings.seller') : t('account_settings.buyer')}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 邮箱设置 */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{t('account_settings.email_address')}</h3>
            {!showEmailForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmailForm(true)}
              >
                {t('account_settings.modify_email')}
              </Button>
            )}
          </div>
          
          {!showEmailForm ? (
            <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {user.email || t('account_settings.email_not_set')}
            </div>
          ) : (
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <Input
                label={t('account_settings.new_email_address')}
                type="email"
                value={emailData.email}
                onChange={(e) => setEmailData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('account_settings.enter_new_email')}
                required
              />
              <Input
                label={t('account_settings.current_password')}
                type="password"
                value={emailData.password}
                onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={t('account_settings.enter_current_password')}
                required
              />
              <div className="flex space-x-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('account_settings.updating') : t('account_settings.confirm_update')}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEmailEdit}>
                  {t('account_settings.cancel')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* 密码设置 */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{t('account_settings.password')}</h3>
            {!showPasswordForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordForm(true)}
              >
                {t('account_settings.modify_password')}
              </Button>
            )}
          </div>
          
          {!showPasswordForm ? (
            <div className="text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
              ••••••••••••
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Input
                label={t('account_settings.current_password')}
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                placeholder={t('account_settings.enter_current_password_simple')}
                required
              />
              <Input
                label={t('account_settings.new_password')}
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                placeholder={t('account_settings.enter_new_password')}
                required
                minLength={6}
              />
              <Input
                label={t('account_settings.confirm_new_password')}
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                placeholder={t('account_settings.enter_new_password_again')}
                required
                minLength={6}
              />
              <div className="flex space-x-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('account_settings.modifying') : t('account_settings.confirm_modify')}
                </Button>
                <Button type="button" variant="outline" onClick={cancelPasswordEdit}>
                  {t('account_settings.cancel')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* 安全提示 */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">{t('account_settings.security_tips.title')}</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• {t('account_settings.security_tips.change_password_regularly')}</li>
          <li>• {t('account_settings.security_tips.avoid_public_networks')}</li>
          <li>• {t('account_settings.security_tips.report_suspicious_activity')}</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleAccountSettingsPage;