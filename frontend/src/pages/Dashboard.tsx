import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import UsageTrendChart from '../components/UsageTrendChart';
import { BarChart3, DollarSign, Zap, TrendingUp, Activity, User, Package, Plus, Settings, FileText, Search, ShoppingCart } from 'lucide-react';
import { apiClient } from '../services/api';
import type { ApiService, UsageStats } from '../types/api';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [apis, setApis] = useState<ApiService[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<ApiService[]>([]);
  
  // 数据获取函数
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'seller') {
        // 卖家数据
        const [apisResponse, usageResponse] = await Promise.all([
          apiClient.getSellerApis(),
          apiClient.getSellerUsage('monthly')
        ]);
        setApis(apisResponse.apis || []);
        setUsageStats(usageResponse);
      } else if (user?.role === 'buyer') {
        // 买家数据
        const [subscriptionsResponse, usageResponse] = await Promise.all([
          apiClient.getBuyerSubscriptions(),
          apiClient.getBuyerUsage('monthly')
        ]);
        setSubscriptions(subscriptionsResponse || []);
        setUsageStats(usageResponse);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // 计算统计数据
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const stats = [
    {
      label: user?.role === 'seller' ? t('dashboard.stats.total_apis') : t('dashboard.stats.subscribed_apis'),
      value: user?.role === 'seller' ? apis.length : subscriptions.length,
      icon: user?.role === 'seller' ? Package : ShoppingCart,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      label: t('dashboard.stats.active_apis'),
      value: user?.role === 'seller' ? apis.filter(api => api.is_active).length : subscriptions.length,
      icon: Activity,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
    },
    {
      label: t('dashboard.stats.monthly_calls'),
      value: usageStats?.calls_made?.toLocaleString() || '0',
      icon: BarChart3,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
    },
    {
      label: user?.role === 'seller' ? t('dashboard.stats.total_revenue') : t('dashboard.stats.total_cost'),
      value: `$${(usageStats?.indicative_cost || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
    },
    {
      label: t('dashboard.stats.token_usage'),
      value: usageStats?.total_tokens?.toLocaleString() || '0',
      icon: Zap,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    },
  ];

  // 生成最近活动数据
  const generateRecentActivity = () => {
    const activities = [];
    
    if (user?.role === 'seller') {
      // 卖家活动
      if (apis.length > 0) {
        activities.push({
          title: t('dashboard.api_management'),
          description: t('dashboard.api_management_desc', { count: apis.length }),
          time: t('common.realtime'),
          icon: Package,
          color: 'bg-gradient-to-br from-blue-500 to-blue-600',
        });
      }
      
      if (usageStats && usageStats.calls_made > 0) {
        activities.push({
          title: t('dashboard.api_calls_stats'),
          description: t('dashboard.api_calls_stats_desc', { count: usageStats.calls_made }),
          time: '1小时前',
          icon: BarChart3,
          color: 'bg-gradient-to-br from-green-500 to-green-600',
        });
      }
      
      if (usageStats && usageStats.indicative_cost > 0) {
        activities.push({
          title: t('dashboard.revenue_stats'),
          description: t('dashboard.revenue_stats_desc', { amount: formatCurrency(usageStats.indicative_cost) }),
          time: '2小时前',
          icon: DollarSign,
          color: 'bg-gradient-to-br from-purple-500 to-purple-600',
        });
      }
      
      const activeApis = apis.filter(api => api.is_active).length;
      if (activeApis > 0) {
        activities.push({
          title: t('dashboard.active_api_services'),
          description: t('dashboard.active_api_services_desc', { count: activeApis }),
          time: t('common.realtime'),
          icon: Activity,
          color: 'bg-gradient-to-br from-orange-500 to-orange-600',
        });
      }
    } else {
      // 买家活动
      if (subscriptions.length > 0) {
        activities.push({
          title: t('dashboard.subscription_management'),
          description: t('dashboard.subscription_management_desc', { count: subscriptions.length }),
          time: t('common.realtime'),
          icon: Package,
          color: 'bg-gradient-to-br from-blue-500 to-blue-600',
        });
      }
      
      if (usageStats && usageStats.calls_made > 0) {
        activities.push({
          title: t('dashboard.usage_tracking'),
          description: t('dashboard.usage_tracking_desc', { count: usageStats.calls_made }),
          time: '1小时前',
          icon: BarChart3,
          color: 'bg-gradient-to-br from-green-500 to-green-600',
        });
      }
      
      if (usageStats && usageStats.indicative_cost > 0) {
        activities.push({
          title: t('dashboard.cost_analysis'),
          description: t('dashboard.cost_analysis_desc', { amount: formatCurrency(usageStats.indicative_cost) }),
          time: '2小时前',
          icon: DollarSign,
          color: 'bg-gradient-to-br from-purple-500 to-purple-600',
        });
      }
      
      if (usageStats && usageStats.total_tokens > 0) {
        activities.push({
          title: t('dashboard.stats.token_usage'),
          description: `总消耗: ${formatNumber(usageStats.total_tokens)} tokens`,
          time: '3小时前',
          icon: TrendingUp,
          color: 'bg-gradient-to-br from-orange-500 to-orange-600',
        });
      }
    }
    
    // 如果没有活动数据，显示默认信息
    if (activities.length === 0) {
      activities.push({
        title: t('dashboard.no_activity'),
        description: user?.role === 'seller' ? '开始注册您的第一个API服务' : '开始订阅您的第一个API服务',
        time: '现在',
        icon: Zap,
        color: 'bg-gradient-to-br from-gray-500 to-gray-600',
      });
    }
    
    return activities.slice(0, 4); // 最多显示4个活动
  };
  
  const recentActivity = generateRecentActivity();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-3">
              {t('dashboard.welcome', { username: user?.username })}
            </h1>
            <p className="text-blue-100 text-lg">
              {user?.role === 'seller' ? t('dashboard.seller_subtitle') : t('dashboard.buyer_subtitle')}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`p-4 rounded-2xl ${stat.color} shadow-lg`}>
                <stat.icon className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="mt-6">
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {t('common.realtime')}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 快速操作 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quick_actions')}</h2>
          <div className="grid grid-cols-2 gap-4">
            {user?.role === 'seller' ? (
              <>
                <button 
                  onClick={() => navigate('/seller/services')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group"
                >
                  <div className="p-2 bg-blue-500 rounded-lg text-white group-hover:bg-blue-600 transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{t('dashboard.add_api')}</div>
                    <div className="text-sm text-gray-600">{t('dashboard.add_api_desc')}</div>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/seller/usage')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-200 group"
                >
                  <div className="p-2 bg-green-500 rounded-lg text-white group-hover:bg-green-600 transition-colors">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{t('dashboard.view_stats')}</div>
                    <div className="text-sm text-gray-600">{t('dashboard.view_stats_desc')}</div>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/seller/services')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-200 group"
                >
                  <div className="p-2 bg-purple-500 rounded-lg text-white group-hover:bg-purple-600 transition-colors">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{t('dashboard.manage_apis')}</div>
                    <div className="text-sm text-gray-600">{t('dashboard.manage_apis_desc')}</div>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/seller/services')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg hover:from-orange-100 hover:to-orange-200 transition-all duration-200 group"
                >
                  <div className="p-2 bg-orange-500 rounded-lg text-white group-hover:bg-orange-600 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{t('dashboard.manage_docs')}</div>
                    <div className="text-sm text-gray-600">{t('dashboard.manage_docs_desc')}</div>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/buyer/browse')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group"
                >
                  <div className="p-2 bg-blue-500 rounded-lg text-white group-hover:bg-blue-600 transition-colors">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{t('dashboard.browse_apis')}</div>
                    <div className="text-sm text-gray-600">{t('dashboard.browse_apis_desc')}</div>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/buyer/subscriptions')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-200 group"
                >
                  <div className="p-2 bg-green-500 rounded-lg text-white group-hover:bg-green-600 transition-colors">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{t('dashboard.my_subscriptions')}</div>
                    <div className="text-sm text-gray-600">{t('dashboard.my_subscriptions_desc')}</div>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/buyer/usage')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-200 group"
                >
                  <div className="p-2 bg-purple-500 rounded-lg text-white group-hover:bg-purple-600 transition-colors">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{t('dashboard.usage_stats')}</div>
                    <div className="text-sm text-gray-600">{t('dashboard.usage_stats_desc')}</div>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/buyer/account')}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg hover:from-orange-100 hover:to-orange-200 transition-all duration-200 group"
                >
                  <div className="p-2 bg-orange-500 rounded-lg text-white group-hover:bg-orange-600 transition-colors">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{t('dashboard.account_settings')}</div>
                    <div className="text-sm text-gray-600">{t('dashboard.account_settings_desc')}</div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-slate-700/50">
          <div className="px-8 py-6 border-b border-gray-200/50 dark:border-slate-700/50">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Activity className="h-6 w-6 mr-3 text-blue-500" />
              {t('dashboard.recent_activity')}
            </h2>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200">
                  <div className={`p-3 rounded-xl ${activity.color} shadow-lg`}>
                    <activity.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 使用趋势图表 */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-slate-700/50">
        <div className="px-8 py-6 border-b border-gray-200/50 dark:border-slate-700/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="h-6 w-6 mr-3 text-blue-500" />
            {t('dashboard.api_usage_stats')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            {t('dashboard.api_usage_stats_desc')}
          </p>
        </div>
        <div className="p-8">
          <UsageTrendChart userRole={user?.role || 'buyer'} />
        </div>
      </div>
      

    </div>
  );
};

export default Dashboard;