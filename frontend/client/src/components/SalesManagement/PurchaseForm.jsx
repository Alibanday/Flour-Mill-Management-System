import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaShoppingBag, FaCalculator, FaTruck, FaBoxes, FaSeedling, FaPlus, FaMinus } from 'react-icons/fa';

export default function PurchaseForm({ onSubmit, onCancel, editData = null, warehouses = [] }) {
  const [formData, setFormData] = useState({
    purchaseNumber: '',
    purchaseType: 'Bags',
    supplier: { 
      name: '', 
      contact: { phone: '', email: '', address: '' }, 
      type: 'Private',
      outstandingBalance: 0
    },
    purchaseDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    warehouse: '',
    paymentMethod: 'Cash',
    tax: 0,
    shippingCost: 0,
    notes: ''
  });

  const [bagsData, setBagsData] = useState({
    ata: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 },
    maida: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 },
    suji: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 },
    fine: { quantity: 0, unit: 'pcs', unitPrice: 0, totalPrice: 0 }
  });

  const [foodData, setFoodData] = useState({
    wheat: { 
      quantity: 0, 
      unit: 'kg', 
      unitPrice: 0, 
      totalPrice: 0, 
      source: 'Government', 
      quality: 'Standard',
      grade: 'A'
    }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        purchaseDate: new Date(editData.purchaseDate).toISOString().split('T')[0],
        deliveryDate: editData.deliveryDate ? new Date(editData.deliveryDate).toISOString().split('T')[0] : ''
      });
      if (editData.bags) setBagsData(editData.bags);
      if (editData.food) setFoodData(editData.food);
    }
  }, [editData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBagsChange = (bagType, field, value) => {
    setBagsData(prev => {
      const updated = {
        ...prev,
        [bagType]: { ...prev[bagType], [field]: value }
      };
      
      // Auto-calculate total price
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' ? (parseFloat(value) || 0) : (updated[bagType]?.quantity || 0);
        const unitPrice = field === 'unitPrice' ? (parseFloat(value) || 0) : (updated[bagType]?.unitPrice || 0);
        updated[bagType].totalPrice = quantity * unitPrice;
      }
      
      return updated;
    });
  };

  const handleFoodChange = (field, value) => {
    setFoodData(prev => {
      const updated = {
        ...prev,
        wheat: { ...prev.wheat, [field]: value }
      };
      
      // Auto-calculate total price
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' ? (parseFloat(value) || 0) : (updated.wheat?.quantity || 0);
        const unitPrice = field === 'unitPrice' ? (parseFloat(value) || 0) : (updated.wheat?.unitPrice || 0);
        updated.wheat.totalPrice = quantity * unitPrice;
      }
      
      return updated;
    });
  };

  const calculateTotals = () => {
    let bagsTotal = 0;
    let foodTotal = 0;

    if (formData.purchaseType === 'Bags' || formData.purchaseType === 'Other') {
      bagsTotal = Object.values(bagsData || {}).reduce((sum, bag) => sum + (bag.totalPrice || 0), 0) || 0;
    }

    if (formData.purchaseType === 'Food' || formData.purchaseType === 'Other') {
      foodTotal = (foodData?.wheat?.totalPrice || 0);
    }

    const subtotal = (bagsTotal || 0) + (foodTotal || 0);
    const totalAmount = (subtotal || 0) + (formData.tax || 0) + (formData.shippingCost || 0);

    return { bagsTotal, foodTotal, subtotal, totalAmount };
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.purchaseNumber.trim()) newErrors.purchaseNumber = 'Purchase number is required';
    if (!formData.supplier.name.trim()) newErrors.supplierName = 'Supplier name is required';
    if (!formData.warehouse) newErrors.warehouse = 'Warehouse is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';

    let hasItems = false;
    if (formData.purchaseType === 'Bags' || formData.purchaseType === 'Other') {
      hasItems = Object.values(bagsData || {}).some(bag => (bag?.quantity || 0) > 0);
    }
    if (formData.purchaseType === 'Food' || formData.purchaseType === 'Other') {
      hasItems = hasItems || ((foodData?.wheat?.quantity || 0) > 0);
    }
    if (!hasItems) newErrors.items = 'At least one item with quantity > 0 is required';

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
        bags: formData.purchaseType === 'Bags' || formData.purchaseType === 'Other' ? (bagsData || {}) : undefined,
        food: formData.purchaseType === 'Food' || formData.purchaseType === 'Other' ? (foodData || {}) : undefined
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { bagsTotal, foodTotal, subtotal, totalAmount } = calculateTotals();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {editData ? 'Edit Purchase' : 'New Purchase'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Purchase Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Number *
            </label>
            <input
              type="text"
              name="purchaseNumber"
              value={formData.purchaseNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.purchaseNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="PUR-001"
            />
            {errors.purchaseNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.purchaseNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Type *
            </label>
            <select
              name="purchaseType"
              value={formData.purchaseType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Bags">Bags</option>
              <option value="Food">Food (Wheat)</option>
              <option value="Other">Other (Bags + Food)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Date *
            </label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Supplier Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FaTruck className="mr-2" />
            Supplier Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Name *
              </label>
              <input
                type="text"
                name="supplier.name"
                value={formData.supplier.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.supplierName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Supplier Name"
              />
              {errors.supplierName && (
                <p className="mt-1 text-sm text-red-600">{errors.supplierName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Type
              </label>
              <select
                name="supplier.type"
                value={formData.supplier.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Government">Government</option>
                <option value="Private">Private</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Manufacturer">Manufacturer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outstanding Balance (Rs.)
              </label>
              <input
                type="number"
                name="supplier.outstandingBalance"
                value={formData.supplier.outstandingBalance}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="supplier.contact.phone"
                value={formData.supplier.contact.phone}
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
                name="supplier.contact.email"
                value={formData.supplier.contact.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="supplier@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="supplier.contact.address"
                value={formData.supplier.contact.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Supplier Address"
              />
            </div>
          </div>
        </div>

        {/* Bags Purchasing Section */}
        {(formData.purchaseType === 'Bags' || formData.purchaseType === 'Other') && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
              <FaBoxes className="mr-2" />
              Bags Purchasing Details
            </h3>
            
            <div className="space-y-4">
              {Object.entries(bagsData || {}).map(([bagType, bag]) => (
                <div key={bagType} className="bg-white p-4 rounded-lg border">
                  <h4 className="text-md font-medium text-gray-900 mb-3 capitalize">
                    {bagType.toUpperCase()} Bags
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={bag?.quantity || 0}
                        onChange={(e) => handleBagsChange(bagType, 'quantity', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <select
                        value={bag?.unit || 'pcs'}
                        onChange={(e) => handleBagsChange(bagType, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pcs">Pieces</option>
                        <option value="boxes">Boxes</option>
                        <option value="bundles">Bundles</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Price (Rs.)
                      </label>
                      <input
                        type="number"
                        value={bag?.unitPrice || 0}
                        onChange={(e) => handleBagsChange(bagType, 'unitPrice', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Price (Rs.)
                      </label>
                      <input
                        type="number"
                        value={bag?.totalPrice || 0}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Food Purchasing Section */}
        {(formData.purchaseType === 'Food' || formData.purchaseType === 'Other') && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-900 mb-4 flex items-center">
              <FaSeedling className="mr-2" />
              Food Purchasing Details (Wheat from Government)
            </h3>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={foodData?.wheat?.quantity || 0}
                    onChange={(e) => handleFoodChange('quantity', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    value={foodData?.wheat?.unit || 'kg'}
                    onChange={(e) => handleFoodChange('unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="tons">Tons</option>
                    <option value="bags">Bags</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Price (Rs.)
                  </label>
                  <input
                    type="number"
                    value={foodData?.wheat?.unitPrice || 0}
                    onChange={(e) => handleFoodChange('unitPrice', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Price (Rs.)
                  </label>
                  <input
                    type="number"
                    value={foodData?.wheat?.totalPrice || 0}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source
                  </label>
                  <select
                    value={foodData?.wheat?.source || 'Government'}
                    onChange={(e) => handleFoodChange('source', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality
                  </label>
                  <select
                    value={foodData?.wheat?.quality || 'Standard'}
                    onChange={(e) => handleFoodChange('quality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Premium">Premium</option>
                    <option value="Standard">Standard</option>
                    <option value="Economy">Economy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <select
                    value={foodData?.wheat?.grade || 'A'}
                    onChange={(e) => handleFoodChange('grade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Date
            </label>
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Cost (Rs.)
            </label>
            <input
              type="number"
              name="shippingCost"
              value={formData.shippingCost}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
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
              {warehouses.map((warehouse) => (
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

        {/* Purchase Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
            <FaCalculator className="mr-2" />
            Purchase Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {(formData.purchaseType === 'Bags' || formData.purchaseType === 'Other') && (
              <div>
                <span className="text-gray-600">Bags Total:</span>
                <span className="ml-2 font-medium text-gray-900">Rs. {(bagsTotal || 0).toFixed(2)}</span>
              </div>
            )}
            
            {(formData.purchaseType === 'Food' || formData.purchaseType === 'Other') && (
              <div>
                <span className="text-gray-600">Food Total:</span>
                <span className="ml-2 font-medium text-gray-900">Rs. {(foodTotal || 0).toFixed(2)}</span>
              </div>
            )}
            
            <div>
              <span className="text-gray-600">Subtotal:</span>
                              <span className="ml-2 font-medium text-gray-900">Rs. {(subtotal || 0).toFixed(2)}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Tax:</span>
                              <span className="ml-2 font-medium text-gray-900">+Rs. {(formData.tax || 0).toFixed(2)}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Shipping:</span>
                              <span className="ml-2 font-medium text-gray-900">+Rs. {(formData.shippingCost || 0).toFixed(2)}</span>
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
            {isSubmitting ? 'Saving...' : (editData ? 'Update Purchase' : 'Create Purchase')}
          </button>
        </div>
      </form>
    </div>
  );
}
