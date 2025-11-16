import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaTag, FaDollarSign, FaPlus, FaTrash } from 'react-icons/fa';
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
    unit: 'kg', // Always kg
    weightVariants: [{ weight: '', price: '', unit: 'kg', isActive: true }], // Start with one empty variant
    minimumStock: '',
    status: 'Active'
  });

  useEffect(() => {
    if (product && mode === 'edit') {
      // Load weight variants if they exist, otherwise use legacy weight/price
      const weightVariants = product.weightVariants && product.weightVariants.length > 0
        ? product.weightVariants.filter(v => v.isActive !== false).map(v => ({
            weight: v.weight ? v.weight.toString() : '',
            price: v.price ? v.price.toString() : '',
            unit: v.unit || 'kg',
            isActive: v.isActive !== false
          }))
        : (product.weight && product.price ? [{
            weight: product.weight.toString(),
            price: product.price.toString(),
            unit: 'kg',
            isActive: true
          }] : [{ weight: '', price: '', unit: 'kg', isActive: true }]);

      setFormData({
        name: product.name || '',
        code: product.code || '',
        category: product.category || 'Raw Materials',
        subcategory: product.subcategory || '',
        description: product.description || '',
        unit: 'kg', // Always kg
        weightVariants: weightVariants.length > 0 ? weightVariants : [{ weight: '', price: '', unit: 'kg', isActive: true }],
        minimumStock: product.minimumStock || '',
        status: product.status || 'Active'
      });
    }
    // For new products, the initial state already has one empty variant
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

  // Handle weight variant change
  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const newVariants = [...prev.weightVariants];
      newVariants[index] = {
        ...newVariants[index],
        [field]: field === 'weight' || field === 'price' ? (value === '' ? '' : parseFloat(value) || '') : value
      };
      return {
        ...prev,
        weightVariants: newVariants
      };
    });
    
    // Clear errors for this variant
    const errorKey = `variants.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Add a new weight variant
  const addWeightVariant = () => {
    setFormData(prev => ({
      ...prev,
      weightVariants: [...prev.weightVariants, { weight: '', price: '', unit: 'kg', isActive: true }]
    }));
  };

  // Remove a weight variant
  const removeWeightVariant = (index) => {
    if (formData.weightVariants.length > 1) {
      setFormData(prev => ({
        ...prev,
        weightVariants: prev.weightVariants.filter((_, i) => i !== index)
      }));
    } else {
      toast.warning('At least one weight category is required');
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
    
    // Validate weight variants
    if (!formData.weightVariants || formData.weightVariants.length === 0) {
      newErrors.weightVariants = 'At least one weight category is required';
    } else {
      formData.weightVariants.forEach((variant, index) => {
        const weight = variant.weight === '' || variant.weight === null || variant.weight === undefined 
          ? '' 
          : parseFloat(variant.weight);
        const price = variant.price === '' || variant.price === null || variant.price === undefined 
          ? '' 
          : parseFloat(variant.price);
        
        if (variant.weight === '' || variant.weight === null || variant.weight === undefined) {
          newErrors[`variants.${index}.weight`] = 'Weight is required';
        } else if (isNaN(weight) || weight <= 0) {
          newErrors[`variants.${index}.weight`] = 'Weight must be a valid positive number (greater than 0)';
        }
        
        if (variant.price === '' || variant.price === null || variant.price === undefined) {
          newErrors[`variants.${index}.price`] = 'Price is required';
        } else if (isNaN(price) || price < 0) {
          newErrors[`variants.${index}.price`] = 'Price must be a valid positive number';
        }
      });
      
      // Check for duplicate weights (only check valid weights)
      const validVariants = formData.weightVariants.filter(v => {
        const w = v.weight === '' || v.weight === null || v.weight === undefined 
          ? '' 
          : parseFloat(v.weight);
        return !isNaN(w) && w > 0;
      });
      const weights = validVariants.map(v => parseFloat(v.weight));
      const duplicateWeights = weights.filter((w, i) => weights.indexOf(w) !== i);
      if (duplicateWeights.length > 0) {
        newErrors.weightVariants = 'Duplicate weight categories are not allowed';
      }
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
      // Prepare weight variants (filter out empty ones and ensure proper format)
      const weightVariants = formData.weightVariants
        .filter(v => {
          const weight = v.weight === '' || v.weight === null || v.weight === undefined 
            ? '' 
            : parseFloat(v.weight);
          const price = v.price === '' || v.price === null || v.price === undefined 
            ? '' 
            : parseFloat(v.price);
          return !isNaN(weight) && weight > 0 && !isNaN(price) && price >= 0;
        })
        .map(v => ({
          weight: parseFloat(v.weight),
          price: parseFloat(v.price),
          unit: v.unit || 'kg',
          isActive: v.isActive !== false
        }));

      // Set legacy weight and price to first variant for backward compatibility
      const firstVariant = weightVariants.length > 0 ? weightVariants[0] : null;

      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined, // Auto-generated if empty
        category: formData.category,
        subcategory: formData.subcategory.trim(),
        description: formData.description.trim() || undefined,
        unit: 'kg', // Always kg
        weightVariants: weightVariants,
        weight: firstVariant ? firstVariant.weight : 0, // Legacy field
        price: firstVariant ? firstVariant.price : 0, // Legacy field
        purchasePrice: 0, // Not used in product catalog
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
            placeholder="e.g., ATA, MAIDA, SUJI, FINE"
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

        {/* Weight Variants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Weight Categories <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addWeightVariant}
              className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-1" />
              Add Weight Category
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Add multiple weight categories with different prices (e.g., 20kg, 25kg, 50kg)
          </p>
          
          {errors.weightVariants && (
            <p className="mb-2 text-sm text-red-500">{errors.weightVariants}</p>
          )}
          
          <div className="space-y-3">
            {formData.weightVariants.map((variant, index) => (
              <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Weight Category {index + 1}
                  </h4>
                  {formData.weightVariants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWeightVariant(index)}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove this weight category"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={variant.weight || ''}
                      onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        errors[`variants.${index}.weight`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 20"
                      required
                    />
                    {errors[`variants.${index}.weight`] && (
                      <p className="mt-1 text-xs text-red-500">{errors[`variants.${index}.weight`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value="kg"
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      <FaDollarSign className="inline mr-1" />
                      Price (PKR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={variant.price || ''}
                      onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        errors[`variants.${index}.price`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 1000"
                      required
                    />
                    {errors[`variants.${index}.price`] && (
                      <p className="mt-1 text-xs text-red-500">{errors[`variants.${index}.price`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

