import React, { useState, useEffect } from 'react';
import { FaSearch, FaUser, FaPhone, FaEnvelope, FaBuilding, FaSpinner } from 'react-icons/fa';

export default function CustomerSearch({ onCustomerSelect, selectedCustomer, placeholder = "Search customers..." }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchCustomers();
    } else {
      setCustomers([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  const searchCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You are not logged in. Please log in again.');
        return;
      }

      const response = await fetch(`http://localhost:7000/api/customers/search?search=${encodeURIComponent(searchTerm)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        throw new Error('Failed to search customers');
      }

      const data = await response.json();
      setCustomers(data.data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error('Error searching customers:', err);
      setError(err.message || 'Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    onCustomerSelect(customer);
    setSearchTerm(`${customer.firstName} ${customer.lastName} (${customer.customerId})`);
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      onCustomerSelect(null);
    }
  };

  const handleInputFocus = () => {
    if (customers.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'text-green-600',
      'Inactive': 'text-gray-600',
      'Suspended': 'text-yellow-600',
      'Blacklisted': 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  const getTypeColor = (type) => {
    const colors = {
      'Regular': 'bg-blue-100 text-blue-800',
      'Premium': 'bg-purple-100 text-purple-800',
      'VIP': 'bg-yellow-100 text-yellow-800',
      'New': 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <FaSpinner className="animate-spin h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaUser className="h-4 w-4 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedCustomer.customerId} • {selectedCustomer.businessName || 'Individual'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedCustomer.customerType)}`}>
                {selectedCustomer.customerType}
              </span>
              <span className={`text-xs font-medium ${getStatusColor(selectedCustomer.status)}`}>
                {selectedCustomer.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Results */}
      {showDropdown && customers.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {customers.map((customer) => (
            <div
              key={customer._id}
              onClick={() => handleCustomerSelect(customer)}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <FaUser className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {customer.customerId} • {customer.businessName || 'Individual'}
                    </p>
                    <div className="flex items-center mt-1 space-x-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <FaPhone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <FaEnvelope className="h-3 w-3 mr-1" />
                        {customer.email}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(customer.customerType)}`}>
                    {customer.customerType}
                  </span>
                  <span className={`text-xs font-medium ${getStatusColor(customer.status)}`}>
                    {customer.status}
                  </span>
                  {customer.creditLimit > 0 && (
                    <span className="text-xs text-gray-500">
                      Credit: ₹{customer.creditLimit?.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {showDropdown && customers.length === 0 && searchTerm.length >= 2 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-3 text-center text-gray-500">
            <FaUser className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No customers found</p>
            <p className="text-xs">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
}
