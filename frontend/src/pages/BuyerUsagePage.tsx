import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BarChart3, TrendingUp, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { apiClient } from '../services/api';
import type { UsageStats, Period } from '../types/api';

const BuyerUsagePage: React.FC = () => {
  const { t } = useTranslation();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [refreshing, setRefreshing] = useState(false);

  // 加载用量统计数据
  const loadUsageStats = async (selectedPeriod: Period = period) => {
    try {
      setLoading(true);
      setError(null);
      const stats = await apiClient.getBuyerUsage(selectedPeriod);
      setUsageStats(stats);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
      setError(t('buyer_usage.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsageStats();
    setRefreshing(false);
  };

  // 处理时间周期变化
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    loadUsageStats(newPeriod);
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadUsageStats();
  }, []);

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  // 获取时间周期显示文本
  const getPeriodText = (period: Period) => {
    switch (period) {
      case 'daily': return t('buyer_usage.period_daily');
      case 'weekly': return t('buyer_usage.period_weekly');
      case 'monthly': return t('buyer_usage.period_monthly');
      case 'yearly': return t('buyer_usage.period_yearly');
      default: return t('buyer_usage.period_monthly');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>{t('buyer_usage.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => loadUsageStats()} variant="outline">
                {t('buyer_usage.retry')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题和控制 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('buyer_usage.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('buyer_usage.description')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as Period)}
            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">{t('buyer_usage.period_daily')}</option>
            <option value="weekly">{t('buyer_usage.period_weekly')}</option>
            <option value="monthly">{t('buyer_usage.period_monthly')}</option>
            <option value="yearly">{t('buyer_usage.period_yearly')}</option>
          </select>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('buyer_usage.refresh')}
          </Button>
        </div>
      </div>

      {/* 统计概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 总调用次数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('buyer_usage.total_calls')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(usageStats?.calls_made || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getPeriodText(period)}{t('buyer_usage.cumulative_calls')}
            </p>
          </CardContent>
        </Card>

        {/* 总Token数量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('buyer_usage.total_tokens')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(usageStats?.total_tokens || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getPeriodText(period)}{t('buyer_usage.cumulative_tokens')}
            </p>
          </CardContent>
        </Card>

        {/* 预估费用 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('buyer_usage.estimated_cost')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(usageStats?.indicative_cost || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getPeriodText(period)}{t('buyer_usage.cumulative_cost')}
            </p>
          </CardContent>
        </Card>

        {/* 使用的API数量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('buyer_usage.apis_used')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats?.usage_details_by_api?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('buyer_usage.different_apis')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API详细使用情况 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            {t('buyer_usage.api_usage_details')}
          </CardTitle>
          <CardDescription>
            {t('buyer_usage.api_usage_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageStats?.usage_details_by_api && usageStats.usage_details_by_api.length > 0 ? (
            <div className="space-y-4">
              {usageStats.usage_details_by_api.map((detail) => (
                <div 
                  key={detail.api_service_id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {detail.api_service_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('buyer_usage.service_id')}: {detail.api_service_id}
                    </p>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatNumber(detail.calls)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('buyer_usage.calls_count')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {formatNumber(detail.total_tokens)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('buyer_usage.tokens_count')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(detail.cost)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {t('buyer_usage.cost')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {getPeriodText(period)}{t('buyer_usage.no_usage_records')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerUsagePage;