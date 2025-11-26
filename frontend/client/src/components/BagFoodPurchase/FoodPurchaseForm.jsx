import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPrint, FaWarehouse, FaSpinner, FaMoneyBillWave, FaInfoCircle, FaBox } from 'react-icons/fa';

export default function FoodPurchaseForm({ purchase, suppliers, onClose, onSave }) {
  const [formData, setFormData] = useState({
    purchaseNumber: 'Auto-generated',
    purchaseType: 'Private',
    supplier: '',
    productType: 'Wheat',
    quantity: 0,
    unit: 'kg',
    unitPrice: 0,
    totalPrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    deliveryStatus: 'Pending',
    paymentStatus: 'Pending',
    paidAmount: 0,
    remainingAmount: 0,
    expectedDeliveryDate: '',
    warehouse: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [currentWheatStock, setCurrentWheatStock] = useState(0);
  const [loadingStock, setLoadingStock] = useState(false);

  const isEditing = !!purchase;

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      setWarehousesLoading(true);
      try {
        const response = await fetch('/api/warehouses', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
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

  // Fetch wheat stock when warehouse changes
  useEffect(() => {
    if (formData.warehouse) {
      fetchWheatStock(formData.warehouse);
    } else {
      setCurrentWheatStock(0);
    }
  }, [formData.warehouse]);

  // Function to fetch current wheat stock for selected warehouse
  const fetchWheatStock = async (warehouseId) => {
    setLoadingStock(true);
    try {
      const response = await fetch(`http://localhost:7000/api/warehouses/${warehouseId}/inventory`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.inventory) {
          const inventory = data.data.inventory;
          const wheatInventory = inventory.wheat || {};
          const wheatStock = wheatInventory.currentStock !== undefined 
            ? wheatInventory.currentStock 
            : (wheatInventory.totalWheat || 0);
          setCurrentWheatStock(wheatStock);
        } else {
          const inventoryResponse = await fetch(`http://localhost:7000/api/inventory?warehouse=${warehouseId}&limit=1000`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (inventoryResponse.ok) {
            const inventoryData = await inventoryResponse.json();
            const inventoryItems = inventoryData.data || [];
            let totalStock = 0;
            inventoryItems.forEach(item => {
              const normalizedCategory = (item.category || item.product?.category || '').toLowerCase();
              const normalizedName = (item.name || item.product?.name || '').toLowerCase();
              const normalizedSubcategory = (item.subcategory || item.product?.subcategory || '').toLowerCase();
              
              if (normalizedCategory.includes('wheat') || 
                  normalizedName.includes('wheat') ||
                  normalizedSubcategory.includes('wheat') ||
                  normalizedName.includes('grain')) {
                const stock = item.currentStock !== undefined ? item.currentStock : (item.weight || 0);
                totalStock += stock;
              }
            });
            setCurrentWheatStock(totalStock);
          } else {
            setCurrentWheatStock(0);
          }
        }
      } else {
        console.error('Failed to fetch warehouse inventory:', response.status);
        setCurrentWheatStock(0);
      }
    } catch (error) {
      console.error('Error fetching wheat stock:', error);
      setCurrentWheatStock(0);
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    if (purchase) {
      setFormData({
        purchaseNumber: purchase.purchaseNumber || '',
        purchaseType: purchase.purchaseType || 'Private',
        supplier: purchase.supplier || '',
        productType: purchase.productType || 'Wheat',
        quantity: purchase.quantity || 0,
        unit: purchase.unit || 'kg',
        unitPrice: purchase.unitPrice || 0,
        totalPrice: purchase.totalPrice || 0,
        purchaseDate: new Date(purchase.purchaseDate).toISOString().split('T')[0],
        status: purchase.status || 'Pending',
        deliveryStatus: purchase.deliveryStatus || 'Pending',
        paymentStatus: purchase.paymentStatus || 'Pending',
        paidAmount: purchase.paidAmount || 0,
        remainingAmount: purchase.remainingAmount || 0,
        expectedDeliveryDate: purchase.expectedDeliveryDate ? new Date(purchase.expectedDeliveryDate).toISOString().split('T')[0] : '',
        warehouse: purchase.warehouse || '',
        notes: purchase.notes || ''
      });
    } else {
      setFormData(prev => ({
        ...prev,
        purchaseNumber: 'Auto-generated'
      }));
    }
  }, [purchase]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? value === 'true' : value
    };

    if (name === 'purchaseType') {
      newFormData.supplier = '';
    }

    if (name === 'quantity' || name === 'unitPrice') {
      const quantity = name === 'quantity' ? parseFloat(value) || 0 : formData.quantity;
      const unitPrice = name === 'unitPrice' ? parseFloat(value) || 0 : formData.unitPrice;
      newFormData.totalPrice = quantity * unitPrice;
      const paidAmount = parseFloat(newFormData.paidAmount) || 0;
      newFormData.remainingAmount = Math.max(0, newFormData.totalPrice - paidAmount);
    }

    if (name === 'paidAmount') {
      const paidAmount = parseFloat(value) || 0;
      const totalPrice = parseFloat(newFormData.totalPrice) || 0;
      newFormData.remainingAmount = Math.max(0, totalPrice - paidAmount);
      if (paidAmount === 0) {
        newFormData.paymentStatus = 'Pending';
      } else if (paidAmount >= totalPrice) {
        newFormData.paymentStatus = 'Completed';
      } else {
        newFormData.paymentStatus = 'Partial';
      }
    }

    if (name === 'paymentStatus') {
      const totalPrice = parseFloat(newFormData.totalPrice) || 0;
      if (value === 'Completed') {
        newFormData.paidAmount = totalPrice;
        newFormData.remainingAmount = 0;
      } else if (value === 'Pending') {
        newFormData.paidAmount = 0;
        newFormData.remainingAmount = totalPrice;
      } else {
        const currentPaid = parseFloat(newFormData.paidAmount) || 0;
        newFormData.remainingAmount = Math.max(0, totalPrice - currentPaid);
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('📝 FoodPurchaseForm: Submitting form data:', formData);
      const result = await onSave(formData);
      console.log('✅ FoodPurchaseForm: Save successful, result:', result);
      onClose();
    } catch (err) {
      console.error('❌ FoodPurchaseForm: Save failed:', err);
      setError(err.message || 'Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  // Print professional invoice
  const printWheatPurchaseInvoice = (purchase) => {
    const supplierData = purchase.supplier && typeof purchase.supplier === 'object' 
      ? purchase.supplier 
      : suppliers.find(s => s._id === purchase.supplier) || {};
    
    const warehouseData = purchase.warehouse && typeof purchase.warehouse === 'object' 
      ? purchase.warehouse 
      : warehouses.find(w => w._id === purchase.warehouse) || {};
    
    const supplierName = supplierData.name || 'N/A';
    const supplierContact = supplierData.contactPerson?.phone || supplierData.phone || 'N/A';
    const supplierAddress = supplierData.address || 'N/A';
    
    const warehouseName = warehouseData.name || 'N/A';
    const warehouseLocation = warehouseData.location || 'N/A';
    
    const quantity = purchase.quantity || purchase.totalQuantity || 0;
    const unitPrice = purchase.unitPrice || 0;
    const unit = purchase.unit || 'kg';
    const productType = purchase.productType || 'Wheat';
    
    const subtotal = purchase.subtotal || purchase.totalPrice || purchase.totalAmount || (quantity * unitPrice);
    const tax = purchase.tax || 0;
    const discount = purchase.discount || 0;
    const totalAmount = purchase.totalAmount || purchase.totalPrice || (subtotal + tax - discount);
    const paidAmount = purchase.paidAmount || 0;
    const dueAmount = purchase.dueAmount || purchase.remainingAmount || (totalAmount - paidAmount);
    
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
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Wheat Purchase Invoice - ${purchase.purchaseNumber || 'N/A'}</title>
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
            .delivery-info { background: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; border-radius: 3px; margin-top: 15px; }
            .delivery-info h3 { font-size: 12px; color: #166534; margin-bottom: 10px; font-weight: 600; }
            .delivery-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; }
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
                  <div class="subtitle">Wheat Purchase Invoice</div>
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
                ${purchase.purchaseType ? `<p>Type: ${purchase.purchaseType}</p>` : ''}
              </div>
              <div class="party-box">
                <h3>Delivery Information</h3>
                <p class="name">${warehouseName}</p>
                <p>Location: ${warehouseLocation}</p>
                <p>Purchase Date: ${purchaseDate}</p>
                ${purchase.expectedDeliveryDate ? `<p>Expected Delivery: ${new Date(purchase.expectedDeliveryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
              </div>
            </div>
            
            <div class="products-section">
              <h3>Product Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Type</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">1</td>
                    <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${productType}</td>
                    <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${unit}</td>
                    <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${quantity.toLocaleString()}</td>
                    <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">Rs. ${unitPrice.toLocaleString()}</td>
                    <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Rs. ${subtotal.toLocaleString()}</td>
                  </tr>
                  <tr style="background: #f3f4f6; font-weight: 600;">
                    <td colspan="3" style="text-align: right; padding: 12px 8px; border-top: 2px solid #1e40af;">TOTAL</td>
                    <td style="text-align: right; padding: 12px 8px; border-top: 2px solid #1e40af;">${quantity.toLocaleString()} ${unit}</td>
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
                <span style="font-weight: 600; color: ${purchase.paymentStatus === 'Completed' ? '#059669' : purchase.paymentStatus === 'Partial' ? '#d97706' : '#dc2626'};">
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
            
            ${purchase.deliveryStatus ? `
            <div class="delivery-info">
              <h3>Delivery Details</h3>
              <div class="delivery-row">
                <span>Delivery Status:</span>
                <span style="font-weight: 600; color: ${purchase.deliveryStatus === 'Delivered' ? '#059669' : purchase.deliveryStatus === 'In Transit' ? '#2563eb' : '#d97706'};">
                  ${purchase.deliveryStatus}
                </span>
              </div>
              ${purchase.expectedDeliveryDate ? `
              <div class="delivery-row">
                <span>Expected Delivery:</span>
                <span>${new Date(purchase.expectedDeliveryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}
            
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

  const handlePrint = () => {
    printWheatPurchaseInvoice(formData);
  };

  const privateSuppliers = suppliers.filter(s => s.supplierType === 'Private');
  const governmentSuppliers = suppliers.filter(s => s.supplierType === 'Government');

  const getCurrentSuppliers = () => {
    return formData.purchaseType === 'Government' ? governmentSuppliers : privateSuppliers;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Edit Food Purchase' : 'New Food Purchase'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">Wheat purchase form</p>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <FaTimes className="mr-2" />
              Close
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-600 flex items-center">
              <FaInfoCircle className="mr-2" />
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information Section */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaInfoCircle className="mr-2 text-blue-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Number
                </label>
                <input
                  type="text"
                  name="purchaseNumber"
                  value={formData.purchaseNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Type *
                </label>
                <select
                  name="purchaseType"
                  value={formData.purchaseType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Private">🛒 Private Purchase</option>
                  <option value="Government">🏛️ Government Purchase</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier * ({formData.purchaseType})
                </label>
                <select
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select {formData.purchaseType.toLowerCase()} supplier</option>
                  {getCurrentSuppliers().map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.supplierCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type *
                </label>
                <input
                  type="text"
                  name="productType"
                  value={formData.productType}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                />
              </div>
            </div>
          </div>

          {/* Product Details Section with Prominent Total */}
          <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaBox className="mr-2 text-blue-600" />
              Product Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (kg) *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  onWheel={(e) => e.target.blur()}
                  onFocus={(e) => e.target.addEventListener('wheel', (evt) => evt.preventDefault(), { passive: false })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per kg (Rs.) *
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  onWheel={(e) => e.target.blur()}
                  onFocus={(e) => e.target.addEventListener('wheel', (evt) => evt.preventDefault(), { passive: false })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Enter price per kg"
                />
              </div>
            </div>

            {/* Prominent Total Price Display */}
            <div className="bg-white rounded-lg p-4 border-2 border-blue-400 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaMoneyBillWave className="text-blue-600 text-xl mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Purchase Amount</p>
                    <p className="text-3xl font-bold text-blue-600">Rs. {formData.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Quantity × Unit Price</p>
                  <p className="text-sm text-gray-700 font-medium">
                    {formData.quantity || 0} kg × Rs. {formData.unitPrice || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warehouse & Stock Section */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaWarehouse className="mr-2 text-blue-600" />
              Warehouse & Stock Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warehouse (Where to store wheat) *
              </label>
              <select
                name="warehouse"
                value={formData.warehouse}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={warehousesLoading}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse._id} value={warehouse._id}>
                    {warehouse.name} - {warehouse.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Wheat Stock Display */}
            {formData.warehouse && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaBox className="text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">Current Wheat Stock</span>
                  </div>
                  {loadingStock ? (
                    <div className="flex items-center text-blue-600">
                      <FaSpinner className="animate-spin mr-2" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-blue-600">{currentWheatStock.toFixed(2)} kg</span>
                  )}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Your purchase will be added to this stock amount.
                </p>
              </div>
            )}
          </div>

          {/* Status & Delivery Section */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Delivery</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status *
                </label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Status *
                </label>
                <select
                  name="deliveryStatus"
                  value={formData.deliveryStatus}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            {formData.deliveryStatus === 'Pending' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Delivery Date *
                </label>
                <input
                  type="date"
                  name="expectedDeliveryDate"
                  value={formData.expectedDeliveryDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            )}
          </div>

          {/* Payment Details Section */}
          {formData.paymentStatus === 'Partial' && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                <FaMoneyBillWave className="mr-2" />
                Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid Amount (Rs.) *
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleInputChange}
                    onWheel={(e) => e.target.blur()}
                    onFocus={(e) => e.target.addEventListener('wheel', (evt) => evt.preventDefault(), { passive: false })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                    placeholder="Enter paid amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={formData.totalPrice.toFixed(2)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remaining Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    value={formData.remainingAmount.toFixed(2)}
                    readOnly
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg font-semibold text-sm ${
                      formData.remainingAmount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Additional notes about this purchase..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {isEditing ? 'Update Purchase' : 'Create Purchase'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
