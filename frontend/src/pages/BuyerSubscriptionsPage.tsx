import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Search, 
  Star, 
  DollarSign, 
  Eye, 
  Key, 
  Calendar,
  Loader2, 
  AlertCircle,
  Copy,
  ExternalLink,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useToast } from '../components/ui/Toast';
import type { ApiServiceDetail } from '../types/api';
import { useNavigate } from 'react-router-dom';

const BuyerSubscriptionsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [subscriptions, setSubscriptions] = useState<ApiServiceDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<Set<number>>(new Set());
  const { addToast } = useToast();

  // Load subscriptions on component mount
  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const subs = await apiClient.getBuyerSubscriptions();
      // 后端已经返回完整的订阅信息，包括真实的platform_api_key
      setSubscriptions(subs as ApiServiceDetail[]);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setError(t('buyer_subscriptions.load_failed'));
      addToast({ type: 'error', title: t('buyer_subscriptions.load_failed') });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (serviceId: number) => {
    navigate(`/buyer/services/${serviceId}`);
  };

  const handleCopyApiKey = async (apiKey: string) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      addToast({ type: 'success', title: t('buyer_subscriptions.copy_success') });
    } catch (err) {
      console.error('Failed to copy API key:', err);
      addToast({ type: 'error', title: t('buyer_subscriptions.copy_failed') });
    }
  };

  const handleRefreshKey = async (serviceId: number) => {
    if (refreshingIds.has(serviceId)) return;
    
    try {
      setRefreshingIds(prev => new Set(prev).add(serviceId));
      // This would call an API to refresh the key
      // For now, just simulate the action
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast({ type: 'success', title: 'API密钥已刷新' });
      // Reload subscriptions to get new key
      await loadSubscriptions();
      addToast({ type: 'success', title: t('buyer_subscriptions.key_refreshed') });
    } catch (err) {
      console.error('Failed to refresh key:', err);
      addToast({ type: 'error', title: t('buyer_subscriptions.refresh_key_failed') });
    } finally {
      setRefreshingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };

  const handleUnsubscribe = async (serviceId: number) => {
    if (!window.confirm(t('buyer_subscriptions.unsubscribe_confirm'))) {
      return;
    }

    try {
      await apiClient.unsubscribeFromService(serviceId);
      await loadSubscriptions();
      addToast({ type: 'success', title: t('buyer_subscriptions.unsubscribed') });
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      addToast({ type: 'error', title: t('buyer_subscriptions.unsubscribe_failed') });
    }
  };

  const handleRetry = () => {
    loadSubscriptions();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  // Filter subscriptions based on search
  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('buyer_subscriptions.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('buyer_subscriptions.load_error_title')}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('buyer_subscriptions.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和搜索 */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('buyer_subscriptions.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('buyer_subscriptions.description')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('buyer_subscriptions.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>{t('buyer_subscriptions.total_subscriptions', { count: subscriptions.length })}</span>
          </div>
        </div>
      </div>

      {/* 订阅列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSubscriptions.map((subscription) => (
          <Card key={subscription.service_id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{subscription.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    {t('buyer_subscriptions.by_seller', { seller: subscription.seller_username || t('buyer_subscriptions.unknown_seller') })}
                  </CardDescription>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  subscription.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {subscription.is_active ? t('buyer_subscriptions.available') : t('buyer_subscriptions.unavailable')}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {subscription.rating && renderStars(subscription.rating)}
                </div>
                {subscription.rating && (
                  <>
                    <span className="text-sm font-medium">{subscription.rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">{t('buyer_subscriptions.reviews_count', { count: subscription.review_count || 0 })}</span>
                  </>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subscription.description}
              </p>
              
              {/* 服务ID信息 */}
              <div className="bg-blue-50 dark:bg-blue-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('buyer_subscriptions.service_id')}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyApiKey(subscription.service_id.toString())}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border block">
                  {subscription.service_id}
                </code>
              </div>
              
              {/* API密钥信息 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('buyer_subscriptions.api_key')}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyApiKey(subscription.platform_api_key || '')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRefreshKey(subscription.service_id)}
                      disabled={refreshingIds.has(subscription.service_id)}
                      className="h-6 w-6 p-0"
                    >
                      {refreshingIds.has(subscription.service_id) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border block break-all overflow-hidden">
                  {subscription.platform_api_key || 'pk_xxxxxxxxx'}
                </code>
              </div>
              
              {/* API调用示例 */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('buyer_subscriptions.api_call_example')}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const curlExample = `curl --request POST \\
  --url <url>/proxy/v1/${subscription.service_id}/v1/chat/completions \\
  --header 'X-API-Key: <your api key>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "model": "Qwen/Qwen3-8B",
    "messages": [{
      "role": "user",
      "content": "Hello, how are you?"
    }],
    "max_tokens": 100
  }'`;
                      handleCopyApiKey(curlExample);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs bg-white dark:bg-gray-900 px-3 py-2 rounded border font-mono overflow-x-auto">
                  <div className="whitespace-pre text-gray-800 dark:text-gray-200">
{`curl --request POST \\`}<br/>
{`  --url <url>/proxy/v1/${subscription.service_id}/v1/chat/completions \\`}<br/>
{`  --header 'X-API-Key: <your api key>' \\`}<br/>
{`  --header 'Content-Type: application/json' \\`}<br/>
{`  --data '{`}<br/>
{`    "model": "Qwen/Qwen3-8B",`}<br/>
{`    "messages": [{`}<br/>
{`      "role": "user",`}<br/>
{`      "content": "Hello, how are you?"`}<br/>
{`    }],`}<br/>
{`    "max_tokens": 100`}<br/>
{`  }'`}
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {t('buyer_subscriptions.api_example_tip', { url: '<url>', key: '<your api key>' })}
                </div>
              </div>
              
              {/* 订阅信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{t('buyer_subscriptions.subscription_time')}</div>
                    <div className="text-gray-500">
                      {subscription.subscription_date 
                        ? new Date(subscription.subscription_date).toLocaleDateString('zh-CN')
                        : t('buyer_subscriptions.unknown_time')
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">
                      {subscription.pricing_model === 'per_token' ? t('buyer_subscriptions.per_10k_tokens_cost') : t('buyer_subscriptions.per_call_cost')}
                    </div>
                    <div className="text-gray-500">
                      {subscription.pricing_model === 'per_token' 
                        ? `$${subscription.price_per_token ? (subscription.price_per_token * 10000).toFixed(2) : '0.00'}`
                        : `$${subscription.price_per_call ? subscription.price_per_call.toFixed(4) : '0.0000'}`
                      }
                    </div>
                  </div>
                </div>
              </div>
              

              
              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewDetails(subscription.service_id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {t('buyer_subscriptions.details')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(subscription.documentation, '_blank')}
                  disabled={!subscription.documentation}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {t('buyer_subscriptions.documentation')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleUnsubscribe(subscription.service_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubscriptions.length === 0 && (
        <div className="text-center py-12">
          {subscriptions.length === 0 ? (
            <div>
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('buyer_subscriptions.no_subscriptions_title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('buyer_subscriptions.no_subscriptions_description')}
              </p>
              <Button onClick={() => navigate('/marketplace')}>
                {t('buyer_subscriptions.browse_market')}
              </Button>
            </div>
          ) : (
            <div>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('buyer_subscriptions.no_search_results_title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('buyer_subscriptions.no_search_results_description')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuyerSubscriptionsPage;