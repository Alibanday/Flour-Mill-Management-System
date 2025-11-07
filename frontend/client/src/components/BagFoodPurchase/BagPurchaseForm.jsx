import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaCalculator, FaPrint } from 'react-icons/fa';

export default function BagPurchaseForm({ purchase, suppliers, onClose, onSave }) {
  const [formData, setFormData] = useState({
    purchaseNumber: 'Auto-generated',
    supplier: '',
    productType: '',
    quantity: 0,
    unit: '',
    unitPrice: 0,
    totalPrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    paymentStatus: 'Pending',
    paidAmount: 0,
    remainingAmount: 0,
    warehouse: '',
    notes: '',
    receivingGatePass: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  const isEditing = !!purchase;

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      setWarehousesLoading(true);
      try {
        const response = await fetch('/api/warehouses');
        if (response.ok) {
          const data = await response.json();
          setWarehouses(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      } finally {
        setWarehousesLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (purchase) {
      console.log('Loading purchase data for editing:', purchase);
      
      // Extract supplier ID (handle both populated and non-populated)
      let supplierId = '';
      if (purchase.supplier) {
        if (typeof purchase.supplier === 'object' && purchase.supplier._id) {
          supplierId = purchase.supplier._id;
        } else if (typeof purchase.supplier === 'string') {
          supplierId = purchase.supplier;
        }
      }
      
      // Extract warehouse ID
      let warehouseId = '';
      if (purchase.warehouse) {
        if (typeof purchase.warehouse === 'object' && purchase.warehouse._id) {
          warehouseId = purchase.warehouse._id;
        } else if (typeof purchase.warehouse === 'string') {
          warehouseId = purchase.warehouse;
        }
      }
      
      // Extract bag data from bags structure (Map or object)
      let productType = '';
      let quantity = 0;
      let unit = '';
      let unitPrice = 0;
      let totalPrice = 0;
      
      if (purchase.bags) {
        let bagsObj = purchase.bags;
        
        // Handle Map structure - convert to object
        if (purchase.bags instanceof Map) {
          bagsObj = Object.fromEntries(purchase.bags);
        }
        // Handle serialized Map (when data comes from API, Maps are often serialized as objects)
        else if (purchase.bags.constructor && purchase.bags.constructor.name === 'Map') {
          // This shouldn't happen after serialization, but handle it anyway
          bagsObj = Object.fromEntries(Object.entries(purchase.bags));
        }
        // Handle object structure
        else if (typeof purchase.bags === 'object') {
          bagsObj = purchase.bags;
        }
        
        // Try to find the first bag type with quantity > 0, fallback to any bag type
        // Check both uppercase (ATA) and lowercase (ata) keys
        const bagTypes = [
          { keys: ['ATA', 'ata'], name: 'ATA' },
          { keys: ['MAIDA', 'maida'], name: 'MAIDA' },
          { keys: ['SUJI', 'suji'], name: 'SUJI' },
          { keys: ['FINE', 'fine'], name: 'FINE' }
        ];
        
        let foundBagWithQuantity = false;
        
        // First pass: look for bag types with quantity > 0
        for (const { keys, name } of bagTypes) {
          let bagData = null;
          for (const key of keys) {
            if (bagsObj[key] && bagsObj[key].quantity !== undefined) {
              bagData = bagsObj[key];
              break;
            }
          }
          
          if (bagData && bagData.quantity > 0) {
            productType = name;
            quantity = parseFloat(bagData.quantity) || 0;
            unit = bagData.unit || '50kg bags';
            unitPrice = parseFloat(bagData.unitPrice) || 0;
            totalPrice = parseFloat(bagData.totalPrice) || (quantity * unitPrice);
            console.log(`Found bag data with quantity for ${name}:`, { quantity, unit, unitPrice, totalPrice });
            foundBagWithQuantity = true;
            break;
          }
        }
        
        // Second pass: if no bag with quantity > 0, use the first one found
        if (!foundBagWithQuantity) {
          for (const { keys, name } of bagTypes) {
            let bagData = null;
            for (const key of keys) {
              if (bagsObj[key] && bagsObj[key].quantity !== undefined) {
                bagData = bagsObj[key];
                break;
              }
            }
            
            if (bagData) {
              productType = name;
              quantity = parseFloat(bagData.quantity) || 0;
              unit = bagData.unit || '50kg bags';
              unitPrice = parseFloat(bagData.unitPrice) || 0;
              totalPrice = parseFloat(bagData.totalPrice) || (quantity * unitPrice);
              console.log(`Found bag data for ${name} (quantity may be 0):`, { quantity, unit, unitPrice, totalPrice });
              break;
            }
          }
        }
      }
      
      // Fallback to direct properties if bags structure doesn't have data
      if (!productType && (purchase.productType || purchase.quantity)) {
        productType = purchase.productType || '';
        quantity = purchase.quantity || 0;
        unit = purchase.unit || '50kg bags';
        unitPrice = purchase.unitPrice || 0;
        totalPrice = purchase.totalPrice || purchase.totalAmount || 0;
      }
      
      // Calculate remaining amount
      const total = totalPrice || purchase.totalAmount || 0;
      const paid = purchase.paidAmount || 0;
      const remaining = total - paid;
      
      console.log('Extracted form data:', {
        productType,
        quantity,
        unit,
        unitPrice,
        totalPrice,
        supplierId,
        warehouseId
      });
      
      setFormData({
        purchaseNumber: purchase.purchaseNumber || '',
        supplier: supplierId,
        productType: productType,
        quantity: quantity,
        unit: unit,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        purchaseDate: purchase.purchaseDate 
          ? new Date(purchase.purchaseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        status: purchase.status || 'Pending',
        paymentStatus: purchase.paymentStatus || 'Pending',
        paidAmount: paid,
        remainingAmount: remaining,
        warehouse: warehouseId,
        notes: purchase.notes || '',
        receivingGatePass: purchase.receivingGatePass || false
      });
    } else {
      // Purchase number will be auto-generated by the backend
      setFormData(prev => ({
        ...prev,
        purchaseNumber: 'Auto-generated'
      }));
    }
  }, [purchase]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };
    
    // Calculate total price when quantity or unit price changes
    if (name === 'quantity' || name === 'unitPrice') {
      const quantity = name === 'quantity' ? parseFloat(value) || 0 : formData.quantity;
      const unitPrice = name === 'unitPrice' ? parseFloat(value) || 0 : formData.unitPrice;
      newFormData.totalPrice = quantity * unitPrice;
    }

    // Update unit when product type changes (default to 50kg bags for bag purchases)
    if (name === 'productType') {
      // Default unit for bag purchases is 50kg bags
      if (!newFormData.unit || newFormData.unit === '') {
        newFormData.unit = '50kg bags';
      }
    }

    // Calculate remaining amount when paid amount changes
    if (name === 'paidAmount') {
      const paidAmount = parseFloat(value) || 0;
      const totalPrice = newFormData.totalPrice || formData.totalPrice;
      newFormData.remainingAmount = totalPrice - paidAmount;
    }

    // Update remaining amount when total price changes
    if (name === 'quantity' || name === 'unitPrice') {
      const paidAmount = parseFloat(formData.paidAmount) || 0;
      const totalPrice = newFormData.totalPrice;
      newFormData.remainingAmount = totalPrice - paidAmount;
    }
    
    setFormData(newFormData);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Form submitted with data:', formData);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter suppliers to show only private suppliers
  const privateSuppliers = suppliers.filter(supplier => supplier.supplierType === 'Private');

  // Handle different action buttons
  const handlePrintInvoice = () => {
    window.print();
  };

  const handleSaveInvoice = async () => {
    await handleSubmit();
  };

  const handlePrintAndSave = async () => {
    await handleSubmit();
    setTimeout(() => {
      window.print();
    }, 1000);
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
                Purchase Number
              </label>
              <input
                type="text"
                name="purchaseNumber"
                value={formData.purchaseNumber}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="Auto-generated by system"
              />
              <p className="mt-1 text-xs text-gray-500">Purchase number will be generated automatically</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier * (Private Only)
              </label>
              <select
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select private supplier</option>
                {privateSuppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.supplierCode})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Only private suppliers are shown for bag purchases</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type * 
              </label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select bag type</option>
                <option value="ATA">ATA</option>
                <option value="MAIDA">MAIDA</option>
                <option value="SUJI">SUJI</option>
                <option value="FINE">FINE</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Select the type of bag (ATA, MAIDA, SUJI, or FINE)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select unit</option>
                <option value="50kg bags">50kg bags</option>
                <option value="25kg bags">25kg bags</option>
                <option value="20kg bags">20kg bags</option>
                <option value="15kg bags">15kg bags</option>
                <option value="10kg bags">10kg bags</option>
                <option value="5kg bags">5kg bags</option>
                <option value="100kg sacks">100kg sacks</option>
                <option value="50kg sacks">50kg sacks</option>
                <option value="25kg sacks">25kg sacks</option>
                <option value="bags">bags</option>
                <option value="pieces">pieces</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Select the unit for the bags</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price *
              </label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Price
              </label>
              <input
                type="number"
                value={formData.totalPrice.toFixed(2)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold"
              />
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
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
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
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Partial Payment Section */}
          {formData.paymentStatus === 'Partial' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-4">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid Amount *
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter paid amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    value={formData.totalPrice.toFixed(2)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remaining Amount
                  </label>
                  <input
                    type="number"
                    value={formData.remainingAmount.toFixed(2)}
                    readOnly
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md font-semibold ${
                      formData.remainingAmount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Warehouse Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse *
            </label>
            <select
              name="warehouse"
              value={formData.warehouse}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={warehousesLoading}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name} - {warehouse.location}
                </option>
              ))}
            </select>
            {warehousesLoading && (
              <p className="mt-1 text-xs text-gray-500">Loading warehouses...</p>
            )}
          </div>

          {/* Receiving Gate Pass Option */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="receivingGatePass"
                checked={formData.receivingGatePass}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm font-medium text-blue-800">
                Generate Receiving Gate Pass
              </label>
            </div>
            <p className="mt-1 text-xs text-blue-600">
              Check this box to generate a gate pass for receiving the goods
            </p>
          </div>
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
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handlePrintInvoice}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center"
              >
                <FaPrint className="mr-2" />
                Print Invoice
              </button>
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
              >
                <FaSave className="mr-2" />
                Save Invoice
              </button>
              <button
                type="button"
                onClick={handlePrintAndSave}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <FaPrint className="mr-2" />
                Print & Save
              </button>
            </div>
            <div className="flex space-x-3">
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
          </div>
        </form>
      </div>
    </div>
  );
} 