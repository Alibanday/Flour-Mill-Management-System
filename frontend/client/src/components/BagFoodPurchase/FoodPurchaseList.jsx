import React, { useState } from 'react';
import { FaTrash, FaEye, FaPrint, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';
import FoodPurchaseDetail from './FoodPurchaseDetail';

export default function FoodPurchaseList({ purchases, loading, error, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-red-100 text-red-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Transit': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const supplierName = typeof purchase.supplier === 'object' ? purchase.supplier.name : purchase.supplier;
    const searchStr = searchTerm.toLowerCase();

    const matchesSearch = purchase.purchaseNumber?.toLowerCase().includes(searchStr) ||
      supplierName?.toLowerCase().includes(searchStr) ||
      purchase.productType?.toLowerCase().includes(searchStr);

    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;

    // Fix supplier filter comparison
    const purchaseSupplierId = typeof purchase.supplier === 'object' ? purchase.supplier._id : purchase.supplier;
    const matchesSupplier = supplierFilter === 'all' || purchaseSupplierId === supplierFilter;

    const matchesCategory = categoryFilter === 'all' || purchase.productType === categoryFilter;

    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      matchesDate = new Date(purchase.purchaseDate).toDateString() === today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(purchase.purchaseDate) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(purchase.purchaseDate) >= monthAgo;
    }

    return matchesSearch && matchesStatus && matchesSupplier && matchesCategory && matchesDate;
  });

  const uniqueSuppliers = [...new Set(purchases.map(p => p.supplier).filter(Boolean))];
  const uniqueCategories = [...new Set(purchases.map(p => p.productType).filter(Boolean))];

  // Print professional invoice
  const printWheatPurchaseInvoice = (purchase) => {
    const supplierData = purchase.supplier && typeof purchase.supplier === 'object' ? purchase.supplier : {};
    const warehouseData = purchase.warehouse && typeof purchase.warehouse === 'object' ? purchase.warehouse : {};
    
    const supplierName = supplierData.name || 'N/A';
    const supplierContact = supplierData.contactPerson?.phone || supplierData.phone || 'N/A';
    const supplierAddress = supplierData.address || 'N/A';
    
    const warehouseName = warehouseData.name || 'N/A';
    const warehouseLocation = warehouseData.location || 'N/A';
    
    // Handle both single product and foodItems array
    let quantity = 0;
    let unitPrice = 0;
    let unit = 'kg';
    let productType = 'Wheat';
    
    if (purchase.foodItems && purchase.foodItems.length > 0) {
      // Multiple items case - sum them up
      quantity = purchase.foodItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalPrice = purchase.foodItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
      unitPrice = quantity > 0 ? totalPrice / quantity : 0;
      unit = purchase.foodItems[0]?.unit || 'kg';
      productType = purchase.foodItems.map(item => item.name || item.productType).join(', ') || 'Wheat';
    } else {
      // Single product case
      quantity = purchase.quantity || purchase.totalQuantity || 0;
      unitPrice = purchase.unitPrice || 0;
      unit = purchase.unit || 'kg';
      productType = purchase.productType || 'Wheat';
    }
    
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🌾</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Food Purchases Found</h3>
        <p className="text-gray-500">Start by creating your first food purchase.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search purchases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Suppliers</option>
          {Array.from(new Map(uniqueSuppliers.map(s => [typeof s === 'object' ? s._id : s, s])).values()).map(supplier => {
            const supplierId = typeof supplier === 'object' ? supplier._id : supplier;
            const supplierName = typeof supplier === 'object' ? supplier.name : 'Unknown Supplier';
            return (
              <option key={supplierId} value={supplierId}>
                {supplierName}
              </option>
            );
          })}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {uniqueCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Food Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                Financial
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPurchases.map((purchase) => (
              <tr key={purchase._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {purchase.purchaseNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </div>
                    {purchase.deliveryDate && (
                      <div className="text-xs text-gray-400">
                        Delivery: {new Date(purchase.deliveryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {typeof purchase.supplier === 'object' ? purchase.supplier.name : purchase.supplier || 'Unknown Supplier'}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm">
                    {purchase.foodItems && purchase.foodItems.length > 0 ? (
                      <div className="space-y-1">
                        {purchase.foodItems.map((item, idx) => (
                          <div key={idx} className="border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                            <div className="text-xs">
                              <span className="font-medium">{item.name}</span>
                              {item.category && <span className="text-gray-500"> ({item.category})</span>}
                            </div>
                            <div className="text-xs text-gray-600">
                              {item.quantity} {item.unit} @ Rs. {item.unitPrice?.toLocaleString()}/unit
                            </div>
                            {item.quality && (
                              <div className="text-xs text-gray-500">
                                Quality: {item.quality}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="text-xs font-medium text-gray-700 mt-1 pt-1 border-t border-gray-200">
                          Total: {purchase.totalQuantity || 0} units
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No items</div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 min-w-[180px]">
                  <div className="text-sm">
                    <div className="text-gray-900 font-medium break-words">
                      Rs. {(purchase.totalAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 break-words">
                      Paid: Rs. {(purchase.paidAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Due: Rs. {(purchase.dueAmount || 0).toLocaleString()}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </span>
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(purchase.paymentStatus)}`}>
                        {purchase.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDeliveryStatusColor(purchase.deliveryStatus)}`}>
                        {purchase.deliveryStatus}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onDelete(purchase)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                    <button
                      onClick={() => printWheatPurchaseInvoice(purchase)}
                      className="text-gray-600 hover:text-gray-900 p-1"
                      title="Print Invoice"
                    >
                      <FaPrint />
                    </button>
                    <button
                      onClick={() => setSelectedPurchase(purchase)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredPurchases.length} of {purchases.length} purchases
          </div>
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-600">
              Total Value: <span className="font-semibold text-gray-900">
                Rs. {filteredPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString()}
              </span>
            </span>
            <span className="text-gray-600">
              Total Quantity: <span className="font-semibold text-gray-900">
                {filteredPurchases.reduce((sum, p) => sum + (p.totalQuantity || 0), 0)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPurchase && (
        <FoodPurchaseDetail
          purchaseId={selectedPurchase?._id}
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onDelete={(purchase) => {
            if (onDelete) {
              onDelete(purchase);
            }
            setSelectedPurchase(null);
          }}
        />
      )}
    </div>
  );
}