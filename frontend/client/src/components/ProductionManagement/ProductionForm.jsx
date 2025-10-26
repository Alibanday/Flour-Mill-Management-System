import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaIndustry, FaPlus, FaTrash, FaWarehouse } from 'react-icons/fa';

export default function ProductionForm({ onSubmit, onCancel, editData = null, warehouses = [] }) {
  const [formData, setFormData] = useState({
    batchNumber: '', // Auto-generated, read-only
    warehouse: '', // Source warehouse
    wheatQuantity: '', // Quantity in kg
    productionDate: new Date().toISOString().split('T')[0],
    outputProducts: [{ // Multiple output products
      productName: '',
      weight: '',
      quantity: '',
      unit: 'bags'
    }],
    destinationWarehouse: '', // Where to add output products
    wastage: {
      quantity: 0,
      reason: 'Processing Loss'
    },
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [currentWheatStock, setCurrentWheatStock] = useState(0);

  // Fetch inventory items when component mounts
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const response = await fetch('http://localhost:7000/api/inventory', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Filter for finished goods (Bags)
          const bagItems = (data.data || []).filter(item => 
            item.category === 'Finished Goods' && item.subcategory === 'Bags'
          );
          setInventoryItems(bagItems);
        }
      } catch (error) {
        console.error('Error fetching inventory items:', error);
      }
    };

    fetchInventoryItems();
  }, []);

  // Fetch wheat stock when warehouse is selected
  useEffect(() => {
    if (formData.warehouse) {
      fetchWheatStock(formData.warehouse);
    }
  }, [formData.warehouse]);

  const fetchWheatStock = async (warehouseId) => {
    try {
      // Find wheat stock from Stock movements for this warehouse
      const response = await fetch('http://localhost:7000/api/stocks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter for wheat stock in this warehouse
        const wheatStocks = (data.data || []).filter(stock => {
          return stock.warehouse === warehouseId && 
                 stock.inventoryItem?.subcategory === 'Wheat';
        });
        
        // Calculate total wheat stock from movements
        let totalStock = 0;
        wheatStocks.forEach(stock => {
          if (stock.movementType === 'in') {
            totalStock += stock.quantity;
          } else if (stock.movementType === 'out') {
            totalStock -= stock.quantity;
          }
        });
        
        setCurrentWheatStock(totalStock);
      }
    } catch (error) {
      console.error('Error fetching wheat stock:', error);
      setCurrentWheatStock(0);
    }
  };

  // Calculate wastage
  useEffect(() => {
    const wheatQty = parseFloat(formData.wheatQuantity) || 0;
    const totalOutput = formData.outputProducts.reduce((total, product) => {
      const weight = parseFloat(product.weight) || 0;
      const qty = parseFloat(product.quantity) || 0;
      return total + (weight * qty);
    }, 0);
    
    const wastage = wheatQty - totalOutput;
    
    setFormData(prev => ({
      ...prev,
      wastage: {
        ...prev.wastage,
        quantity: wastage > 0 ? wastage : 0
      }
    }));
  }, [formData.wheatQuantity, formData.outputProducts]);

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
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOutputProductChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      outputProducts: prev.outputProducts.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const addOutputProduct = () => {
    setFormData(prev => ({
      ...prev,
      outputProducts: [...prev.outputProducts, {
        productName: '',
        weight: '',
        quantity: '',
        unit: 'bags'
      }]
    }));
  };

  const removeOutputProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      outputProducts: prev.outputProducts.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.warehouse) {
      newErrors.warehouse = 'Source warehouse is required';
    }

    if (!formData.wheatQuantity || parseFloat(formData.wheatQuantity) <= 0) {
      newErrors.wheatQuantity = 'Wheat quantity is required';
    }

    if (parseFloat(formData.wheatQuantity) > currentWheatStock) {
      newErrors.wheatQuantity = 'Insufficient wheat stock available';
    }

    if (formData.outputProducts.length === 0) {
      newErrors.outputProducts = 'At least one output product is required';
    }

    formData.outputProducts.forEach((product, index) => {
      if (!product.productName) {
        newErrors[`outputProduct_${index}_productName`] = 'Product name is required';
      }
      if (!product.weight || parseFloat(product.weight) <= 0) {
        newErrors[`outputProduct_${index}_weight`] = 'Weight is required';
      }
      if (!product.quantity || parseFloat(product.quantity) <= 0) {
        newErrors[`outputProduct_${index}_quantity`] = 'Quantity is required';
      }
    });

    if (!formData.destinationWarehouse) {
      newErrors.destinationWarehouse = 'Destination warehouse is required';
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
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected product details for weight
  const getSelectedProduct = (productName) => {
    return inventoryItems.find(item => item.name === productName);
  };

  // Auto-set weight when product is selected
  const handleProductSelect = (index, productName) => {
    const product = getSelectedProduct(productName);
    if (product) {
      handleOutputProductChange(index, 'productName', productName);
      // Set weight from selected product
      handleOutputProductChange(index, 'weight', product.weight);
    }
  };

  // Get available weight options for selected product
  const getAvailableWeights = (productName) => {
    if (!productName) return [];
    const product = getSelectedProduct(productName);
    if (!product) return [];
    // Return the specific weight for this product
    return [product.weight];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaIndustry className="mr-3 text-blue-600" />
          {editData ? 'Edit Production Record' : 'Add New Production'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Batch Number - Auto-generated, read-only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch Number *
          </label>
          <input
            type="text"
            name="batchNumber"
            value="Auto-Generated"
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">Batch number will be automatically generated</p>
        </div>

        {/* Source Warehouse Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Warehouse (Where wheat is stored) *
          </label>
          <select
            name="warehouse"
            value={formData.warehouse}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.warehouse ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Warehouse</option>
            {warehouses.map(warehouse => (
              <option key={warehouse._id} value={warehouse._id}>
                {warehouse.name} - {warehouse.location}
              </option>
            ))}
          </select>
          {errors.warehouse && (
            <p className="text-red-500 text-sm mt-1">{errors.warehouse}</p>
          )}
        </div>

        {/* Current Wheat Stock Display */}
        {formData.warehouse && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <FaWarehouse className="text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">Current Wheat Stock</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{currentWheatStock.toFixed(2)} kg</span>
            </div>
            <p className="text-xs text-blue-600 mt-2">Available wheat in this warehouse</p>
          </div>
        )}

        {/* Wheat Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wheat Quantity (kg) *
          </label>
          <input
            type="number"
            name="wheatQuantity"
            value={formData.wheatQuantity}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.wheatQuantity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter wheat quantity in kg"
            min="0"
            step="0.01"
          />
          {errors.wheatQuantity && (
            <p className="text-red-500 text-sm mt-1">{errors.wheatQuantity}</p>
          )}
          {formData.warehouse && currentWheatStock > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Available: {currentWheatStock.toFixed(2)} kg
            </p>
          )}
        </div>

        {/* Output Products Section */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Output Products</h3>
          
          {formData.outputProducts.map((product, index) => (
            <div key={index} className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <select
                    value={product.productName}
                    onChange={(e) => handleProductSelect(index, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`outputProduct_${index}_productName`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Product</option>
                    {inventoryItems.map(item => (
                      <option key={item._id} value={item.name}>
                        {item.name} ({item.weight} kg)
                      </option>
                    ))}
                  </select>
                  {errors[`outputProduct_${index}_productName`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`outputProduct_${index}_productName`]}</p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg per unit) *
                  </label>
                  {product.productName ? (
                    <select
                      value={product.weight}
                      onChange={(e) => handleOutputProductChange(index, 'weight', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`outputProduct_${index}_weight`] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {getAvailableWeights(product.productName).map(weight => (
                        <option key={weight} value={weight}>
                          {weight} kg
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value="Select product first"
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  )}
                  {errors[`outputProduct_${index}_weight`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`outputProduct_${index}_weight`]}</p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity (units) *
                  </label>
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => handleOutputProductChange(index, 'quantity', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`outputProduct_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  {errors[`outputProduct_${index}_quantity`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`outputProduct_${index}_quantity`]}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Total: {(parseFloat(product.weight) * parseFloat(product.quantity) || 0).toFixed(2)} kg
                  </p>
                </div>

                {/* Remove Button */}
                <div className="flex items-end">
                  {formData.outputProducts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOutputProduct(index)}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center"
                    >
                      <FaTrash className="mr-2" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Output Product Button */}
          <button
            type="button"
            onClick={addOutputProduct}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
          >
            <FaPlus className="mr-2" />
            Add Product
          </button>

          {errors.outputProducts && (
            <p className="text-red-500 text-sm mt-1">{errors.outputProducts}</p>
          )}
        </div>

        {/* Destination Warehouse */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination Warehouse (Where to store output products) *
          </label>
          <select
            name="destinationWarehouse"
            value={formData.destinationWarehouse}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.destinationWarehouse ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Destination Warehouse</option>
            {warehouses.map(warehouse => (
              <option key={warehouse._id} value={warehouse._id}>
                {warehouse.name} - {warehouse.location}
              </option>
            ))}
          </select>
          {errors.destinationWarehouse && (
            <p className="text-red-500 text-sm mt-1">{errors.destinationWarehouse}</p>
          )}
        </div>

        {/* Wastage Display */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Wastage Tracking</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Waste (kg)
              </label>
              <input
                type="number"
                value={formData.wastage.quantity.toFixed(2)}
                readOnly
                className="w-full px-3 py-2 border border-yellow-300 rounded-md bg-yellow-100 font-semibold text-yellow-800"
              />
              <p className="text-xs text-yellow-600 mt-1">
                Wheat Quantity - Total Output Products Weight
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wastage Reason
              </label>
              <select
                name="wastage.reason"
                value={formData.wastage.reason}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Processing Loss">Processing Loss</option>
                <option value="Quality Issue">Quality Issue</option>
                <option value="Machine Error">Machine Error</option>
                <option value="Human Error">Human Error</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Production Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Production Date *
          </label>
          <input
            type="date"
            name="productionDate"
            value={formData.productionDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes about the production process..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? 'Saving...' : (editData ? 'Update Production' : 'Save Production')}
          </button>
        </div>
      </form>
    </div>
  );
}
