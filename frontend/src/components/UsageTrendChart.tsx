import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { apiClient } from '../services/api';
import type { UsageStats, UsageTimeSeries, Period } from '../types/api';

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UsageTrendChartProps {
  userRole: 'seller' | 'buyer';
}

type MetricType = 'calls' | 'tokens';
type TimeRange = 'hourly' | 'daily' | 'weekly' | 'monthly';

const UsageTrendChart: React.FC<UsageTrendChartProps> = ({ userRole }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageStats | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<UsageTimeSeries | null>(null);
  const [metricType, setMetricType] = useState<MetricType>('calls');
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [dataMode, setDataMode] = useState<'timeseries' | 'api'>('timeseries');

  useEffect(() => {
    fetchUsageData();
  }, [timeRange, userRole]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      // 获取聚合使用数据
      const data = userRole === 'seller' 
        ? await apiClient.getSellerUsage(timeRange as Period)
        : await apiClient.getBuyerUsage(timeRange as Period);
      setUsageData(data);
      
      // 获取时间序列数据
      const timeSeries = userRole === 'seller'
        ? await apiClient.getSellerUsageTimeSeries(timeRange as Period)
        : await apiClient.getBuyerUsageTimeSeries(timeRange as Period);
      setTimeSeriesData(timeSeries);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 生成时间序列图表数据
  const generateTimeSeriesData = () => {
    if (!timeSeriesData || !timeSeriesData.data_points || timeSeriesData.data_points.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = timeSeriesData.data_points.map(point => {
      const date = new Date(point.date);
      return timeRange === 'hourly'
        ? date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        : timeRange === 'daily' 
        ? date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
        : timeRange === 'weekly'
        ? `${t('usage_chart.week_prefix')}${Math.ceil(date.getDate() / 7)}${t('usage_chart.week_suffix')}`
        : date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
    });

    const dataPoints = timeSeriesData.data_points.map(point => 
      metricType === 'calls' ? point.calls : point.total_tokens
    );

    const color = metricType === 'calls' ? 'rgb(59, 130, 246)' : 'rgb(16, 185, 129)';
    const backgroundColor = metricType === 'calls' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)';

    return {
      labels,
      datasets: [
        {
          label: metricType === 'calls' ? t('usage_chart.calls_label') : t('usage_chart.tokens_label'),
          data: dataPoints,
          borderColor: color,
          backgroundColor: backgroundColor,
          borderWidth: 2,
          fill: chartType === 'line',
          tension: 0.4,
        },
      ],
    };
  };

  // 生成基于真实API数据的图表数据
  const generateApiUsageData = () => {
    if (!usageData || !usageData.usage_details_by_api || usageData.usage_details_by_api.length === 0) {
      return { labels: [], datasets: [] };
    }

    // 按API分组显示真实使用数据
    const apiDetails = usageData.usage_details_by_api.slice(0, 10); // 显示前10个API
    const labels = apiDetails.map(detail => detail.api_service_name || `API ${detail.api_service_id}`);
    const dataPoints = apiDetails.map(detail => 
      metricType === 'calls' ? detail.calls : detail.total_tokens
    );

    const color = metricType === 'calls' ? 'rgb(59, 130, 246)' : 'rgb(16, 185, 129)';
    const backgroundColor = metricType === 'calls' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)';

    return {
      labels,
      datasets: [
        {
          label: metricType === 'calls' ? t('usage_chart.api_calls_count') : t('usage_chart.token_usage_amount'),
          data: dataPoints,
          borderColor: color,
          backgroundColor: backgroundColor,
          borderWidth: 2,
          fill: chartType === 'line',
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: dataMode === 'timeseries' 
          ? `${metricType === 'calls' ? t('usage_chart.api_calls_trend') : t('usage_chart.token_usage_trend')} (${timeRange === 'hourly' ? t('usage_chart.hourly_label') : timeRange === 'daily' ? t('usage_chart.daily_label') : timeRange === 'weekly' ? t('usage_chart.weekly_label') : t('usage_chart.monthly_label')})`
          : `${metricType === 'calls' ? t('usage_chart.api_calls_stats') : t('usage_chart.token_usage_stats')} (${t('usage_chart.by_api_group')})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (metricType === 'tokens' && typeof value === 'number') {
              return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString();
            }
            return value;
          },
        },
      },
    },
  };

  const chartData = dataMode === 'timeseries' ? generateTimeSeriesData() : generateApiUsageData();

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 控制面板 */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {/* 指标类型选择 */}
          <select
            value={metricType}
            onChange={(e) => setMetricType(e.target.value as MetricType)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="calls">{t('usage_chart.calls')}</option>
            <option value="tokens">{t('usage_chart.tokens')}</option>
          </select>

          {/* 时间范围选择 */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="hourly">{t('usage_chart.hourly')}</option>
            <option value="daily">{t('usage_chart.daily')}</option>
            <option value="weekly">{t('usage_chart.weekly')}</option>
            <option value="monthly">{t('usage_chart.monthly')}</option>
          </select>

          {/* 数据模式选择 */}
          <select
            value={dataMode}
            onChange={(e) => setDataMode(e.target.value as 'timeseries' | 'api')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="timeseries">{t('usage_chart.timeseries')}</option>
            <option value="api">{t('usage_chart.api_group')}</option>
          </select>

          {/* 图表类型选择 */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="line">{t('usage_chart.line_chart')}</option>
            <option value="bar">{t('usage_chart.bar_chart')}</option>
          </select>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={fetchUsageData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          {t('usage_chart.refresh_data')}
        </button>
      </div>

      {/* 图表容器 */}
      <div className="h-64">
        {chartType === 'line' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>

      {/* 数据摘要 */}
      {usageData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">{t('usage_chart.total_calls')}</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {usageData.calls_made.toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">{t('usage_chart.total_tokens')}</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {usageData.total_tokens.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400">{t('usage_chart.total_cost')}</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ${usageData.indicative_cost.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageTrendChart;