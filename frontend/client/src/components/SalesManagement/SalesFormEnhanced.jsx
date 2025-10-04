import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaShoppingCart, FaCalculator, FaUser, FaBoxes, FaUndo, FaPercent, FaRupeeSign, FaPlus, FaSearch, FaUserPlus } from 'react-icons/fa';

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
  
  // Customer search states
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        saleDate: new Date(editData.saleDate).toISOString().split('T')[0]
      });
      if (editData.returns) {
        setReturns(editData.returns);
      }
    }
  }, [editData]);

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

  // Customer search functionality
  useEffect(() => {
    if (customerSearchQuery.length >= 2) {
      searchCustomers();
    } else {
      setCustomerSearchResults([]);
    }
  }, [customerSearchQuery]);

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

  const selectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer._id,
      customer: {
        name: `${customer.firstName} ${customer.lastName}`,
        contact: {
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address?.street || ''
        },
        creditLimit: customer.creditLimit || 0,
        outstandingBalance: customer.creditUsed || 0
      }
    }));
    setCustomerSearchQuery(`${customer.firstName} ${customer.lastName}`);
    setShowCustomerSearch(false);
  };

  const clearCustomer = () => {
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
    setCustomerSearchQuery('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'customer.name') {
      setCustomerSearchQuery(value);
      setShowCustomerSearch(value.length >= 2);
    }

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

  const safeNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const addItem = () => {
    if (!selectedProduct || !itemQuantity || !itemUnitPrice) {
      setErrors({ items: 'Please fill all item fields' });
      return;
    }

    const product = inventory.find(p => p._id === selectedProduct);
    if (!product) {
      setErrors({ items: 'Product not found' });
      return;
    }

    // Check if product is available in the selected warehouse
    if (formData.warehouse && product.warehouse) {
      const productWarehouseId = product.warehouse._id || product.warehouse;
      if (productWarehouseId.toString() !== formData.warehouse) {
        setErrors({ items: `Product ${product.name} is not available in the selected warehouse. It's available in ${product.warehouse.name || 'another warehouse'}.` });
        return;
      }
    }

    // Check stock availability
    if (product.currentStock < safeNumber(itemQuantity)) {
      setErrors({ items: `Insufficient stock. Available: ${product.currentStock} ${product.unit}, Requested: ${itemQuantity}` });
      return;
    }

    const quantity = safeNumber(itemQuantity);
    const unitPrice = safeNumber(itemUnitPrice);
    const totalPrice = quantity * unitPrice;

    const newItem = {
      product: selectedProduct,
      productName: product.name,
      quantity: quantity,
      unit: product.unit || 'kg',
      unitPrice: unitPrice,
      totalPrice: totalPrice
    };

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
    if (!formData.customer.name.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!formData.warehouse) {
      newErrors.warehouse = 'Warehouse selection is required';
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const saleData = {
        ...formData,
        totalAmount: calculateTotal()
      };

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
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="customer.name"
                    value={customerSearchQuery}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search or enter customer name"
                    required
                  />
                  <FaSearch className="absolute right-3 top-3 text-gray-400" />
                </div>
                
                {/* Customer Search Results */}
                {showCustomerSearch && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isSearchingCustomers ? (
                      <div className="p-3 text-center text-gray-500">
                        <FaSearch className="animate-spin mx-auto mb-2" />
                        Searching customers...
                      </div>
                    ) : customerSearchResults.length > 0 ? (
                      customerSearchResults.map((customer) => (
                        <div
                          key={customer._id}
                          onClick={() => selectCustomer(customer)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                        >
                          <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                          <div className="text-sm text-gray-600">{customer.email}</div>
                          <div className="text-sm text-gray-600">{customer.phone}</div>
                          {customer.businessName && (
                            <div className="text-sm text-gray-500">{customer.businessName}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500">No customers found</div>
                    )}
                  </div>
                )}
              </div>

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
                <input
                  type="text"
                  name="customer.contact.address"
                  value={formData.customer.contact.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer address"
                />
              </div>

              {/* Customer Credit Information */}
              {formData.customerId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-3 bg-blue-50 rounded-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit (Rs.)
                    </label>
                    <input
                      type="number"
                      name="customer.creditLimit"
                      value={formData.customer.creditLimit}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Balance (Rs.)
                    </label>
                    <input
                      type="number"
                      name="customer.outstandingBalance"
                      value={formData.customer.outstandingBalance}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
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

            {/* Product Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaBoxes className="mr-2 text-green-500" />
                Product
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Product
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      // Auto-set warehouse when product is selected
                      if (e.target.value) {
                        const product = inventory.find(p => p._id === e.target.value);
                        if (product && product.warehouse) {
                          setFormData(prev => ({
                            ...prev,
                            warehouse: product.warehouse._id || product.warehouse
                          }));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose product</option>
                    {inventory.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} ({product.currentStock} {product.unit}) - {product.warehouse?.name || 'Unknown Warehouse'}
                      </option>
                    ))}
                  </select>
                  {selectedProduct && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Available in:</strong> {inventory.find(p => p._id === selectedProduct)?.warehouse?.name || 'Unknown Warehouse'}
                      </p>
                      <p className="text-sm text-blue-600">
                        <strong>Stock:</strong> {inventory.find(p => p._id === selectedProduct)?.currentStock} {inventory.find(p => p._id === selectedProduct)?.unit}
                      </p>
                      {formData.warehouse && inventory.find(p => p._id === selectedProduct)?.warehouse && (() => {
                        const product = inventory.find(p => p._id === selectedProduct);
                        if (product && product.warehouse) {
                          const productWarehouseId = product.warehouse._id || product.warehouse;
                          return productWarehouseId.toString() !== formData.warehouse;
                        }
                        return false;
                      })() && (
                        <p className="text-sm text-red-600 mt-1">
                          ⚠️ <strong>Warning:</strong> Selected warehouse doesn't match product location
                        </p>
                      )}
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    value={itemUnitPrice}
                    onChange={(e) => setItemUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
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
            </div>

            {/* Warehouse Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaBoxes className="mr-2 text-blue-500" />
                Warehouse Selection
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Warehouse *
                </label>
                <select
                  name="warehouse"
                  value={formData.warehouse}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose warehouse</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </select>
                {errors.warehouse && (
                  <p className="mt-1 text-sm text-red-600">{errors.warehouse}</p>
                )}
                {formData.items.length > 0 && formData.warehouse && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                    <p className="text-sm text-yellow-700">
                      <strong>⚠️ Warehouse Check:</strong> Make sure all selected products are available in the chosen warehouse.
                    </p>
                    {formData.items.some(item => {
                      const product = inventory.find(p => p._id === item.product);
                      if (product && product.warehouse) {
                        const productWarehouseId = product.warehouse._id || product.warehouse;
                        return productWarehouseId.toString() !== formData.warehouse;
                      }
                      return false;
                    }) && (
                      <p className="text-sm text-red-600 mt-1">
                        Some products in your cart are not available in the selected warehouse!
                      </p>
                    )}
                  </div>
                )}
                {errors.customerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                )}
                {errors.items && (
                  <p className="mt-1 text-sm text-red-600">{errors.items}</p>
                )}
                {errors.paymentMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
                )}
                {errors.submit && (
                  <p className="mt-1 text-sm text-red-600">{errors.submit}</p>
                )}
              </div>
            </div>

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
