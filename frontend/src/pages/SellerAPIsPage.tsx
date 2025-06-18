import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { apiClient } from '../services/api';
import type { ApiService, CreateApiService } from '../types/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Globe, 
  Activity, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy,
  Eye,
  FileText
} from 'lucide-react';

const SellerAPIsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [apis, setApis] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedApi, setSelectedApi] = useState<ApiService | null>(null);
  const [editingApi, setEditingApi] = useState<CreateApiService>({
    name: '',
    description: '',
    original_endpoint_url: '',
    original_api_key: ''
  });
  const [pricingData, setPricingData] = useState({
    pricing_model: 'per_call' as 'per_call' | 'per_token',
    price_per_call: 0,
    price_per_token: 0
  });
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updatingPricing, setUpdatingPricing] = useState(false);

  const { addToast } = useToast();
  
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
  
  const [newApi, setNewApi] = useState<CreateApiService>({
    name: '',
    description: '',
    original_endpoint_url: '',
    original_api_key: ''
  });

  // 查看API详情
  const handleViewApi = (api: ApiService) => {
    setSelectedApi(api);
    setShowDetailModal(true);
  };

  // 编辑API
  const handleEditApi = (api: ApiService) => {
    setSelectedApi(api);
    setEditingApi({
      name: api.name,
      description: api.description,
      original_endpoint_url: '', // 出于安全考虑，不显示原始URL
      original_api_key: '' // 出于安全考虑，不显示原始密钥
    });
    setShowEditModal(true);
  };

  // 更新API服务
  const handleUpdateApi = async () => {
    if (!selectedApi || !editingApi.name || !editingApi.description) {
      toast.error(t('pages.seller_apis.errors.fillAllFields'));
      return;
    }

    try {
      setUpdating(true);
      
      // 构建更新数据，只包含非空字段
      const updateData: Partial<CreateApiService> = {
        name: editingApi.name,
        description: editingApi.description
      };
      
      if (editingApi.original_endpoint_url.trim()) {
        updateData.original_endpoint_url = editingApi.original_endpoint_url;
      }
      
      if (editingApi.original_api_key.trim()) {
        updateData.original_api_key = editingApi.original_api_key;
      }
      
      const updatedApi = await apiClient.updateApiService(selectedApi.service_id, updateData);
      
      // 更新本地状态
      setApis(apis.map(api => 
        api.service_id === selectedApi.service_id 
          ? { ...api, ...updatedApi }
          : api
      ));
      
      setShowEditModal(false);
      setSelectedApi(null);
      toast.success(t('pages.seller_apis.update_success_message'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || t('pages.seller_apis.errors.updateFailed');
        toast.error(t('pages.seller_apis.update_error_message', { error: errorMessage }));
    } finally {
      setUpdating(false);
    }
  };

  // 删除API确认
  const handleDeleteApi = (api: ApiService) => {
    setSelectedApi(api);
    setShowDeleteModal(true);
  };

  // 确认删除API
  const handleConfirmDelete = async () => {
    if (!selectedApi) return;

    try {
      setDeleting(true);
      
      await apiClient.deleteApiService(selectedApi.service_id);
      
      // 更新本地状态
      setApis(apis.filter(api => api.service_id !== selectedApi.service_id));
      
      setShowDeleteModal(false);
      setSelectedApi(null);
      toast.success(t('pages.seller_apis.delete_success_message'));
      setSelectedApi(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || t('pages.seller_apis.errors.deleteFailed');
        toast.error(t('pages.seller_apis.delete_error_message', { error: errorMessage }));
    } finally {
      setDeleting(false);
    }
  };

  // 定价设置处理函数
  const handlePricingSettings = (api: ApiService) => {
    setSelectedApi(api);
    // 设置当前API的定价信息
    setPricingData({
      pricing_model: api.pricing_model || 'per_call',
      price_per_call: api.price_per_call || 0,
      price_per_token: api.price_per_token || 0
    });
    setShowPricingModal(true);
  };

  // 更新定价设置
  const handleUpdatePricing = async () => {
    if (!selectedApi) return;

    try {
      setUpdatingPricing(true);
      await apiClient.updateApiPricing(selectedApi.service_id, pricingData);
      
      // 更新本地状态
      setApis(apis.map(api => 
        api.service_id === selectedApi.service_id 
          ? { ...api, ...pricingData }
          : api
      ));
      
      setShowPricingModal(false);
      setSelectedApi(null);
      toast.success(t('pages.seller_apis.pricing_update_success_message'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || t('pages.seller_apis.errors.updateFailed');
        toast.error(t('pages.seller_apis.pricing_update_error_message', { error: errorMessage }));
    } finally {
      setUpdatingPricing(false);
    }
  };

  // 用于跟踪是否已显示过空列表提示
  const hasShownEmptyMessage = useRef(false);

  // 加载API列表
  const loadApis = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSellerApis();
      const apiList = Array.isArray(data.apis) ? data.apis : [];
      setApis(apiList);
      
      // 如果有友好提示信息，显示给用户（只显示一次）
      if (data.message && apiList.length === 0 && !hasShownEmptyMessage.current) {
        hasShownEmptyMessage.current = true;
        toast.info(data.message);
      }
      
      // 如果有API了，重置标志
      if (apiList.length > 0) {
        hasShownEmptyMessage.current = false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || t('pages.seller_apis.errors.loadFailed');
        toast.error(t('pages.seller_apis.errors.loadApiListError') + ': ' + errorMessage);
      setApis([]); // 确保在错误情况下也设置为空数组
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // 创建新API
  const handleCreateApi = async () => {
    if (!newApi.name || !newApi.description || !newApi.original_endpoint_url || !newApi.original_api_key) {
      toast.error(t('pages.seller_apis.errors.fillAllFields'));
      return;
    }

    try {
      setCreating(true);
      const createdApi = await apiClient.createApiService(newApi);
      setApis([...(Array.isArray(apis) ? apis : []), createdApi]);
      setNewApi({
        name: '',
        description: '',
        original_endpoint_url: '',
        original_api_key: ''
      });
      setShowCreateForm(false);
      toast.success(t('pages.seller_apis.create_success_message'));
    } catch (error: unknown) {
      // 优先从axios响应中获取后端返回的具体错误信息
      const axiosError = error as { response?: { data?: { error?: string } } };
      const errorMessage = axiosError?.response?.data?.error 
        || (error instanceof Error ? error.message : t('pages.seller_apis.create_failed_fallback'));
      toast.error(t('pages.seller_apis.create_error_message', { error: errorMessage }));
    } finally {
      setCreating(false);
    }
  };

  // 文档管理函数
  const handleViewDocumentation = (serviceId: number) => {
    navigate(`/seller/services/${serviceId}/documentation`);
  };

  // 使用量统计函数
  const handleViewUsage = (serviceId: number) => {
    navigate(`/seller/services/${serviceId}/usage`);
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  useEffect(() => {
    loadApis();
  }, [loadApis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('pages.seller_apis.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('pages.seller_apis.subtitle')}
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          variant="gradient"
          className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          {t('pages.seller_apis.register_new_api')}
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('pages.seller_apis.total_apis')}</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {apis.length}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">{t('pages.seller_apis.active_apis')}</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {apis.filter(api => api.is_active).length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{t('pages.seller_apis.total_subscriptions')}</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {apis.filter(api => api.platform_proxy_url_prefix).length}
                </p>
              </div>
              <ExternalLink className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 创建API表单 */}
      {showCreateForm && (
        <Card className="border-2 border-blue-200 dark:border-blue-700 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('pages.seller_apis.create_form_title')}
            </CardTitle>
            <CardDescription>
              {t('pages.seller_apis.create_form_subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('pages.seller_apis.service_name_label')}
                value={newApi.name}
                onChange={(e) => setNewApi({...newApi, name: e.target.value})}
                placeholder={t('pages.seller_apis.service_name_placeholder')}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              <Input
                label={t('pages.seller_apis.api_endpoint_label')}
                value={newApi.original_endpoint_url}
                onChange={(e) => setNewApi({...newApi, original_endpoint_url: e.target.value})}
                placeholder={t('pages.seller_apis.api_endpoint_placeholder')}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Input
              label={t('pages.seller_apis.service_description_label')}
              value={newApi.description}
              onChange={(e) => setNewApi({...newApi, description: e.target.value})}
              placeholder={t('pages.seller_apis.service_description_placeholder')}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
            />
            <Input
              label={t('pages.seller_apis.api_key_label')}
              type="password"
              value={newApi.original_api_key}
              onChange={(e) => setNewApi({...newApi, original_api_key: e.target.value})}
              placeholder={t('pages.seller_apis.api_key_placeholder')}
              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleCreateApi} 
                variant="gradient"
                disabled={creating}
                className="flex items-center gap-2"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {creating ? t('pages.seller_apis.creating') : t('pages.seller_apis.create_api')}
              </Button>
              <Button 
                onClick={() => setShowCreateForm(false)} 
                variant="outline"
                disabled={creating}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('pages.seller_apis.registered_apis')}
          </CardTitle>
          <CardDescription>
            {t('pages.seller_apis.manage_subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apis.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('pages.seller_apis.no_apis')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('pages.seller_apis.no_apis_desc')}
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                variant="gradient"
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                {t('pages.seller_apis.register_api')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apis.map((api) => (
                <div 
                  key={api.service_id} 
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                >
                  {/* 标题和状态 */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {api.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      api.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {api.is_active ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {api.is_active ? t('pages.seller_apis.active_status') : t('pages.seller_apis.inactive_status')}
                    </span>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleViewApi(api)}
                    >
                      <Eye className="h-4 w-4" />
                      {t('pages.seller_apis.view_details')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleEditApi(api)}
                    >
                      <Edit className="h-4 w-4" />
                      {t('pages.seller_apis.edit_api')}
                    </Button>
                    
                    {/* 使用量统计按钮 */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:border-green-300"
                      onClick={() => handleViewUsage(api.service_id)}
                    >
                      <Activity className="h-4 w-4" />
                      {t('pages.seller_apis.usage_stats_button')}
                    </Button>
                    
                    {/* 定价设置按钮 */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 text-purple-600 hover:text-purple-700 hover:border-purple-300"
                      onClick={() => handlePricingSettings(api)}
                    >
                      <span className="text-sm">💰</span>
                      {t('pages.seller_apis.pricing_settings')}
                    </Button>
                    
                    {/* 文档管理按钮 */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 hover:border-indigo-300"
                      onClick={() => handleViewDocumentation(api.service_id)}
                    >
                      <FileText className="h-4 w-4" />
                      {t('pages.seller_apis.api_docs_management')}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-300 flex items-center gap-1"
                      onClick={() => handleDeleteApi(api)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('pages.seller_apis.delete_api')}
                    </Button>
                  </div>
                  
                  {/* 描述 */}
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {api.description}
                  </p>
                  
                  {/* 服务信息 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-20">
                        {t('pages.seller_apis.service_id_label')}:
                      </span>
                      <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {api.service_id}
                      </span>
                    </div>
                    
                    {api.platform_proxy_url_prefix && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-20">
                          {t('pages.seller_apis.proxy_url_label')}:
                        </span>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-mono text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 flex-1">
                            {api.platform_proxy_url_prefix}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(api.platform_proxy_url_prefix!)}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 查看详情模态框 */}
      {showDetailModal && selectedApi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('pages.seller_apis.api_detail_title')}</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('pages.seller_apis.service_name_label')}
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {selectedApi.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('pages.seller_apis.service_description_label')}
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {selectedApi.description}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('pages.seller_apis.service_id_label')}
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg font-mono">
                  {selectedApi.service_id}
                </div>
              </div>
              
              {selectedApi.platform_proxy_url_prefix && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('pages.seller_apis.proxy_url_prefix_label')}
                  </label>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg font-mono text-blue-700 dark:text-blue-300">
                    {selectedApi.platform_proxy_url_prefix}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('pages.seller_apis.service_status_label')}
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                    selectedApi.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {selectedApi.is_active ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {selectedApi.is_active ? t('pages.seller_apis.active_status') : t('pages.seller_apis.inactive_status')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowDetailModal(false)}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑模态框 */}
      {showEditModal && selectedApi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('pages.seller_apis.edit_modal_title')}</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={updating}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <Input
                label={t('pages.seller_apis.service_name_label')}
                value={editingApi.name}
                onChange={(e) => setEditingApi({...editingApi, name: e.target.value})}
                placeholder={t('pages.seller_apis.service_name_placeholder')}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              
              <Input
                label={t('pages.seller_apis.service_description_label')}
                value={editingApi.description}
                onChange={(e) => setEditingApi({...editingApi, description: e.target.value})}
                placeholder={t('pages.seller_apis.service_description_placeholder')}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              
              <Input
                label={t('pages.seller_apis.api_endpoint_label')}
                value={editingApi.original_endpoint_url}
                onChange={(e) => setEditingApi({...editingApi, original_endpoint_url: e.target.value})}
                placeholder={t('pages.seller_apis.api_endpoint_placeholder')}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              
              <Input
                label={t('pages.seller_apis.api_key_label')}
                type="password"
                value={editingApi.original_api_key}
                onChange={(e) => setEditingApi({...editingApi, original_api_key: e.target.value})}
                placeholder={t('pages.seller_apis.api_key_placeholder')}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                disabled={updating}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleUpdateApi}
                variant="gradient"
                disabled={updating}
                className="flex items-center gap-2"
              >
                {updating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Edit className="h-4 w-4" />
                )}
                {updating ? t('pages.seller_apis.updating_button') : t('pages.seller_apis.save_changes_button')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && selectedApi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('pages.seller_apis.delete_api_title')}</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={deleting}
              >
                ✕
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('pages.seller_apis.confirm_delete_message', { name: selectedApi.name })}
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      {t('pages.seller_apis.warning_title')}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {t('pages.seller_apis.delete_warning_message')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting}
              >
                {deleting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('pages.seller_apis.deleting_button')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    {t('pages.seller_apis.confirm_delete_button')}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 定价设置模态框 */}
      {showPricingModal && selectedApi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('pages.seller_apis.pricing_settings_title')}</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPricingModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={updatingPricing}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('pages.seller_apis.service_name_label')}
                </label>
                <p className="text-gray-900 dark:text-white font-medium">{selectedApi.name}</p>
              </div>
              
              {/* 当前定价信息显示 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
                <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                  {t('pages.seller_apis.current_pricing_label')}
                </label>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p>{t('pages.seller_apis.pricing_model_label')}: {selectedApi.pricing_model === 'per_token' ? t('pages.seller_apis.per_token_pricing') : t('pages.seller_apis.per_call_pricing')}</p>
                  {selectedApi.pricing_model === 'per_token' ? (
                    <p>{t('pages.seller_apis.price_per_10k_tokens_label')}: ${((selectedApi.price_per_token || 0) * 10000).toFixed(2)}</p>
              ) : (
                <p>{t('pages.seller_apis.price_per_call_label')}: ${(selectedApi.price_per_call || 0).toFixed(2)}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('pages.seller_apis.pricing_model_label')}
                </label>
                <select 
                  value={pricingData.pricing_model}
                  onChange={(e) => setPricingData({...pricingData, pricing_model: e.target.value as 'per_call' | 'per_token'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={updatingPricing}
                >
                  <option value="per_call">{t('pages.seller_apis.per_call_pricing')}</option>
                  <option value="per_token">{t('pages.seller_apis.per_token_pricing')}</option>
                </select>
              </div>
              
              {pricingData.pricing_model === 'per_call' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('pages.seller_apis.price_per_call_input_label')}
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricingData.price_per_call}
                    onChange={(e) => setPricingData({...pricingData, price_per_call: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                    disabled={updatingPricing}
                  />
                </div>
              )}
              
              {pricingData.pricing_model === 'per_token' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('pages.seller_apis.price_per_10k_tokens_input_label')}
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={(pricingData.price_per_token * 10000).toFixed(2)}
                    onChange={(e) => setPricingData({...pricingData, price_per_token: (parseFloat(e.target.value) || 0) / 10000})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.0000"
                    disabled={updatingPricing}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowPricingModal(false)}
                disabled={updatingPricing}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleUpdatePricing}
                variant="gradient"
                disabled={updatingPricing}
              >
                {updatingPricing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('pages.seller_apis.updating_pricing_button')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💰</span>
                    {t('pages.seller_apis.save_pricing_button')}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerAPIsPage;