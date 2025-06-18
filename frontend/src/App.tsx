import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ToastProvider } from './components/ui/Toast';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

import SellerAPIsPage from './pages/SellerAPIsPage';
import BuyerPage from './pages/BuyerPage';
import ApiDetailPage from './pages/ApiDetailPage';

import SimpleAccountSettingsPage from './pages/SimpleAccountSettingsPage';

import ApiDocumentationPage from './pages/ApiDocumentationPage';
import BuyerSubscriptionsPage from './pages/BuyerSubscriptionsPage';
import BuyerUsagePage from './pages/BuyerUsagePage';
import SellerApiUsagePage from './pages/SellerApiUsagePage';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// 公共路由组件（已登录用户不能访问）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// 角色保护路由组件
const RoleProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          {/* 公共路由 */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          
          {/* 受保护的路由 */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          

          
          <Route 
            path="/seller/services" 
            element={
              <RoleProtectedRoute allowedRoles={['seller']}>
                <Layout>
                  <SellerAPIsPage />
                </Layout>
              </RoleProtectedRoute>
            } 
          />
          
          <Route 
            path="/seller/services/:serviceId/documentation" 
            element={
              <RoleProtectedRoute allowedRoles={['seller']}>
                <Layout>
                  <ApiDocumentationPage />
                </Layout>
              </RoleProtectedRoute>
            } 
          />
          
          <Route 
            path="/seller/services/:serviceId/usage" 
            element={
              <RoleProtectedRoute allowedRoles={['seller']}>
                <Layout>
                  <SellerApiUsagePage />
                </Layout>
              </RoleProtectedRoute>
            } 
          />
          
          <Route 
            path="/buyer" 
            element={
              <RoleProtectedRoute allowedRoles={['buyer']}>
                <Layout>
                  <BuyerPage />
                </Layout>
              </RoleProtectedRoute>
            } 
          />
          
          <Route 
            path="/buyer/services" 
            element={
              <RoleProtectedRoute allowedRoles={['buyer']}>
                <Layout>
                  <BuyerPage />
                </Layout>
              </RoleProtectedRoute>
            } 
          />
          
          <Route 
            path="/buyer/services/:serviceId" 
            element={
              <RoleProtectedRoute allowedRoles={['buyer']}>
                <ApiDetailPage />
              </RoleProtectedRoute>
            } 
          />
          

          
          <Route 
            path="/buyer/subscriptions" 
            element={
              <RoleProtectedRoute allowedRoles={['buyer']}>
                <Layout>
                  <BuyerSubscriptionsPage />
                </Layout>
              </RoleProtectedRoute>
            } 
          />
          
          <Route 
            path="/buyer/usage" 
            element={
              <RoleProtectedRoute allowedRoles={['buyer']}>
                <Layout>
                  <BuyerUsagePage />
                </Layout>
              </RoleProtectedRoute>
            } 
          />
          
          <Route 
            path="/seller/analytics" 
            element={
              <RoleProtectedRoute allowedRoles={['seller']}>
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">数据分析</h1>
                    <p className="text-gray-600 dark:text-gray-400">数据分析功能开发中...</p>
                  </div>
                </Layout>
              </RoleProtectedRoute>
            } 
          />
          
          <Route 
            path="/seller/revenue" 
            element={
              <RoleProtectedRoute allowedRoles={['seller']}>
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">收入统计</h1>
                    <p className="text-gray-600 dark:text-gray-400">收入统计功能开发中...</p>
                  </div>
                </Layout>
              </RoleProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Layout>
                  <SimpleAccountSettingsPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/billing" 
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">账单管理</h1>
                    <p className="text-gray-600 dark:text-gray-400">账单管理功能开发中...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/help" 
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">帮助中心</h1>
                    <p className="text-gray-600 dark:text-gray-400">帮助中心功能开发中...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          {/* 默认重定向 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404页面 */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    404
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    页面未找到
                  </p>
                  <a 
                    href="/dashboard" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    返回首页
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
};

export default App;
