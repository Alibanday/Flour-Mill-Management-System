import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaShoppingCart, FaCalculator, FaUser, FaBoxes, FaUndo, FaPercent, FaRupeeSign, FaPlus, FaSearch, FaUserPlus } from 'react-icons/fa';
import CustomerSearch from './CustomerSearch';
import api, { API_ENDPOINTS } from '../../services/api';

export default function SalesFormEnhanced({ onSubmit, onCancel, editData = null, warehouses = [], inventory = [] }) {
  const [formData, setFormData] = useState({
    invoiceNumber: '', // Will be auto-generated
    customerId: '', // New field for customer reference
    customer: {
      name: '',
      contact: {
        phone: '',
        email: '',
        address: ''
      },
      creditLimit: 0,
      outstandingBalance: 0
    },
    saleDate: new Date().toISOString().split('T')[0],
    items: [],
    warehouse: '',
    paymentMethod: 'Cash',
    discount: {
      type: 'none',
      value: 0,
      amount: 0
    },
    tax: 0,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnitPrice, setItemUnitPrice] = useState('');
  const [showReturns, setShowReturns] = useState(false);
  const [returns, setReturns] = useState([]);
  
  // Customer search states (keeping for backward compatibility)
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  
  // Helper function for safe number parsing
  const safeNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };
  
  // Get filtered products based on selected warehouse
  // Note: This old inventory model uses 'weight' for stock and 'price' for price
  const getFilteredProducts = () => {
    // Show all products with weight > 0
    return inventory.filter(product => {
      // Check if product has weight/stock
      return product.weight !== undefined && product.weight > 0;
    });
  };
  
  // Auto-fill unit price when product is selected
  useEffect(() => {
    if (selectedProduct) {
      const product = inventory.find(p => p._id === selectedProduct);
      if (product && product.price) {
        setItemUnitPrice(product.price);
      }
    }
  }, [selectedProduct, inventory]);
  
  // Auto-calculate total price for each item
  useEffect(() => {
    if (itemQuantity && itemUnitPrice) {
      const quantity = safeNumber(itemQuantity);
      const unitPrice = safeNumber(itemUnitPrice);
      const totalPrice = quantity * unitPrice;
      
      // You can optionally store this in a state if needed for display
      // For now, we'll calculate it when adding the item
    }
  }, [itemQuantity, itemUnitPrice]);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        saleDate: new Date(editData.saleDate).toISOString().split('T')[0]
      });
      if (editData.returns) {
        setReturns(editData.returns);
      }
      
      // If editing and customer ID exists, fetch the full customer object
      if (editData.customerId) {
        fetchCustomerById(editData.customerId);
      }
    }
  }, [editData]);
  
  const fetchCustomerById = async (customerId) => {
    try {
      const response = await api.get(API_ENDPOINTS.CUSTOMERS.GET_BY_ID(customerId));
      
      if (response.data?.success) {
        setSelectedCustomerObj(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  // Auto-calculate discount amount when discount changes
  useEffect(() => {
    if (formData.discount?.type === 'percentage') {
      const subtotal = (formData.items || []).reduce((sum, item) => sum + safeNumber(item.totalPrice), 0);
      setFormData(prev => ({
        ...prev,
        discount: {
          ...prev.discount,
          amount: (subtotal * safeNumber(prev.discount?.value)) / 100
        }
      }));
    } else if (formData.discount?.type === 'fixed') {
      setFormData(prev => ({
        ...prev,
        discount: {
          ...prev.discount,
          amount: safeNumber(prev.discount?.value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        discount: {
          ...prev.discount,
          amount: 0
        }
      }));
    }
  }, [formData.discount?.type, formData.discount?.value, formData.items]);


  const searchCustomers = async () => {
    if (customerSearchQuery.length < 2) return;
    
    setIsSearchingCustomers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:7000/api/sales/customers/search?q=${encodeURIComponent(customerSearchQuery)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomerSearchResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const handleCustomerSelect = (customer) => {
    if (!customer) {
      // Clear customer data when no customer is selected
      setSelectedCustomerObj(null);
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customer: {
          name: '',
          contact: {
            phone: '',
            email: '',
            address: ''
          },
          creditLimit: 0,
          outstandingBalance: 0
        }
      }));
      return;
    }

    // Store the full customer object
    setSelectedCustomerObj(customer);

    setFormData(prev => ({
      ...prev,
      customerId: customer._id,
      customer: {
        name: `${customer.firstName} ${customer.lastName}`,
        contact: {
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address ? 
            [
              customer.address.street,
              customer.address.city,
              customer.address.state,
              customer.address.zipCode
            ].filter(Boolean).join(', ') : ''
        },
        creditLimit: customer.creditLimit || 0,
        outstandingBalance: customer.outstandingBalance || customer.creditUsed || 0
      }
    }));
    
    console.log('✅ Customer selected:', {
      customerId: customer._id,
      name: `${customer.firstName} ${customer.lastName}`,
      creditLimit: customer.creditLimit,
      outstandingBalance: customer.outstandingBalance || customer.creditUsed,
      rawCustomer: customer
    });
  };

  const clearCustomer = () => {
    setSelectedCustomerObj(null);
    setFormData(prev => ({
      ...prev,
      customerId: '',
      customer: {
        name: '',
        contact: {
          phone: '',
          email: '',
          address: ''
        },
        creditLimit: 0,
        outstandingBalance: 0
      }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;


    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        // Navigate to the nested property
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        // Set the final value
        current[parts[parts.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addItem = () => {
    if (!formData.warehouse) {
      setErrors({ items: 'Please select a warehouse first' });
      return;
    }
    
    if (!selectedProduct || !itemQuantity || !itemUnitPrice) {
      setErrors({ items: 'Please fill all item fields' });
      return;
    }

    const product = inventory.find(p => p._id === selectedProduct);
    if (!product) {
      setErrors({ items: 'Product not found' });
      return;
    }

    // Check stock availability - using 'weight' field which represents quantity in this old model
    const quantity = safeNumber(itemQuantity);
    const availableStock = product.weight || 0;
    if (availableStock < quantity) {
      setErrors({ items: `Insufficient stock! Available: ${availableStock} units, Requested: ${quantity}` });
      return;
    }

    const unitPrice = safeNumber(itemUnitPrice);
    const totalPrice = quantity * unitPrice;

    const newItem = {
      product: selectedProduct,
      productName: product.name,
      quantity: quantity,
      unit: 'units', // Display as units instead of kg
      unitPrice: unitPrice,
      totalPrice: totalPrice
    };

    const updatedItems = [...formData.items, newItem];
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Check credit limit if payment method is credit
    if (formData.paymentMethod === 'Credit' && formData.customerId) {
      const availableCredit = formData.customer.creditLimit - formData.customer.outstandingBalance;
      if (newSubtotal > availableCredit) {
        setErrors({ items: `Credit limit exceeded! Available credit: Rs. ${availableCredit.toFixed(2)}, Purchase total: Rs. ${newSubtotal.toFixed(2)}` });
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset item fields
    setSelectedProduct('');
    setItemQuantity('');
    setItemUnitPrice('');
    setErrors({});
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + safeNumber(item.totalPrice), 0);
    const discountAmount = safeNumber(formData.discount?.amount || 0);
    const taxAmount = safeNumber(formData.tax || 0);
    return subtotal - discountAmount + taxAmount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    const newErrors = {};
    if (!formData.customerId) {
      newErrors.customerName = 'Please select a customer';
    }
    if (!formData.warehouse) {
      newErrors.warehouse = 'Please select a warehouse';
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }
    
    // Check credit limit for credit payments
    if (formData.paymentMethod === 'Credit' && formData.customerId) {
      const total = calculateTotal();
      const availableCredit = formData.customer.creditLimit - formData.customer.outstandingBalance;
      if (total > availableCredit) {
        newErrors.items = `Credit limit exceeded! Available credit: Rs. ${availableCredit.toFixed(2)}, Total purchase: Rs. ${total.toFixed(2)}`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare sale data with proper structure
      const saleData = {
        customer: {
          customerId: formData.customerId,
          name: formData.customer.name,
          contact: formData.customer.contact,
          creditLimit: formData.customer.creditLimit,
          outstandingBalance: formData.customer.outstandingBalance
        },
        saleDate: formData.saleDate,
        items: formData.items,
        warehouse: formData.warehouse,
        paymentMethod: formData.paymentMethod,
        discount: formData.discount,
        tax: formData.tax,
        notes: formData.notes,
        subtotal: formData.items.reduce((sum, item) => sum + item.totalPrice, 0),
        totalAmount: calculateTotal()
      };

      console.log('📤 Sending sale data:', saleData);
      await onSubmit(saleData);
    } catch (error) {
      console.error('Error submitting sale:', error);
      setErrors({ submit: 'Failed to create sale' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaShoppingCart className="mr-2 text-blue-500" />
              New Sale
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber || "Auto-generated"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  placeholder="Auto-generated"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Invoice number will be generated automatically</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Date *
                </label>
                <input
                  type="date"
                  name="saleDate"
                  value={formData.saleDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                Customer Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer *
                </label>
                <CustomerSearch
                  onCustomerSelect={handleCustomerSelect}
                  selectedCustomer={selectedCustomerObj}
                  placeholder="Search customer by name, email, phone, or ID..."
                />
                {errors.customer?.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.customer.name}</p>
                )}
              </div>

              {/* Customer Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="customer.contact.phone"
                    value={formData.customer.contact.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+92-300-1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="customer.contact.email"
                    value={formData.customer.contact.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="customer@example.com"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="customer.contact.address"
                    value={formData.customer.contact.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer address (can be edited)"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (formData.customerId) {
                        try {
                          // Fetch full customer data from database
                          const response = await api.get(API_ENDPOINTS.CUSTOMERS.GET_BY_ID(formData.customerId));
                          
                          if (response.data?.success) {
                            const customer = response.data.data;
                            
                            if (customer?.address) {
                              // Format address from customer's saved data
                              const addressParts = [
                                customer.address.street,
                                customer.address.city,
                                customer.address.state,
                                customer.address.zipCode
                              ].filter(Boolean);
                              
                              const address = addressParts.join(', ');
                              
                              setFormData(prev => ({
                                ...prev,
                                customer: {
                                  ...prev.customer,
                                  contact: {
                                    ...prev.customer.contact,
                                    address: address
                                  }
                                }
                              }));
                              
                              // Update selected customer object
                              setSelectedCustomerObj(customer);
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching customer:', error);
                          alert('Failed to fetch customer address');
                        }
                      }
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded border border-gray-300 hover:border-blue-300 transition-colors"
                    title="Reset to customer's saved address"
                  >
                    Reset
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Address can be manually edited or reset to customer's saved address</p>
              </div>

              {/* Customer Credit Information */}
              {formData.customerId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit (Rs.) *
                    </label>
                    <input
                      type="number"
                      name="customer.creditLimit"
                      value={formData.customer.creditLimit}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-blue-900 font-semibold"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum credit allowed for this customer</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outstanding Balance (Rs.) *
                    </label>
                    <input
                      type="number"
                      name="customer.outstandingBalance"
                      value={formData.customer.outstandingBalance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-blue-900 font-semibold"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Remaining amount to be paid from previous purchases</p>
                  </div>
                </div>
              )}
              
              {/* Credit Available Display */}
              {formData.customerId && formData.customer.creditLimit > 0 && (
                <div className="mt-2 p-3 bg-green-50 rounded-md border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Available Credit:</span>
                    <span className={`text-lg font-bold ${
                      (formData.customer.creditLimit - formData.customer.outstandingBalance - calculateTotal()) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      Rs. {Math.max(0, (formData.customer.creditLimit - formData.customer.outstandingBalance - calculateTotal())).toFixed(2)}
                    </span>
                  </div>
                  {calculateTotal() > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      Current Purchase: Rs. {calculateTotal().toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Clear Customer Button */}
              {formData.customerId && (
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center"
                >
                  <FaTimes className="mr-1" />
                  Clear Customer Selection
                </button>
              )}
            </div>

            {/* Warehouse Selection - MUST BE FIRST */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaBoxes className="mr-2 text-blue-500" />
                Select Warehouse *
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose Warehouse
                </label>
                <select
                  name="warehouse"
                  value={formData.warehouse}
                  onChange={(e) => {
                    handleInputChange(e);
                    // Reset selected product when warehouse changes
                    setSelectedProduct('');
                    setItemQuantity('');
                    setItemUnitPrice('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose warehouse first</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </select>
                {!formData.warehouse && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Please select a warehouse to view available products</p>
                )}
              </div>
            </div>

            {/* Product Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaBoxes className="mr-2 text-green-500" />
                Add Products to Sale
              </h3>
              
              {!formData.warehouse ? (
                <div className="text-center py-8 bg-yellow-50 rounded-md border border-yellow-200">
                  <p className="text-yellow-700">Please select a warehouse first to add products</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Product
                      </label>
                      <select
                        value={selectedProduct}
                        onChange={(e) => {
                          setSelectedProduct(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!formData.warehouse}
                      >
                        <option value="">Choose product</option>
                        {getFilteredProducts().map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name} - Stock: {product.weight || 0} units
                          </option>
                        ))}
                      </select>
                  {selectedProduct && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Product:</strong> {inventory.find(p => p._id === selectedProduct)?.name}
                      </p>
                      <p className="text-sm text-blue-600">
                        <strong>Available Stock:</strong> {inventory.find(p => p._id === selectedProduct)?.weight || 0} units
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Price:</strong> Rs. {inventory.find(p => p._id === selectedProduct)?.price || 0}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  {selectedProduct && itemQuantity && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {inventory.find(p => p._id === selectedProduct)?.weight || 0} units
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price (Rs.)
                  </label>
                  <input
                    type="number"
                    value={itemUnitPrice}
                    onChange={(e) => setItemUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled from inventory</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Price
                  </label>
                  <input
                    type="text"
                    value={itemQuantity && itemUnitPrice ? (parseFloat(itemQuantity || 0) * parseFloat(itemUnitPrice || 0)).toFixed(2) : '0.00'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 font-semibold"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center"
                  >
                    <FaPlus className="mr-2" />
                    Add Item
                  </button>
                </div>
              </div>

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Items Added:</h4>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border">
                        <div className="flex-1">
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-gray-600 ml-2">({item.quantity} {item.unit})</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-600">Rs. {item.unitPrice}/unit</span>
                          <span className="font-medium">Rs. {item.totalPrice.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                </>
              )}
            </div>

            {/* Error Messages */}
            {errors.warehouse && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.warehouse}</p>
              </div>
            )}
            {errors.customerName && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.customerName}</p>
              </div>
            )}
            {errors.items && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.items}</p>
              </div>
            )}
            {errors.paymentMethod && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.paymentMethod}</p>
              </div>
            )}
            {errors.submit && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Discount and Tax Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <select
                  name="discount.type"
                  value={formData.discount.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  name="discount.value"
                  value={formData.discount.value}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax (Rs.)
                </label>
                <input
                  type="number"
                  name="tax"
                  value={formData.tax}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Total Calculation */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-blue-600">Rs. {calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <FaCalculator className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Sale
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
