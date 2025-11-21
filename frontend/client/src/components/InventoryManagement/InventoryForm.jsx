import React, { useState, useEffect } from 'react';
import { FaBoxes, FaWarehouse, FaTag, FaDollarSign, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';

const InventoryForm = ({ inventory = null, onSave, onCancel, mode = 'create' }) => {
  const { isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    code: '', // Will be auto-generated
    category: 'Raw Materials',
    subcategory: 'Wheat',
    weight: '',
    price: ''
  });
  
  const [existingItem, setExistingItem] = useState(null);
  const [showExistingItem, setShowExistingItem] = useState(false);
  const [addStockMode, setAddStockMode] = useState(false);

  useEffect(() => {
    if (inventory && mode === 'edit') {
      setFormData({
        name: inventory.name || '',
        code: inventory.code || '',
        category: inventory.category || 'Raw Materials',
        subcategory: inventory.subcategory || 'Wheat',
        weight: inventory.weight || '',
        price: inventory.price || ''
      });
    }
  }, [inventory, mode]);

  const checkExistingItem = async () => {
    if (!formData.name) {
      toast.warning('Please enter item name first');
      return;
    }

    try {
      const response = await api.get(API_ENDPOINTS.INVENTORY.FIND_EXISTING, {
        params: {
          name: formData.name
        }
      });
      
      if (response.data.success && response.data.exists) {
        setExistingItem(response.data.data);
        setShowExistingItem(true);
        toast.info('Similar item found! You can add quantity to existing item or create new one.');
      } else {
        setExistingItem(null);
        setShowExistingItem(false);
        toast.success('No existing item found. You can create a new one.');
      }
    } catch (error) {
      console.error('Error checking existing item:', error);
      toast.error('Error checking for existing items: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddStockToExisting = async () => {
    if (!existingItem || !formData.weight) {
      toast.error('Please enter weight to add');
      return;
    }

    setLoading(true);
    try {
      // Update the existing item's weight
      const response = await api.put(API_ENDPOINTS.INVENTORY.UPDATE(existingItem._id), {
        weight: existingItem.weight + parseFloat(formData.weight)
      });

      if (response.data.success) {
        toast.success(`Weight added successfully! New weight: ${response.data.data.weight} kg`);
        if (onSave) onSave(response.data.data);
        
        // Trigger stock list refresh by dispatching a custom event
        window.dispatchEvent(new CustomEvent('stockUpdated'));
        window.dispatchEvent(new CustomEvent('inventoryUpdated'));
        
        onCancel();
      } else {
        toast.error(response.data.message || 'Error adding weight');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error adding weight';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.weight || !formData.price) {
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

      // Clean up form data - convert string numbers to actual numbers
      const cleanedFormData = { ...formData };
      if (cleanedFormData.weight) {
        cleanedFormData.weight = parseFloat(cleanedFormData.weight);
      }
      if (cleanedFormData.price) {
        cleanedFormData.price = parseFloat(cleanedFormData.price);
      }

      console.log('Submitting inventory with cleaned data:', cleanedFormData);


      let response;
      if (mode === 'create') {
        response = await api.post(API_ENDPOINTS.INVENTORY.CREATE, cleanedFormData);
        toast.success('Inventory item created successfully!');
      } else {
        response = await api.put(API_ENDPOINTS.INVENTORY.UPDATE(inventory._id), cleanedFormData);
        toast.success('Inventory item updated successfully!');
      }

      if (onSave) onSave(response.data.data);
      
      // Trigger stock list refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('stockUpdated'));
      window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    } catch (error) {
      const message = error.response?.data?.message || 'Error saving inventory item';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'Raw Materials', label: 'Raw Materials' },
    { value: 'Finished Goods', label: 'Finished Goods' }
  ];

  const subcategories = {
    'Raw Materials': ['Wheat', 'Choker'],
    'Finished Goods': ['Bags']
  };

  const handleCategoryChange = (category) => {
    const availableSubcategories = subcategories[category] || [];
    const newSubcategory = availableSubcategories[0] || '';
    
    setFormData({
      ...formData,
      category,
      subcategory: newSubcategory
    });
  };

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
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Code</label>
              <input
                type="text"
                value={formData.code || 'Auto-generated'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                placeholder="Will be auto-generated"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Item code will be automatically generated by the system</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory *</label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                {subcategories[formData.category]?.map(subcategory => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg) *
              </label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the weight of the item in kilograms
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (Rs. per item) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the price for the complete item
              </p>
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={checkExistingItem}
                disabled={!formData.name}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Check Existing Item
              </button>
            </div>
          </div>

          {/* Existing Item Found */}
          {showExistingItem && existingItem && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-3">⚠️ Similar Item Found</h3>
              <div className="bg-white rounded-lg p-4 border border-yellow-300">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Name</label>
                    <p className="text-gray-900">{existingItem.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Code</label>
                    <p className="text-gray-900">{existingItem.code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Weight</label>
                    <p className="text-gray-900">{existingItem.weight} kg</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="text-gray-900">{existingItem.category} - {existingItem.subcategory}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAddStockMode(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add Quantity to Existing Item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExistingItem(false);
                      setExistingItem(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Create New Item Anyway
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Quantity to Existing Item */}
          {addStockMode && existingItem && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-800 mb-3">Add Quantity to Existing Item</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight to Add (kg) *</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter weight to add"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Weight</label>
                  <p className="text-gray-900 py-3">{existingItem.weight} kg</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddStockToExisting}
                  disabled={loading || !formData.weight}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Adding Weight...' : 'Add Weight'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddStockMode(false);
                    setFormData({...formData, weight: ''});
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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

