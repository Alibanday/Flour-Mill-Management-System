import React, { useState, useEffect, useMemo } from 'react';
import FormField from '../UI/FormField';
import api, { API_ENDPOINTS } from '../../services/api';

const StockTransferForm = ({ warehouses, inventory, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    transferNumber: '',
    fromWarehouse: '',
    toWarehouse: '',
    expectedDate: '',
    items: [],
    notes: '',
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableItems, setAvailableItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');

  const validationSchema = {
    fromWarehouse: { required: true },
    toWarehouse: { required: true },
    expectedDate: { required: true },
    items: { required: true, minLength: 1 }
  };

  const validateFieldValue = (field, value) => {
    const rules = validationSchema[field];
    if (!rules) return null;

    if (rules.required) {
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      const isEmptyString = typeof value === 'string' && value.trim() === '';
      const isEmpty = value === null || value === undefined || value === '' || isEmptyArray || isEmptyString;
      if (isEmpty) {
        return 'This field is required';
      }
    }

    if (rules.minLength && Array.isArray(value) && value.length < rules.minLength) {
      return `Please add at least ${rules.minLength} item(s)`;
    }

    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(validationSchema).forEach(field => {
      const error = validateFieldValue(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    setErrors(newErrors);
    return newErrors;
  };

  const mapInventoryItems = (items = []) => {
    return items
      .map(item => {
        const quantity = item.currentStock ?? item.quantity ?? item.weight ?? 0;
        const name = item.name || item.product?.name || item.productName || 'Unnamed Item';
        const unit = item.unit || item.product?.unit || item.measurementUnit || 'units';
        const warehouseId =
          (typeof item.warehouse === 'object' ? item.warehouse?._id : item.warehouse) || formData.fromWarehouse;
        const warehouseName =
          (typeof item.warehouse === 'object' ? item.warehouse?.name : item.warehouseName) ||
          warehouses.find(w => w._id === warehouseId)?.name;

        return {
          _id: item._id,
          name,
          quantity,
          unit,
          warehouseId,
          warehouseName: warehouseName || 'Selected Warehouse'
        };
      })
      .filter(item => item.quantity > 0);
  };

  useEffect(() => {
    const fetchWarehouseInventory = async () => {
      if (!formData.fromWarehouse) {
        setAvailableItems([]);
        return;
      }
      setInventoryError('');
      setInventoryLoading(true);
      try {
        const response = await api.get(API_ENDPOINTS.INVENTORY.BY_WAREHOUSE(formData.fromWarehouse), {
          params: { includeSummary: true }
        });
        if (response.data?.success) {
          const mapped = mapInventoryItems(response.data.data || []);
          if (!mapped.length) {
            setInventoryError('No available stock in the selected warehouse.');
          }
          setAvailableItems(mapped);
        } else {
          throw new Error(response.data?.message || 'Failed to load inventory');
        }
      } catch (error) {
        console.error('Error fetching warehouse inventory:', error);
        setInventoryError('Unable to load live stock levels for this warehouse.');
        setAvailableItems([]);
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchWarehouseInventory();
  }, [formData.fromWarehouse]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'fromWarehouse' ? { items: [] } : {})
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
    const error = validateFieldValue(field, formData[field]);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
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
    
    if (loading) return;

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const normalizedItems = formData.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        requestedQuantity: Number(item.quantity),
        actualQuantity: Number(item.actualQuantity ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
        inventoryItem: item.itemId || item.inventoryItem
      }));

      await onSubmit({ ...formData, items: normalizedItems });
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

              {inventoryError && (
                <div className="mb-3 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                  {inventoryError}
                </div>
              )}

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
                            disabled={!formData.fromWarehouse || inventoryLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            <option value="">
                              {formData.fromWarehouse
                                ? inventoryLoading
                                  ? 'Loading items...'
                                  : availableItems.length
                                    ? 'Select Item'
                                    : 'No stock available'
                                : 'Select warehouse first'}
                            </option>
                            {availableItems.map(availableItem => (
                              <option key={availableItem._id} value={availableItem._id}>
                                {availableItem.name} — Total: {availableItem.quantity} {availableItem.unit}
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
                aria-disabled={loading}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  loading
                    ? 'bg-blue-400 text-white cursor-not-allowed opacity-70'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
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

