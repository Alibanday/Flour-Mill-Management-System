import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api, { API_ENDPOINTS } from '../services/api';
import RepackingForm from '../components/Repacking/RepackingForm';
import RepackingList from '../components/Repacking/RepackingList';
import RepackingStats from '../components/Repacking/RepackingStats';
import { toast } from 'react-toastify';

const RepackingPage = () => {
  const { user, hasPermission } = useAuth();
  const [repackings, setRepackings] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRepacking, setEditingRepacking] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    productType: '',
    dateRange: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchRepackings();
    fetchInventory();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchRepackings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });

      const response = await api.get(`${API_ENDPOINTS.REPACKING}?${params}`);
      
      if (response.data.success) {
        setRepackings(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching repackings:', error);
      toast.error('Failed to fetch repacking records');
    } finally {
      setLoading(false);
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
      const response = await api.get(`${API_ENDPOINTS.REPACKING}/stats/overview`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching repacking stats:', error);
    }
  };

  const handleCreateRepacking = async (repackingData) => {
    try {
      const response = await api.post(API_ENDPOINTS.REPACKING, repackingData);
      
      if (response.data.success) {
        toast.success('Repacking record created successfully');
        setShowForm(false);
        fetchRepackings();
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating repacking:', error);
      toast.error(error.response?.data?.message || 'Failed to create repacking record');
    }
  };

  const handleUpdateRepacking = async (repackingData) => {
    try {
      const response = await api.put(`${API_ENDPOINTS.REPACKING}/${editingRepacking._id}`, repackingData);
      
      if (response.data.success) {
        toast.success('Repacking record updated successfully');
        setShowForm(false);
        setEditingRepacking(null);
        fetchRepackings();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating repacking:', error);
      toast.error(error.response?.data?.message || 'Failed to update repacking record');
    }
  };

  const handleEditRepacking = (repacking) => {
    setEditingRepacking(repacking);
    setShowForm(true);
  };

  const handleDeleteRepacking = async (repackingId) => {
    if (window.confirm('Are you sure you want to delete this repacking record?')) {
      try {
        const response = await api.delete(`${API_ENDPOINTS.REPACKING}/${repackingId}`);
        
        if (response.data.success) {
          toast.success('Repacking record deleted successfully');
          fetchRepackings();
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting repacking:', error);
        toast.error('Failed to delete repacking record');
      }
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
          <p className="text-gray-600">You don't have permission to access repacking management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Repacking Management</h1>
          <p className="text-gray-600 mt-1">Manage product repacking operations and track wastage</p>
        </div>
        {hasPermission(['Admin', 'Manager', 'Employee']) && (
          <button
            onClick={() => {
              setEditingRepacking(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Repacking
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && <RepackingStats stats={stats} />}

      {/* Repacking List */}
      <RepackingList
        repackings={repackings}
        loading={loading}
        filters={filters}
        pagination={pagination}
        onEdit={handleEditRepacking}
        onDelete={handleDeleteRepacking}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        hasPermission={hasPermission}
      />

      {/* Repacking Form Modal */}
      {showForm && (
        <RepackingForm
          repacking={editingRepacking}
          inventory={inventory}
          onSubmit={editingRepacking ? handleUpdateRepacking : handleCreateRepacking}
          onClose={() => {
            setShowForm(false);
            setEditingRepacking(null);
          }}
        />
      )}
    </div>
  );
};

export default RepackingPage;

