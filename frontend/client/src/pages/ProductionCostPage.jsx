import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api, { API_ENDPOINTS } from '../services/api';
import ProductionCostChart from '../components/ProductionCost/ProductionCostChart';
import ProductionCostTable from '../components/ProductionCost/ProductionCostTable';
import ProductionCostFilters from '../components/ProductionCost/ProductionCostFilters';
import { toast } from 'react-toastify';

const ProductionCostPage = () => {
  const { user, hasPermission } = useAuth();
  const [costData, setCostData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: 'month',
    startDate: '',
    endDate: '',
    costCategory: '',
    productType: ''
  });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchProductionCosts();
  }, [filters]);

  const fetchProductionCosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.costCategory) params.append('costCategory', filters.costCategory);
      if (filters.productType) params.append('productType', filters.productType);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);

      const response = await api.get(`${API_ENDPOINTS.PRODUCTION_COSTS}?${params}`);
      
      if (response.data.success) {
        setCostData(response.data.data);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching production costs:', error);
      toast.error('Failed to fetch production cost data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.costCategory) params.append('costCategory', filters.costCategory);
      if (filters.productType) params.append('productType', filters.productType);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      params.append('format', format);

      const response = await api.get(`${API_ENDPOINTS.PRODUCTION_COSTS}/export?${params}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `production-costs.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Production cost data exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export production cost data');
    }
  };

  if (!hasPermission(['Admin', 'Manager'])) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access production cost analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Cost Analysis</h1>
          <p className="text-gray-600 mt-1">Analyze production costs and track cost trends</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('pdf')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Export PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <ProductionCostFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-500 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('en-PK', {
                    style: 'currency',
                    currency: 'PKR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(summary.totalCost)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-500 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Daily Cost</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('en-PK', {
                    style: 'currency',
                    currency: 'PKR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(summary.averageDailyCost)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-500 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Highest Cost Day</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {new Intl.NumberFormat('en-PK', {
                    style: 'currency',
                    currency: 'PKR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(summary.highestCostDay)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-500 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cost Trend</p>
                <p className={`text-2xl font-bold ${summary.costTrend === 'increasing' ? 'text-red-600' : summary.costTrend === 'decreasing' ? 'text-green-600' : 'text-gray-600'}`}>
                  {summary.costTrend === 'increasing' ? '↗' : summary.costTrend === 'decreasing' ? '↘' : '→'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <ProductionCostChart
        data={costData}
        loading={loading}
      />

      {/* Table */}
      <ProductionCostTable
        data={costData}
        loading={loading}
      />
    </div>
  );
};

export default ProductionCostPage;

