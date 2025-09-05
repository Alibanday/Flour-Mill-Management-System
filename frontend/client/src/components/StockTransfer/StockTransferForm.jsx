import React, { useState, useEffect } from 'react';
import { useValidation } from '../../utils/validation';
import FormField from '../UI/FormField';

const StockTransferForm = ({ warehouses, inventory, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    transferNumber: '',
    fromWarehouse: '',
    toWarehouse: '',
    transferType: 'Internal',
    priority: 'Normal',
    expectedDate: '',
    items: [],
    notes: '',
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableItems, setAvailableItems] = useState([]);

  const validationSchema = {
    fromWarehouse: { required: true },
    toWarehouse: { required: true },
    transferType: { required: true },
    expectedDate: { required: true },
    items: { required: true, minLength: 1 }
  };

  const { validateField, validateForm } = useValidation(validationSchema);

  useEffect(() => {
    // Filter available items based on selected warehouse
    if (formData.fromWarehouse) {
      const warehouseItems = inventory.filter(item => 
        item.warehouse === formData.fromWarehouse && item.quantity > 0
      );
      setAvailableItems(warehouseItems);
    } else {
      setAvailableItems([]);
    }
  }, [formData.fromWarehouse, inventory]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleBlur = (field) => {
    const error = validateField(field, formData);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemId: '',
        itemName: '',
        quantity: 0,
        unit: '',
        notes: ''
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleItemSelect = (index, itemId) => {
    const selectedItem = availableItems.find(item => item._id === itemId);
    if (selectedItem) {
      updateItem(index, 'itemId', itemId);
      updateItem(index, 'itemName', selectedItem.name);
      updateItem(index, 'unit', selectedItem.unit);
      updateItem(index, 'quantity', 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Create Stock Transfer
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transfer Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Transfer Number"
                  type="text"
                  value={formData.transferNumber}
                  onChange={(value) => handleInputChange('transferNumber', value)}
                  placeholder="Auto-generated"
                  disabled
                />
                <FormField
                  label="Transfer Type"
                  type="select"
                  value={formData.transferType}
                  onChange={(value) => handleInputChange('transferType', value)}
                  options={[
                    { value: 'Internal', label: 'Internal Transfer' },
                    { value: 'Emergency', label: 'Emergency Transfer' },
                    { value: 'Replenishment', label: 'Replenishment' },
                    { value: 'Consolidation', label: 'Consolidation' }
                  ]}
                  required
                />
                <FormField
                  label="From Warehouse"
                  type="select"
                  value={formData.fromWarehouse}
                  onChange={(value) => handleInputChange('fromWarehouse', value)}
                  onBlur={() => handleBlur('fromWarehouse')}
                  error={errors.fromWarehouse}
                  options={warehouses.map(warehouse => ({
                    value: warehouse._id,
                    label: warehouse.name
                  }))}
                  required
                />
                <FormField
                  label="To Warehouse"
                  type="select"
                  value={formData.toWarehouse}
                  onChange={(value) => handleInputChange('toWarehouse', value)}
                  onBlur={() => handleBlur('toWarehouse')}
                  error={errors.toWarehouse}
                  options={warehouses.filter(w => w._id !== formData.fromWarehouse).map(warehouse => ({
                    value: warehouse._id,
                    label: warehouse.name
                  }))}
                  required
                />
                <FormField
                  label="Priority"
                  type="select"
                  value={formData.priority}
                  onChange={(value) => handleInputChange('priority', value)}
                  options={[
                    { value: 'Low', label: 'Low' },
                    { value: 'Normal', label: 'Normal' },
                    { value: 'High', label: 'High' },
                    { value: 'Urgent', label: 'Urgent' }
                  ]}
                />
                <FormField
                  label="Expected Date"
                  type="date"
                  value={formData.expectedDate}
                  onChange={(value) => handleInputChange('expectedDate', value)}
                  onBlur={() => handleBlur('expectedDate')}
                  error={errors.expectedDate}
                  required
                />
              </div>
            </div>

            {/* Transfer Items */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Transfer Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Item
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No items added yet. Click "Add Item" to start.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item
                          </label>
                          <select
                            value={item.itemId}
                            onChange={(e) => handleItemSelect(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Item</option>
                            {availableItems.map(availableItem => (
                              <option key={availableItem._id} value={availableItem._id}>
                                {availableItem.name} (Available: {availableItem.quantity} {availableItem.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => updateItem(index, 'notes', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Optional notes"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Reason"
                type="textarea"
                value={formData.reason}
                onChange={(value) => handleInputChange('reason', value)}
                rows={3}
                placeholder="Reason for transfer"
              />
              <FormField
                label="Notes"
                type="textarea"
                value={formData.notes}
                onChange={(value) => handleInputChange('notes', value)}
                rows={3}
                placeholder="Additional notes"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.items.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockTransferForm;

