import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaCalculator, FaPrint } from 'react-icons/fa';

export default function BagPurchaseForm({ purchase, suppliers, onClose, onSave }) {
  const [formData, setFormData] = useState({
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    bags: {
      ATA: { quantity: 0, unitPrice: 0, totalPrice: 0 },
      MAIDA: { quantity: 0, unitPrice: 0, totalPrice: 0 },
      SUJI: { quantity: 0, unitPrice: 0, totalPrice: 0 },
      FINE: { quantity: 0, unitPrice: 0, totalPrice: 0 }
    },
    subtotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    paidAmount: 0,
    deliveryDate: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = !!purchase;

  useEffect(() => {
    if (purchase) {
      setFormData({
        supplier: purchase.supplier?._id || purchase.supplier || '',
        purchaseDate: new Date(purchase.purchaseDate).toISOString().split('T')[0],
        bags: {
          ATA: { ...purchase.bags.ATA },
          MAIDA: { ...purchase.bags.MAIDA },
          SUJI: { ...purchase.bags.SUJI },
          FINE: { ...purchase.bags.FINE }
        },
        subtotal: purchase.subtotal || 0,
        tax: purchase.tax || 0,
        discount: purchase.discount || 0,
        totalAmount: purchase.totalAmount || 0,
        paymentMethod: purchase.paymentMethod || 'Cash',
        paymentStatus: purchase.paymentStatus || 'Pending',
        paidAmount: purchase.paidAmount || 0,
        deliveryDate: purchase.deliveryDate ? new Date(purchase.deliveryDate).toISOString().split('T')[0] : '',
        notes: purchase.notes || ''
      });
    }
  }, [purchase]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBagChange = (bagType, field, value) => {
    const newBags = { ...formData.bags };
    newBags[bagType][field] = parseFloat(value) || 0;
    
    // Calculate total price for this bag type
    newBags[bagType].totalPrice = newBags[bagType].quantity * newBags[bagType].unitPrice;
    
    setFormData(prev => ({
      ...prev,
      bags: newBags
    }));
    
    calculateTotals(newBags);
  };

  const calculateTotals = (bags = formData.bags) => {
    const subtotal = Object.values(bags).reduce((total, bag) => total + bag.totalPrice, 0);
    const totalAmount = subtotal + parseFloat(formData.tax || 0) - parseFloat(formData.discount || 0);
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      totalAmount
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const purchaseData = {
        ...formData,
        totalQuantity: Object.values(formData.bags).reduce((total, bag) => total + bag.quantity, 0),
        dueAmount: formData.totalAmount - formData.paidAmount
      };

      await onSave(purchaseData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Bag Purchase' : 'New Bag Purchase'}
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <FaTimes className="mr-2" />
              Close
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-600">Error: {error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier *
              </label>
              <select
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
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
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date
              </label>
              <input
                type="date"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bag Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bag Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(formData.bags).map(([bagType, bag]) => (
                <div key={bagType} className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-3">{bagType} Bags</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={bag.quantity}
                        onChange={(e) => handleBagChange(bagType, 'quantity', e.target.value)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Unit Price</label>
                      <input
                        type="number"
                        value={bag.unitPrice}
                        onChange={(e) => handleBagChange(bagType, 'unitPrice', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Total</label>
                      <input
                        type="number"
                        value={bag.totalPrice.toFixed(2)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtotal
                </label>
                <input
                  type="number"
                  value={formData.subtotal.toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax
                </label>
                <input
                  type="number"
                  name="tax"
                  value={formData.tax}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount
                </label>
                <input
                  type="number"
                  value={formData.totalAmount.toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid Amount
                </label>
                <input
                  type="number"
                  name="paidAmount"
                  value={formData.paidAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  max={formData.totalAmount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Amount
                </label>
                <input
                  type="number"
                  value={(formData.totalAmount - formData.paidAmount).toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about this purchase..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
            >
              <FaSave className="mr-2" />
              {loading ? 'Saving...' : (isEditing ? 'Update Purchase' : 'Create Purchase')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 