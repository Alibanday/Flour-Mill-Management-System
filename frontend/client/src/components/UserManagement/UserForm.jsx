import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard, FaCamera, FaBuilding } from 'react-icons/fa';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';
import { useValidation, validationSchemas } from '../../utils/validation';
import FormField from '../UI/FormField';

export default function UserForm({ user = null, onCancel, onSave }) {
  const initialData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cnic: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    role: 'Employee',
    assignedWarehouses: [],
    isActive: true,
    profilePicture: null
  };

  const {
    data: formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm: validateFormData,
    setData
  } = useValidation(initialData, {
    ...validationSchemas.user,
    confirmPassword: {
      required: (value) => !value ? 'Confirm password is required' : null,
      match: (value) => value !== formData.password ? 'Passwords do not match' : null
    },
    role: {
      required: (value) => !value ? 'Role is required' : null
    }
  });

  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [imagePreview, setImagePreview] = useState('');

  const roles = [
    { value: 'Admin', label: 'Administrator', description: 'Full system access' },
    { value: 'Manager', label: 'Manager', description: 'Warehouse and team management' },
    { value: 'Employee', label: 'Employee', description: 'Basic system access' },
    { value: 'Cashier', label: 'Cashier', description: 'Sales and financial access' }
  ];

  useEffect(() => {
    fetchWarehouses();
    
    // Add ESC key handler
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    if (user) {
      setData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        phone: user.phone || '',
        cnic: user.cnic || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        role: user.role || 'Employee',
        assignedWarehouses: user.assignedWarehouses || [],
        isActive: user.isActive !== undefined ? user.isActive : true,
        profilePicture: null
      });
              if (user.profilePicture) {
          setImagePreview(user.profilePicture);
        }
      }
      
      // Cleanup function
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }, [user, onCancel]);

  const fetchWarehouses = async () => {
    try {
      // Mock warehouses for now - replace with API call when backend is ready
      const mockWarehouses = [
        { _id: 'w1', name: 'Main Warehouse' },
        { _id: 'w2', name: 'Secondary Warehouse' },
        { _id: 'w3', name: 'Production Warehouse' }
      ];
      setWarehouses(mockWarehouses);
      
      // TODO: Uncomment when backend is ready
      const response = await api.get(API_ENDPOINTS.WAREHOUSES.GET_ALL);
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC is required';
    } else if (!/^\d{5}-\d{7}-\d$/.test(formData.cnic)) {
      newErrors.cnic = 'CNIC format should be 12345-1234567-1';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (formData.role === 'Manager' && formData.assignedWarehouses.length === 0) {
      newErrors.assignedWarehouses = 'Managers must be assigned to at least one warehouse';
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
      // For now, create mock response since backend is not ready
      const mockUser = {
        _id: user ? user._id : Date.now().toString(),
        ...formData,
        assignedWarehouses: formData.assignedWarehouses || []
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (user) {
        toast.success('User updated successfully! (Mock)');
      } else {
        toast.success('User created successfully! (Mock)');
      }

      // Call onSave with the mock user data
      onSave(mockUser);
      onCancel();

      // TODO: Uncomment when backend is ready
      /*
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'assignedWarehouses') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === 'profilePicture' && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (key !== 'profilePicture' && key !== 'confirmPassword') {
          formDataToSend.append(key, formData[key]);
        }
      });

      let response;
      if (user) {
        // Update existing user
        response = await api.put(API_ENDPOINTS.USERS.UPDATE(user._id), formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('User updated successfully!');
      } else {
        // Create new user
        response = await api.post(API_ENDPOINTS.USERS.CREATE, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('User created successfully!');
      }

      onSave(response.data);
      onCancel();
      */

    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setData(prev => ({ ...prev, profilePicture: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWarehouseToggle = (warehouseId) => {
    setData(prev => ({
      ...prev,
      assignedWarehouses: prev.assignedWarehouses.includes(warehouseId)
        ? prev.assignedWarehouses.filter(id => id !== warehouseId)
        : [...prev.assignedWarehouses, warehouseId]
    }));
  };

  const formatCNIC = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/(\d{5})(\d{7})(\d{1})/);
    if (matches) {
      return `${matches[1]}-${matches[2]}-${matches[3]}`;
    }
    return value;
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-center bg-blue-600 text-white rounded-t-xl">
          <h2 className="text-xl font-semibold flex items-center">
            <FaUser className="mr-2" />
            {user ? 'Edit User' : 'Create New User'}
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
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FaUser className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                <FaCamera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaUser className="mr-2 text-blue-600" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNIC *
                </label>
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={(e) => {
                    const formatted = formatCNIC(e.target.value);
                    setData(prev => ({ ...prev, cnic: formatted }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cnic ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="12345-1234567-1"
                  maxLength="15"
                />
                {errors.cnic && (
                  <p className="mt-1 text-sm text-red-600">{errors.cnic}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.role ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-blue-600" />
              Address Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter state"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>
          </div>

          {/* Warehouse Assignment for Managers */}
          {formData.role === 'Manager' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FaBuilding className="mr-2 text-blue-600" />
                Warehouse Assignment
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {warehouses.map((warehouse) => (
                  <label
                    key={warehouse._id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.assignedWarehouses.includes(warehouse._id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedWarehouses.includes(warehouse._id)}
                      onChange={() => handleWarehouseToggle(warehouse._id)}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm font-medium">{warehouse.name}</span>
                  </label>
                ))}
              </div>
              {errors.assignedWarehouses && (
                <p className="mt-2 text-sm text-red-600">{errors.assignedWarehouses}</p>
              )}
            </div>
          )}

          {/* Password Section */}
          {!user && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FaIdCard className="mr-2 text-blue-600" />
                Password
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              User is active
            </label>
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
                  {user ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {user ? 'Update User' : 'Create User'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
