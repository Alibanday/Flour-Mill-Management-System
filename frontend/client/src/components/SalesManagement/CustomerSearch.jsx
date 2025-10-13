import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBuilding, FaTimes, FaPlus } from 'react-icons/fa';
import api, { API_ENDPOINTS } from '../../services/api';

const CustomerSearch = ({ onCustomerSelect, selectedCustomer = null, placeholder = "Search customer by name or ID..." }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch customers when search query changes
  useEffect(() => {
    const searchCustomers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        const response = await api.get(`${API_ENDPOINTS.CUSTOMERS.SEARCH}?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setSearchResults(response.data.data || []);
        } else {
          setError('Failed to search customers');
        }
      } catch (err) {
        console.error('Customer search error:', err);
        setError('Error searching customers');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchCustomers, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize search query with selected customer
  useEffect(() => {
    if (selectedCustomer) {
      setSearchQuery(`${selectedCustomer.firstName} ${selectedCustomer.lastName} (${selectedCustomer.customerNumber || selectedCustomer._id})`);
    }
  }, [selectedCustomer]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
    
    // Clear selection if user is typing
    if (selectedCustomer && value !== `${selectedCustomer.firstName} ${selectedCustomer.lastName} (${selectedCustomer.customerNumber || selectedCustomer._id})`) {
      onCustomerSelect(null);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSearchQuery(`${customer.firstName} ${customer.lastName} (${customer.customerNumber || customer._id})`);
    setShowDropdown(false);
    onCustomerSelect(customer);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    onCustomerSelect(null);
    inputRef.current?.focus();
  };

  const formatAddress = (address) => {
    if (!address) return 'No address';
    const parts = [address.street, address.city, address.state, address.zipCode].filter(Boolean);
    return parts.join(', ') || 'No address';
  };

  const getDisplayName = (customer) => {
    const name = `${customer.firstName} ${customer.lastName}`.trim();
    const businessName = customer.businessName ? ` (${customer.businessName})` : '';
    return `${name}${businessName}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Clear Button */}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="text-sm" />
          </button>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (searchResults.length > 0 || error || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Searching customers...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              {error}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((customer) => (
                <button
                  key={customer._id}
                  type="button"
                  onClick={() => handleCustomerSelect(customer)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <FaUser className="text-blue-500 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getDisplayName(customer)}
                        </p>
                        {customer.customerType && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            customer.customerType === 'VIP' ? 'bg-purple-100 text-purple-800' :
                            customer.customerType === 'Premium' ? 'bg-gold-100 text-gold-800' :
                            customer.customerType === 'Regular' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {customer.customerType}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 space-y-1">
                        {customer.phone && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <FaPhone className="text-xs" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        
                        {customer.email && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <FaEnvelope className="text-xs" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <FaMapMarkerAlt className="text-xs" />
                          <span className="truncate">{formatAddress(customer.address)}</span>
                        </div>
                        
                        {customer.businessName && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <FaBuilding className="text-xs" />
                            <span className="truncate">{customer.businessName}</span>
                          </div>
                        )}
                      </div>
                      
                      {customer.customerNumber && (
                        <p className="text-xs text-blue-600 mt-1">
                          ID: {customer.customerNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-4 text-center text-gray-500">
              <FaUser className="mx-auto mb-2 text-gray-300" />
              <p>No customers found for "{searchQuery}"</p>
              <p className="text-xs mt-1">Try searching by name, email, or customer ID</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;
