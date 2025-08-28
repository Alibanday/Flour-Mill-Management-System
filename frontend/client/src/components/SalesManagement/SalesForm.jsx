import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaShoppingCart, FaCalculator, FaUser, FaBoxes, FaUndo, FaPercent, FaRupeeSign, FaPlus } from 'react-icons/fa';

export default function SalesForm({ onSubmit, onCancel, editData = null, warehouses = [], inventory = [] }) {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
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
    if (formData.discount.type === 'percentage') {
      const subtotal = (formData.items || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
      setFormData(prev => ({
        ...prev,
        discount: {
          ...prev.discount,
          amount: (subtotal * (prev.discount.value || 0)) / 100
        }
      }));
    } else if (formData.discount.type === 'fixed') {
      setFormData(prev => ({
        ...prev,
        discount: {
          ...prev.discount,
          amount: prev.discount.value || 0
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
  }, [formData.discount.type, formData.discount.value, formData.items]);

  const handleInputChange = (e) => {
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

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct || !itemQuantity || !itemUnitPrice) {
      setErrors({ items: 'Please fill all item fields' });
      return;
    }

    const product = inventory.find(p => p._id === selectedProduct);
    if (!product) return;

    const quantity = parseFloat(itemQuantity) || 0;
    const unitPrice = parseFloat(itemUnitPrice) || 0;
    const totalPrice = quantity * unitPrice;

    const newItem = {
      product: selectedProduct,
      productName: product.name,
      quantity,
      unit: product.unit || 'kg',
      unitPrice,
      totalPrice
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset form
    setSelectedProduct('');
    setItemQuantity('');
    setItemUnitPrice('');
    setErrors(prev => ({ ...prev, items: '' }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleAddReturn = () => {
    const returnData = {
      itemId: Date.now(), // Temporary ID
      productName: '',
      quantity: 0,
      unit: 'kg',
      returnReason: 'Quality Issue',
      returnDate: new Date().toISOString().split('T')[0],
      refundAmount: 0,
      status: 'Pending'
    };

    setReturns([...returns, returnData]);
  };

  const handleReturnChange = (index, field, value) => {
    const updatedReturns = [...returns];
    updatedReturns[index] = { ...updatedReturns[index], [field]: value };
    setReturns(updatedReturns);
  };

  const handleRemoveReturn = (index) => {
    setReturns(returns.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
    const discountAmount = formData.discount.amount || 0;
    const taxAmount = formData.tax || 0;
    const totalAmount = (subtotal || 0) - (discountAmount || 0) + (taxAmount || 0);

    return { subtotal, discountAmount, taxAmount, totalAmount };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.invoiceNumber.trim()) newErrors.invoiceNumber = 'Invoice number is required';
    if (!formData.customer.name.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.warehouse) newErrors.warehouse = 'Warehouse is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
         if ((formData.items || []).length === 0) newErrors.items = 'At least one item is required';

    // Validate discount
    if (formData.discount.type === 'percentage' && (formData.discount.value < 0 || formData.discount.value > 100)) {
      newErrors.discount = 'Percentage discount must be between 0 and 100';
    }
    if (formData.discount.type === 'fixed' && formData.discount.value < 0) {
      newErrors.discount = 'Fixed discount cannot be negative';
    }

    // Validate tax
    if (formData.tax < 0) newErrors.tax = 'Tax cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
             const submitData = {
         ...formData,
         returns: (returns || []).length > 0 ? returns : undefined
       };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { subtotal, discountAmount, taxAmount, totalAmount } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {editData ? 'Edit Sale' : 'New Sale'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice and Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Number *
            </label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="INV-001"
            />
            {errors.invoiceNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Date *
            </label>
            <input
              type="date"
              name="saleDate"
              value={formData.saleDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FaUser className="mr-2" />
            Customer Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                name="customer.name"
                value={formData.customer.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.customerName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Customer Name"
              />
              {errors.customerName && (
                <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="customer.contact.phone"
                value={formData.customer.contact.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+92-300-1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="customer.contact.email"
                value={formData.customer.contact.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="customer.contact.address"
                value={formData.customer.contact.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Customer Address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Limit (Rs.)
              </label>
              <input
                type="number"
                name="customer.creditLimit"
                value={formData.customer.creditLimit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outstanding Balance (Rs.)
              </label>
              <input
                type="number"
                name="customer.outstandingBalance"
                value={formData.customer.outstandingBalance}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Credit Status Display (FR 22) */}
          {formData.customer.creditLimit > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Credit Status</p>
                  <p className="text-xs text-blue-600">
                    Available Credit: Rs. {Math.max(0, formData.customer.creditLimit - formData.customer.outstandingBalance).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-900">Credit Limit: Rs. {formData.customer.creditLimit.toFixed(2)}</p>
                  <p className="text-xs text-blue-600">
                    Outstanding: Rs. {formData.customer.outstandingBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Items */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FaBoxes className="mr-2" />
            Product Items
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Product</option>
                                 {(inventory || []).map((product) => (
                   <option key={product._id} value={product._id}>
                     {product.name} ({product.code})
                   </option>
                 ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price (Rs.)
              </label>
              <input
                type="number"
                value={itemUnitPrice}
                onChange={(e) => setItemUnitPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <FaPlus className="mr-2" />
                Add Item
              </button>
            </div>
          </div>

          {errors.items && (
            <p className="text-sm text-red-600 mb-4">{errors.items}</p>
          )}

          {/* Items List */}
                     {(formData.items || []).length > 0 && (
            <div className="bg-white rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                                     {(formData.items || []).map((item, index) => (
                    <tr key={index}>
                                             <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                         {item.productName || 'Unknown Product'}
                       </td>
                                             <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                         {(item.quantity || 0)} {(item.unit || 'kg')}
                       </td>
                                             <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                         Rs. {(item.unitPrice || 0).toFixed(2)}
                       </td>
                       <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                         Rs. {(item.totalPrice || 0).toFixed(2)}
                       </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        >
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Discount and Tax */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type
            </label>
            <select
              name="discount.type"
              value={formData.discount.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">No Discount</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (Rs.)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Value
            </label>
            <div className="relative">
              <input
                type="number"
                name="discount.value"
                value={formData.discount.value}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.discount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={formData.discount.type === 'none'}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {formData.discount.type === 'percentage' ? (
                  <FaPercent className="text-gray-400" />
                ) : formData.discount.type === 'fixed' ? (
                  <FaRupeeSign className="text-gray-400" />
                ) : null}
              </div>
            </div>
            {errors.discount && (
              <p className="mt-1 text-sm text-red-600">{errors.discount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax (Rs.)
            </label>
            <input
              type="number"
              name="tax"
              value={formData.tax}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.tax ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
              min="0"
              step="0.01"
            />
            {errors.tax && (
              <p className="mt-1 text-sm text-red-600">{errors.tax}</p>
            )}
          </div>
        </div>

        {/* Returns Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FaUndo className="mr-2" />
              Product Returns
            </h3>
            <button
              type="button"
              onClick={() => setShowReturns(!showReturns)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showReturns ? 'Hide Returns' : 'Show Returns'}
            </button>
          </div>

          {showReturns && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleAddReturn}
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <FaPlus className="mr-2" />
                Add Return
              </button>

                             {(returns || []).map((returnItem, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={returnItem.productName}
                        onChange={(e) => handleReturnChange(index, 'productName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Product Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Quantity
                      </label>
                      <input
                        type="number"
                        value={returnItem.quantity}
                        onChange={(e) => handleReturnChange(index, 'quantity', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Reason
                      </label>
                      <select
                        value={returnItem.returnReason}
                        onChange={(e) => handleReturnChange(index, 'returnReason', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Quality Issue">Quality Issue</option>
                        <option value="Wrong Product">Wrong Product</option>
                        <option value="Customer Request">Customer Request</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveReturn(index)}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment and Warehouse */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse *
            </label>
            <select
              name="warehouse"
              value={formData.warehouse}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.warehouse ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Warehouse</option>
                             {(warehouses || []).map((warehouse) => (
                 <option key={warehouse._id} value={warehouse._id}>
                   {warehouse.name}
                 </option>
               ))}
            </select>
            {errors.warehouse && (
              <p className="mt-1 text-sm text-red-600">{errors.warehouse}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Additional notes..."
          />
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
            <FaCalculator className="mr-2" />
            Order Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Subtotal:</span>
              <span className="ml-2 font-medium text-gray-900">Rs. {(subtotal || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Discount:</span>
              <span className="ml-2 font-medium text-red-600">-Rs. {(discountAmount || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Tax:</span>
              <span className="ml-2 font-medium text-gray-900">+Rs. {(taxAmount || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-2 font-bold text-blue-900 text-lg">Rs. {(totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? 'Saving...' : (editData ? 'Update Sale' : 'Create Sale')}
          </button>
        </div>
      </form>
    </div>
  );
}
