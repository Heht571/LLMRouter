import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../services/api';
import type { ApiServiceDetail } from '../types/api';
import { useAuthStore } from '../store/authStore';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../components/ui/Toast';
import { Eye, Edit3, Save, X, ArrowLeft, Star, Users, Activity, DollarSign, ShoppingCart } from 'lucide-react';

const ApiDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const [apiDetail, setApiDetail] = useState<ApiServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [documentationContent, setDocumentationContent] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);
  const [apiDocumentation, setApiDocumentation] = useState<any>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  useEffect(() => {
    if (serviceId) {
      fetchApiDetail(parseInt(serviceId));
    }
  }, [serviceId]);

  const fetchApiDetail = async (id: number) => {
    try {
      setLoading(true);
      const detail = await apiClient.getApiDetail(id);
      setApiDetail(detail);
      setDocumentationContent(detail.documentation || '');
      
      // 获取API文档
      await fetchApiDocumentation(id);
    } catch (error) {
      console.error('Failed to fetch API detail:', error);
      addToast({ type: 'error', title: t('api_detail.fetch_detail_failed') });
      navigate(user?.role === 'seller' ? '/seller' : '/buyer');
    } finally {
      setLoading(false);
    }
  };

  const fetchApiDocumentation = async (id: number) => {
    try {
      setLoadingDoc(true);
      let documentation;
      if (user?.role === 'seller') {
        documentation = await apiClient.getApiDocumentation(id);
      } else {
        documentation = await apiClient.getBuyerApiDocumentation(id);
      }
      setApiDocumentation(documentation);
    } catch (error) {
      console.error('Failed to fetch API documentation:', error);
      // 不显示错误提示，因为文档可能不存在
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleSubscribe = async () => {
    if (!apiDetail) return;
    
    // 检查认证状态
    const token = localStorage.getItem('token');
    if (!token) {
      addToast({ type: 'error', title: t('api_detail.please_login') });
      return;
    }
    
    try {
      setSubscribing(true);
      console.log('开始订阅 API，服务ID:', apiDetail.service_id);
      console.log('当前token:', token ? '已存在' : '不存在');
      const result = await apiClient.subscribeToApi(apiDetail.service_id);
      console.log('订阅成功，结果:', result);
      addToast({ type: 'success', title: t('api_detail.subscribe_success') });
      await fetchApiDetail(apiDetail.service_id);
    } catch (error: any) {
      console.error('订阅失败，详细错误:', error);
      console.error('错误响应:', error.response?.data);
      console.error('错误状态码:', error.response?.status);
      const errorMessage = error.response?.data?.error || t('api_detail.subscribe_failed');
      addToast({ type: 'error', title: errorMessage });
    } finally {
      setSubscribing(false);
    }
  };

  const handleSaveDocumentation = async () => {
    if (!apiDetail) return;

    try {
      setSavingDoc(true);
      // 使用现有的updateApiService方法，但需要扩展以支持文档更新
      // 只更新文档内容，其他字段保持原值
      await apiClient.updateApiService(apiDetail.service_id, {
        name: apiDetail.name,
        description: apiDetail.description,
        original_endpoint_url: apiDetail.platform_proxy_prefix || '', // 使用现有的代理前缀
        documentation: documentationContent
      });
      
      setApiDetail(prev => prev ? { ...prev, documentation: documentationContent } : null);
      setIsEditingDoc(false);
      addToast({ type: 'success', title: t('api_detail.doc_update_success') });
    } catch (error) {
      console.error('Failed to update documentation:', error);
      addToast({ type: 'error', title: t('api_detail.doc_update_failed') });
    } finally {
      setSavingDoc(false);
    }
  };

  const handleCancelEdit = () => {
    setDocumentationContent(apiDetail?.documentation || '');
    setIsEditingDoc(false);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-4 h-4 fill-yellow-200 text-yellow-400" />
      );
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }
    
    return stars;
  };

  // 检查当前用户是否是该API的卖家
  const isOwner = user?.role === 'seller' && user?.username === apiDetail?.seller_username;
  const isBuyer = user?.role === 'buyer';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('api_detail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!apiDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t('api_detail.api_not_found')}</p>
          <button
            onClick={() => navigate(user?.role === 'seller' ? '/seller' : '/buyer')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('api_detail.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(user?.role === 'seller' ? '/seller/apis' : '/buyer')}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {user?.role === 'seller' ? t('api_detail.back_to_my_apis') : t('api_detail.back_to_market')}
            </button>
            <div className="flex items-center space-x-2">
              {isBuyer && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                apiDetail.is_subscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {apiDetail.is_subscribed ? t('api_detail.subscribed') : t('api_detail.not_subscribed')}
              </span>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              apiDetail.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {apiDetail.is_active ? t('api_detail.available') : t('api_detail.unavailable')}
            </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* API Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{apiDetail.name}</h1>
                  <p className="text-gray-600 mb-4">{apiDetail.description}</p>
                  
                  {/* Rating and Reviews */}
                  {apiDetail.rating && (
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        {renderStars(apiDetail.rating)}
                        <span className="text-sm text-gray-600 ml-2">
                          {apiDetail.rating.toFixed(1)} {t('api_detail.reviews_count', { count: apiDetail.review_count || 0 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {apiDetail.features && apiDetail.features.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">{t('api_detail.features')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {apiDetail.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category */}
                  {apiDetail.category && (
                    <div className="mb-4">
                      <span className="text-sm text-gray-500">{t('api_detail.category')}: </span>
                      <span className="text-sm font-medium text-gray-900">{apiDetail.category}</span>
                    </div>
                  )}

                  {/* Seller */}
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">{t('api_detail.provider')}: </span>
                    <span className="text-sm font-medium text-gray-900">{apiDetail.seller_username}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentation */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('api_detail.api_documentation')}</h2>
                {isOwner && (
                  <div className="flex items-center space-x-2">
                    {isEditingDoc ? (
                      <>
                        <button
                          onClick={handleSaveDocumentation}
                          disabled={savingDoc}
                          className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {savingDoc ? t('api_detail.saving') : t('api_detail.save')}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={savingDoc}
                          className="flex items-center px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t('api_detail.cancel')}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditingDoc(true)}
                        className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        {t('api_detail.edit_documentation')}
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {isEditingDoc ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('api_detail.markdown_content')}
                    </label>
                    <textarea
                      value={documentationContent}
                      onChange={(e) => setDocumentationContent(e.target.value)}
                      className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder={t('api_detail.doc_placeholder')}
                    />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t('api_detail.preview')}</h4>
                    <div className="prose max-w-none text-sm">
                      {documentationContent ? (
                        <ReactMarkdown>{documentationContent}</ReactMarkdown>
                      ) : (
                        <p className="text-gray-500 italic">{t('api_detail.no_content')}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  {loadingDoc ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">{t('api_detail.loading_doc')}</p>
                    </div>
                  ) : apiDocumentation ? (
                    <div>
                      <ReactMarkdown>{apiDocumentation.content}</ReactMarkdown>
                      {apiDocumentation.endpoints && apiDocumentation.endpoints.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-semibold mb-4">{t('api_detail.api_endpoints')}</h3>
                          <div className="space-y-4">
                            {apiDocumentation.endpoints.map((endpoint: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                                    endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                    endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                    endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {endpoint.method}
                                  </span>
                                  <code className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                                    {endpoint.path}
                                  </code>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                                {endpoint.request_example && (
                                  <div className="mb-2">
                                    <h5 className="text-sm font-medium mb-1">{t('api_detail.request_example')}</h5>
                                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                      <code>{endpoint.request_example}</code>
                                    </pre>
                                  </div>
                                )}
                                {endpoint.response_example && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-1">{t('api_detail.response_example')}</h5>
                                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                                      <code>{endpoint.response_example}</code>
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t('api_detail.no_documentation')}</p>
                      {isOwner && (
                        <p className="text-sm text-gray-400 mt-2">{t('api_detail.add_documentation_tip')}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card - 只对买家显示 */}
            {isBuyer && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('api_detail.pricing_info')}</h3>
                <div className="text-center mb-6">
                  {apiDetail.pricing_model === 'per_token' ? (
                    <>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        ${apiDetail.price_per_token ? (apiDetail.price_per_token * 10000).toFixed(2) : '0.00'}
                      </div>
                      <div className="text-sm text-gray-500">{t('api_detail.per_10k_tokens')}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        ${apiDetail.price_per_call?.toFixed(4) || '0.0000'}
                      </div>
                      <div className="text-sm text-gray-500">{t('api_detail.per_call')}</div>
                    </>
                  )}
                </div>
                
                {!apiDetail.is_subscribed ? (
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing || !apiDetail.is_active}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {subscribing ? t('api_detail.subscribing') : t('api_detail.subscribe')}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm text-green-800 font-medium">{t('api_detail.subscribed')}</div>
                      {apiDetail.subscription_date && (
                        <div className="text-xs text-green-600 mt-1">
                          {t('api_detail.subscription_time')}: {new Date(apiDetail.subscription_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {apiDetail.platform_api_key && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-sm font-medium text-gray-900 mb-1">{t('api_detail.api_key')}</div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                          {apiDetail.platform_api_key}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('api_detail.statistics')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">{t('api_detail.total_calls')}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {apiDetail.total_calls?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="text-sm text-gray-600">{t('api_detail.subscriber_count')}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {apiDetail.subscriber_count?.toLocaleString() || 0}
                  </span>
                </div>
                {(apiDetail.price_per_call || apiDetail.price_per_token) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-600">
                        {apiDetail.pricing_model === 'per_token' ? t('api_detail.per_10k_tokens_price') : t('api_detail.per_call_price')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {apiDetail.pricing_model === 'per_token' 
                        ? `$${apiDetail.price_per_token ? (apiDetail.price_per_token * 10000).toFixed(2) : '0.00'}`
                        : `$${apiDetail.price_per_call?.toFixed(4) || '0.0000'}`
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Owner Actions - 只对API拥有者显示 */}
            {isOwner && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('api_detail.management_actions')}</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate(`/seller/apis/${apiDetail.service_id}/edit`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('api_detail.edit_api_settings')}
                  </button>
                  <button
                    onClick={() => navigate(`/seller/apis/${apiDetail.service_id}/analytics`)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t('api_detail.view_analytics')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDetailPage;