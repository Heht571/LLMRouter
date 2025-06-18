import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types/api';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const { addToast } = useToast();
  const { t } = useTranslation();
  
  const toast = useMemo(() => ({
    success: (title: string, description?: string) => {
      addToast({ type: 'success', title, description });
    },
    error: (title: string, description?: string) => {
      addToast({ type: 'error', title, description });
    },
    warning: (title: string, description?: string) => {
      addToast({ type: 'warning', title, description });
    },
    info: (title: string, description?: string) => {
      addToast({ type: 'info', title, description });
    },
  }), [addToast]);
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer'
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.username.trim()) {
      newErrors.username = t('form_validation.username_required');
    } else if (formData.username.length < 3) {
      newErrors.username = t('form_validation.username_min_length');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('form_validation.email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('form_validation.email_invalid');
    }

    if (!formData.password) {
      newErrors.password = t('form_validation.password_required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('form_validation.password_min_length');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('form_validation.confirm_password_required');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('form_validation.password_mismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      toast.success(t('status_messages.register_success'), t('status_messages.register_success_desc'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(t('status_messages.register_failed'), error instanceof Error ? error.message : t('status_messages.register_failed_desc'));
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100">
      {/* 左侧装饰区域 - 宽屏设计 */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-gradient-to-br from-slate-800 to-slate-900">
        {/* 背景装饰 */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-slate-600/20 rounded-full blur-2xl"></div>
        </div>
        
        {/* 内容区域 */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              {t('register.join_us')}
              <br />
              <span className="text-blue-400">{t('register.start_journey')}</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              {t('register.platform_description')}
            </p>
            <div className="space-y-4 text-slate-400">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{t('register.buyer_benefit')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{t('register.seller_benefit')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{t('register.security_guarantee')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 右侧注册区域 */}
      <div className="flex-1 lg:w-1/2 xl:w-2/5 flex items-center justify-center px-6 sm:px-12 lg:px-16">
        <div className="w-full max-w-md space-y-8">
          {/* 移动端Logo */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-xl mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('register.mobile_title')}</h2>
            <p className="text-slate-600">{t('register.page_subtitle')}</p>
          </div>
          
          {/* 桌面端标题 */}
          <div className="hidden lg:block text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('register.desktop_title')}</h2>
            <p className="text-slate-600">{t('register.desktop_subtitle')}</p>
          </div>

          {/* 注册表单 */}
          <Card className="bg-white shadow-xl border-0 rounded-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                      {t('register.form_username')}
                    </label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full h-12 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t('register.username_placeholder')}
                      required
                    />
                    {errors.username && (
                      <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      {t('register.form_email')}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full h-12 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t('register.email_placeholder')}
                      required
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      {t('register.form_password')}
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full h-12 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t('register.password_placeholder')}
                      required
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                      {t('register.form_confirm_password')}
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full h-12 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t('register.confirm_password_placeholder')}
                      required
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {t('register.form_account_type')}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleInputChange('role', 'buyer')}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          formData.role === 'buyer'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-300 hover:border-slate-400 text-slate-700'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">{t('register.account_type_buyer')}</div>
                        <div className="text-xs text-slate-500">{t('register.account_type_buyer_desc')}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('role', 'seller')}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          formData.role === 'seller'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-300 hover:border-slate-400 text-slate-700'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">{t('register.account_type_seller')}</div>
                        <div className="text-xs text-slate-500">{t('register.account_type_seller_desc')}</div>
                      </button>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-6 rounded-lg transition-colors h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t('register.creating_account')}</span>
                    </div>
                  ) : (
                    t('register.create_account')
                  )}
                </Button>
              </form>
              
              <div className="text-center pt-6">
                <p className="text-slate-600 text-sm">
                  {t('register.already_have_account')}{' '}
                  <Link 
                    to="/login" 
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    {t('register.login_now')}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;