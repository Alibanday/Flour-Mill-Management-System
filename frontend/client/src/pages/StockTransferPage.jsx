import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api, { API_ENDPOINTS } from '../services/api';
import StockTransferForm from '../components/StockTransfer/StockTransferForm';
import StockTransferList from '../components/StockTransfer/StockTransferList';
import StockTransferStats from '../components/StockTransfer/StockTransferStats';
import { toast } from 'react-toastify';

const StockTransferPage = () => {
  const { user, hasPermission } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    fromWarehouse: '',
    toWarehouse: '',
    transferType: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchTransfers();
    fetchWarehouses();
    fetchInventory();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await api.get(`${API_ENDPOINTS.STOCK_TRANSFERS}?${params}`);
      
      if (response.data.success) {
        setTransfers(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Failed to fetch stock transfers');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.WAREHOUSES);
      if (response.data.success) {
        setWarehouses(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.INVENTORY);
      if (response.data.success) {
        setInventory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.STOCK_TRANSFERS}/stats/overview`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching transfer stats:', error);
    }
  };

  const handleCreateTransfer = async (transferData) => {
    try {
      const response = await api.post(API_ENDPOINTS.STOCK_TRANSFERS, transferData);
      
      if (response.data.success) {
        toast.success('Stock transfer created successfully');
        setShowForm(false);
        fetchTransfers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error(error.response?.data?.message || 'Failed to create stock transfer');
    }
  };

  const handleApproveTransfer = async (transferId, approvalData) => {
    try {
      const response = await api.patch(`${API_ENDPOINTS.STOCK_TRANSFERS}/${transferId}/approve`, approvalData);
      
      if (response.data.success) {
        toast.success('Transfer approved successfully');
        fetchTransfers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error approving transfer:', error);
      toast.error('Failed to approve transfer');
    }
  };

  const handleDispatchTransfer = async (transferId, dispatchData) => {
    try {
      const response = await api.patch(`${API_ENDPOINTS.STOCK_TRANSFERS}/${transferId}/dispatch`, dispatchData);
      
      if (response.data.success) {
        toast.success('Transfer dispatched successfully');
        fetchTransfers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error dispatching transfer:', error);
      toast.error('Failed to dispatch transfer');
    }
  };

  const handleReceiveTransfer = async (transferId, receiveData) => {
    try {
      const response = await api.patch(`${API_ENDPOINTS.STOCK_TRANSFERS}/${transferId}/receive`, receiveData);
      
      if (response.data.success) {
        toast.success('Transfer received successfully');
        fetchTransfers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error receiving transfer:', error);
      toast.error('Failed to receive transfer');
    }
  };

  const handleCompleteTransfer = async (transferId) => {
    try {
      const response = await api.patch(`${API_ENDPOINTS.STOCK_TRANSFERS}/${transferId}/complete`);
      
      if (response.data.success) {
        toast.success('Transfer completed successfully');
        fetchTransfers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error completing transfer:', error);
      toast.error('Failed to complete transfer');
    }
  };

  const handleCancelTransfer = async (transferId, reason) => {
    try {
      const response = await api.patch(`${API_ENDPOINTS.STOCK_TRANSFERS}/${transferId}/cancel`, { reason });
      
      if (response.data.success) {
        toast.success('Transfer cancelled successfully');
        fetchTransfers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      toast.error('Failed to cancel transfer');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (!hasPermission(['Admin', 'Manager', 'Employee'])) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access stock transfers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Transfer Management</h1>
          <p className="text-gray-600 mt-1">Manage stock transfers between warehouses</p>
        </div>
        {hasPermission(['Admin', 'Manager', 'Employee']) && (
          <button
            onClick={() => {
              setEditingTransfer(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Transfer
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && <StockTransferStats stats={stats} />}

      {/* Transfer List */}
      <StockTransferList
        transfers={transfers}
        loading={loading}
        filters={filters}
        pagination={pagination}
        warehouses={warehouses}
        onApprove={handleApproveTransfer}
        onDispatch={handleDispatchTransfer}
        onReceive={handleReceiveTransfer}
        onComplete={handleCompleteTransfer}
        onCancel={handleCancelTransfer}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        hasPermission={hasPermission}
      />

      {/* Transfer Form Modal */}
      {showForm && (
        <StockTransferForm
          warehouses={warehouses}
          inventory={inventory}
          onSubmit={handleCreateTransfer}
          onClose={() => {
            setShowForm(false);
            setEditingTransfer(null);
          }}
        />
      )}
    </div>
  );
};

export default StockTransferPage;

