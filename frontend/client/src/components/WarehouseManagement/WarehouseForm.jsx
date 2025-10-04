import React, { useState, useEffect } from 'react';
import { FaWarehouse, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUser, FaBoxes, FaClock, FaSave, FaTimes, FaEdit, FaBuilding } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';

const WarehouseForm = ({ warehouse = null, onSave, onCancel, mode = 'create' }) => {
  const { user, isAdmin, isManager } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'Active',
    description: '',
    manager: '',
    capacity: {
      totalCapacity: '',
      unit: '50kg bags'
    },
    contact: {
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Pakistan'
      }
    }
  });

  useEffect(() => {
    if (warehouse && mode === 'edit') {
      setFormData({
        name: warehouse.name || '',
        location: warehouse.location || '',
        status: warehouse.status || 'Active',
        description: warehouse.description || '',
        manager: warehouse.manager?._id || warehouse.manager || '',
        capacity: {
          totalCapacity: warehouse.capacity?.totalCapacity || '',
          unit: warehouse.capacity?.unit || '50kg bags'
        },
        contact: {
          phone: warehouse.contact?.phone || '',
          email: warehouse.contact?.email || '',
          address: {
            street: warehouse.contact?.address?.street || '',
            city: warehouse.contact?.address?.city || '',
            state: warehouse.contact?.address?.state || '',
            zipCode: warehouse.contact?.address?.zipCode || '',
            country: warehouse.contact?.address?.country || 'Pakistan'
          }
        }
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        name: '',
        location: '',
        status: 'Active',
        description: '',
        manager: '',
        capacity: {
          totalCapacity: '',
          unit: '50kg bags'
        },
        contact: {
          phone: '',
          email: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Pakistan'
          }
        }
      });
    }
    // Clear any existing errors when form opens
    setErrors({});
  }, [warehouse, mode]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
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

    console.log('Form submission started with data:', formData);

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, submitting...');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      console.log('Submitting to:', API_ENDPOINTS.WAREHOUSES.CREATE);
      console.log('Raw form data:', JSON.stringify(formData, null, 2));

      // Clean up form data - remove empty fields that cause validation errors
      const cleanedFormData = { ...formData };
      
      // Remove empty manager field (causes ObjectId validation error)
      if (!cleanedFormData.manager || cleanedFormData.manager === '' || cleanedFormData.manager === null) {
        delete cleanedFormData.manager;
      }
      
      // Remove empty description field
      if (!cleanedFormData.description || cleanedFormData.description === '' || cleanedFormData.description === null) {
        delete cleanedFormData.description;
      }
      
      // Clean contact object - remove empty fields
      if (cleanedFormData.contact) {
        if (!cleanedFormData.contact.phone || cleanedFormData.contact.phone === '' || cleanedFormData.contact.phone === null) {
          delete cleanedFormData.contact.phone;
        }
        if (!cleanedFormData.contact.email || cleanedFormData.contact.email === '' || cleanedFormData.contact.email === null) {
          delete cleanedFormData.contact.email;
        }
        
        // Clean address object - remove empty fields
        if (cleanedFormData.contact.address) {
          const address = cleanedFormData.contact.address;
          if (!address.street || address.street === '' || address.street === null) {
            delete address.street;
          }
          if (!address.city || address.city === '' || address.city === null) {
            delete address.city;
          }
          if (!address.state || address.state === '' || address.state === null) {
            delete address.state;
          }
          if (!address.zipCode || address.zipCode === '' || address.zipCode === null) {
            delete address.zipCode;
          }
        }
      }

      // Convert string numbers to actual numbers
      if (cleanedFormData.capacity && cleanedFormData.capacity.totalCapacity) {
        cleanedFormData.capacity.totalCapacity = parseFloat(cleanedFormData.capacity.totalCapacity);
        
        // Ensure it's a valid number
        if (isNaN(cleanedFormData.capacity.totalCapacity)) {
          cleanedFormData.capacity.totalCapacity = 0;
        }
      }

      // Final safety check - remove any remaining empty strings that could cause issues
      Object.keys(cleanedFormData).forEach(key => {
        if (cleanedFormData[key] === '' || cleanedFormData[key] === null || cleanedFormData[key] === undefined) {
          if (key !== 'description' && key !== 'manager') { // Keep these as they're handled above
            delete cleanedFormData[key];
          }
        }
      });

      // Clean nested objects
      if (cleanedFormData.contact) {
        Object.keys(cleanedFormData.contact).forEach(key => {
          if (cleanedFormData.contact[key] === '' || cleanedFormData.contact[key] === null || cleanedFormData.contact[key] === undefined) {
            delete cleanedFormData.contact[key];
          }
        });
        
        if (cleanedFormData.contact.address) {
          Object.keys(cleanedFormData.contact.address).forEach(key => {
            if (cleanedFormData.contact.address[key] === '' || cleanedFormData.contact.address[key] === null || cleanedFormData.contact.address[key] === undefined) {
              delete cleanedFormData.contact.address[key];
            }
          });
        }
      }

      console.log('Cleaned form data:', JSON.stringify(cleanedFormData, null, 2));

      let response;
      if (mode === 'edit' && warehouse) {
        // Update existing warehouse
        response = await api.put(API_ENDPOINTS.WAREHOUSES.UPDATE(warehouse._id), cleanedFormData);
        toast.success('Warehouse updated successfully!');
      } else {
        // Create new warehouse
        response = await api.post(API_ENDPOINTS.WAREHOUSES.CREATE, cleanedFormData);
        console.log('Warehouse creation response:', response.data);
        toast.success('Warehouse created successfully!');
      }

      onSave(response.data.data || response.data);
      
      // Trigger warehouse update event for real-time dashboard
      if (mode === 'create') {
        window.dispatchEvent(new CustomEvent('warehouseAdded', { 
          detail: { warehouse: response.data.data || response.data } 
        }));
      } else {
        window.dispatchEvent(new CustomEvent('warehouseUpdated', { 
          detail: { warehouse: response.data.data || response.data } 
        }));
      }
      
      onCancel();

    } catch (error) {
      console.error('Error saving warehouse:', error);
      console.error('Error response:', error.response?.data);
      console.error('Full error:', error);
      
      let errorMessage = 'Failed to save warehouse';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
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

            <div className="grid grid-cols-1 gap-4">
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
                <p className="mt-1 text-sm text-gray-500">
                  Warehouse number will be generated automatically
                </p>
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

          {/* Manager Assignment */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaUser className="mr-2 text-blue-600" />
              Manager Assignment
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse Manager
              </label>
              <select
                name="manager"
                value={formData.manager}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Manager (Optional)</option>
                {/* This would be populated with actual managers from API */}
                <option value="manager1">Manager 1</option>
                <option value="manager2">Manager 2</option>
              </select>
            </div>
          </div>

          {/* Capacity Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaBoxes className="mr-2 text-blue-600" />
              Capacity Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Capacity
                </label>
                <input
                  type="number"
                  name="capacity.totalCapacity"
                  value={formData.capacity.totalCapacity}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    capacity: { ...prev.capacity, totalCapacity: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter total capacity"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity Unit
                </label>
                <select
                  name="capacity.unit"
                  value={formData.capacity.unit}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    capacity: { ...prev.capacity, unit: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="tons">Tons</option>
                  <option value="quintals">Quintals</option>
                  <option value="50kg bags">50kg Bags</option>
                  <option value="25kg bags">25kg Bags</option>
                  <option value="10kg bags">10kg Bags</option>
                  <option value="5kg bags">5kg Bags</option>
                  <option value="100kg sacks">100kg Sacks</option>
                  <option value="50kg sacks">50kg Sacks</option>
                  <option value="25kg sacks">25kg Sacks</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaPhone className="mr-2 text-blue-600" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
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
