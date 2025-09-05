import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api, { API_ENDPOINTS } from '../services/api';
import CustomerForm from '../components/CustomerManagement/CustomerForm';
import CustomerList from '../components/CustomerManagement/CustomerList';
import CustomerStats from '../components/CustomerManagement/CustomerStats';
import { toast } from 'react-toastify';

const CustomerManagementPage = () => {
  const { user, hasPermission } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    creditStatus: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await api.get(`${API_ENDPOINTS.CUSTOMERS}?${params}`);
      
      if (response.data.success) {
        setCustomers(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.CUSTOMERS}/stats/overview`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
    }
  };

  const handleCreateCustomer = async (customerData) => {
    try {
      const response = await api.post(API_ENDPOINTS.CUSTOMERS, customerData);
      
      if (response.data.success) {
        toast.success('Customer created successfully');
        setShowForm(false);
        fetchCustomers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error(error.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleUpdateCustomer = async (customerData) => {
    try {
      const response = await api.put(`${API_ENDPOINTS.CUSTOMERS}/${editingCustomer._id}`, customerData);
      
      if (response.data.success) {
        toast.success('Customer updated successfully');
        setShowForm(false);
        setEditingCustomer(null);
        fetchCustomers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error(error.response?.data?.message || 'Failed to update customer');
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to deactivate this customer?')) {
      try {
        const response = await api.delete(`${API_ENDPOINTS.CUSTOMERS}/${customerId}`);
        
        if (response.data.success) {
          toast.success('Customer deactivated successfully');
          fetchCustomers();
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to deactivate customer');
      }
    }
  };

  const handleUpdateStatus = async (customerId, status) => {
    try {
      const response = await api.patch(`${API_ENDPOINTS.CUSTOMERS}/${customerId}/status`, { status });
      
      if (response.data.success) {
        toast.success('Customer status updated successfully');
        fetchCustomers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast.error('Failed to update customer status');
    }
  };

  const handleUpdateCreditLimit = async (customerId, creditData) => {
    try {
      const response = await api.patch(`${API_ENDPOINTS.CUSTOMERS}/${customerId}/credit-limit`, creditData);
      
      if (response.data.success) {
        toast.success('Credit limit updated successfully');
        fetchCustomers();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating credit limit:', error);
      toast.error('Failed to update credit limit');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (!hasPermission(['Admin', 'Manager', 'Cashier'])) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access customer management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage customers, credit limits, and outstanding balances</p>
        </div>
        {hasPermission(['Admin', 'Manager']) && (
          <button
            onClick={() => {
              setEditingCustomer(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Customer
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && <CustomerStats stats={stats} />}

      {/* Customer List */}
      <CustomerList
        customers={customers}
        loading={loading}
        filters={filters}
        pagination={pagination}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        onUpdateStatus={handleUpdateStatus}
        onUpdateCreditLimit={handleUpdateCreditLimit}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        hasPermission={hasPermission}
      />

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerManagementPage;

