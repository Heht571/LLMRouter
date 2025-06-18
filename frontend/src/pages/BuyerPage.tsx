import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Star, DollarSign, Activity, Users, ShoppingCart, Eye, Filter, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/api';
import { useToast } from '../components/ui/Toast';
import type { BrowseApiService } from '../types/api';

// Remove the old interface as we're using BrowseApiService from types

const BuyerPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [services, setServices] = useState<BrowseApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribingIds, setSubscribingIds] = useState<Set<number>>(new Set());
  const { addToast } = useToast();

  // Load available APIs on component mount
  useEffect(() => {
    loadAvailableApis();
  }, []);

  const loadAvailableApis = async () => {
    try {
      setLoading(true);
      setError(null);
      const apis = await apiClient.getBrowseApis();
      setServices(apis);
    } catch (err) {
      console.error('Failed to load APIs:', err);
      setError(t('buyer_page.load_failed'));
      addToast({ type: 'error', title: t('buyer_page.load_api_failed') });
    } finally {
      setLoading(false);
    }
  };

  // 处理详情页面导航
  const handleViewDetails = (serviceId: number) => {
    navigate(`/buyer/services/${serviceId}`);
  };

  // Extract unique categories for filter
  const categories = ['all', ...Array.from(new Set(services.map(s => s.category).filter(Boolean)))];

  // Filter services based on search and category
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubscribe = async (serviceId: number) => {
    if (subscribingIds.has(serviceId)) return;
    
    try {
      setSubscribingIds(prev => new Set(prev).add(serviceId));
      const subscription = await apiClient.subscribeToApi(serviceId);
      addToast({ type: 'success', title: t('buyer_page.subscribe_success') });
      console.log('订阅成功:', subscription);
      // Optionally refresh the services list or update UI
    } catch (err) {
      console.error('订阅失败:', err);
      addToast({ type: 'error', title: t('buyer_page.subscribe_failed') });
    } finally {
      setSubscribingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };

  const handleRetry = () => {
    loadAvailableApis();
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">{t('buyer_page.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('buyer_page.load_error_title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            {t('buyer_page.retry')}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('buyer_page.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('buyer_page.description')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('buyer_page.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? t('buyer_page.all_categories') : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 服务网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card key={service.service_id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    {t('buyer_page.by_seller')}{service.seller_username || t('buyer_page.unknown_seller')}
                  </CardDescription>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  service.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {service.is_active ? t('buyer_page.available') : t('buyer_page.unavailable')}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {service.rating && renderStars(service.rating)}
                </div>
                {service.rating && (
                  <>
                    <span className="text-sm font-medium">{service.rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">{t('buyer_page.reviews_count', { count: service.review_count || 0 })}</span>
                  </>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {service.description}
              </p>
              
              {service.features && service.features.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {service.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  {service.pricing_model === 'per_token' ? (
                    <>
                      <div className="font-semibold">${service.price_per_token ? (service.price_per_token * 10000).toFixed(2) : '0.00'}</div>
                      <div className="text-gray-500 text-xs">{t('buyer_page.per_10k_tokens')}</div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold">${service.price_per_call ? service.price_per_call.toFixed(4) : '0.0000'}</div>
                      <div className="text-gray-500 text-xs">{t('buyer_page.per_call')}</div>
                    </>
                  )}
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="font-semibold">{service.total_calls ? service.total_calls.toLocaleString() : '0'}</div>
                  <div className="text-gray-500 text-xs">{t('buyer_page.total_calls')}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="font-semibold">{service.subscriber_count || 0}</div>
                  <div className="text-gray-500 text-xs">{t('buyer_page.subscribers')}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewDetails(service.service_id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {t('buyer_page.details')}
                </Button>
                <Button
                  variant={service.is_active ? 'gradient' : 'outline'}
                  size="sm"
                  className="flex-1"
                  disabled={!service.is_active || subscribingIds.has(service.service_id)}
                  onClick={() => handleSubscribe(service.service_id)}
                >
                  {subscribingIds.has(service.service_id) ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-1" />
                  )}
                  {subscribingIds.has(service.service_id) ? t('buyer_page.subscribing') : (service.is_active ? t('buyer_page.subscribe') : t('buyer_page.unavailable'))}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('buyer_page.no_services_title')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('buyer_page.no_services_description')}
          </p>
        </div>
      )}
    </div>
  );
};

export default BuyerPage;