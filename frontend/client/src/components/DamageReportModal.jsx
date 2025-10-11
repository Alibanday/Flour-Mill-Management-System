import React, { useState, useEffect } from 'react';
import { FaTimes, FaExclamationTriangle, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function DamageReportModal({ isOpen, onClose, warehouseId, onReportSubmitted }) {
  const [formData, setFormData] = useState({
    inventoryItem: '',
    quantityDamaged: '',
    reason: '',
    severity: 'Medium',
    description: '',
    estimatedLoss: '',
    damageDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [stockItems, setStockItems] = useState([]);

  const damageReasons = [
    'Water Damage',
    'Fire Damage', 
    'Physical Damage',
    'Expired/Expired',
    'Contamination',
    'Pest Damage',
    'Temperature Damage',
    'Handling Error',
    'Transportation Damage',
    'Other'
  ];

  const severityLevels = [
    { value: 'Low', label: 'Low', color: 'text-green-600' },
    { value: 'Medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'High', label: 'High', color: 'text-orange-600' },
    { value: 'Critical', label: 'Critical', color: 'text-red-600' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchStockItems();
      // Reset form when modal opens
      setFormData({
        inventoryItem: '',
        quantityDamaged: '',
        reason: '',
        severity: 'Medium',
        description: '',
        estimatedLoss: '',
        damageDate: new Date().toISOString().split('T')[0]
      });
      setErrors({});
    }
  }, [isOpen, warehouseId]);

  const fetchStockItems = async () => {
    try {
      // Mock data - replace with actual API call
      const mockStockItems = [
        { _id: '1', name: 'Wheat Flour', code: 'WF001', currentStock: 150 },
        { _id: '2', name: 'Maida', code: 'MD002', currentStock: 25 },
        { _id: '3', name: 'Wheat Grain', code: 'WG003', currentStock: 0 }
      ];
      setStockItems(mockStockItems);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      toast.error('Failed to fetch stock items');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.inventoryItem) {
      newErrors.inventoryItem = 'Please select an inventory item';
    }

    if (!formData.quantityDamaged || formData.quantityDamaged <= 0) {
      newErrors.quantityDamaged = 'Please enter a valid quantity';
    } else {
      const selectedItem = stockItems.find(item => item._id === formData.inventoryItem);
      if (selectedItem && parseInt(formData.quantityDamaged) > selectedItem.currentStock) {
        newErrors.quantityDamaged = `Quantity cannot exceed current stock (${selectedItem.currentStock})`;
      }
    }

    if (!formData.reason) {
      newErrors.reason = 'Please select a reason for damage';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a detailed description';
    }

    if (!formData.damageDate) {
      newErrors.damageDate = 'Please select the damage date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Mock API call - replace with actual API call
      const damageReport = {
        ...formData,
        warehouseId,
        quantityDamaged: parseInt(formData.quantityDamaged),
        estimatedLoss: formData.estimatedLoss ? parseFloat(formData.estimatedLoss) : 0,
        status: 'Reported',
        createdAt: new Date()
      };

      console.log('Submitting damage report:', damageReport);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Damage report submitted successfully');
      onReportSubmitted && onReportSubmitted(damageReport);
      onClose();
    } catch (error) {
      console.error('Error submitting damage report:', error);
      toast.error('Failed to submit damage report');
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = stockItems.find(item => item._id === formData.inventoryItem);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Report Damaged Stock</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Inventory Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inventory Item *
            </label>
            <select
              name="inventoryItem"
              value={formData.inventoryItem}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.inventoryItem ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select an item</option>
              {stockItems.map(item => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.code}) - Stock: {item.currentStock}
                </option>
              ))}
            </select>
            {errors.inventoryItem && (
              <p className="mt-1 text-sm text-red-600">{errors.inventoryItem}</p>
            )}
          </div>

          {/* Quantity and Reason Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Damaged *
              </label>
              <input
                type="number"
                name="quantityDamaged"
                value={formData.quantityDamaged}
                onChange={handleInputChange}
                min="1"
                max={selectedItem?.currentStock || ''}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.quantityDamaged ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter quantity"
              />
              {errors.quantityDamaged && (
                <p className="mt-1 text-sm text-red-600">{errors.quantityDamaged}</p>
              )}
              {selectedItem && (
                <p className="mt-1 text-sm text-gray-500">
                  Available stock: {selectedItem.currentStock}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Damage *
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select reason</option>
                {damageReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>
          </div>

          {/* Severity and Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level
              </label>
              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {severityLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Damage Date *
              </label>
              <input
                type="date"
                name="damageDate"
                value={formData.damageDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.damageDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.damageDate && (
                <p className="mt-1 text-sm text-red-600">{errors.damageDate}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Provide detailed description of the damage..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Estimated Loss */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Financial Loss (Optional)
            </label>
            <div className="flex">
              <input
                type="number"
                name="estimatedLoss"
                value={formData.estimatedLoss}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter estimated loss amount"
              />
              <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                PKR
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <FaSave className="mr-2" />
              )}
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
