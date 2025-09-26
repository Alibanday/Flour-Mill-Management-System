import React, { useState, useEffect } from 'react';
import { FaExchangeAlt, FaWarehouse, FaBoxes, FaArrowRight } from 'react-icons/fa';
import api, { API_ENDPOINTS } from '../../services/api';
import { toast } from 'react-toastify';

export default function StockTransfer({ onTransferComplete }) {
  const [formData, setFormData] = useState({
    inventoryItem: '',
    fromWarehouse: '',
    toWarehouse: '',
    quantity: '',
    reason: '',
    referenceNumber: ''
  });

  const [inventoryItems, setInventoryItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [availableStock, setAvailableStock] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        await Promise.all([
          loadWarehouses(),
          loadInventoryItems()
        ]);
      } catch (error) {
        console.error('Error loading transfer data:', error);
      } finally {
        setDataLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (formData.inventoryItem && formData.fromWarehouse) {
      loadAvailableStock();
    }
  }, [formData.inventoryItem, formData.fromWarehouse]);

  const loadWarehouses = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.WAREHOUSES.GET_ALL);
      if (response.data.success) {
        setWarehouses(response.data.data);
        console.log("StockTransfer: Warehouses loaded:", response.data.data?.length || 0, "warehouses");
      } else {
        console.error("Invalid warehouse response:", response.data);
        setWarehouses([]);
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
      setWarehouses([]);
    }
  };

  const loadInventoryItems = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.INVENTORY.GET_ALL);
      if (response.data.success) {
        setInventoryItems(response.data.data);
        console.log("StockTransfer: Inventory items loaded:", response.data.data?.length || 0, "items");
      } else {
        console.error("Invalid inventory response:", response.data);
        setInventoryItems([]);
      }
    } catch (error) {
      console.error('Error loading inventory items:', error);
      setInventoryItems([]);
    }
  };

  const loadAvailableStock = async () => {
    try {
      const item = inventoryItems.find(item => item._id === formData.inventoryItem);
      if (item) {
        // Handle both string and object warehouse references
        const itemWarehouseId = typeof item.warehouse === 'object' ? item.warehouse._id : item.warehouse;
        if (itemWarehouseId === formData.fromWarehouse) {
          setAvailableStock(item.currentStock);
        } else {
          setAvailableStock(0);
        }
      } else {
        setAvailableStock(0);
      }
    } catch (error) {
      console.error('Error loading available stock:', error);
      setAvailableStock(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.inventoryItem || !formData.fromWarehouse || !formData.toWarehouse || !formData.quantity) {
      toast.error('Please fill all required fields');
        return;
      }

    if (formData.fromWarehouse === formData.toWarehouse) {
      toast.error('Source and destination warehouses cannot be the same');
      return;
    }

    if (parseFloat(formData.quantity) > availableStock) {
      toast.error(`Insufficient stock. Available: ${availableStock}`);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(API_ENDPOINTS.STOCK.TRANSFER_BETWEEN, {
        inventoryItem: formData.inventoryItem,
        fromWarehouse: formData.fromWarehouse,
        toWarehouse: formData.toWarehouse,
        quantity: parseFloat(formData.quantity),
        reason: formData.reason,
        referenceNumber: formData.referenceNumber
      });

      if (response.data.success) {
        toast.success('Stock transferred successfully!');
        setFormData({
          inventoryItem: '',
          fromWarehouse: '',
          toWarehouse: '',
          quantity: '',
          reason: '',
          referenceNumber: ''
        });
        setAvailableStock(0);
        if (onTransferComplete) {
          onTransferComplete();
        }
        
        // Trigger stock update event for real-time updates
        window.dispatchEvent(new CustomEvent('stockUpdated'));
        window.dispatchEvent(new CustomEvent('inventoryUpdated')); // Also trigger inventory refresh
      } else {
        toast.error(response.data.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Reset inventory item when warehouse changes
    if (name === 'fromWarehouse') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        inventoryItem: '', // Clear inventory selection
        quantity: '' // Clear quantity
      }));
      setAvailableStock(0);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const filteredInventoryItems = inventoryItems.filter(item => {
    // Handle both string and object warehouse references
    const itemWarehouseId = typeof item.warehouse === 'object' ? item.warehouse._id : item.warehouse;
    return itemWarehouseId === formData.fromWarehouse;
  });

  if (dataLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-lg text-gray-700">Loading transfer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaExchangeAlt className="text-blue-600 text-2xl mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Stock Transfer</h2>
        </div>
        <div className="text-sm text-gray-500">
          {warehouses.length} warehouses, {inventoryItems.length} items loaded
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* From Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Warehouse *
              </label>
            <div className="relative">
              <FaWarehouse className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                name="fromWarehouse"
                value={formData.fromWarehouse}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Source Warehouse</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </div>
            </div>

          {/* To Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Warehouse *
              </label>
            <div className="relative">
              <FaWarehouse className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                name="toWarehouse"
                value={formData.toWarehouse}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Destination Warehouse</option>
                {warehouses.filter(w => w._id !== formData.fromWarehouse).map(warehouse => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inventory Item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inventory Item *
            </label>
            <select
              name="inventoryItem"
              value={formData.inventoryItem}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={!formData.fromWarehouse}
            >
              <option value="">
                {!formData.fromWarehouse 
                  ? "Select warehouse first" 
                  : "Select Inventory Item"
                }
              </option>
              {filteredInventoryItems.length === 0 && formData.fromWarehouse ? (
                <option value="" disabled>No items available in selected warehouse</option>
              ) : (
                filteredInventoryItems.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.name} ({item.code}) - Stock: {item.currentStock} {item.unit}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Available Stock Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Stock
            </label>
            <div className="px-4 py-3 bg-gray-100 rounded-lg">
              <span className="text-lg font-semibold text-gray-800">
                {availableStock} {inventoryItems.find(item => item._id === formData.inventoryItem)?.unit || 'units'}
              </span>
            </div>
          </div>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quantity */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Quantity *
              </label>
            <div className="relative">
              <FaBoxes className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity"
                min="0.01"
                step="0.01"
                max={availableStock}
                required
              />
            </div>
            {availableStock > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Maximum: {availableStock} {inventoryItems.find(item => item._id === formData.inventoryItem)?.unit || 'units'}
                </p>
              )}
            </div>

          {/* Reference Number */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                name="referenceNumber"
              value={formData.referenceNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Optional reference number"
              />
            </div>
          </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transfer Reason
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter reason for transfer (optional)"
            rows="3"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
            <button
              type="submit"
            disabled={loading || !formData.inventoryItem || !formData.fromWarehouse || !formData.toWarehouse || !formData.quantity}
            className={`px-8 py-3 rounded-lg font-semibold flex items-center ${
              loading || !formData.inventoryItem || !formData.fromWarehouse || !formData.toWarehouse || !formData.quantity
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            >
              {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Transferring...
              </>
              ) : (
              <>
                <FaArrowRight className="mr-2" />
                Transfer Stock
              </>
              )}
            </button>
        </div>
      </form>
    </div>
  );
}