import React, { useState, useEffect } from 'react';
import { 
  FaWarehouse, FaSearch, FaPlus, FaEdit, FaTrash, FaEye, 
  FaMapMarkerAlt, FaFilter, FaRedo 
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';
import WarehouseForm from './WarehouseForm';

const WarehouseList = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchWarehouses();
  }, [currentPage, statusFilter]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await api.get(`${API_ENDPOINTS.WAREHOUSES.GET_ALL}?${params}`);
      
      if (response.data && response.data.success) {
        setWarehouses(response.data.data || []);
        if (response.data.pagination) {
          setTotalPages(Math.ceil((response.data.pagination.total || 0) / itemsPerPage));
        }
      } else {
        setWarehouses([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to fetch warehouses');
      setWarehouses([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchWarehouses();
  };

  const handleCreate = () => {
    setEditingWarehouse(null);
    setShowForm(true);
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setShowForm(true);
  };

  const handleDelete = async (warehouseId) => {
    if (!isAdmin()) {
      toast.error('Only Admin can delete warehouses');
      return;
    }

    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        await api.delete(API_ENDPOINTS.WAREHOUSES.DELETE(warehouseId));
        toast.success('Warehouse deleted successfully!');
        fetchWarehouses();
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        toast.error('Failed to delete warehouse');
      }
    }
  };

  const handleStatusToggle = async (warehouseId, currentStatus) => {
    if (!isAdmin() && !isManager()) {
      toast.error('You do not have permission to change warehouse status');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await api.patch(`http://localhost:7000/api/warehouses/${warehouseId}/status`, { status: newStatus });
      
      toast.success(`Warehouse status updated to ${newStatus}`);
      fetchWarehouses();
    } catch (error) {
      console.error('Error updating warehouse status:', error);
      toast.error('Failed to update warehouse status');
    }
  };

  const handleSaveWarehouse = (warehouseData) => {
    if (editingWarehouse) {
      // Update existing warehouse in the list
      setWarehouses(prev => 
        prev.map(w => w._id === warehouseData._id ? warehouseData : w)
      );
    } else {
      // Add new warehouse to the list
      setWarehouses(prev => [warehouseData, ...prev]);
    }
    setShowForm(false);
    setEditingWarehouse(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingWarehouse(null);
  };

  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.warehouseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || warehouse.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="text-gray-600">Manage your warehouse locations and information</p>
        </div>
        
        {(isAdmin() || isManager()) && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            Add Warehouse
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search warehouses by name, number, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            
            <button
              type="submit"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Search
            </button>
            
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrentPage(1);
                fetchWarehouses();
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <FaRedo />
            </button>
          </div>
        </form>
      </div>

      {/* Warehouse List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredWarehouses.length === 0 ? (
          <div className="text-center py-12">
            <FaWarehouse className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No warehouses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Get started by creating your first warehouse.'}
            </p>
            {!searchTerm && statusFilter === 'all' && (isAdmin() || isManager()) && (
              <div className="mt-6">
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700"
                >
                  <FaPlus className="mr-2" />
                  Add Warehouse
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWarehouses.map((warehouse) => (
                  <tr key={warehouse._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FaWarehouse className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {warehouse.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            #{warehouse.warehouseNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FaMapMarkerAlt className="mr-2 text-gray-400" />
                        <span className="max-w-xs truncate" title={warehouse.location}>
                          {warehouse.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusToggle(warehouse._id, warehouse.status)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          warehouse.status === 'Active' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } transition-colors duration-200`}
                      >
                        {warehouse.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(warehouse.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {/* View Button */}
                        <button
                          onClick={() => {
                            // TODO: Implement view functionality
                            toast.info('View functionality coming soon');
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          title="View warehouse details"
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
                        
                        {/* Edit Button - Only show if user has permission */}
                        {(isAdmin() || isManager()) && (
                          <button
                            onClick={() => handleEdit(warehouse)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                            title="Edit warehouse"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* Delete Button - Only show if user has permission */}
                        {isAdmin() && (
                          <button
                            onClick={() => handleDelete(warehouse._id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                            title="Delete warehouse"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Form Modal */}
      {showForm && (
        <WarehouseForm
          warehouse={editingWarehouse}
          onSave={handleSaveWarehouse}
          onCancel={handleCancel}
          mode={editingWarehouse ? 'edit' : 'create'}
        />
      )}
    </div>
  );
};

export default WarehouseList;
