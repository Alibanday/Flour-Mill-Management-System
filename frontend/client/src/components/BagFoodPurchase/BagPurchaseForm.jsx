import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPrint, FaPlus, FaTrash } from 'react-icons/fa';
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

  // Items array for multiple products - each item gets a unique ID for React keys
  const [items, setItems] = useState([{
    id: Date.now(), // Unique ID for React key
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

          // Filter out wheat products - exclude products with wheat/grain in name, category, or subcategory
          const nonWheatProducts = activeProducts.filter(product => {
            const name = (product.name || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            const subcategory = (product.subcategory || '').toLowerCase();

            // Check if product is wheat/grain
            const isWheat = 
              name.includes('wheat') ||
              name.includes('grain') ||
              (category.includes('raw materials') && (name.includes('grain') || subcategory.includes('grain'))) ||
              subcategory.includes('wheat') ||
              subcategory.includes('grain');

            // Exclude wheat products from bag purchase form
            return !isWheat;
          });

          // Sort products: bag-related products first, then others
          const sortedProducts = nonWheatProducts.sort((a, b) => {
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
          // Filter out wheat products here too
          const nonWheatProducts = allProducts.filter(p => {
            if (p.status !== 'Active') return false;
            const name = (p.name || '').toLowerCase();
            const category = (p.category || '').toLowerCase();
            const subcategory = (p.subcategory || '').toLowerCase();
            const isWheat = 
              name.includes('wheat') ||
              name.includes('grain') ||
              (category.includes('raw materials') && (name.includes('grain') || subcategory.includes('grain'))) ||
              subcategory.includes('wheat') ||
              subcategory.includes('grain');
            return !isWheat;
          });
          setProducts(nonWheatProducts);
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

  // Handle item changes (product, weight category, quantity, unitPrice)
  const handleItemChange = (index, field, value) => {
    // Use functional update to ensure we're working with the latest state
    setItems(prevItems => {
      const newItems = [...prevItems];
      // Create a new item object instead of mutating the existing one
      const currentItem = newItems[index];
      let updatedItem = { ...currentItem }; // Spread to create new object

      if (field === 'product') {
        // Product selected - find product and reset weight category
        const product = products.find(p => p._id === value);
        if (product) {
          updatedItem = {
            ...currentItem,
            productId: product._id,
            product: product.name,
            weightCategory: '',
            unitPrice: 0,
            total: 0
          };
        } else {
          updatedItem = {
            ...currentItem,
            productId: '',
            product: '',
            weightCategory: '',
            unitPrice: 0,
            total: 0
          };
        }
      } else if (field === 'weightCategory') {
        // Weight category selected - suggest price from catalog (can be overridden)
        const product = products.find(p => p._id === currentItem.productId);
        if (product && product.weightVariants && product.weightVariants.length > 0) {
          const weightVariant = product.weightVariants.find(v =>
            v.weight === parseFloat(value) && v.isActive !== false
          );
          if (weightVariant) {
            const newQuantity = parseFloat(currentItem.quantity) || 0;
            const newUnitPrice = weightVariant.price || 0;
            updatedItem = {
              ...currentItem,
              weightCategory: value,
              unitPrice: newUnitPrice,
              total: newQuantity * newUnitPrice
            };
          }
        }
      } else if (field === 'quantity') {
        // Quantity changed - recalculate total
        const newQuantity = parseFloat(value) || 0;
        const currentUnitPrice = parseFloat(currentItem.unitPrice) || 0;
        updatedItem = {
          ...currentItem,
          quantity: newQuantity,
          total: newQuantity * currentUnitPrice
        };
      } else if (field === 'unitPrice') {
        // Unit price manually changed - recalculate total
        const newUnitPrice = parseFloat(value) || 0;
        const currentQuantity = parseFloat(currentItem.quantity) || 0;
        updatedItem = {
          ...currentItem,
          unitPrice: newUnitPrice,
          total: currentQuantity * newUnitPrice
        };
      }

      newItems[index] = updatedItem;
      
      // Recalculate remaining amount within the same update
      const totalPrice = newItems.reduce((sum, i) => sum + (i.total || 0), 0);
      setFormData(prev => ({
        ...prev,
        remainingAmount: totalPrice - (parseFloat(prev.paidAmount) || 0)
      }));
      
      return newItems;
    });
  };

  // Add new item
  const addItem = () => {
    // Use functional update to ensure we're working with the latest state
    setItems(prevItems => [...prevItems, {
      id: Date.now(), // Unique ID for React key
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

  // Print professional invoice
  const printBagPurchaseInvoice = (purchase, purchaseItems, suppliersList, warehousesList) => {
    // Handle supplier - could be populated object or just ID
    let supplierData = null;
    if (purchase.supplier && typeof purchase.supplier === 'object' && purchase.supplier.name) {
      supplierData = purchase.supplier;
    } else {
      const supplierId = purchase.supplier?._id || purchase.supplier;
      supplierData = suppliersList.find(s => s._id === supplierId);
    }
    
    // Handle warehouse - could be populated object or just ID
    let warehouseData = null;
    if (purchase.warehouse && typeof purchase.warehouse === 'object' && purchase.warehouse.name) {
      warehouseData = purchase.warehouse;
    } else {
      const warehouseId = purchase.warehouse?._id || purchase.warehouse;
      warehouseData = warehousesList.find(w => w._id === warehouseId);
    }
    
    const supplierName = supplierData?.name || 'N/A';
    const supplierContact = supplierData?.contactPerson?.phone || supplierData?.phone || 'N/A';
    const supplierAddress = supplierData?.address || 'N/A';
    
    const warehouseName = warehouseData?.name || 'N/A';
    const warehouseLocation = warehouseData?.location || 'N/A';
    
    // Get all products from purchase
    const productsList = [];
    if (purchase.bags) {
      const bags = purchase.bags instanceof Map ? Object.fromEntries(purchase.bags) : purchase.bags;
      Object.entries(bags).forEach(([productName, bagData]) => {
        if (bagData && bagData.quantity > 0) {
          productsList.push({
            name: productName,
            quantity: bagData.quantity || 0,
            unit: bagData.unit || 'bags',
            unitPrice: bagData.unitPrice || 0,
            totalPrice: bagData.totalPrice || 0
          });
        }
      });
    }
    
    const totalQuantity = productsList.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const subtotal = purchase.subtotal || purchase.totalAmount || purchase.totalPrice || 
                     productsList.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    const tax = purchase.tax || 0;
    const discount = purchase.discount || 0;
    const totalAmount = purchase.totalAmount || purchase.totalPrice || subtotal + tax - discount;
    const paidAmount = purchase.paidAmount || 0;
    const dueAmount = purchase.dueAmount || (totalAmount - paidAmount);
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const purchaseDate = purchase.purchaseDate 
      ? new Date(purchase.purchaseDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : currentDate;
    
    const invoiceRows = productsList.map((product, index) => `
      <tr>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${product.name}</td>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${product.unit}</td>
        <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${product.quantity.toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">Rs. ${product.unitPrice.toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Rs. ${product.totalPrice.toLocaleString()}</td>
      </tr>
    `).join('');
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bag Purchase Invoice - ${purchase.purchaseNumber || 'N/A'}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #000; line-height: 1.4; }
            .invoice-container { max-width: 100%; padding: 20px; }
            .invoice-header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
            .company-info h1 { font-size: 28px; color: #1e40af; margin-bottom: 5px; font-weight: 700; }
            .company-info .subtitle { font-size: 13px; color: #6b7280; }
            .invoice-info { text-align: right; }
            .invoice-info h2 { font-size: 24px; color: #2563eb; margin-bottom: 5px; font-weight: 700; }
            .invoice-info .invoice-number { font-size: 14px; color: #111827; font-weight: 600; }
            .invoice-info .invoice-date { font-size: 11px; color: #6b7280; margin-top: 5px; }
            .parties-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px; }
            .party-box { background: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; border-radius: 3px; }
            .party-box h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; font-weight: 600; }
            .party-box p { font-size: 11px; color: #111827; margin: 3px 0; }
            .party-box .name { font-weight: 600; font-size: 13px; color: #111827; }
            .products-section { margin-bottom: 25px; }
            .products-section h3 { font-size: 14px; color: #111827; margin-bottom: 10px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; page-break-inside: auto; }
            thead { background: #1e40af; color: white; }
            thead th { padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            thead th:nth-child(1) { text-align: center; width: 50px; }
            thead th:nth-child(3),
            thead th:nth-child(4),
            thead th:nth-child(5),
            thead th:nth-child(6) { text-align: right; }
            tbody tr { border-bottom: 1px solid #e5e7eb; page-break-inside: avoid; }
            tbody tr:nth-child(even) { background: #f9fafb; }
            tbody td { padding: 10px 8px; font-size: 11px; color: #111827; }
            .totals-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
            .totals-box { background: #f3f4f6; padding: 15px; border-radius: 5px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .total-row:last-child { border-bottom: none; font-weight: 700; font-size: 14px; color: #1e40af; }
            .total-row .label { color: #6b7280; }
            .total-row .value { color: #111827; font-weight: 600; }
            .payment-info { background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 3px; margin-top: 20px; }
            .payment-info h3 { font-size: 12px; color: #1e40af; margin-bottom: 10px; font-weight: 600; }
            .payment-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; }
            .payment-row .paid { color: #059669; font-weight: 600; }
            .payment-row .due { color: #dc2626; font-weight: 600; }
            .notes-section { margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
            .notes-section h3 { font-size: 12px; color: #6b7280; margin-bottom: 5px; font-weight: 600; }
            .notes-section p { font-size: 11px; color: #111827; }
            .invoice-footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; }
            .invoice-footer p { font-size: 10px; color: #6b7280; margin: 3px 0; }
            @media print { 
              .no-print { display: none !important; } 
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .invoice-container { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="header-top">
                <div class="company-info">
                  <h1>FLOUR MILL</h1>
                  <div class="subtitle">Bag Purchase Invoice</div>
                </div>
                <div class="invoice-info">
                  <h2>INVOICE</h2>
                  <div class="invoice-number">Invoice #: ${purchase.purchaseNumber || 'N/A'}</div>
                  <div class="invoice-date">Date: ${purchaseDate}</div>
                </div>
              </div>
            </div>
            
            <div class="parties-section">
              <div class="party-box">
                <h3>Supplier Information</h3>
                <p class="name">${supplierName}</p>
                <p>Contact: ${supplierContact}</p>
                <p>${supplierAddress}</p>
              </div>
              <div class="party-box">
                <h3>Delivery Information</h3>
                <p class="name">${warehouseName}</p>
                <p>Location: ${warehouseLocation}</p>
                <p>Purchase Date: ${purchaseDate}</p>
              </div>
            </div>
            
            <div class="products-section">
              <h3>Products Purchased</h3>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceRows}
                  <tr style="background: #f3f4f6; font-weight: 600;">
                    <td colspan="3" style="text-align: right; padding: 12px 8px; border-top: 2px solid #1e40af;">TOTAL</td>
                    <td style="text-align: right; padding: 12px 8px; border-top: 2px solid #1e40af;">${totalQuantity.toLocaleString()}</td>
                    <td style="text-align: right; padding: 12px 8px; border-top: 2px solid #1e40af;">-</td>
                    <td style="text-align: right; padding: 12px 8px; border-top: 2px solid #1e40af; color: #1e40af; font-size: 13px;">Rs. ${subtotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="totals-section">
              <div></div>
              <div class="totals-box">
                <div class="total-row">
                  <span class="label">Subtotal:</span>
                  <span class="value">Rs. ${subtotal.toLocaleString()}</span>
                </div>
                ${tax > 0 ? `
                <div class="total-row">
                  <span class="label">Tax:</span>
                  <span class="value">Rs. ${tax.toLocaleString()}</span>
                </div>
                ` : ''}
                ${discount > 0 ? `
                <div class="total-row">
                  <span class="label">Discount:</span>
                  <span class="value">-Rs. ${discount.toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="total-row">
                  <span class="label">Grand Total:</span>
                  <span class="value">Rs. ${totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div class="payment-info">
              <h3>Payment Details</h3>
              <div class="payment-row">
                <span>Payment Status:</span>
                <span style="font-weight: 600; color: ${purchase.paymentStatus === 'Paid' ? '#059669' : purchase.paymentStatus === 'Partial' ? '#d97706' : '#dc2626'};">
                  ${purchase.paymentStatus || 'Pending'}
                </span>
              </div>
              <div class="payment-row">
                <span>Payment Method:</span>
                <span>${purchase.paymentMethod || 'N/A'}</span>
              </div>
              ${paidAmount > 0 ? `
              <div class="payment-row">
                <span>Paid Amount:</span>
                <span class="paid">Rs. ${paidAmount.toLocaleString()}</span>
              </div>
              ` : ''}
              ${dueAmount > 0 ? `
              <div class="payment-row">
                <span>Due Amount:</span>
                <span class="due">Rs. ${dueAmount.toLocaleString()}</span>
              </div>
              ` : ''}
            </div>
            
            ${purchase.notes ? `
            <div class="notes-section">
              <h3>Notes</h3>
              <p>${purchase.notes}</p>
            </div>
            ` : ''}
            
            <div class="invoice-footer">
              <p><strong>Thank you for your business!</strong></p>
              <p>Generated on ${currentDate} at ${currentTime}</p>
              <p>This is a computer-generated invoice</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.afterprint = () => printWindow.close();
      }, 250);
    };
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

      // Show success message
      if (printInvoice) {
        alert('Purchase saved successfully! Invoice will be printed now.');
      } else {
        alert('Purchase saved successfully!');
      }

      // Print invoice if selected (after a short delay to ensure message is shown)
      if (printInvoice && savedPurchase) {
        setTimeout(() => {
          printBagPurchaseInvoice(savedPurchase, validItems, suppliers, warehouses);
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
                // Use the unique ID as key to ensure React properly tracks each item
                return (
                  <div key={item.id || `item-${index}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                              {variant.weight}kg
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
                          onWheel={(e) => e.target.blur()}
                          onFocus={(e) => e.target.addEventListener('wheel', (evt) => evt.preventDefault(), { passive: false })}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="0"
                        />
                      </div>

                      {/* Unit Price (Editable) */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Unit Price (Rs.) *
                        </label>
                        <input
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          onFocus={(e) => e.target.addEventListener('wheel', (evt) => evt.preventDefault(), { passive: false })}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Enter price per kg"
                        />
                        <p className="mt-1 text-xs text-gray-500">Auto-filled from catalog, can be changed</p>
                      </div>

                      {/* Total (Read-only) */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Total (Rs.)
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
                  <p className="text-2xl font-bold text-gray-900">Rs. {grandTotal.toFixed(2)}</p>
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
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md font-semibold ${formData.remainingAmount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
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
              Select Action:
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
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {printInvoice
                ? 'The purchase will be saved and the invoice will be printed.'
                : 'The purchase will be saved. You can optionally print the invoice.'}
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
