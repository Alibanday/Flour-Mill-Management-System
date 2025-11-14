import React, { useState, useEffect } from 'react';
import { 
  FaTags, FaSearch, FaFilter, FaEdit, FaTrash, FaPlus,
  FaSort, FaSortUp, FaSortDown, FaDollarSign, FaTimes,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';
import ProductForm from './ProductForm';

const ProductCatalog = ({ onClose }) => {
  const { isAdmin, isManager } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    subcategory: 'all'
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
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, [pagination.current, pagination.limit, searchTerm, filters, sortConfig]);

  useEffect(() => {
    const handleInventoryUpdate = () => {
      fetchInventory();
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
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
        ...(filters.subcategory !== 'all' && { subcategory: filters.subcategory })
      });

      const response = await api.get(`${API_ENDPOINTS.PRODUCT.GET_ALL}?${params}`);
      
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
        setInventory([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          pages: 0
        }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    // Categories are now hardcoded based on Product model
    setCategories(['Raw Materials', 'Finished Goods', 'Packaging Materials']);
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
      await api.delete(API_ENDPOINTS.PRODUCT.DELETE(item._id));
      toast.success('Product deleted successfully');
      fetchInventory();
    } catch (error) {
      const message = error.response?.data?.message || 'Error deleting product';
      toast.error(message);
    }
  };


  const handleFormSave = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchInventory();
  };


  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaTags className="text-3xl" />
              <div>
                <h2 className="text-2xl font-bold">Product Catalog</h2>
                <p className="text-blue-100 text-sm">Manage your product catalog, prices, and categories</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {(isAdmin() || isManager()) && (
                <button
                  onClick={handleCreate}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2 font-medium"
                >
                  <FaPlus />
                  <span>Add Product</span>
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:text-blue-200 transition-colors p-2"
                  title="Close"
                >
                  <FaTimes className="text-xl" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-5 border-b bg-white flex-shrink-0">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products by name, code, or description..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Subcategory
                </label>
                <select
                  value={filters.subcategory || 'all'}
                  onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                >
                  <option value="all">All Subcategories</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Choker">Choker</option>
                  <option value="Bags">Bags</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ category: 'all', subcategory: 'all' });
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-300"
                >
                  <FaFilter className="inline mr-1.5" />
                  Clear Filters
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Products Table */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-5">
            <table className="min-w-full bg-white rounded-lg shadow-sm overflow-hidden">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">
                      <span>Product</span>
                      {sortConfig.key === 'name' && (
                        sortConfig.direction === 'asc' ? <FaSortUp className="text-gray-400" /> : <FaSortDown className="text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-2">
                      <span>Category</span>
                      {sortConfig.key === 'category' && (
                        sortConfig.direction === 'asc' ? <FaSortUp className="text-gray-400" /> : <FaSortDown className="text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('subcategory')}>
                    <div className="flex items-center gap-2">
                      <span>Subcategory</span>
                      {sortConfig.key === 'subcategory' && (
                        sortConfig.direction === 'asc' ? <FaSortUp className="text-gray-400" /> : <FaSortDown className="text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => handleSort('price')}>
                    <div className="flex items-center gap-2">
                      <span>Price</span>
                      {sortConfig.key === 'price' && (
                        sortConfig.direction === 'asc' ? <FaSortUp className="text-gray-400" /> : <FaSortDown className="text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map((item) => (
                  <tr key={item._id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-0.5">{item.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{item.code}</div>
                        {item.description && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-1 max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        {item.subcategory || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <FaDollarSign className="text-green-600 text-sm" />
                        <span className="text-sm font-bold text-gray-900">
                          {item.price ? item.price.toLocaleString() : 'N/A'}
                        </span>
                        {item.price && <span className="text-xs text-gray-500">PKR</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Product"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        {isAdmin() && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete Product"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-5 py-4 border-t bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-900">{((pagination.current - 1) * pagination.limit) + 1}</span> to{' '}
                <span className="font-medium text-gray-900">{Math.min(pagination.current * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium text-gray-900">{pagination.total}</span> products
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  let page;
                  if (pagination.pages <= 5) {
                    page = i + 1;
                  } else if (pagination.current <= 3) {
                    page = i + 1;
                  } else if (pagination.current >= pagination.pages - 2) {
                    page = pagination.pages - 4 + i;
                  } else {
                    page = pagination.current - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 border rounded-md text-sm font-medium transition-colors ${
                        page === pagination.current
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && inventory.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-16 bg-gray-50">
            <div className="text-center max-w-md px-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaTags className="text-2xl text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== false)
                  ? 'Try adjusting your search or filter criteria to find products.'
                  : 'Get started by adding your first product to the catalog.'}
              </p>
              {(isAdmin() || isManager()) && (
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <FaPlus className="mr-2 h-4 w-4" />
                  Add Product
                </button>
              )}
            </div>
          </div>
        )}

        {/* Inventory Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <ProductForm
                product={editingItem}
                mode={editingItem ? 'edit' : 'create'}
                onSave={handleFormSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCatalog;

