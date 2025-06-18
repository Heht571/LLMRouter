import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { handleAuthError } from '../utils';
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiService,
  BrowseApiService,
  ApiServiceDetail,
  CreateApiService,
  Subscription,
  UsageStats,
  UsageTimeSeries,
  Period,
} from '../types/api';
import type {
  UserAccountResponse,
  UpdateUserProfileRequest,
  UpdateUserSettingsRequest,
  UpdateUserSecurityRequest,
  ChangePasswordRequest,
  AccountSettingsUpdateRequest,
} from '../types/account';

class ApiClient {
  private client: AxiosInstance;
  private healthClient: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'http://localhost:8080/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 为健康检查创建单独的客户端，因为健康检查端点不在 /api/v1 路径下
    this.healthClient = axios.create({
      baseURL: 'http://localhost:8080',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle authentication error - clear data and redirect to login
          handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post(
      '/auth/login',
      credentials
    );
    return response.data;
  }

  async register(userData: RegisterData): Promise<User> {
    const response: AxiosResponse<User> = await this.client.post(
      '/auth/register',
      userData
    );
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.healthClient.get('/health');
    return response.data;
  }

  // Seller endpoints
  async getSellerApis(): Promise<{apis: ApiService[], message?: string}> {
    const response: AxiosResponse<{apis: ApiService[], message?: string}> = await this.client.get(
      '/seller/services'
    );
    return response.data;
  }

  async createApiService(apiData: CreateApiService): Promise<ApiService> {
    const response: AxiosResponse<ApiService> = await this.client.post(
      '/seller/services',
      apiData
    );
    return response.data;
  }

  async updateApiService(serviceId: number, apiData: Partial<CreateApiService>): Promise<ApiService> {
    const response: AxiosResponse<ApiService> = await this.client.put(
      `/seller/services/${serviceId}`,
      apiData
    );
    return response.data;
  }

  async updateApiPricing(serviceId: number, pricingData: {
    pricing_model: 'per_call' | 'per_token';
    price_per_call: number;
    price_per_token: number;
  }): Promise<void> {
    await this.client.put(`/seller/services/${serviceId}/pricing`, pricingData);
  }

  async deleteApiService(serviceId: number): Promise<void> {
    await this.client.delete(`/seller/services/${serviceId}`);
  }

  // Buyer endpoints
  async getBrowseApis(): Promise<BrowseApiService[]> {
    const response: AxiosResponse<{apis: BrowseApiService[]}> = await this.client.get(
      '/buyer/services'
    );
    return response.data.apis;
  }

  async getBuyerSubscriptions(): Promise<ApiService[]> {
    // This would be a different endpoint for subscribed services
    // For now, using the same endpoint but this should be changed
    const response: AxiosResponse<{apis: ApiService[]}> = await this.client.get(
      '/buyer/subscriptions'
    );
    return response.data.apis;
  }

  async getApiDetail(serviceId: number): Promise<ApiServiceDetail> {
    const response: AxiosResponse<ApiServiceDetail> = await this.client.get(
      `/buyer/services/${serviceId}`
    );
    return response.data;
  }

  async subscribeToApi(serviceId: number): Promise<Subscription> {
    const response: AxiosResponse<Subscription> = await this.client.post(
      `/buyer/services/${serviceId}/subscribe`
    );
    return response.data;
  }

  async unsubscribeFromAPI(serviceId: number): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.delete(
      `/buyer/subscriptions/${serviceId}`
    );
    return response.data;
  }

  async getBuyerUsage(period: Period = 'monthly'): Promise<UsageStats> {
    const response: AxiosResponse<UsageStats> = await this.client.get(
      '/buyer/usage',
      {
        params: { period },
      }
    );
    return response.data;
  }

  async getSellerUsage(period: Period = 'daily'): Promise<UsageStats> {
    const response: AxiosResponse<UsageStats> = await this.client.get(
      '/seller/usage',
      {
        params: { period },
      }
    );
    return response.data;
  }

  async getBuyerUsageTimeSeries(period: Period = 'daily'): Promise<UsageTimeSeries> {
    const response: AxiosResponse<UsageTimeSeries> = await this.client.get(
      '/buyer/usage/timeseries',
      {
        params: { period },
      }
    );
    return response.data;
  }

  async getSellerUsageTimeSeries(period: Period = 'daily'): Promise<UsageTimeSeries> {
    const response: AxiosResponse<UsageTimeSeries> = await this.client.get(
      '/seller/usage/timeseries',
      {
        params: { period },
      }
    );
    return response.data;
  }

  // Documentation endpoints
  async getApiDocumentation(serviceId: number): Promise<any> {
    const response = await this.client.get(
      `/seller/services/${serviceId}/documentation`
    );
    return response.data;
  }

  async createApiDocumentation(serviceId: number, docData: any): Promise<any> {
    const response = await this.client.post(
      `/seller/services/${serviceId}/documentation`,
      docData
    );
    return response.data;
  }

  async updateApiDocumentation(serviceId: number, docData: any): Promise<any> {
    const response = await this.client.put(
      `/seller/services/${serviceId}/documentation`,
      docData
    );
    return response.data;
  }

  async deleteApiDocumentation(serviceId: number): Promise<void> {
    await this.client.delete(`/seller/services/${serviceId}/documentation`);
  }

  // Buyer methods for API documentation
  async getBuyerApiDocumentation(serviceId: number): Promise<any> {
    const response = await this.client.get(
      `/buyer/services/${serviceId}/documentation`
    );
    return response.data;
  }



  // Account management endpoints
  async getUserAccount(): Promise<UserAccountResponse> {
    const response: AxiosResponse<UserAccountResponse> = await this.client.get('/auth/account');
    return response.data;
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.post(
      '/auth/change-password',
      passwordData
    );
    return response.data;
  }

  async updateUserProfile(profileData: UpdateUserProfileRequest): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.put(
      '/auth/profile',
      profileData
    );
    return response.data;
  }

  async updateUserSettings(settingsData: UpdateUserSettingsRequest): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.put(
      '/auth/settings',
      settingsData
    );
    return response.data;
  }

  async updateUserSecurity(securityData: UpdateUserSecurityRequest): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.put(
      '/auth/security',
      securityData
    );
    return response.data;
  }

  // Seller account settings
  async getSellerAccountSettings(): Promise<UserAccountResponse> {
    const response: AxiosResponse<UserAccountResponse> = await this.client.get('/seller/account-settings');
    return response.data;
  }

  async updateSellerAccountSettings(settingsData: AccountSettingsUpdateRequest): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.put(
      '/seller/account-settings',
      settingsData
    );
    return response.data;
  }

  // Buyer account settings
  async getBuyerAccountSettings(): Promise<UserAccountResponse> {
    const response: AxiosResponse<UserAccountResponse> = await this.client.get('/buyer/account-settings');
    return response.data;
  }

  async updateBuyerAccountSettings(settingsData: AccountSettingsUpdateRequest): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.put(
      '/buyer/account-settings',
      settingsData
    );
    return response.data;
  }

  // Proxy requests
  async proxyRequest(
    platformApiKey: string,
    proxiedPath: string,
    data?: Record<string, unknown>
  ): Promise<unknown> {
    const response = await this.client.post(`/proxy/${proxiedPath}`, data, {
      headers: {
        'platform_api_key': platformApiKey,
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;