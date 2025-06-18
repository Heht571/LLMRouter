import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  ArrowLeft, 
  Save, 
  Edit, 
  FileText, 
  Eye, 
  EyeOff, 
  Globe,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { apiClient } from '../services/api';
import type { ApiService } from '../types/api';

interface APIDocumentation {
  doc_id: number;
  service_id: number;
  title: string;
  description: string;
  content: string;
  version: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const ApiDocumentationPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();
  
  // 状态管理
  const [documentation, setDocumentation] = useState<APIDocumentation | null>(null);
  const [apiService, setApiService] = useState<ApiService | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);

  
  // 表单状态
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [isPublished, setIsPublished] = useState(false);

  // 加载API服务信息
  const loadApiService = useCallback(async () => {
    if (!serviceId) return;
    
    try {
      const services = await apiClient.getSellerApis();
      const service = services.apis.find((s: ApiService) => s.service_id === parseInt(serviceId));
      if (service) {
        setApiService(service);
      }
    } catch (error) {
      console.error('Failed to load API service:', error);
    }
  }, [serviceId]);

  // 加载文档数据
  const loadDocumentation = useCallback(async () => {
    if (!serviceId) return;
    
    setIsLoading(true);
    try {
      const docResponse = await apiClient.getApiDocumentation(parseInt(serviceId));
      setDocumentation(docResponse);
      setTitle(docResponse.title || '');
      setDescription(docResponse.description || '');
      setContent(docResponse.content || '');
      setVersion(docResponse.version || '1.0.0');
      setIsPublished(docResponse.is_published || false);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setDocumentation(null);
        // 设置默认值
        setTitle('');
        setDescription('');
        setContent(getDefaultContent());
        setVersion('1.0.0');
        setIsPublished(false);
      } else {
        addToast({ type: 'error', title: t('api_documentation.load_failed'), description: t('api_documentation.try_again') });
      }
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, addToast]);

  // 获取默认文档内容
  const getDefaultContent = () => {
    return t('api_documentation.default_content');
  };

  // 保存文档
  const handleSaveDocumentation = async () => {
    if (!serviceId) return;
    
    setSaving(true);
    try {
      const docData = {
        title: title || apiService?.name || t('api_documentation.default_title'),
        description: description || '',
        content: content || getDefaultContent(),
        version: version || '1.0.0',
        is_published: isPublished
      };
      
      if (!documentation) {
        // 创建新文档
        const newDoc = await apiClient.createApiDocumentation(parseInt(serviceId), docData);
        setDocumentation(newDoc);
        addToast({ type: 'success', title: t('api_documentation.create_success') });
      } else {
        // 更新现有文档
        const updatedDoc = await apiClient.updateApiDocumentation(parseInt(serviceId), docData);
        setDocumentation(updatedDoc);
        addToast({ type: 'success', title: t('api_documentation.save_success') });
      }
      
      setIsEditing(false);
    } catch (error) {
      addToast({ 
        type: 'error', 
        title: documentation ? t('api_documentation.save_failed') : t('api_documentation.create_failed'),
        description: t('api_documentation.network_error')
      });
    } finally {
      setSaving(false);
    }
  };

  // 切换发布状态
  const handleTogglePublish = async () => {
    if (!documentation || !serviceId) return;
    
    try {
      const newPublishStatus = !isPublished;
      const updateData = {
        title,
        description,
        content,
        version,
        is_published: newPublishStatus
      };
      
      await apiClient.updateApiDocumentation(parseInt(serviceId), updateData);
      setIsPublished(newPublishStatus);
      addToast({ 
        type: 'success', 
        title: newPublishStatus ? t('api_documentation.published') : t('api_documentation.unpublished') 
      });
    } catch (error) {
      addToast({ type: 'error', title: t('api_documentation.publish_failed') });
    }
  };

  // 开始编辑
  const handleStartEditing = () => {
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEditing = () => {
    if (documentation) {
      // 恢复原始值
      setTitle(documentation.title || '');
      setDescription(documentation.description || '');
      setContent(documentation.content || '');
      setVersion(documentation.version || '1.0.0');
      setIsPublished(documentation.is_published || false);
    }
    setIsEditing(false);
  };



  useEffect(() => {
    loadApiService();
    loadDocumentation();
  }, [loadApiService, loadDocumentation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-lg text-gray-600 dark:text-gray-400">{t('api_documentation.loading')}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/seller/services')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('api_documentation.back_to_services')}
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('api_documentation.title')}
                  </h1>
                  {apiService && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {apiService.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 顶部操作按钮 */}
            <div className="flex items-center gap-3">
              {documentation && (
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                    isPublished
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {isPublished ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {isPublished ? t('api_documentation.published_status') : t('api_documentation.draft_status')}
                  </span>
                  
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTogglePublish}
                      className="flex items-center gap-1 text-black dark:text-white"
                    >
                      {isPublished ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {isPublished ? t('api_documentation.set_private') : t('api_documentation.publish')}
                    </Button>
                  )}
                </div>
              )}
              
              {!isEditing ? (
                <Button onClick={handleStartEditing} className="flex items-center gap-2 text-black dark:text-white">
                  <Edit className="h-4 w-4" />
                  {documentation ? t('api_documentation.edit_docs') : t('api_documentation.create_docs')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancelEditing} className="text-black dark:text-white">
                    {t('api_documentation.cancel')}
                  </Button>
                  <Button 
                    onClick={handleSaveDocumentation} 
                    disabled={isSaving}
                    className="flex items-center gap-2 text-black dark:text-white"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? t('api_documentation.saving') : t('api_documentation.save')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
            {/* 服务信息概览 */}
            {apiService && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {apiService.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            apiService.is_active === true
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {apiService.is_active === true ? t('api_documentation.active') : t('api_documentation.inactive')}
                          </span>
                          <span>ID: {apiService.service_id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <Globe className="h-3 w-3 inline mr-1" />
                      {apiService.platform_proxy_url_prefix}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 文档编辑/查看区域 */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-1">
              {isEditing ? (
                <>
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        {t('api_documentation.edit_docs')}
                      </CardTitle>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t('api_documentation.markdown_support')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">

                    {/* 基本信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('api_documentation.doc_title')} *
                        </label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={t('api_documentation.doc_title_placeholder')}
                          className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('api_documentation.version')}
                        </label>
                        <Input
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          placeholder={t('api_documentation.version_placeholder')}
                          className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('api_documentation.description')}
                      </label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('api_documentation.description_placeholder')}
                        className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('api_documentation.content')}
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={getDefaultContent()}
                        className="w-full h-[calc(100vh-28rem)] p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {t('api_documentation.markdown_syntax_help')}
                      </p>
                    </div>
                  </CardContent>
                </>
              ) : documentation ? (
                <>
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          {documentation.title}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {documentation.version}
                          </span>
                          {documentation.description && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {documentation.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({className, children, ...props}: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          }
                        }}
                      >
                        {documentation.content}
                      </ReactMarkdown>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{t('api_documentation.created')}: {new Date(documentation.created_at).toLocaleString()}</span>
                        <span>{t('api_documentation.updated')}: {new Date(documentation.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="p-12 text-center">
                  <div className="space-y-6">
                    <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {t('api_documentation.no_docs')}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        {t('api_documentation.create_docs_desc')}
                      </p>
                      <Button onClick={handleStartEditing} size="lg" className="flex items-center gap-2 text-black dark:text-white">
                        <Plus className="h-5 w-5" />
                        {t('api_documentation.create_docs')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentationPage;