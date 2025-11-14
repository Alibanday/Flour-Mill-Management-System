import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPrint, FaPlus, FaTrash, FaFileAlt } from 'react-icons/fa';
import api from '../../services/api';

export default function BagPurchaseForm({ purchase, suppliers, onClose, onSave }) {
  const [formData, setFormData] = useState({
    purchaseNumber: 'Auto-generated',
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    paymentStatus: 'Pending',
    paidAmount: 0,
    remainingAmount: 0,
    warehouse: '',
    notes: ''
  });

  // Items array for multiple products
  const [items, setItems] = useState([{
    product: '',
    productId: '',
    weightCategory: '',
    quantity: 0,
    unitPrice: 0,
    total: 0
  }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [printInvoice, setPrintInvoice] = useState(false);
  const [generateGatepass, setGenerateGatepass] = useState(false);

  const isEditing = !!purchase;

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      setWarehousesLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:7000/api/warehouses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
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

  // Fetch products from catalog
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('http://localhost:7000/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data && response.data.success) {
          const allProducts = response.data.data || [];
          const activeProducts = allProducts.filter(p => p.status === 'Active');
          
          // Sort products: bag-related products first, then others
          const sortedProducts = activeProducts.sort((a, b) => {
            const aIsBag = (a.category === 'Packaging Materials' && a.subcategory === 'Bags') ||
                          (a.name.toLowerCase().includes('bag') || a.name.toLowerCase().includes('ata') || 
                           a.name.toLowerCase().includes('maida') || a.name.toLowerCase().includes('suji'));
            const bIsBag = (b.category === 'Packaging Materials' && b.subcategory === 'Bags') ||
                          (b.name.toLowerCase().includes('bag') || b.name.toLowerCase().includes('ata') || 
                           b.name.toLowerCase().includes('maida') || b.name.toLowerCase().includes('suji'));
            
            if (aIsBag && !bIsBag) return -1;
            if (!aIsBag && bIsBag) return 1;
            return 0;
          });
          
          setProducts(sortedProducts);
        } else {
          const allProducts = response.data?.data || response.data || [];
          setProducts(allProducts.filter(p => p.status === 'Active'));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle main form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    // Calculate remaining amount when paid amount changes
    if (name === 'paidAmount') {
      const paidAmount = parseFloat(value) || 0;
      const totalPrice = items.reduce((sum, item) => sum + (item.total || 0), 0);
      newFormData.remainingAmount = totalPrice - paidAmount;
    }
    
    setFormData(newFormData);
  };

  // Handle item changes (product, weight category, quantity)
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = newItems[index];
    
    if (field === 'product') {
      // Product selected - find product and reset weight category
      const product = products.find(p => p._id === value);
      if (product) {
        item.productId = product._id;
        item.product = product.name;
        item.weightCategory = '';
        item.unitPrice = 0;
        item.total = 0;
      } else {
        item.productId = '';
        item.product = '';
        item.weightCategory = '';
        item.unitPrice = 0;
        item.total = 0;
      }
    } else if (field === 'weightCategory') {
      // Weight category selected - set unit price from catalog
      const product = products.find(p => p._id === item.productId);
      if (product && product.weightVariants && product.weightVariants.length > 0) {
        const weightVariant = product.weightVariants.find(v => 
          v.weight === parseFloat(value) && v.isActive !== false
        );
        if (weightVariant) {
          item.weightCategory = value;
          item.unitPrice = weightVariant.price || 0;
          // Recalculate total
          item.total = (parseFloat(item.quantity) || 0) * item.unitPrice;
        }
      }
    } else if (field === 'quantity') {
      // Quantity changed - recalculate total
      item.quantity = parseFloat(value) || 0;
      item.total = item.quantity * item.unitPrice;
    }
    
    newItems[index] = item;
    setItems(newItems);
    
    // Recalculate remaining amount
    const totalPrice = newItems.reduce((sum, i) => sum + (i.total || 0), 0);
    setFormData(prev => ({
      ...prev,
      remainingAmount: totalPrice - (parseFloat(formData.paidAmount) || 0)
    }));
  };

  // Add new item
  const addItem = () => {
    setItems([...items, {
      product: '',
      productId: '',
      weightCategory: '',
      quantity: 0,
      unitPrice: 0,
      total: 0
    }]);
  };

  // Remove item
  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      
      // Recalculate remaining amount
      const totalPrice = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
      setFormData(prev => ({
        ...prev,
        remainingAmount: totalPrice - (parseFloat(formData.paidAmount) || 0)
      }));
    }
  };

  // Get weight variants for a product
  const getWeightVariants = (productId) => {
    const product = products.find(p => p._id === productId);
    if (product && product.weightVariants && product.weightVariants.length > 0) {
      return product.weightVariants.filter(v => v.isActive !== false);
    }
    return [];
  };

  // Filter suppliers to show only private suppliers
  const privateSuppliers = suppliers.filter(supplier => supplier.supplierType === 'Private');

  // Calculate grand total
  const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  // Create gatepass after purchase is saved
  const createGatePass = async (savedPurchase, purchaseItems) => {
    try {
      const selectedSupplier = suppliers.find(s => s._id === formData.supplier);
      const selectedWarehouse = warehouses.find(w => w._id === formData.warehouse);
      
      const supplierName = selectedSupplier?.name || 'Supplier';
      const supplierContact = selectedSupplier?.contactPerson?.phone || 
                              selectedSupplier?.phone || 
                              selectedSupplier?.contact || 
                              'N/A';

      // Build items list from purchase items
      const gatePassItems = purchaseItems.map((item) => {
        const product = products.find(p => p._id === item.productId);
        return {
          description: `${product?.name || 'Product'} - ${item.weightCategory}kg (${item.quantity} bags)`,
          quantity: item.quantity,
          unit: `${item.weightCategory}kg bags`,
          value: item.total
        };
      });

      const gatePassData = {
        type: 'Material',
        purpose: 'Goods Receiving - Bag Purchase',
        issuedTo: {
          name: supplierName,
          contact: supplierContact,
          company: supplierName
        },
        items: gatePassItems,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
        warehouse: formData.warehouse,
        status: 'Active',
        relatedPurchase: savedPurchase._id || savedPurchase.id,
        notes: `Auto-generated for Bag Purchase ${savedPurchase.purchaseNumber || savedPurchase._id}`
      };

      const response = await api.post('http://localhost:7000/api/gate-pass', gatePassData);
      
      if (response.data && response.data.success) {
        console.log('✅ Gate pass created:', response.data.data.gatePassNumber);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error creating gate pass:', error);
      throw new Error('Failed to create gate pass: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    setLoading(true);
    setError(null);

    // Validate items
    const validItems = items.filter(item => 
      item.productId && item.weightCategory && item.quantity > 0
    );

    if (validItems.length === 0) {
      setError('Please add at least one product with weight category and quantity');
      setLoading(false);
      return;
    }

    try {
      // Format data for backend - convert items to bags Map structure
      const bags = new Map();
      
      validItems.forEach((item) => {
        const product = products.find(p => p._id === item.productId);
        if (product) {
          // Use product name as key (backend will do case-insensitive search)
          const productKey = product.name;
          bags.set(productKey, {
            quantity: item.quantity,
            unit: `${item.weightCategory}kg bags`,
            unitPrice: item.unitPrice,
            totalPrice: item.total
          });
        }
      });

      // Convert Map to object for JSON serialization
      const bagsObject = Object.fromEntries(bags);

      // Prepare purchase data
      const purchaseData = {
        ...formData,
        bags: bagsObject,
        totalPrice: grandTotal,
        paidAmount: parseFloat(formData.paidAmount) || 0,
        remainingAmount: formData.remainingAmount
      };

      // Save the purchase
      const savedPurchase = await onSave(purchaseData);
      console.log('✅ Purchase saved:', savedPurchase);
      
      let gatePassNumber = null;
      
      // Handle generate gatepass action (do this first so notification is sent to warehouse manager)
      if (generateGatepass) {
        try {
          const gatePass = await createGatePass(savedPurchase, validItems);
          gatePassNumber = gatePass.gatePassNumber;
          console.log('✅ Gate pass created:', gatePassNumber);
          console.log('✅ Notification sent to warehouse manager');
        } catch (gatePassError) {
          console.error('Gate pass creation error:', gatePassError);
          alert(`Purchase saved but gate pass creation failed: ${gatePassError.message}`);
          // Continue even if gatepass creation fails
        }
      }
      
      // Show success message
      if (generateGatepass && gatePassNumber) {
        const message = `Purchase saved successfully!\n\nGate Pass ${gatePassNumber} has been generated and sent to the warehouse manager of the selected warehouse.\n\n${printInvoice ? 'Invoice will be printed now.' : ''}`;
        alert(message);
      } else if (printInvoice) {
        alert('Purchase saved successfully! Invoice will be printed now.');
      } else if (generateGatepass && !gatePassNumber) {
        // Gatepass was requested but failed
        alert('Purchase saved successfully! However, gate pass creation failed. Please create it manually.');
      } else {
        alert('Purchase saved successfully!');
      }
      
      // Print invoice if selected (after a short delay to ensure message is shown)
      if (printInvoice) {
        setTimeout(() => {
          window.print();
        }, 1500);
      }
      
      // Close form after a delay to allow print dialog to show
      setTimeout(() => {
        onClose();
      }, printInvoice ? 2500 : 800);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Bag Purchase' : 'New Bag Purchase'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <FaTimes className="mr-2" />
            Close
          </button>
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
          </div>

          {/* Products Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Products</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <FaPlus className="mr-1" />
                Add Product
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const weightVariants = getWeightVariants(item.productId);
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Product {index + 1}</h4>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Remove this product"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {/* Product Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Product * 
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                          required
                          disabled={productsLoading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">{productsLoading ? 'Loading...' : 'Select product'}</option>
                          {products.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.name} {product.code ? `(${product.code})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Weight Category Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Weight Category * (kg)
                        </label>
                        <select
                          value={item.weightCategory}
                          onChange={(e) => handleItemChange(index, 'weightCategory', e.target.value)}
                          required
                          disabled={!item.productId || weightVariants.length === 0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!item.productId 
                              ? 'Select product first' 
                              : weightVariants.length === 0 
                              ? 'No weight categories' 
                              : 'Select weight'}
                          </option>
                          {weightVariants.map((variant) => (
                            <option key={variant.weight} value={variant.weight}>
                              {variant.weight}kg - PKR {variant.price.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="0"
                        />
                      </div>

                      {/* Unit Price (Read-only) */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Unit Price (PKR)
                        </label>
                        <input
                          type="number"
                          value={item.unitPrice.toFixed(2)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                        />
                      </div>

                      {/* Total (Read-only) */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Total (PKR)
                        </label>
                        <input
                          type="number"
                          value={item.total.toFixed(2)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 font-semibold text-blue-900 cursor-not-allowed text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grand Total */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Grand Total:</p>
                  <p className="text-2xl font-bold text-gray-900">PKR {grandTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment and Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    value={grandTotal.toFixed(2)}
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

          {/* Action Selection */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Actions (both can be selected):
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                <input
                  type="checkbox"
                  checked={printInvoice}
                  onChange={(e) => setPrintInvoice(e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex items-center">
                  <FaPrint className="mr-2 text-blue-600" />
                  <span className="text-gray-700 font-medium">Print Invoice</span>
                </div>
              </label>
              <label className="flex items-center p-3 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-green-400 transition-colors">
                <input
                  type="checkbox"
                  checked={generateGatepass}
                  onChange={(e) => setGenerateGatepass(e.target.checked)}
                  className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex items-center">
                  <FaFileAlt className="mr-2 text-green-600" />
                  <span className="text-gray-700 font-medium">Generate Gatepass</span>
                </div>
              </label>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {!printInvoice && !generateGatepass 
                ? 'Select at least one action. The purchase will be saved regardless.'
                : printInvoice && generateGatepass
                ? 'The purchase will be saved, invoice will be printed, and a gate pass will be generated and sent to the warehouse manager.'
                : printInvoice
                ? 'The purchase will be saved and the invoice will be printed.'
                : 'The purchase will be saved and a gate pass will be automatically generated and sent to the warehouse manager.'}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end items-center pt-6 border-t">
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
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FaSave className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Purchase
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
