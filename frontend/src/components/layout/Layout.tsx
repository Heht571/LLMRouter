import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import {
  Menu,
  X,
  Home,
  LogOut,
  User,
  ShoppingCart,
  Package,
  BarChart3,
  Code,
  Settings,
  Bell,
  CreditCard,
  HelpCircle,
  Activity,
  Shield,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  const sellerNavigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: Home, description: t('nav.dashboard') },
    { name: t('nav.myApis'), href: '/seller/services', icon: Package, description: t('nav.myApis') },
    { name: t('nav.analytics'), href: '/seller/analytics', icon: BarChart3, description: t('nav.analytics') },
    { name: t('nav.revenue'), href: '/seller/revenue', icon: TrendingUp, description: t('nav.revenue') },

  ];

  const buyerNavigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: Home, description: t('nav.dashboard') },
    { name: t('nav.browseApis'), href: '/buyer/services', icon: ShoppingCart, description: t('nav.browseApis') },
    { name: t('nav.mySubscriptions'), href: '/buyer/subscriptions', icon: Code, description: t('nav.mySubscriptions') },
    { name: t('nav.usageBilling'), href: '/buyer/usage', icon: BarChart3, description: t('nav.usageBilling') },

  ];

  const commonNavigation = [
    { name: t('nav.settings'), href: '/settings', icon: Settings, description: t('nav.settings') },
    { name: t('nav.billing'), href: '/billing', icon: CreditCard, description: t('nav.billing') },
    { name: t('nav.help'), href: '/help', icon: HelpCircle, description: t('nav.help') },
  ];

  const navigation = user?.role === 'seller' ? sellerNavigation : buyerNavigation;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-80 flex-col bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl">
          {/* Mobile Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LLM Router</h1>
                <p className="text-xs text-slate-400">{t('nav.platformName')}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('nav.mainFeatures')}</h3>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <div>{item.name}</div>
                  </Link>
                );
              })}
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('nav.others')}</h3>
              {commonNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <div>{item.name}</div>
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Mobile Footer */}
          <div className="border-t border-slate-700 p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="mr-3 h-4 w-4" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl">
          {/* Header */}
          <div className="flex h-20 items-center px-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  LLM Router
                </h1>
                <p className="text-sm text-slate-400">{t('nav.platformName')}</p>
              </div>
            </div>
          </div>
          
          {/* User Info Card */}
          <div className="p-6">
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-slate-400 capitalize flex items-center">
                    <Activity className="h-3 w-3 mr-1" />
                    {user?.role === 'seller' ? t('nav.apiSeller') : t('nav.apiBuyer')}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-600 flex items-center space-x-1"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="text-xs">{currentLanguage.flag}</span>
                    </Button>
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2",
                            i18n.language === lang.code && "bg-slate-100 dark:bg-slate-700"
                          )}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">{t('nav.mainFeatures')}</h3>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:transform hover:scale-105'
                    )}
                  >
                    <Icon className="mr-4 h-5 w-5" />
                    <div className="flex-1 font-medium">{item.name}</div>
                  </Link>
                );
              })}
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">{t('nav.others')}</h3>
              {commonNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:transform hover:scale-105'
                    )}
                  >
                    <Icon className="mr-4 h-5 w-5" />
                    <div className="flex-1 font-medium">{item.name}</div>
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Footer */}
          <div className="border-t border-slate-700 p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <LogOut className="mr-3 h-4 w-4" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;