import React, { useState, useEffect } from 'react';
import { FaBoxes, FaWarehouse, FaTag, FaDollarSign, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';

const InventoryForm = ({ inventory = null, onSave, onCancel, mode = 'create' }) => {
  const { isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [warehouses, setWarehouses] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Raw Materials',
    description: '',
    unit: 'kg',
    currentStock: '',
    minimumStock: '',
    maximumStock: '',
    warehouse: '',
    cost: { purchasePrice: '', currency: 'PKR' }
  });

  useEffect(() => {
    fetchWarehouses();
    if (inventory && mode === 'edit') {
      setFormData({
        name: inventory.name || '',
        code: inventory.code || '',
        category: inventory.category || 'Raw Materials',
        description: inventory.description || '',
        unit: inventory.unit || 'kg',
        currentStock: inventory.currentStock || '',
        minimumStock: inventory.minimumStock || '',
        maximumStock: inventory.maximumStock || '',
        warehouse: inventory.warehouse?._id || inventory.warehouse || '',
        cost: { 
          purchasePrice: inventory.cost?.purchasePrice || '', 
          currency: inventory.cost?.currency || 'PKR' 
        }
      });
    }
  }, [inventory, mode]);

  const fetchWarehouses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.WAREHOUSES.GET_ALL);
      setWarehouses(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch warehouses');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.warehouse) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!isAdmin() && !isManager()) {
      toast.error('You do not have permission to manage inventory');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      let response;
      if (mode === 'create') {
        response = await api.post(API_ENDPOINTS.INVENTORY.CREATE, formData);
        toast.success('Inventory item created successfully!');
      } else {
        response = await api.put(API_ENDPOINTS.INVENTORY.UPDATE(inventory._id), formData);
        toast.success('Inventory item updated successfully!');
      }

      if (onSave) onSave(response.data.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Error saving inventory item';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Raw Materials', 'Finished Goods', 'Packaging', 'Tools', 'Machinery', 'Other'];
  const units = ['kg', 'tons', 'bags', 'pieces', 'liters', 'meters', 'units'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaBoxes className="text-2xl" />
              <h2 className="text-2xl font-bold">
                {mode === 'create' ? 'Create New Inventory Item' : 'Edit Inventory Item'}
              </h2>
            </div>
            <button onClick={onCancel} className="text-white hover:text-gray-200">
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="e.g., INV001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock *</label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock</label>
              <input
                type="number"
                value={formData.minimumStock}
                onChange={(e) => setFormData({...formData, minimumStock: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Stock</label>
              <input
                type="number"
                value={formData.maximumStock}
                onChange={(e) => setFormData({...formData, maximumStock: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price</label>
              <input
                type="number"
                value={formData.cost.purchasePrice}
                onChange={(e) => setFormData({
                  ...formData, 
                  cost: {...formData.cost, purchasePrice: e.target.value}
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse *</label>
              <select
                value={formData.warehouse}
                onChange={(e) => setFormData({...formData, warehouse: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter item description"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <FaSave />
              <span>{loading ? 'Saving...' : (mode === 'create' ? 'Create Item' : 'Update Item')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryForm;
