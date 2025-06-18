import { useCallback } from 'react';
import { handleAuthError } from '../utils';
import { useToast } from '../components/ui/Toast';

interface ErrorResponse {
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

export const useErrorHandler = () => {
  const { addToast } = useToast();
  
  const handleError = useCallback((error: unknown, showToast: boolean = true) => {
    const errorResponse = error as ErrorResponse;
    
    // Handle 401 Unauthorized errors
    if (errorResponse.response?.status === 401) {
      console.warn('Authentication failed - redirecting to login');
      
      if (showToast) {
        addToast({
          type: 'warning',
          title: '会话已过期',
          description: '请重新登录以继续使用',
          duration: 3000
        });
      }
      
      // Small delay to show the toast before redirect
      setTimeout(() => {
        handleAuthError();
      }, 500);
      
      return;
    }
    
    // Handle other HTTP errors
    if (errorResponse.response?.status) {
      const status = errorResponse.response.status;
      const message = errorResponse.response.data?.error || 
                     errorResponse.response.data?.message || 
                     `HTTP Error ${status}`;
      
      console.error(`API Error ${status}:`, message);
      
      if (showToast) {
        addToast({
          type: 'error',
          title: '请求失败',
          description: message,
          duration: 5000
        });
      }
      
      return message;
    }
    
    // Handle network errors
    if (errorResponse.message) {
      console.error('Network Error:', errorResponse.message);
      
      if (showToast) {
        addToast({
          type: 'error',
          title: '网络错误',
          description: '请检查网络连接后重试',
          duration: 5000
        });
      }
      
      return errorResponse.message;
    }
    
    // Handle unknown errors
    console.error('Unknown Error:', error);
    const unknownErrorMessage = 'An unexpected error occurred';
    
    if (showToast) {
      addToast({
        type: 'error',
        title: '未知错误',
        description: '发生了意外错误，请稍后重试',
        duration: 5000
      });
    }
    
    return unknownErrorMessage;
  }, [addToast]);
  
  return { handleError };
};