import React, { useState, useEffect } from 'react';
import { FaWarehouse, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUser, FaBoxes, FaClock, FaSave, FaTimes, FaEdit, FaBuilding } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import { toast } from 'react-toastify';

const WarehouseForm = ({ warehouse = null, onSave, onCancel, mode = 'create' }) => {
  const { user, isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    warehouseNumber: '',
    name: '',
    location: '',
    status: 'Active',
    description: ''
  });

  useEffect(() => {
    if (warehouse && mode === 'edit') {
      setFormData({
        warehouseNumber: warehouse.warehouseNumber || '',
        name: warehouse.name || '',
        location: warehouse.location || '',
        status: warehouse.status || 'Active',
        description: warehouse.description || ''
      });
    }
  }, [warehouse, mode]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.warehouseNumber.trim()) {
      newErrors.warehouseNumber = 'Warehouse number is required';
    } else if (formData.warehouseNumber.length < 2) {
      newErrors.warehouseNumber = 'Warehouse number must be at least 2 characters';
    } else if (formData.warehouseNumber.length > 20) {
      newErrors.warehouseNumber = 'Warehouse number cannot exceed 20 characters';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Warehouse name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Warehouse name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Warehouse name cannot exceed 100 characters';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.length < 5) {
      newErrors.location = 'Location must be at least 5 characters';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      let response;
      if (mode === 'edit' && warehouse) {
        // Update existing warehouse
        response = await axios.put(`http://localhost:7000/api/warehouses/${warehouse._id}`, formData, config);
        toast.success('Warehouse updated successfully!');
      } else {
        // Create new warehouse
        response = await axios.post('http://localhost:7000/api/warehouses/create', formData, config);
        toast.success('Warehouse created successfully!');
      }

      onSave(response.data.data || response.data);
      onCancel();

    } catch (error) {
      console.error('Error saving warehouse:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save warehouse';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Check if user has permission to create/edit warehouses
  if (!isAdmin() && !isManager()) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to manage warehouses.</p>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-center bg-blue-600 text-white rounded-t-xl">
          <h2 className="text-xl font-semibold flex items-center">
            <FaWarehouse className="mr-2" />
            {mode === 'edit' ? 'Edit Warehouse' : 'Create New Warehouse'}
          </h2>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-200 text-2xl bg-transparent p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaWarehouse className="mr-2 text-blue-600" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Number *
                </label>
                <input
                  type="text"
                  name="warehouseNumber"
                  value={formData.warehouseNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.warehouseNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter warehouse number"
                  maxLength="20"
                />
                {errors.warehouseNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.warehouseNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter warehouse name"
                  maxLength="100"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-blue-600" />
              Location Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <textarea
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter full location details (address, city, state, etc.)"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>
          </div>

          {/* Status and Description */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaBuilding className="mr-2 text-blue-600" />
              Status & Description
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.status ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter warehouse description (optional)"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {mode === 'edit' ? 'Update Warehouse' : 'Create Warehouse'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseForm;
