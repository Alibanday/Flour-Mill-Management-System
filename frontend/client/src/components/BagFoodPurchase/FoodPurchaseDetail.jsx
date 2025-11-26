import React, { useState, useEffect } from 'react';
import { FaTimes, FaPrint, FaTrash, FaWarehouse, FaUser, FaCalendar, FaMoneyBillWave, FaFileInvoice, FaTruck } from 'react-icons/fa';

export default function FoodPurchaseDetail({ purchaseId, purchase, onClose, onDelete }) {
  const [purchaseData, setPurchaseData] = useState(purchase || null);
  const [loading, setLoading] = useState(!purchase);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (purchase) {
      setPurchaseData(purchase);
      setLoading(false);
    }
  }, [purchase]);

  useEffect(() => {
    if (!purchaseId) return;

    const needsFetch =
      !purchase ||
      typeof purchase.warehouse !== 'object' ||
      typeof purchase.supplier !== 'object' ||
      !purchase.foodItems ||
      purchase.foodItems.length === 0;

    if (needsFetch) {
      fetchPurchase();
    }
  }, [purchaseId, purchase]);

  const fetchPurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:7000/api/food-purchases/${purchaseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPurchaseData(data.data || data);
      } else {
        setError('Failed to fetch purchase details');
      }
    } catch (err) {
      console.error('Error fetching purchase:', err);
      setError('Failed to fetch purchase details');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  if (error || !purchaseData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-red-600 mb-4">{error || 'Purchase not found'}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const foodItems = purchaseData.foodItems || [];
  const totalQuantity = purchaseData.totalQuantity || foodItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = purchaseData.totalAmount || purchaseData.totalPrice || 
                      foodItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const paidAmount = purchaseData.paidAmount || 0;
  const dueAmount = purchaseData.dueAmount || purchaseData.remainingAmount || (totalAmount - paidAmount);
  const supplier = purchaseData.supplier;
  const supplierName = supplier && typeof supplier === 'object' ? supplier.name : supplier || 'Unknown Supplier';
  const warehouse = purchaseData.warehouse;
  const warehouseName = warehouse && typeof warehouse === 'object' ? warehouse.name : warehouse || 'Unknown Warehouse';
  const createdBy = purchaseData.createdBy;
  const createdByName = createdBy && typeof createdBy === 'object' 
    ? `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim() 
    : 'Unknown User';

  // Print professional invoice
  const printWheatPurchaseInvoice = (purchase) => {
    const supplierData = purchase.supplier && typeof purchase.supplier === 'object' ? purchase.supplier : {};
    const warehouseData = purchase.warehouse && typeof purchase.warehouse === 'object' ? purchase.warehouse : {};
    
    const supplierName = supplierData.name || 'N/A';
    const supplierContact = supplierData.contactPerson?.phone || supplierData.phone || 'N/A';
    const supplierAddress = supplierData.address || 'N/A';
    
    const warehouseName = warehouseData.name || 'N/A';
    const warehouseLocation = warehouseData.location || 'N/A';
    
    const foodItems = purchase.foodItems || [];
    const totalQuantity = purchase.totalQuantity || foodItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    const subtotal = purchase.subtotal || purchase.totalAmount || purchase.totalPrice || 
                     foodItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
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
    
    const invoiceRows = foodItems.length > 0 ? foodItems.map((item, index) => `
      <tr>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${item.name || 'N/A'}</td>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${item.unit || 'kg'}</td>
        <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${(item.quantity || 0).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">Rs. ${(item.unitPrice || 0).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Rs. ${(item.totalPrice || 0).toLocaleString()}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="6" style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">No items</td>
      </tr>
    `;
    
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Wheat Purchase Details</h2>
            <p className="text-sm text-gray-500 mt-1">Purchase Number: {purchaseData.purchaseNumber}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => printWheatPurchaseInvoice(purchaseData)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
            >
              <FaPrint className="mr-2" />
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Purchase Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FaUser className="mr-2" />
              Supplier Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium text-gray-900">{supplierName}</span>
              </div>
              {supplier && typeof supplier === 'object' && (
                <>
                  {supplier.contactPerson && (
                    <div>
                      <span className="text-gray-600">Contact Person:</span>
                      <span className="ml-2 text-gray-900">{supplier.contactPerson}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 text-gray-900">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 text-gray-900">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.supplierType && (
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 text-gray-900">{supplier.supplierType}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FaWarehouse className="mr-2" />
              Warehouse Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Warehouse:</span>
                <span className="ml-2 font-medium text-gray-900">{warehouseName}</span>
              </div>
              {warehouse && typeof warehouse === 'object' && warehouse.location && (
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 text-gray-900">{warehouse.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FaCalendar className="mr-2" />
              Date Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Purchase Date:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {new Date(purchaseData.purchaseDate).toLocaleDateString()}
                </span>
              </div>
              {purchaseData.expectedDeliveryDate && (
                <div>
                  <span className="text-gray-600">Expected Delivery:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(purchaseData.expectedDeliveryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {purchaseData.deliveryDate && (
                <div>
                  <span className="text-gray-600">Delivery Date:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(purchaseData.deliveryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FaFileInvoice className="mr-2" />
              Status Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(purchaseData.status)}`}>
                  {purchaseData.status || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Payment Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(purchaseData.paymentStatus)}`}>
                  {purchaseData.paymentStatus || 'Unknown'}
                </span>
              </div>
              {purchaseData.deliveryStatus && (
                <div>
                  <span className="text-gray-600">Delivery Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getDeliveryStatusColor(purchaseData.deliveryStatus)}`}>
                    {purchaseData.deliveryStatus}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Created By:</span>
                <span className="ml-2 text-gray-900">{createdByName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Food Items Table */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Food Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price (Rs.)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Price (Rs.)
                  </th>
                  {foodItems.some(item => item.quality) && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {foodItems.length === 0 ? (
                  <tr>
                    <td colSpan={foodItems.some(item => item.quality) ? "7" : "6"} className="px-4 py-4 text-center text-gray-500">
                      No food items found
                    </td>
                  </tr>
                ) : (
                  foodItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.category || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.unit || 'kg'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {(item.quantity || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Rs. {(item.unitPrice || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        Rs. {(item.totalPrice || 0).toLocaleString()}
                      </td>
                      {foodItems.some(item => item.quality) && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.quality || '-'}
                        </td>
                      )}
                    </tr>
                  ))
                )}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={foodItems.some(item => item.quality) ? "3" : "2"} className="px-4 py-3 text-sm text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {totalQuantity.toLocaleString()} {foodItems.length > 0 ? foodItems[0].unit || 'units' : 'units'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    -
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    Rs. {totalAmount.toLocaleString()}
                  </td>
                  {foodItems.some(item => item.quality) && (
                    <td className="px-4 py-3 text-sm text-gray-600">-</td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaMoneyBillWave className="mr-2" />
            Financial Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900">Rs. {totalAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Paid Amount</div>
              <div className="text-2xl font-bold text-green-600">Rs. {paidAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Due Amount</div>
              <div className="text-2xl font-bold text-red-600">Rs. {dueAmount.toLocaleString()}</div>
            </div>
          </div>
          {purchaseData.paymentMethod && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="text-sm text-gray-600">Payment Method</div>
              <div className="text-lg font-medium text-gray-900">{purchaseData.paymentMethod}</div>
            </div>
          )}
          {(purchaseData.tax > 0 || purchaseData.discount > 0) && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {purchaseData.tax > 0 && (
                  <div>
                    <span className="text-gray-600">Tax:</span>
                    <span className="ml-2 font-medium text-gray-900">Rs. {(purchaseData.tax || 0).toLocaleString()}</span>
                  </div>
                )}
                {purchaseData.discount > 0 && (
                  <div>
                    <span className="text-gray-600">Discount:</span>
                    <span className="ml-2 font-medium text-gray-900">Rs. {(purchaseData.discount || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delivery Information */}
        {purchaseData.deliveryStatus && (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaTruck className="mr-2" />
              Delivery Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Delivery Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getDeliveryStatusColor(purchaseData.deliveryStatus)}`}>
                  {purchaseData.deliveryStatus}
                </span>
              </div>
              {purchaseData.expectedDeliveryDate && (
                <div>
                  <span className="text-gray-600">Expected Delivery:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(purchaseData.expectedDeliveryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {purchaseData.deliveryDate && (
                <div>
                  <span className="text-gray-600">Actual Delivery Date:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(purchaseData.deliveryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {purchaseData.notes && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{purchaseData.notes}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this purchase?')) {
                  onDelete(purchaseData);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            >
              <FaTrash className="mr-2" />
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

