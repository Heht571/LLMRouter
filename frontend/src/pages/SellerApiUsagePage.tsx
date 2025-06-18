import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { apiClient } from '../services/api';
import type { UsageStats, Period, ApiService } from '../types/api';
import { 
  ArrowLeft,
  Activity, 
  BarChart3,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';

const SellerApiUsagePage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [apiService, setApiService] = useState<ApiService | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('daily');
  const { addToast } = useToast();

  const toast = {
    success: (title: string, description?: string) => {
      addToast({ type: 'success', title, description });
    },
    error: (title: string, description?: string) => {
      addToast({ type: 'error', title, description });
    },
  };

  const loadUsageStats = async (selectedPeriod: Period = period) => {
    try {
      setLoading(true);
      const stats = await apiClient.getSellerUsage(selectedPeriod);
      setUsageStats(stats);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
      toast.error(t('seller_api_usage.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const loadApiService = async () => {
    if (!serviceId) return;
    
    try {
      const services = await apiClient.getSellerApis();
      const service = services.apis.find((s: ApiService) => s.service_id === parseInt(serviceId));
      if (service) {
        setApiService(service);
      } else {
        toast.error(t('seller_api_usage.service_not_found'));
        navigate('/seller/services');
      }
    } catch (error) {
      console.error('Failed to load API service:', error);
      toast.error(t('seller_api_usage.load_service_failed'));
    }
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    loadUsageStats(newPeriod);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getPeriodLabel = (period: Period) => {
    switch (period) {
      case 'daily': return t('seller_api_usage.period_today');
      case 'weekly': return t('seller_api_usage.period_this_week');
      case 'monthly': return t('seller_api_usage.period_this_month');
      default: return period;
    }
  };

  useEffect(() => {
    loadApiService();
    loadUsageStats();
  }, [serviceId]);

  if (loading && !usageStats) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 找到当前API服务的使用量详情
  const currentApiUsage = usageStats?.usage_details_by_api?.find(
    detail => detail.api_service_id === parseInt(serviceId || '0')
  );

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/seller/services')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('seller_api_usage.back_button')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('seller_api_usage.title')}
            </h1>
            {apiService && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {apiService.name} (ID: {apiService.service_id})
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 时间周期选择 */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select 
              value={period} 
              onChange={(e) => handlePeriodChange(e.target.value as Period)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="daily">{t('seller_api_usage.period_today')}</option>
              <option value="weekly">{t('seller_api_usage.period_this_week')}</option>
              <option value="monthly">{t('seller_api_usage.period_this_month')}</option>
            </select>
          </div>
          
          <Button onClick={() => loadUsageStats()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('seller_api_usage.refresh_data')}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* API调用次数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('seller_api_usage.api_calls_card_title')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(currentApiUsage?.calls || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('seller_api_usage.total_calls_period', { period: getPeriodLabel(period) })}
            </p>
          </CardContent>
        </Card>

        {/* Token使用量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('seller_api_usage.token_usage_card_title')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(currentApiUsage?.total_tokens || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('seller_api_usage.total_tokens_period', { period: getPeriodLabel(period) })}
            </p>
          </CardContent>
        </Card>

        {/* 实际收入 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('seller_api_usage.actual_revenue_card_title')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentApiUsage?.cost || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('seller_api_usage.actual_revenue_period', { period: getPeriodLabel(period) })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t('seller_api_usage.revenue_calculation_note')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API服务详情 */}
      {apiService && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('seller_api_usage.api_service_details_title')}</CardTitle>
            <CardDescription>
              {t('seller_api_usage.api_info_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('seller_api_usage.service_name_label')}</label>
                <p className="text-sm">{apiService.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('seller_api_usage.service_description_label')}</label>
                <p className="text-sm">{apiService.description || t('seller_api_usage.no_description')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('seller_api_usage.service_status_label')}</label>
                <p className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    apiService.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {apiService.is_active ? t('seller_api_usage.status_active') : t('seller_api_usage.status_inactive')}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('seller_api_usage.service_id_label')}</label>
                <p className="text-sm font-mono">{apiService.service_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('seller_api_usage.proxy_url_label')}</label>
                <p className="text-sm font-mono">{apiService.platform_proxy_url_prefix}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('seller_api_usage.created_time')}</label>
                <p className="text-sm">
                  {t('seller_api_usage.unknown_time')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用量趋势说明 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('seller_api_usage.usage_explanation_title')}</CardTitle>
          <CardDescription>
            {t('seller_api_usage.usage_explanation_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">{t('seller_api_usage.api_calls_card_title')}</h4>
              <p className="text-sm text-gray-600">
                {t('seller_api_usage.calls_explanation')}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{t('seller_api_usage.token_usage_card_title')}</h4>
              <p className="text-sm text-gray-600">
                {t('seller_api_usage.tokens_explanation')}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{t('seller_api_usage.actual_revenue_card_title')}</h4>
              <p className="text-sm text-gray-600">
                {t('seller_api_usage.revenue_explanation')}
              </p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                {t('seller_api_usage.data_update_note')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerApiUsagePage;