import React, { useState, useEffect } from 'react';
import { 
  FaBoxes, FaSearch, FaFilter,
  FaSort, FaSortUp, FaSortDown,
  FaExclamationTriangle, FaCheckCircle, FaTimesCircle,
  FaWarehouse
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';

const InventoryList = () => {
  const { isAdmin, isManager, isEmployee } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    subcategory: 'all',
    status: 'all',
    warehouse: 'all'
  });
  const [warehouses, setWarehouses] = useState([]);
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
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchInventory();
    fetchCategories();
    fetchWarehouses();
  }, [pagination.current, pagination.limit, searchTerm, filters, sortConfig]);

  // Listen for custom events to trigger refresh
  useEffect(() => {
    const handleInventoryUpdate = () => {
      console.log("InventoryList: Received inventory update event, refreshing...");
      fetchInventory();
    };

    const handleStockUpdate = () => {
      console.log("InventoryList: Received stock update event, refreshing...");
      fetchInventory();
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    window.addEventListener('stockUpdated', handleStockUpdate);

    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
      window.removeEventListener('stockUpdated', handleStockUpdate);
    };
  }, []);

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
        ...(filters.subcategory !== 'all' && { subcategory: filters.subcategory }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.warehouse !== 'all' && { warehouse: filters.warehouse })
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


  const fetchCategories = async () => {
    try {
      const response = await api.get('http://localhost:7000/api/inventory/category/all');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('http://localhost:7000/api/warehouses');
      if (response.data && response.data.success) {
        setWarehouses(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
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

  const getCurrentStock = (item) => {
    // Use stock field set by backend, or currentStock, or fallback to weight
    return item.stock !== undefined ? item.stock : 
           (item.currentStock !== undefined ? item.currentStock : (item.weight || 0));
  };

  const getStockStatusColor = (item) => {
    const stock = getCurrentStock(item);
    if (stock === 0) return 'text-red-600';
    if (item.minimumStock && stock <= item.minimumStock) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockStatusIcon = (item) => {
    const stock = getCurrentStock(item);
    if (stock === 0) return <FaTimesCircle className="text-red-500" />;
    if (item.minimumStock && stock <= item.minimumStock) return <FaExclamationTriangle className="text-yellow-500" />;
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
            <FaWarehouse className="text-2xl" />
            <div>
              <h2 className="text-2xl font-bold">Stock Levels</h2>
              <p className="text-green-100 text-sm">View actual inventory quantities and stock status</p>
            </div>
          </div>
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

          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaWarehouse className="inline mr-1" />
                Warehouse
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
              <select
                value={filters.subcategory || 'all'}
                onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Subcategories</option>
                <option value="Wheat Grain">Wheat Grain</option>
                <option value="Corn">Corn</option>
                <option value="Rice">Rice</option>
                <option value="Flour">Flour</option>
                <option value="Maida">Maida</option>
                <option value="Suji">Suji</option>
                <option value="Chokhar">Chokhar</option>
                <option value="Bags">Bags</option>
                <option value="Sacks">Sacks</option>
                <option value="Machine Parts">Machine Parts</option>
                <option value="Lubricants">Lubricants</option>
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
                  onClick={() => handleSort('subcategory')}>
                <div className="flex items-center space-x-1">
                  <span>Subcategory</span>
                  {sortConfig.key === 'subcategory' && (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('currentStock')}>
                <div className="flex items-center space-x-1">
                  <span>Current Stock</span>
                  {sortConfig.key === 'currentStock' && (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span>Min. Stock</span>
              </th>
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
                    <div className="text-sm font-medium text-gray-900">
                      {item.productName || item.product?.name || item.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.productCode || item.product?.code || item.code || 'N/A'}
                    </div>
                    {item.warehouseName && (
                      <div className="text-xs text-blue-600 mt-1">
                        <FaWarehouse className="inline mr-1" />
                        {item.warehouseName || item.warehouse?.name || ''}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.category || item.product?.category || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {item.subcategory || item.product?.subcategory || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStockStatusIcon(item)}
                    <span className={`text-sm font-medium ${getStockStatusColor(item)}`}>
                      {getCurrentStock(item).toLocaleString()} {item.unit || item.product?.unit || 'units'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {item.minimumStock ? `${item.minimumStock.toLocaleString()} kg` : 'Not set'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stock data found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== false)
              ? 'Try adjusting your search or filter criteria.'
              : 'No stock levels found. Stock data is created automatically when you make purchases, sales, or production.'}
          </p>
          <div className="mt-4">
            <p className="text-xs text-gray-400">
              <strong>Note:</strong> This shows actual stock levels per warehouse aggregated from all purchases, sales, production, and stock movements. 
              Use the <strong>"Product Catalog"</strong> button above to manage your product catalog separately.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryList;
