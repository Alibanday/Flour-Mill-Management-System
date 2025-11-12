import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUser, FaSpinner } from 'react-icons/fa';

export default function EmployeeForm({ employee, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Production',
    position: '',
    salary: '',
    hireDate: '',
    warehouse: '',
    monthlyAllowedLeaves: 0,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    cnic: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    bankDetails: {
      accountNumber: '',
      bankName: '',
      branchCode: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [warehouses, setWarehouses] = useState([]);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching warehouses with token:', !!token);
      
      const response = await fetch('http://localhost:7000/api/warehouses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Warehouses response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Warehouses data:', data);
        const warehousesData = data.data || [];
        console.log('Setting warehouses:', warehousesData);
        setWarehouses(warehousesData);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // If it's an authentication error, redirect to login
        if (response.status === 401) {
          alert('Your session has expired. Please log in again.');
          window.location.href = '/login';
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    if (employee) {
      // Handle warehouse - it could be an object with _id or just an _id string
      let warehouseId = '';
      if (employee.warehouse) {
        if (typeof employee.warehouse === 'object' && employee.warehouse._id) {
          warehouseId = employee.warehouse._id;
        } else if (typeof employee.warehouse === 'string') {
          warehouseId = employee.warehouse;
        }
      }

      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || 'Production',
        position: employee.position || '',
        salary: employee.salary ? String(employee.salary) : '',
        hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
        warehouse: warehouseId,
        monthlyAllowedLeaves: employee.monthlyAllowedLeaves || 0,
        address: {
          street: employee.address?.street || '',
          city: employee.address?.city || '',
          state: employee.address?.state || '',
          zipCode: employee.address?.zipCode || '',
          country: employee.address?.country || ''
        },
        cnic: employee.cnic || '',
        emergencyContact: {
          name: employee.emergencyContact?.name || '',
          relationship: employee.emergencyContact?.relationship || '',
          phone: employee.emergencyContact?.phone || ''
        },
        bankDetails: {
          accountNumber: employee.bankDetails?.accountNumber || '',
          bankName: employee.bankDetails?.bankName || '',
          branchCode: employee.bankDetails?.branchCode || ''
        }
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Real-time validation
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    // Clear server error when user starts typing
    if (serverError) {
      setServerError('');
    }
  };

  // Real-time validation functions
  const validateField = (name, value) => {
    let error = '';
    
    // Helper function to safely convert value to string
    const getStringValue = (val) => {
      if (val === null || val === undefined) return '';
      return String(val);
    };
    
    switch (name) {
      case 'firstName':
        const firstNameStr = getStringValue(value);
        if (!firstNameStr.trim()) error = 'First name is required';
        else if (firstNameStr.trim().length < 2) error = 'First name must be at least 2 characters';
        break;
      case 'lastName':
        const lastNameStr = getStringValue(value);
        if (!lastNameStr.trim()) error = 'Last name is required';
        else if (lastNameStr.trim().length < 2) error = 'Last name must be at least 2 characters';
        break;
      case 'email':
        const emailStr = getStringValue(value);
        if (!emailStr.trim()) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(emailStr)) error = 'Please enter a valid email address';
        break;
      case 'phone':
        const phoneStr = getStringValue(value);
        if (!phoneStr.trim()) error = 'Phone number is required';
        else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phoneStr)) error = 'Please enter a valid phone number';
        break;
      case 'department':
        const deptStr = getStringValue(value);
        if (!deptStr.trim()) error = 'Department is required';
        break;
      case 'warehouse':
        const warehouseStr = getStringValue(value);
        if (!warehouseStr.trim()) error = 'Warehouse is required';
        break;
      case 'position':
        const positionStr = getStringValue(value);
        if (!positionStr.trim()) error = 'Position is required';
        else if (positionStr.trim().length < 2) error = 'Position must be at least 2 characters';
        break;
      case 'salary':
        const salaryValue = parseFloat(value);
        if (!value && value !== 0) error = 'Salary is required';
        else if (isNaN(salaryValue) || salaryValue < 0) error = 'Salary must be a valid positive number';
        else if (salaryValue < 10000) error = 'Salary must be at least 10,000';
        break;
      case 'hireDate':
        if (!value) error = 'Hire date is required';
        else {
          const hireDate = new Date(value);
          const today = new Date();
          if (hireDate > today) error = 'Hire date cannot be in the future';
          else if (hireDate < new Date('1900-01-01')) error = 'Please enter a valid hire date';
        }
        break;
      case 'cnic':
        const cnicStr = getStringValue(value);
        if (cnicStr && !/^\d{5}-\d{7}-\d{1}$/.test(cnicStr)) error = 'CNIC must be in format 12345-1234567-1 (optional field)';
        break;
      case 'bankDetails.accountNumber':
        const accountStr = getStringValue(value);
        if (accountStr && accountStr.length < 10) error = 'Account number must be at least 10 characters';
        break;
      case 'bankDetails.bankName':
        const bankNameStr = getStringValue(value);
        if (bankNameStr && bankNameStr.length < 2) error = 'Bank name must be at least 2 characters';
        break;
      case 'bankDetails.branchCode':
        const branchCodeStr = getStringValue(value);
        if (branchCodeStr && branchCodeStr.length < 3) error = 'Branch code must be at least 3 characters';
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate all fields
    const fieldsToValidate = [
      'firstName', 'lastName', 'email', 'phone', 'department', 
      'warehouse', 'position', 'salary', 'hireDate'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Validate nested fields (only if they have values)
    if (formData.cnic && String(formData.cnic).trim()) {
      const cnicError = validateField('cnic', formData.cnic);
      if (cnicError) {
        newErrors.cnic = cnicError;
      }
    }

    if (formData.bankDetails.accountNumber && String(formData.bankDetails.accountNumber).trim()) {
      const accountError = validateField('bankDetails.accountNumber', formData.bankDetails.accountNumber);
      if (accountError) {
        newErrors['bankDetails.accountNumber'] = accountError;
      }
    }
    
    setErrors(newErrors);
    setFieldErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted', formData);
    
    // Clear previous server errors
    setServerError('');
    
    const validationResult = validateForm();
    const isValid = validationResult.isValid;
    const validationErrors = validationResult.errors;
    
    console.log('Form validation result:', isValid);
    console.log('Validation errors:', validationErrors);
    
    if (!isValid) {
      console.log('Validation failed. Errors:', validationErrors);
      console.log('Form data being validated:', formData);
      
      // Wait a moment for errors state to update, then scroll to first error
      setTimeout(() => {
        const errorKeys = Object.keys(validationErrors);
        console.log('Error keys:', errorKeys);
        
        if (errorKeys.length > 0) {
          const firstErrorField = errorKeys[0];
          console.log('First error field:', firstErrorField, 'Error:', validationErrors[firstErrorField]);
          
          const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.focus();
          } else {
            console.warn('Could not find element for field:', firstErrorField);
          }
        }
        
        // Show a detailed error message
        const errorMessages = Object.entries(validationErrors)
          .map(([field, error]) => `${field}: ${error}`)
          .join(', ');
        setServerError(`Please fix the following errors: ${errorMessages}`);
      }, 100);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Check if user is authenticated
      if (!token) {
        setServerError('You are not logged in. Please log in first.');
        setLoading(false);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      const url = employee 
        ? `http://localhost:7000/api/employees/${employee._id}` 
        : 'http://localhost:7000/api/employees/create';
      const method = employee ? 'PUT' : 'POST';

      // Clean up form data - convert empty strings to null for optional fields
      const cleanedFormData = {
        ...formData,
        salary: parseFloat(formData.salary) || 0, // Convert salary to number
        monthlyAllowedLeaves: parseInt(formData.monthlyAllowedLeaves) || 0, // Convert to integer
        cnic: formData.cnic && String(formData.cnic).trim() ? String(formData.cnic).trim() : null,
        emergencyContact: {
          name: formData.emergencyContact.name?.trim() || null,
          relationship: formData.emergencyContact.relationship?.trim() || null,
          phone: formData.emergencyContact.phone?.trim() || null
        },
        bankDetails: {
          accountNumber: formData.bankDetails.accountNumber?.trim() || null,
          bankName: formData.bankDetails.bankName?.trim() || null,
          branchCode: formData.bankDetails.branchCode?.trim() || null
        }
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedFormData)
      });

      if (!response.ok) {
        let errorData = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorData = { message: 'An error occurred while processing your request' };
        }
        console.error('Error response:', errorData);
        
        // Handle specific server errors
        if (response.status === 400) {
          // Check if the error response includes a specific field that caused the duplicate
          if (errorData.field) {
            if (errorData.field === 'email') {
              setServerError(errorData.message || 'An employee with this email address already exists. Please use a different email.');
              setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
            } else if (errorData.field === 'cnic') {
              setServerError(errorData.message || 'An employee with this CNIC already exists. Please use a different CNIC.');
              setErrors(prev => ({ ...prev, cnic: 'This CNIC is already registered' }));
            } else if (errorData.field === 'employeeId') {
              setServerError(errorData.message || 'An employee with this ID already exists. Please try again.');
            } else {
              setServerError(errorData.message || 'Please check your input and try again.');
            }
          } else if (errorData.message && errorData.message.includes('email or CNIC already exists')) {
            // Fallback for older error messages
            setServerError('An employee with this email address or CNIC already exists. Please use different values.');
            // Set errors for both fields to help user identify the issue
            setErrors(prev => ({ 
              ...prev, 
              email: 'This email may already be registered',
              cnic: 'This CNIC may already be registered'
            }));
          } else if (errorData.message && errorData.message.includes('email already exists')) {
            setServerError('An employee with this email address already exists. Please use a different email.');
            setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
          } else if (errorData.message && errorData.message.includes('CNIC already exists')) {
            setServerError('An employee with this CNIC already exists. Please use a different CNIC.');
            setErrors(prev => ({ ...prev, cnic: 'This CNIC is already registered' }));
          } else if (errorData.message && errorData.message.includes('employeeId already exists')) {
            setServerError('An employee with this ID already exists. Please try again.');
          } else {
            setServerError(errorData.message || 'Please check your input and try again.');
          }
        } else if (response.status === 401) {
          setServerError('Your session has expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (response.status === 403) {
          setServerError('You do not have permission to perform this action.');
        } else if (response.status === 500) {
          setServerError('Server error occurred. Please try again later.');
        } else {
          setServerError(errorData.message || 'An unexpected error occurred. Please try again.');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        // Show success message
        setServerError('');
        alert(employee ? 'Employee updated successfully!' : 'Employee added successfully!');
        onSuccess();
      } else {
        setServerError(data.message || 'Failed to save employee');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setServerError('Unable to connect to server. Please check your internet connection.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-lg mr-4">
            <FaUser className="text-blue-600 text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <p className="text-gray-600">
              {employee ? 'Update employee information' : 'Enter employee details'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      {/* Server Error Display */}
      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{serverError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.firstName 
                    ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-blue-500 hover:border-gray-400'
                }`}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <div className="mt-1 flex items-center">
                  <svg className="h-4 w-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-500 text-sm">{errors.firstName}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNIC
              </label>
              <input
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.cnic 
                    ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-blue-500 hover:border-gray-400'
                }`}
                placeholder="12345-1234567-1 (optional)"
              />
              {errors.cnic && (
                <div className="mt-1 flex items-center">
                  <svg className="h-4 w-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-500 text-sm">{errors.cnic}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                name="emergencyContact.name"
                value={formData.emergencyContact.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter emergency contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                name="emergencyContact.phone"
                value={formData.emergencyContact.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter emergency contact phone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Relationship
              </label>
              <input
                type="text"
                name="emergencyContact.relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Spouse, Parent, Sibling"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter state"
              />
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.department ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="Production">Production</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
                <option value="Maintenance">Maintenance</option>
              </select>
              {errors.department && (
                <p className="text-red-500 text-sm mt-1">{errors.department}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse *
              </label>
              <select
                name="warehouse"
                value={formData.warehouse}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.warehouse ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Warehouse</option>
                {warehouses.length > 0 ? (
                  warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No warehouses available</option>
                )}
              </select>
              {errors.warehouse && (
                <p className="text-red-500 text-sm mt-1">{errors.warehouse}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.position ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter position"
              />
              {errors.position && (
                <p className="text-red-500 text-sm mt-1">{errors.position}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary *
              </label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.salary ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter salary"
                min="0"
              />
              {errors.salary && (
                <p className="text-red-500 text-sm mt-1">{errors.salary}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hire Date *
              </label>
              <input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.hireDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.hireDate && (
                <p className="text-red-500 text-sm mt-1">{errors.hireDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Allowed Leaves
              </label>
              <input
                type="number"
                name="monthlyAllowedLeaves"
                value={formData.monthlyAllowedLeaves}
                onChange={handleChange}
                min="0"
                max="31"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of leaves allowed per month (excess leaves will result in salary deduction)
              </p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                name="bankDetails.accountNumber"
                value={formData.bankDetails.accountNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                name="bankDetails.bankName"
                value={formData.bankDetails.bankName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bank name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Code
              </label>
              <input
                type="text"
                name="bankDetails.branchCode"
                value={formData.bankDetails.branchCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter branch code"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={(e) => {
              console.log('Button clicked!', { loading, formData });
              if (loading) {
                e.preventDefault();
                return;
              }
              // Let the form handle submission
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-sm hover:shadow-md disabled:shadow-none"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                {employee ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                {employee ? 'Update Employee' : 'Create Employee'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}