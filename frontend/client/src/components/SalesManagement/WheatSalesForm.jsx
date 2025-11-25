import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaUser, FaWarehouse, FaMoneyBillWave, FaBox, FaSpinner } from 'react-icons/fa';
import CustomerSearch from './CustomerSearch';

export default function WheatSalesForm({
  onSubmit,
  onCancel,
  editData = null,
  warehouses = [],
  wheatProduct = null
}) {
  const [formData, setFormData] = useState({
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
    },
    saleDate: new Date().toISOString().split('T')[0],
    warehouse: '',
    quantity: '', // in kg
    unitPrice: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
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
  const [wheatStock, setWheatStock] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);

  // Prefill unit price when wheat product is available (for new sales)
  useEffect(() => {
    if (!editData && wheatProduct?.price && !formData.unitPrice) {
      setFormData(prev => ({
        ...prev,
        unitPrice: wheatProduct.price.toString()
      }));
    }
  }, [wheatProduct, editData]);

  // Fetch wheat stock when warehouse changes
  useEffect(() => {
    const fetchWheatStock = async () => {
      if (!formData.warehouse) {
        setWheatStock(null);
        return;
      }

      setLoadingStock(true);
      try {
        const token = localStorage.getItem('token');
        
        // Use the warehouse inventory endpoint to get accurate wheat stock (same as ProductionForm)
        const response = await fetch(`http://localhost:7000/api/warehouses/${formData.warehouse}/inventory`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.inventory) {
            const inventory = data.data.inventory;
            const wheatInventory = inventory.wheat || {};
            
            // Get wheat stock from the inventory object
            // It uses currentStock if available, otherwise totalWheat
            const wheatStockValue = wheatInventory.currentStock !== undefined 
              ? wheatInventory.currentStock 
              : (wheatInventory.totalWheat || 0);
            
            setWheatStock({
              quantity: wheatStockValue,
              unit: 'kg',
              name: 'Wheat'
            });
          } else {
            // Fallback: fetch from inventory API and calculate manually
            const inventoryResponse = await fetch(`http://localhost:7000/api/inventory?warehouse=${formData.warehouse}&limit=1000`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (inventoryResponse.ok) {
              const inventoryData = await inventoryResponse.json();
              const inventoryItems = inventoryData.data || [];
              
              // Filter for wheat items - match the exact logic from warehouse controller
              let totalStock = 0;
              inventoryItems.forEach(item => {
                const normalizedCategory = (item.category || item.product?.category || '').toLowerCase();
                const normalizedName = (item.name || item.product?.name || '').toLowerCase();
                const normalizedSubcategory = (item.subcategory || item.product?.subcategory || '').toLowerCase();
                
                // Check if it's wheat (same logic as warehouse controller)
                if (normalizedCategory.includes('wheat') || 
                    normalizedName.includes('wheat') ||
                    normalizedSubcategory.includes('wheat') ||
                    normalizedName.includes('grain') ||
                    normalizedCategory.includes('raw materials')) {
                  const stock = item.currentStock !== undefined ? item.currentStock : (item.weight || 0);
                  totalStock += stock;
                }
              });
              
              setWheatStock({
                quantity: totalStock,
                unit: 'kg',
                name: 'Wheat'
              });
            } else {
              setWheatStock({ quantity: 0, unit: 'kg', name: 'Wheat' });
            }
          }
        } else {
          console.error('Failed to fetch warehouse inventory:', response.status);
          setWheatStock({ quantity: 0, unit: 'kg', name: 'Wheat' });
        }
      } catch (error) {
        console.error('Error fetching wheat stock:', error);
        setWheatStock({ quantity: 0, unit: 'kg', name: 'Wheat' });
      } finally {
        setLoadingStock(false);
      }
    };

    fetchWheatStock();
  }, [formData.warehouse]);

  // Load edit data
  useEffect(() => {
    if (editData) {
      const customerId = editData.customerId || editData.customer?.customerId || editData.customer?._id;
      const warehouseId = typeof editData.warehouse === 'object'
        ? editData.warehouse._id || editData.warehouse
        : editData.warehouse;

      let paymentStatus = editData.paymentStatus || 'Unpaid';
      if (paymentStatus === 'Pending') paymentStatus = 'Unpaid';
      if (paymentStatus === 'Paid') paymentStatus = 'Total Paid';

      const customerData = editData.customer || {};
      const saleDate = editData.saleDate
        ? new Date(editData.saleDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      // Extract wheat item (assuming first item is wheat)
      const wheatItem = editData.items && editData.items.length > 0 ? editData.items[0] : null;

      // Format address - convert object to string if needed (for edit mode)
      let formattedAddress = '';
      const addressObj = customerData.contact?.address;
      if (addressObj) {
        if (typeof addressObj === 'object') {
          const addressParts = [];
          if (addressObj.street) addressParts.push(addressObj.street);
          if (addressObj.city) addressParts.push(addressObj.city);
          if (addressObj.state) addressParts.push(addressObj.state);
          if (addressObj.zipCode) addressParts.push(addressObj.zipCode);
          if (addressObj.country) addressParts.push(addressObj.country);
          formattedAddress = addressParts.join(', ');
        } else {
          formattedAddress = addressObj.toString();
        }
      }
      
      setFormData({
        customerId: customerId || '',
        customer: {
          name: customerData.name || '',
          contact: {
            phone: customerData.contact?.phone || '',
            email: customerData.contact?.email || '',
            address: formattedAddress // Always a string
          },
          creditLimit: customerData.creditLimit || 0,
          outstandingBalance: customerData.outstandingBalance || customerData.creditUsed || 0
        },
        saleDate: saleDate,
        warehouse: warehouseId || '',
        quantity: wheatItem ? wheatItem.quantity.toString() : '',
        unitPrice: wheatItem ? wheatItem.unitPrice.toString() : '',
        paymentMethod: editData.paymentMethod || 'Cash',
        paymentStatus: paymentStatus,
        paidAmount: parseFloat(editData.paidAmount) || 0,
        discount: editData.discount || { type: 'none', value: 0, amount: 0 },
        tax: parseFloat(editData.tax) || 0,
        notes: editData.notes || ''
      });
    }
  }, [editData]);

  const handleInputChange = (e) => {
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

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [name]: numValue === '' ? '' : (isNaN(numValue) ? prev[name] : numValue)
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDiscountChange = (field, value) => {
    setFormData(prev => {
      const discount = { ...prev.discount };
      discount[field] = field === 'value' ? parseFloat(value) || 0 : value;
      
      // Calculate discount amount
      const subtotal = calculateSubtotal();
      if (discount.type === 'percentage') {
        discount.amount = (subtotal * discount.value) / 100;
      } else if (discount.type === 'fixed') {
        discount.amount = discount.value;
      } else {
        discount.amount = 0;
      }

      return { ...prev, discount };
    });
  };

  const calculateSubtotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    return quantity * unitPrice;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = formData.discount.amount || 0;
    const taxAmount = parseFloat(formData.tax) || 0;
    return subtotal - discountAmount + taxAmount;
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomerObj(customer);
    
    // Format address - convert object to string if needed
    let formattedAddress = '';
    const addressObj = customer.address || customer.contact?.address;
    if (addressObj) {
      if (typeof addressObj === 'object') {
        // Convert address object to string
        const addressParts = [];
        if (addressObj.street) addressParts.push(addressObj.street);
        if (addressObj.city) addressParts.push(addressObj.city);
        if (addressObj.state) addressParts.push(addressObj.state);
        if (addressObj.zipCode) addressParts.push(addressObj.zipCode);
        if (addressObj.country) addressParts.push(addressObj.country);
        formattedAddress = addressParts.join(', ');
      } else {
        formattedAddress = addressObj.toString();
      }
    }
    
    setFormData(prev => ({
      ...prev,
      customerId: customer._id || customer.customerId,
      customer: {
        name: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        contact: {
          phone: customer.phone || customer.contact?.phone || '',
          email: customer.email || customer.contact?.email || '',
          address: formattedAddress // Always a string
        },
        creditLimit: customer.creditLimit || 0,
        outstandingBalance: customer.outstandingBalance || customer.creditUsed || 0
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId || !formData.customer.name) {
      newErrors.customer = 'Customer is required';
    }

    if (!formData.warehouse) {
      newErrors.warehouse = 'Warehouse is required';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity (kg) is required and must be greater than 0';
    }

    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      newErrors.unitPrice = 'Unit price is required and must be greater than 0';
    }

    // Check stock availability
    if (wheatStock && formData.quantity) {
      const requestedQuantity = parseFloat(formData.quantity);
      if (requestedQuantity > wheatStock.quantity) {
        newErrors.quantity = `Insufficient stock! Available: ${wheatStock.quantity} ${wheatStock.unit}`;
      }
    }

    if (!formData.saleDate) {
      newErrors.saleDate = 'Sale date is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    const paidAmount = parseFloat(formData.paidAmount) || 0;
    const totalAmount = calculateTotal();

    if (paidAmount > totalAmount) {
      newErrors.paidAmount = 'Paid amount cannot exceed total amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const subtotal = calculateSubtotal();
    const discountAmount = formData.discount.amount || 0;
    const taxAmount = parseFloat(formData.tax) || 0;
    const totalAmount = subtotal - discountAmount + taxAmount;
    const paidAmountValue = parseFloat(formData.paidAmount) || 0;
    const dueAmount = totalAmount - paidAmountValue;

    // Determine payment status
    let paymentStatus = formData.paymentStatus;
    if (!paymentStatus) {
      if (paidAmountValue >= totalAmount) {
        paymentStatus = 'Total Paid';
      } else if (paidAmountValue > 0) {
        paymentStatus = 'Partial';
      } else {
        paymentStatus = 'Unpaid';
      }
    }

    if (!wheatProduct?._id) {
      setErrors({ submit: 'Wheat product not found in catalog. Please add Wheat to the catalog first.' });
      setIsSubmitting(false);
      return;
    }

    // Prepare sale data - backend expects Product catalog ID in item.product
    const saleData = {
      customerId: formData.customerId,
      customer: {
        ...formData.customer,
        customerId: formData.customerId
      },
      saleDate: formData.saleDate,
      warehouse: formData.warehouse,
      items: [{
        product: wheatProduct._id, // Product catalog ID (backend will find inventory from this + warehouse)
        productName: 'Wheat',
        quantity: parseFloat(formData.quantity),
        unit: 'kg',
        unitPrice: parseFloat(formData.unitPrice),
        totalPrice: subtotal
      }],
      subtotal: subtotal,
      totalAmount: totalAmount,
      discount: formData.discount,
      tax: taxAmount,
      paymentMethod: formData.paymentMethod,
      paymentStatus: paymentStatus,
      paidAmount: paidAmountValue,
      remainingAmount: dueAmount,
      dueAmount: dueAmount,
      notes: formData.notes || ''
    };

    try {
      await onSubmit(saleData);
    } catch (error) {
      console.error('Error submitting wheat sale:', error);
      setErrors({ submit: error.message || 'Failed to create sale' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = calculateSubtotal();
  const discountAmount = formData.discount.amount || 0;
  const taxAmount = parseFloat(formData.tax) || 0;
  const totalAmount = calculateTotal();
  const paidAmount = parseFloat(formData.paidAmount) || 0;
  const dueAmount = totalAmount - paidAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {editData ? 'Edit Wheat Sale' : 'New Wheat Sale'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <FaTimes className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaUser className="inline mr-2" />
              Customer *
            </label>
            <CustomerSearch
              onCustomerSelect={handleCustomerSelect}
              selectedCustomer={selectedCustomerObj}
            />
            {errors.customer && (
              <p className="mt-1 text-sm text-red-600">{errors.customer}</p>
            )}
          </div>

          {/* Sale Date and Warehouse */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Date *
              </label>
              <input
                type="date"
                name="saleDate"
                value={formData.saleDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.saleDate && (
                <p className="mt-1 text-sm text-red-600">{errors.saleDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaWarehouse className="inline mr-2" />
                Warehouse *
              </label>
              <select
                name="warehouse"
                value={formData.warehouse}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(wh => (
                  <option key={wh._id} value={wh._id}>{wh.name}</option>
                ))}
              </select>
              {errors.warehouse && (
                <p className="mt-1 text-sm text-red-600">{errors.warehouse}</p>
              )}
            </div>
          </div>

          {/* Wheat Stock Display */}
          {formData.warehouse && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              {loadingStock ? (
                <div className="flex items-center">
                  <FaSpinner className="animate-spin text-blue-600 mr-2" />
                  <span className="text-blue-700">Loading stock...</span>
                </div>
              ) : wheatStock ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Current Stock:</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {wheatStock.quantity.toLocaleString()} {wheatStock.unit}
                    </p>
                  </div>
                  <FaBox className="text-3xl text-blue-400" />
                </div>
              ) : (
                <p className="text-blue-700">No wheat stock found in this warehouse</p>
              )}
            </div>
          )}

          {/* Product: Wheat (Fixed) */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product
            </label>
            <input
              type="text"
              value="Wheat"
              disabled
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Quantity and Unit Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (kg) *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity in kg"
                required
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price (Rs./kg) *
              </label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price per kg"
                required
              />
              {errors.unitPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
              )}
            </div>
          </div>

          {/* Discount */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <select
                  value={formData.discount.type}
                  onChange={(e) => handleDiscountChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              {formData.discount.type !== 'none' && (
                <div>
                  <input
                    type="number"
                    value={formData.discount.value || 0}
                    onChange={(e) => handleDiscountChange('value', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.discount.type === 'percentage' ? 'Percentage' : 'Amount'}
                  />
                </div>
              )}
              {formData.discount.amount > 0 && (
                <div className="flex items-center text-gray-700">
                  <span className="text-sm">Discount: Rs. {formData.discount.amount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tax */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax (Rs.)
            </label>
            <input
              type="number"
              name="tax"
              value={formData.tax}
              onChange={handleNumberChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tax amount"
            />
          </div>

          {/* Payment Details */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partial">Partial</option>
                  <option value="Total Paid">Total Paid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid Amount (Rs.)
              </label>
              <input
                type="number"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                max={totalAmount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter paid amount"
              />
              {errors.paidAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.paidAmount}</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">Rs. {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>- Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>Rs. {taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                <span>Total Amount:</span>
                <span>Rs. {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid Amount:</span>
                <span>Rs. {paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-orange-600 font-semibold">
                <span>Due Amount:</span>
                <span>Rs. {dueAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {editData ? 'Update Sale' : 'Create Sale'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
