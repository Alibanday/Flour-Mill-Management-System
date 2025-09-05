import React, { useState, useEffect } from 'react';
import { 
  FaBoxes, FaSearch, FaFilter, FaEdit, FaTrash, FaEye, 
  FaPlus, FaSort, FaSortUp, FaSortDown, FaWarehouse,
  FaExclamationTriangle, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';
import InventoryForm from './InventoryForm';

const InventoryList = () => {
  const { isAdmin, isManager, isEmployee } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    warehouse: 'all',
    lowStock: false,
    outOfStock: false
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchInventory();
    fetchWarehouses();
    fetchCategories();
  }, [pagination.current, pagination.limit, searchTerm, filters, sortConfig]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.warehouse !== 'all' && { warehouse: filters.warehouse }),
        ...(filters.lowStock && { lowStock: 'true' }),
        ...(filters.outOfStock && { outOfStock: 'true' })
      });

      const response = await api.get(`${API_ENDPOINTS.INVENTORY.GET_ALL}?${params}`);
      
      // Debug: Log the response
      console.log('Inventory API Response:', response.data);
      
      // Validate response structure
      if (response.data && response.data.success) {
        setInventory(response.data.data || []);
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total || 0,
            pages: response.data.pagination.pages || 0
          }));
        }
      } else {
        console.error('Invalid response structure:', response.data);
        setInventory([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          pages: 0
        }));
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to fetch inventory items');
      setInventory([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        pages: 0
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.WAREHOUSES.GET_ALL);
      setWarehouses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('http://localhost:7000/api/inventory/category/all');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!isAdmin()) {
      toast.error('Only Admin can delete inventory items');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await api.delete(API_ENDPOINTS.INVENTORY.DELETE(item._id));
      
      toast.success('Inventory item deleted successfully');
      fetchInventory();
    } catch (error) {
      const message = error.response?.data?.message || 'Error deleting inventory item';
      toast.error(message);
    }
  };

  const handleStatusUpdate = async (item, newStatus) => {
    if (!isAdmin() && !isManager()) {
      toast.error('You do not have permission to update status');
      return;
    }

    try {
      await api.patch(`http://localhost:7000/api/inventory/${item._id}/status`, { status: newStatus });
      
      toast.success('Status updated successfully');
      fetchInventory();
    } catch (error) {
      const message = error.response?.data?.message || 'Error updating status';
      toast.error(message);
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchInventory();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      case 'Discontinued': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusColor = (item) => {
    if (item.currentStock === 0) return 'text-red-600';
    if (item.currentStock <= item.minimumStock) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockStatusIcon = (item) => {
    if (item.currentStock === 0) return <FaTimesCircle className="text-red-500" />;
    if (item.currentStock <= item.minimumStock) return <FaExclamationTriangle className="text-yellow-500" />;
    return <FaCheckCircle className="text-green-500" />;
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaBoxes className="text-2xl" />
            <h2 className="text-2xl font-bold">Inventory Management</h2>
          </div>
          {(isAdmin() || isManager()) && (
            <button
              onClick={handleCreate}
              className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <FaPlus />
              <span>Add Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, code, or description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Discontinued">Discontinued</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
              <select
                value={filters.warehouse}
                onChange={(e) => handleFilterChange('warehouse', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lowStock"
                checked={filters.lowStock}
                onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="lowStock" className="text-sm font-medium text-gray-700">
                Low Stock
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="outOfStock"
                checked={filters.outOfStock}
                onChange={(e) => handleFilterChange('outOfStock', e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="outOfStock" className="text-sm font-medium text-gray-700">
                Out of Stock
              </label>
            </div>
          </div>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}>
                <div className="flex items-center space-x-1">
                  <span>Item</span>
                  {sortConfig.key === 'name' && (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('category')}>
                <div className="flex items-center space-x-1">
                  <span>Category</span>
                  {sortConfig.key === 'category' && (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('currentStock')}>
                <div className="flex items-center space-x-1">
                  <span>Stock</span>
                  {sortConfig.key === 'currentStock' && (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}>
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {sortConfig.key === 'status' && (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventory.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.code}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">
                        {item.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStockStatusIcon(item)}
                    <span className={`text-sm font-medium ${getStockStatusColor(item)}`}>
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  {item.minimumStock > 0 && (
                    <div className="text-xs text-gray-500">
                      Min: {item.minimumStock} | Max: {item.maximumStock || 'N/A'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <FaWarehouse className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.warehouse?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.warehouse?.code || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    {isAdmin() && (
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    )}
                    {(isAdmin() || isManager()) && (
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusUpdate(item, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-green-500"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                        <option value="Discontinued">Discontinued</option>
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.current - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.current * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    page === pagination.current
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && inventory.length === 0 && (
        <div className="text-center py-12">
          <FaBoxes className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== false)
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating a new inventory item.'}
          </p>
          {(isAdmin() || isManager()) && (
            <div className="mt-6">
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <FaPlus className="-ml-1 mr-2 h-4 w-4" />
                Add Item
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inventory Form Modal */}
      {showForm && (
        <InventoryForm
          inventory={editingItem}
          mode={editingItem ? 'edit' : 'create'}
          onSave={handleFormSave}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

export default InventoryList;
