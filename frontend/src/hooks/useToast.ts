import { useState, useCallback, useMemo } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

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

  return {
    toasts,
    toast,
    addToast,
    removeToast,
  };
};