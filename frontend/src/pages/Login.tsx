import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { Globe } from 'lucide-react';
import { cn } from '../lib/utils';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const { t, i18n } = useTranslation();
  const { login, isLoading: loading, error } = useAuthStore();
  const { addToast } = useToast();
  
  const handleLanguageChange = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
  };
  
  const languages = [
    { code: 'en', name: t('languages.en'), flag: '🇺🇸' },
    { code: 'zh-CN', name: t('languages.zh-CN'), flag: '🇨🇳' },
    { code: 'zh-TW', name: t('languages.zh-TW'), flag: '🇹🇼' },
    { code: 'ja', name: t('languages.ja'), flag: '🇯🇵' },
  ];
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[1]; // zh-CN
  
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
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password) {
      return;
    }
    
    try {
      await login({ username, password });
      toast.success(t('messages.login_success'), t('messages.login_welcome'));
      navigate('/dashboard');
    } catch {
      toast.error(t('messages.login_failed'), t('messages.login_check_credentials'));
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-50 to-gray-100">
      {/* 语言选择器 */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative group">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-3 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm flex items-center space-x-2"
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm">{currentLanguage.flag}</span>
            <span className="text-sm font-medium">{currentLanguage.name}</span>
          </Button>
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center space-x-3 transition-colors",
                  i18n.language === lang.code && "bg-slate-50 text-blue-600"
                )}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
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
              LLM Router
              <br />
              <span className="text-blue-400">{t('nav.platformName')}</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              {t('pages.login.platform_description')}
            </p>
            <div className="space-y-4 text-slate-400">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{t('pages.login.feature_1')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{t('pages.login.feature_2')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{t('pages.login.feature_3')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 右侧登录区域 */}
      <div className="flex-1 lg:w-1/2 xl:w-2/5 flex items-center justify-center px-6 sm:px-12 lg:px-16">
        <div className="w-full max-w-md space-y-8">
          {/* 移动端Logo */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-xl mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">LLM Router {t('nav.platformName')}</h2>
            <p className="text-slate-600">{t('pages.login.login_subtitle')}</p>
          </div>
          
          {/* 桌面端标题 */}
          <div className="hidden lg:block text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{t('pages.login.welcome_back')}</h2>
            <p className="text-slate-600">{t('pages.login.login_prompt')}</p>
          </div>

          {/* 登录表单 */}
          <Card className="bg-white shadow-xl border-0 rounded-2xl">
            <CardContent className="p-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                      {t('pages.login.username')}
                    </label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-12 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t('pages.login.username_placeholder')}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      {t('pages.login.password')}
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t('pages.login.password_placeholder')}
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-6 rounded-lg transition-colors h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t('pages.login.logging_in')}</span>
                    </div>
                  ) : (
                    t('pages.login.login_button')
                  )}
                </Button>
              </form>
              
              <div className="text-center pt-6">
                <p className="text-slate-600 text-sm">
                  {t('pages.login.no_account')}{' '}
                  <Link 
                    to="/register" 
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    {t('pages.login.register_now')}
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

export default Login;