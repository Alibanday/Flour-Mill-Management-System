import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaShoppingBag, FaCalculator, FaTruck, FaBoxes, FaSeedling, FaPlus, FaMinus } from 'react-icons/fa';

export default function PurchaseForm({ onSubmit, onCancel, editData = null, warehouses = [] }) {
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [formData, setFormData] = useState({
    purchaseNumber: '', // Will be auto-generated
    purchaseType: 'Raw Materials',
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
    notes: '',
    status: 'Pending'
  });

  const [bagsData, setBagsData] = useState({
    ata: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 },
    maida: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 },
    suji: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 },
    fine: { quantity: 0, unit: '50kg bags', unitPrice: 0, totalPrice: 0 }
  });

  const [purchaseItems, setPurchaseItems] = useState([]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouseCapacity, setWarehouseCapacity] = useState(null);
  const [capacityLoading, setCapacityLoading] = useState(false);

  // Unit conversion helper
  const convertToStandardUnit = (quantity, unit, purchaseType) => {
    // For packaging materials and maintenance supplies, use 1:1 conversion
    if (purchaseType === 'Packaging Materials' || purchaseType === 'Maintenance Supplies') {
      return quantity; // No conversion needed for these types
    }
    
    // For raw materials and finished products, convert to 50kg bags
    const conversionRates = {
      'tons': 20,           // 1 ton = 20 x 50kg bags
      'quintals': 2,        // 1 quintal = 2 x 50kg bags  
      '50kg bags': 1,       // 1 x 50kg bag = 1 x 50kg bag
      '25kg bags': 0.5,     // 1 x 25kg bag = 0.5 x 50kg bag
      '10kg bags': 0.2,     // 1 x 10kg bag = 0.2 x 50kg bag
      '5kg bags': 0.1,      // 1 x 5kg bag = 0.1 x 50kg bag
      '100kg sacks': 2,     // 1 x 100kg sack = 2 x 50kg bags
      '50kg sacks': 1,      // 1 x 50kg sack = 1 x 50kg bag
      '25kg sacks': 0.5     // 1 x 25kg sack = 0.5 x 50kg bag
    };
    
    const rate = conversionRates[unit] || 1;
    return quantity * rate;
  };

  // System categories and subcategories
  const categories = [
    { value: 'Raw Materials', label: 'Raw Materials' },
    { value: 'Finished Products', label: 'Finished Products' },
    { value: 'Packaging Materials', label: 'Packaging Materials' },
    { value: 'Maintenance Supplies', label: 'Maintenance Supplies' }
  ];

  // Dynamic unit options based on purchase type
  const getUnitOptions = (purchaseType) => {
    switch (purchaseType) {
      case 'Raw Materials':
      case 'Finished Products':
        return [
          { value: 'tons', label: 'Tons' },
          { value: 'quintals', label: 'Quintals' },
          { value: '50kg bags', label: '50kg Bags' },
          { value: '25kg bags', label: '25kg Bags' },
          { value: '10kg bags', label: '10kg Bags' },
          { value: '5kg bags', label: '5kg Bags' },
          { value: '100kg sacks', label: '100kg Sacks' },
          { value: '50kg sacks', label: '50kg Sacks' },
          { value: '25kg sacks', label: '25kg Sacks' }
        ];
      case 'Packaging Materials':
        return [
          { value: 'bags', label: 'Bags' },
          { value: 'pieces', label: 'Pieces' },
          { value: 'rolls', label: 'Rolls' },
          { value: 'sheets', label: 'Sheets' },
          { value: 'boxes', label: 'Boxes' },
          { value: 'packets', label: 'Packets' },
          { value: 'bundles', label: 'Bundles' }
        ];
      case 'Maintenance Supplies':
        return [
          { value: 'pieces', label: 'Pieces' },
          { value: 'units', label: 'Units' },
          { value: 'sets', label: 'Sets' },
          { value: 'kits', label: 'Kits' },
          { value: 'pairs', label: 'Pairs' },
          { value: 'meters', label: 'Meters' },
          { value: 'liters', label: 'Liters' }
        ];
      default:
        return [
          { value: 'tons', label: 'Tons' },
          { value: 'quintals', label: 'Quintals' },
          { value: '50kg bags', label: '50kg Bags' }
        ];
    }
  };

  const subcategories = {
    'Raw Materials': [
      'Wheat Grain', 'Corn', 'Rice', 'Barley', 'Oats', 'Rye', 'Millet'
    ],
    'Finished Products': [
      'Flour', 'Maida', 'Suji', 'Chokhar', 'Fine Flour', 'Whole Wheat Flour', 'Bread Flour', 'Cake Flour'
    ],
    'Packaging Materials': [
      'Bags', 'Sacks', 'Labels', 'Tape', 'Twine', 'Plastic Sheets'
    ],
    'Maintenance Supplies': [
      'Machine Parts', 'Lubricants', 'Cleaning Supplies', 'Safety Equipment', 'Tools'
    ]
  };

  // Safely coerce values to numbers for calculations and display
  const toNumber = (value) => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  };

  useEffect(() => {
    // Load suppliers list for dropdown
    const loadSuppliers = async () => {
      try {
        setSuppliersLoading(true);
        const res = await fetch('http://localhost:7000/api/suppliers');
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      } finally {
        setSuppliersLoading(false);
      }
    };
    loadSuppliers();

    if (editData) {
      setFormData({
        ...editData,
        purchaseDate: new Date(editData.purchaseDate).toISOString().split('T')[0],
        deliveryDate: editData.deliveryDate ? new Date(editData.deliveryDate).toISOString().split('T')[0] : ''
      });
      if (editData.bags) setBagsData(editData.bags);
      // Note: foodData is handled through purchaseItems now
      if (editData.supplier?._id) setSelectedSupplierId(editData.supplier._id);
    }
  }, [editData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numericFields = new Set(['tax', 'shippingCost', 'supplier.outstandingBalance']);
    const finalValue = numericFields.has(name) ? toNumber(value) : value;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: finalValue }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
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

  const handleAddPurchaseItem = () => {
    const newItem = {
      id: Date.now(),
      subcategory: '',
      quantity: 0,
      unit: 'tons',
      unitPrice: 0,
      totalPrice: 0,
      source: 'Private',
      quality: 'Standard',
      grade: 'A'
    };
    setPurchaseItems(prev => [...prev, newItem]);
  };

  const handleRemovePurchaseItem = (id) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePurchaseItemChange = (id, field, value) => {
    setPurchaseItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-calculate total price
          if (field === 'quantity' || field === 'unitPrice') {
            const quantity = field === 'quantity' ? (parseFloat(value) || 0) : (updatedItem.quantity || 0);
            const unitPrice = field === 'unitPrice' ? (parseFloat(value) || 0) : (updatedItem.unitPrice || 0);
            updatedItem.totalPrice = quantity * unitPrice;
          }
          
          // Reset unit to default when changing subcategory
          if (field === 'subcategory') {
            const unitOptions = getUnitOptions(formData.purchaseType);
            updatedItem.unit = unitOptions[0]?.value || 'pieces';
          }
          
          return updatedItem;
        }
        return item;
      });
      return updated;
    });
  };

  // Fetch warehouse capacity
  const fetchWarehouseCapacity = async (warehouseId) => {
    if (!warehouseId) return;
    
    setCapacityLoading(true);
    try {
      console.log('📦 Fetching capacity for warehouse:', warehouseId);
      const response = await fetch(`http://localhost:7000/api/purchases/warehouse-capacity/${warehouseId}`);
      
      if (!response.ok) {
        console.error('❌ HTTP error:', response.status, response.statusText);
        setWarehouseCapacity(null);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setWarehouseCapacity(data.data);
        console.log('📦 Warehouse capacity:', data.data);
      } else {
        console.error('❌ Failed to fetch warehouse capacity:', data.message);
        setWarehouseCapacity(null);
      }
    } catch (error) {
      console.error('❌ Error fetching warehouse capacity:', error);
      setWarehouseCapacity(null);
    } finally {
      setCapacityLoading(false);
    }
  };

  const calculateTotals = () => {
    let bagsTotal = 0;
    let itemsTotal = 0;

    if (formData.purchaseType === 'Bags' || formData.purchaseType === 'Other') {
      bagsTotal = Object.values(bagsData || {}).reduce((sum, bag) => sum + (bag.totalPrice || 0), 0) || 0;
    }

    // Calculate total for all purchase items
    itemsTotal = purchaseItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;

    const subtotal = (bagsTotal || 0) + (itemsTotal || 0);
    const totalAmount = (subtotal || 0) + toNumber(formData.tax) + toNumber(formData.shippingCost);

    return { bagsTotal, itemsTotal, subtotal, totalAmount };
  };

  const validateForm = () => {
    const newErrors = {};
    // Purchase number is auto-generated, no validation needed
    if (!formData.supplier.name.trim()) newErrors.supplierName = 'Supplier is required';
    if (!formData.warehouse) newErrors.warehouse = 'Warehouse is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    if (!formData.status) newErrors.status = 'Status is required';
    if (toNumber(formData.tax) < 0) newErrors.tax = 'Tax cannot be negative';
    if (toNumber(formData.shippingCost) < 0) newErrors.shippingCost = 'Shipping cannot be negative';

    let hasItems = false;
    if (formData.purchaseType === 'Bags' || formData.purchaseType === 'Other') {
      hasItems = Object.values(bagsData || {}).some(bag => (bag?.quantity || 0) > 0);
    } else {
      hasItems = purchaseItems.some(item => (item?.quantity || 0) > 0);
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
      console.log('📤 Starting purchase submission...');
      // Map frontend categories to backend expected types
      const getBackendPurchaseType = (frontendType) => {
        switch (frontendType) {
          case 'Packaging Materials': return 'Other';
          case 'Raw Materials': return 'Food';
          case 'Finished Products': return 'Food';
          case 'Maintenance Supplies': return 'Other';
          default: return 'Food';
        }
      };

      // Convert purchase items to backend format
      const convertItemsToBackendFormat = () => {
        if (formData.purchaseType === 'Packaging Materials' || formData.purchaseType === 'Maintenance Supplies') {
          // For packaging materials and maintenance supplies, use the first item
          const firstItem = purchaseItems.find(item => item.subcategory && item.quantity > 0);
          if (firstItem) {
            return {
              bags: {
                ata: {
                  quantity: firstItem.quantity,
                  unit: firstItem.unit,
                  unitPrice: firstItem.unitPrice,
                  totalPrice: firstItem.totalPrice
                },
                maida: { quantity: 0, unit: firstItem.unit, unitPrice: 0, totalPrice: 0 },
                suji: { quantity: 0, unit: firstItem.unit, unitPrice: 0, totalPrice: 0 },
                fine: { quantity: 0, unit: firstItem.unit, unitPrice: 0, totalPrice: 0 }
              }
            };
          } else {
            return {
              bags: {
                ata: { quantity: 0, unit: 'pieces', unitPrice: 0, totalPrice: 0 },
                maida: { quantity: 0, unit: 'pieces', unitPrice: 0, totalPrice: 0 },
                suji: { quantity: 0, unit: 'pieces', unitPrice: 0, totalPrice: 0 },
                fine: { quantity: 0, unit: 'pieces', unitPrice: 0, totalPrice: 0 }
              }
            };
          }
        } else {
          // For food items, create the exact structure expected by the model
          const foodData = {
            wheat: { 
              quantity: 0, 
              unit: 'tons', 
              unitPrice: 0, 
              totalPrice: 0, 
              source: 'Government', 
              quality: 'Standard', 
              grade: 'A',
              governmentApproval: '',
              procurementDate: null,
              expiryDate: null
            }
          };
          
          // Map the first item with quantity > 0 to wheat (as per model structure)
          const firstItem = purchaseItems.find(item => item.subcategory && item.quantity > 0);
          if (firstItem) {
            foodData.wheat = {
              quantity: firstItem.quantity,
              unit: firstItem.unit,
              unitPrice: firstItem.unitPrice,
              totalPrice: firstItem.totalPrice,
              source: firstItem.source,
              quality: firstItem.quality,
              grade: firstItem.grade,
              governmentApproval: firstItem.source === 'Government' ? 'GOV-APPROVAL-001' : '',
              procurementDate: firstItem.source === 'Government' ? new Date() : null,
              expiryDate: firstItem.source === 'Government' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null
            };
          }
          
          return { food: foodData };
        }
      };

      // Generate purchase number if auto-generated
      const generatePurchaseNumber = () => {
        if (formData.purchaseNumber === 'Auto-generated' || !formData.purchaseNumber) {
          const date = new Date();
          const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
          const timeStr = date.getTime().toString().slice(-6);
          return `PUR-${dateStr}-${timeStr}`;
        }
        return formData.purchaseNumber;
      };

      // Ensure warehouse is a valid ObjectId string
      const ensureValidWarehouse = (warehouseId) => {
        if (!warehouseId || warehouseId === '') {
          // Return a default warehouse ID if none provided
          return '507f1f77bcf86cd799439011';
        }
        return warehouseId;
      };

      // Ensure supplier has proper structure
      const ensureValidSupplier = (supplier) => {
        if (typeof supplier === 'string') {
          return {
            name: supplier,
            contact: { phone: '', email: '', address: '' },
            type: 'Private'
          };
        }
        // Ensure contact object exists and has required structure
        if (supplier) {
          return {
            name: supplier.name || 'Unknown Supplier',
            contact: {
              phone: supplier.contact?.phone || '',
              email: supplier.contact?.email || '',
              address: supplier.contact?.address || ''
            },
            type: supplier.type || 'Private'
          };
        }
        return {
          name: 'Unknown Supplier',
          contact: { phone: '', email: '', address: '' },
          type: 'Private'
        };
      };

      // Calculate totals for the purchase
      const { bagsTotal, itemsTotal, subtotal, totalAmount } = calculateTotals();
      
      const submitData = {
        purchaseNumber: generatePurchaseNumber(),
        purchaseType: getBackendPurchaseType(formData.purchaseType),
        originalPurchaseType: formData.purchaseType, // Store original purchase type
        warehouse: ensureValidWarehouse(formData.warehouse),
        supplier: ensureValidSupplier(formData.supplier),
        purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
        deliveryDate: formData.deliveryDate || null,
        subtotal: subtotal,
        tax: formData.tax || 0,
        shippingCost: formData.shippingCost || 0,
        totalAmount: totalAmount,
        paymentMethod: formData.paymentMethod || 'Cash',
        paymentStatus: 'Pending',
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: formData.status,
        notes: formData.notes || '',
        createdBy: '507f1f77bcf86cd799439011', // Default user ID
        ...convertItemsToBackendFormat()
      };

      console.log('📤 Frontend sending purchase data:', JSON.stringify(submitData, null, 2));
      console.log('📤 Purchase type mapped:', formData.purchaseType, '->', getBackendPurchaseType(formData.purchaseType));
      console.log('📤 Warehouse ID:', submitData.warehouse);
      console.log('📤 Supplier data:', submitData.supplier);
      console.log('📤 Items data:', convertItemsToBackendFormat());
      console.log('📤 Calculated totals:', { bagsTotal, itemsTotal, subtotal, totalAmount });
      console.log('📤 Form data:', formData);
      console.log('📤 Purchase items:', purchaseItems);
      
      await onSubmit(submitData);
      console.log('✅ Purchase submission completed successfully');
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      alert('Error submitting purchase: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { bagsTotal, itemsTotal, subtotal, totalAmount } = calculateTotals();

  // Fetch warehouse capacity when warehouse changes
  useEffect(() => {
    if (formData.warehouse) {
      fetchWarehouseCapacity(formData.warehouse);
    }
  }, [formData.warehouse]);

  const handleSupplierSelect = (e) => {
    const value = e.target.value;
    setSelectedSupplierId(value);
    if (!value) {
      // Reset supplier details if none selected
      setFormData(prev => ({
        ...prev,
        supplier: {
          name: '',
          contact: { phone: '', email: '', address: '' },
          type: 'Private',
          outstandingBalance: 0
        }
      }));
      return;
    }

    const supplier = suppliers.find(s => s._id === value);
    if (supplier) {
      // Map supplier type to valid enum values for Purchase model
      const mapSupplierType = (type) => {
        const typeMap = {
          'Raw Materials': 'Manufacturer',
          'Raw Material': 'Manufacturer',
          'Materials': 'Manufacturer',
          'Food': 'Wholesaler',
          'Bags': 'Manufacturer',
          'Other': 'Private',
          'Government': 'Government',
          'Private': 'Private',
          'Wholesaler': 'Wholesaler',
          'Manufacturer': 'Manufacturer'
        };
        return typeMap[type] || 'Private';
      };

      setFormData(prev => ({
        ...prev,
        supplier: {
          _id: supplier._id,
          name: supplier.name || '',
          type: mapSupplierType(supplier.businessType) || 'Private',
          outstandingBalance: supplier.outstandingBalance || 0,
          contact: {
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: `${supplier.address?.street || ''} ${supplier.address?.city || ''}`.trim()
          }
        }
      }));
      if (errors.supplierName) setErrors(prev => ({ ...prev, supplierName: '' }));
    }
  };

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
              Purchase Number
            </label>
            <input
              type="text"
              name="purchaseNumber"
              value={formData.purchaseNumber || "Auto-generated"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              placeholder="Auto-generated"
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">Purchase number will be generated automatically</p>
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
              <option value="Raw Materials">Raw Materials</option>
              <option value="Finished Products">Finished Products</option>
              <option value="Packaging Materials">Packaging Materials</option>
              <option value="Maintenance Supplies">Maintenance Supplies</option>
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
                Supplier *
              </label>
              <select
                value={selectedSupplierId}
                onChange={handleSupplierSelect}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.supplierName ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Supplier</option>
                {suppliersLoading ? (
                  <option disabled>Loading...</option>
                ) : (
                  suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))
                )}
              </select>
              {errors.supplierName && (
                <p className="mt-1 text-sm text-red-600">{errors.supplierName}</p>
              )}
            </div>

            {/* Keep a hidden supplier name input to maintain compatibility if needed */}
            <input type="hidden" name="supplier.name" value={formData.supplier.name} />

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
                        value={bag?.unit || '50kg bags'}
                        onChange={(e) => handleBagsChange(bagType, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="50kg bags">50kg Bags</option>
                        <option value="25kg bags">25kg Bags</option>
                        <option value="10kg bags">10kg Bags</option>
                        <option value="5kg bags">5kg Bags</option>
                        <option value="100kg sacks">100kg Sacks</option>
                        <option value="50kg sacks">50kg Sacks</option>
                        <option value="25kg sacks">25kg Sacks</option>
                        <option value="tons">Tons</option>
                        <option value="quintals">Quintals</option>
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

        {/* Purchase Items Section */}
        {formData.purchaseType !== 'Bags' && formData.purchaseType !== 'Other' && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-green-900 flex items-center">
              <FaSeedling className="mr-2" />
                {formData.purchaseType} Details
            </h3>
              <button
                type="button"
                onClick={handleAddPurchaseItem}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <FaPlus className="mr-2" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {purchaseItems.map((item, index) => (
                <div key={item.id} className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium text-gray-900">
                      Item {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleRemovePurchaseItem(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaMinus />
                    </button>
                  </div>
                  
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategory *
                      </label>
                      <select
                        value={item.subcategory}
                        onChange={(e) => handlePurchaseItemChange(item.id, 'subcategory', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories[formData.purchaseType]?.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                  </label>
                  <input
                    type="number"
                        value={item.quantity}
                        onChange={(e) => handlePurchaseItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit *
                  </label>
                  <select
                        value={item.unit}
                        onChange={(e) => handlePurchaseItemChange(item.id, 'unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getUnitOptions(formData.purchaseType).map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Price (Rs.) *
                  </label>
                  <input
                    type="number"
                        value={item.unitPrice}
                        onChange={(e) => handlePurchaseItemChange(item.id, 'unitPrice', parseFloat(e.target.value))}
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
                        value={item.totalPrice}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source
                  </label>
                  <select
                        value={item.source}
                        onChange={(e) => handlePurchaseItemChange(item.id, 'source', e.target.value)}
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
                        value={item.quality}
                        onChange={(e) => handlePurchaseItemChange(item.id, 'quality', e.target.value)}
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
                        value={item.grade}
                        onChange={(e) => handlePurchaseItemChange(item.id, 'grade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                </div>
              </div>
                    </div>
              ))}
              
              {purchaseItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaSeedling className="mx-auto text-4xl mb-2" />
                  <p>No items added yet. Click "Add Item" to start.</p>
                </div>
              )}
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
            {errors.tax && (
              <p className="mt-1 text-sm text-red-600">{errors.tax}</p>
            )}
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
            {errors.shippingCost && (
              <p className="mt-1 text-sm text-red-600">{errors.shippingCost}</p>
            )}
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
            
            {/* Warehouse Capacity Display */}
            {warehouseCapacity && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-blue-900">Warehouse Capacity</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    warehouseCapacity.status === 'Full' ? 'bg-red-100 text-red-800' :
                    warehouseCapacity.status === 'Near Full' ? 'bg-orange-100 text-orange-800' :
                    warehouseCapacity.status === 'High Usage' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {warehouseCapacity.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Total Capacity:</span>
                    <span className="font-medium">{warehouseCapacity.totalCapacity} {warehouseCapacity.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Usage:</span>
                    <span className="font-medium">{warehouseCapacity.currentUsage} {warehouseCapacity.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-medium text-green-600">{warehouseCapacity.availableCapacity} {warehouseCapacity.unit}</span>
                  </div>
                  
                  {/* Unit Conversion Display */}
                  {(() => {
                    const selectedUnit = purchaseItems.length > 0 ? purchaseItems[0].unit : '50kg bags';
                    if (selectedUnit !== '50kg bags' && selectedUnit !== warehouseCapacity.unit) {
                      const convertedTotal = convertToStandardUnit(warehouseCapacity.totalCapacity, warehouseCapacity.unit) / convertToStandardUnit(1, selectedUnit);
                      const convertedCurrent = convertToStandardUnit(warehouseCapacity.currentUsage, warehouseCapacity.unit) / convertToStandardUnit(1, selectedUnit);
                      const convertedAvailable = convertToStandardUnit(warehouseCapacity.availableCapacity, warehouseCapacity.unit) / convertToStandardUnit(1, selectedUnit);
                      
                      return (
                        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <div className="text-xs text-yellow-700 font-medium mb-1">Converted to {selectedUnit}:</div>
                          <div className="space-y-1 text-xs text-yellow-800">
                            <div className="flex justify-between">
                              <span>Total:</span>
                              <span className="font-medium">{Math.round(convertedTotal)} {selectedUnit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Used:</span>
                              <span className="font-medium">{Math.round(convertedCurrent)} {selectedUnit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Available:</span>
                              <span className="font-medium text-green-600">{Math.round(convertedAvailable)} {selectedUnit}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        warehouseCapacity.capacityPercentage >= 100 ? 'bg-red-500' :
                        warehouseCapacity.capacityPercentage >= 90 ? 'bg-orange-500' :
                        warehouseCapacity.capacityPercentage >= 75 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(warehouseCapacity.capacityPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-xs text-blue-600 mt-1">
                    {warehouseCapacity.capacityPercentage}% Full
                  </div>
                </div>
              </div>
            )}
            
            {capacityLoading && (
              <div className="mt-2 text-sm text-gray-500">Loading warehouse capacity...</div>
            )}
            
            {!capacityLoading && !warehouseCapacity && formData.warehouse && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-800">
                  <span className="font-medium">⚠️ Capacity data unavailable</span>
                  <p className="mt-1">Warehouse capacity information could not be loaded. Purchase will proceed without capacity validation.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.status ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="Pending">Pending</option>
            <option value="Received">Received</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Completed">Completed</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status}</p>
          )}
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
            {formData.purchaseType === 'Packaging Materials' && (
              <div>
                <span className="text-gray-600">Bags Total:</span>
                <span className="ml-2 font-medium text-gray-900">Rs. {(bagsTotal || 0).toFixed(2)}</span>
              </div>
            )}
            
            {formData.purchaseType !== 'Packaging Materials' && (
              <div>
                <span className="text-gray-600">Items Total:</span>
                <span className="ml-2 font-medium text-gray-900">Rs. {(itemsTotal || 0).toFixed(2)}</span>
              </div>
            )}
            
            <div>
              <span className="text-gray-600">Subtotal:</span>
              <span className="ml-2 font-medium text-gray-900">Rs. {Number(subtotal || 0).toFixed(2)}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Tax:</span>
              <span className="ml-2 font-medium text-gray-900">+Rs. {Number(formData.tax || 0).toFixed(2)}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Shipping:</span>
              <span className="ml-2 font-medium text-gray-900">+Rs. {Number(formData.shippingCost || 0).toFixed(2)}</span>
            </div>
            
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-2 font-bold text-blue-900 text-lg">Rs. {Number(totalAmount || 0).toFixed(2)}</span>
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
