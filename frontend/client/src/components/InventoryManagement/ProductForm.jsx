import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaTag, FaDollarSign } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';

const ProductForm = ({ product = null, onSave, onCancel, mode = 'create' }) => {
  const { isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    code: '', // Will be auto-generated
    category: 'Raw Materials',
    subcategory: '',
    description: '',
    unit: 'kg',
    price: '',
    purchasePrice: '',
    minimumStock: '',
    status: 'Active'
  });

  useEffect(() => {
    if (product && mode === 'edit') {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        category: product.category || 'Raw Materials',
        subcategory: product.subcategory || '',
        description: product.description || '',
        unit: product.unit || 'kg',
        price: product.price || '',
        purchasePrice: product.purchasePrice || '',
        minimumStock: product.minimumStock || '',
        status: product.status || 'Active'
      });
    }
  }, [product, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.subcategory.trim()) {
      newErrors.subcategory = 'Subcategory is required';
    }
    
    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }
    
    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a valid number';
    }
    
    if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice))) {
      newErrors.purchasePrice = 'Purchase price must be a valid number';
    }
    
    if (formData.minimumStock && isNaN(parseFloat(formData.minimumStock))) {
      newErrors.minimumStock = 'Minimum stock must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined, // Auto-generated if empty
        category: formData.category,
        subcategory: formData.subcategory.trim(),
        description: formData.description.trim() || undefined,
        unit: formData.unit,
        price: formData.price ? parseFloat(formData.price) : 0,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : 0,
        minimumStock: formData.minimumStock ? parseFloat(formData.minimumStock) : 0,
        status: formData.status
      };

      let response;
      if (mode === 'edit' && product) {
        response = await api.put(API_ENDPOINTS.PRODUCT.UPDATE(product._id), submitData);
      } else {
        response = await api.post(API_ENDPOINTS.PRODUCT.CREATE, submitData);
      }

      if (response.data.success) {
        toast.success(`Product ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
        if (onSave) onSave(response.data.data);
        
        // Trigger refresh events
        window.dispatchEvent(new CustomEvent('productUpdated'));
        window.dispatchEvent(new CustomEvent('inventoryUpdated'));
        
        onCancel();
      } else {
        toast.error(response.data.message || `Error ${mode === 'edit' ? 'updating' : 'creating'} product`);
      }
    } catch (error) {
      const message = error.response?.data?.message || `Error ${mode === 'edit' ? 'updating' : 'creating'} product`;
      toast.error(message);
      console.error('Product form error:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Raw Materials', 'Finished Goods', 'Packaging Materials'];
  const units = [
    'tons', 'kg', 'quintals',
    '50kg bags', '25kg bags', '20kg bags', '15kg bags', '10kg bags', '5kg bags',
    '100kg sacks', '50kg sacks', '25kg sacks',
    'bags', 'pieces', 'rolls', 'sheets', 'boxes', 'packets', 'bundles',
    'units', 'sets', 'kits', 'pairs', 'meters', 'liters'
  ];

  const getSubcategories = () => {
    switch (formData.category) {
      case 'Raw Materials':
        return ['Wheat', 'Choker', 'Corn', 'Rice', 'Barley'];
      case 'Finished Goods':
        return ['Bags', 'Flour', 'Maida', 'Suji'];
      case 'Packaging Materials':
        return ['Bags', 'Sacks', 'Labels', 'Tape'];
      default:
        return [];
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaTag className="mr-2 text-blue-600" />
          {mode === 'edit' ? 'Edit Product' : 'Create New Product'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 50kg ATA Bag"
            required
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>

        {/* Code (optional, auto-generated) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Code (Auto-generated if empty)
          </label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Leave empty for auto-generation"
          />
        </div>

        {/* Category and Subcategory */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subcategory"
              value={formData.subcategory}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.subcategory ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Bags, Wheat"
              required
            />
            {errors.subcategory && <p className="mt-1 text-sm text-red-500">{errors.subcategory}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Product description (optional)"
          />
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit <span className="text-red-500">*</span>
          </label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.unit ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            {units.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
          {errors.unit && <p className="mt-1 text-sm text-red-500">{errors.unit}</p>}
        </div>

        {/* Price and Purchase Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaDollarSign className="inline mr-1" />
              Selling Price (PKR)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaDollarSign className="inline mr-1" />
              Purchase Price (PKR)
            </label>
            <input
              type="number"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.purchasePrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.purchasePrice && <p className="mt-1 text-sm text-red-500">{errors.purchasePrice}</p>}
          </div>
        </div>

        {/* Minimum Stock and Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Stock Level
            </label>
            <input
              type="number"
              name="minimumStock"
              value={formData.minimumStock}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.minimumStock ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.minimumStock && <p className="mt-1 text-sm text-red-500">{errors.minimumStock}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Discontinued">Discontinued</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <FaTimes className="inline mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <FaSave className="inline mr-2" />
            {loading ? 'Saving...' : mode === 'edit' ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;

