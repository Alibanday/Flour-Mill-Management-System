import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaFileInvoice,
  FaUserTie,
  FaWarehouse,
  FaShoppingCart,
  FaMoneyBillWave,
  FaClipboardList,
  FaSpinner,
  FaPrint,
  FaPassport
} from 'react-icons/fa';

const formatCurrency = (amount) => {
  const numericValue = Number(amount) || 0;
  return `Rs. ${numericValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatValue = (value) => {
  if (!value && value !== 0) return 'N/A';
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || 'N/A';
  if (typeof value === 'object') {
    return Object.values(value)
      .filter(Boolean)
      .join(', ') || 'N/A';
  }
  return String(value);
};

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gatePass, setGatePass] = useState(null);
  const [loadingGatePass, setLoadingGatePass] = useState(false);

  useEffect(() => {
    const fetchSaleDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:7000/api/sales/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to load sale details');
        }

        const data = await response.json();
        const saleData = data.data || data.sale || data;
        setSale(saleData);
        
        // Fetch gatepass if sale exists
        if (saleData?._id) {
          fetchGatePass(saleData._id);
        }
      } catch (err) {
        console.error('❌ Error fetching sale detail:', err);
        setError(err.message || 'Unable to load sale details');
      } finally {
        setLoading(false);
      }
    };

    const fetchGatePass = async (saleId) => {
      try {
        setLoadingGatePass(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:7000/api/gate-pass?relatedSale=${saleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Get the first gatepass for this sale
          const gatePasses = data.data || data.gatePasses || [];
          if (gatePasses.length > 0) {
            setGatePass(gatePasses[0]);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching gatepass:', err);
        // Don't set error, gatepass is optional
      } finally {
        setLoadingGatePass(false);
      }
    };

    if (id) {
      fetchSaleDetail();
    }
  }, [id]);

  const saleItems = useMemo(() => {
    if (!sale?.items || !Array.isArray(sale.items)) {
      return [];
    }

    return sale.items.map((item, index) => ({
      key: item._id || index,
      name: item.name || item.productName || item.itemName || 'Unnamed Item',
      sku: item.sku || item.code || item.itemCode || '—',
      quantity: item.quantity || 0,
      unit: item.unit || item.unitOfMeasure || 'units',
      unitPrice: item.unitPrice || item.price || 0,
      totalPrice: item.totalPrice || (item.quantity || 0) * (item.unitPrice || item.price || 0)
    }));
  }, [sale]);

  const handleGoBack = () => {
    navigate('/sales');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-600">
        <FaSpinner className="animate-spin text-3xl mb-4" />
        <p>Loading sale details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-600">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button
          onClick={handleGoBack}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
        >
          <FaArrowLeft className="mr-2" />
          Back to Sales
        </button>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-600">
        <p className="text-gray-700 mb-4">Sale not found.</p>
        <button
          onClick={handleGoBack}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
        >
          <FaArrowLeft className="mr-2" />
          Back to Sales
        </button>
      </div>
    );
  }

  const customer = sale.customer || sale.customerDetails || {};
  const warehouse = sale.warehouse || sale.warehouseDetails || {};
  const payment = sale.payment || {};

  const subtotal = sale.subtotal ?? saleItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const discountObj = sale.discount || payment.discount || {};
  const discount = typeof discountObj === 'object' && discountObj.amount !== undefined 
    ? discountObj.amount 
    : (typeof discountObj === 'number' ? discountObj : 0);
  const tax = sale.tax || payment.tax || 0;
  const totalAmount = sale.totalAmount || sale.total || payment.total || subtotal - discount + tax;
  const paidAmount = sale.paidAmount || payment.paidAmount || 0;
  const dueAmount = sale.dueAmount || payment.dueAmount || Math.max(0, totalAmount - paidAmount);

  // Print Invoice
  const printInvoice = () => {
    if (!sale) return;
    
    const saleDate = sale.saleDate 
      ? new Date(sale.saleDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const customerName = customer.name || customer.customerName || 'Walk-in Customer';
    const customerPhone = customer.contact?.phone || customer.phone || 'N/A';
    const customerEmail = customer.contact?.email || customer.email || '';
    const customerAddress = (() => {
      const addr = customer.contact?.address || customer.address;
      if (!addr) return '';
      if (typeof addr === 'string') return addr;
      return formatValue(addr);
    })();
    
    const warehouseName = warehouse.name || warehouse.warehouseName || 'N/A';
    const warehouseLocation = warehouse.location || warehouse.address || 'N/A';
    
    const invoiceRows = saleItems.map((item, index) => `
      <tr>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${item.name || 'N/A'}</td>
        <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${item.unit || 'units'}</td>
        <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${(item.quantity || 0).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">Rs. ${(item.unitPrice || 0).toLocaleString()}</td>
        <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Rs. ${(item.totalPrice || 0).toLocaleString()}</td>
      </tr>
    `).join('');
    
    const totalQuantity = saleItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Invoice - ${sale.invoiceNumber || 'N/A'}</title>
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
                  <div class="subtitle">Sales Invoice</div>
                </div>
                <div class="invoice-info">
                  <h2>INVOICE</h2>
                  <div class="invoice-number">Invoice #: ${sale.invoiceNumber || 'N/A'}</div>
                  <div class="invoice-date">Date: ${saleDate}</div>
                </div>
              </div>
            </div>
            
            <div class="parties-section">
              <div class="party-box">
                <h3>Bill To</h3>
                <p class="name">${customerName}</p>
                ${customerPhone !== 'N/A' ? `<p>Contact: ${customerPhone}</p>` : ''}
                ${customerEmail ? `<p>Email: ${customerEmail}</p>` : ''}
                ${customerAddress ? `<p>${customerAddress}</p>` : ''}
              </div>
              <div class="party-box">
                <h3>Delivery Information</h3>
                <p class="name">${warehouseName}</p>
                <p>Location: ${warehouseLocation}</p>
                <p>Sale Date: ${saleDate}</p>
              </div>
            </div>
            
            <div class="products-section">
              <h3>Products Sold</h3>
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
                    <td style="text-align: right; padding: 12px 8px; border-top: 2px solid #1e40af; color: #1e40af; font-size: 13px;">Rs. ${(subtotal || 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="totals-section">
              <div></div>
              <div class="totals-box">
                <div class="total-row">
                  <span class="label">Subtotal:</span>
                  <span class="value">Rs. ${(subtotal || 0).toLocaleString()}</span>
                </div>
                ${discount > 0 ? `
                <div class="total-row">
                  <span class="label">Discount:</span>
                  <span class="value">-Rs. ${discount.toLocaleString()}</span>
                </div>
                ` : ''}
                ${tax > 0 ? `
                <div class="total-row">
                  <span class="label">Tax:</span>
                  <span class="value">Rs. ${tax.toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="total-row">
                  <span class="label">Grand Total:</span>
                  <span class="value">Rs. ${(totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div class="payment-info">
              <h3>Payment Details</h3>
              <div class="payment-row">
                <span>Payment Status:</span>
                <span style="font-weight: 600; color: ${sale.paymentStatus === 'Paid' || sale.paymentStatus === 'Total Paid' ? '#059669' : sale.paymentStatus === 'Partial' ? '#d97706' : '#dc2626'};">
                  ${sale.paymentStatus || 'Pending'}
                </span>
              </div>
              <div class="payment-row">
                <span>Payment Method:</span>
                <span>${sale.paymentMethod || payment.method || 'N/A'}</span>
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
            
            ${sale.notes ? `
            <div class="notes-section">
              <h3>Notes</h3>
              <p>${sale.notes}</p>
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

  // Print Gatepass
  const printGatepass = () => {
    if (!sale || !gatePass) {
      alert('Gate pass not found for this sale. It may not have been generated yet.');
      return;
    }
    
    const gatePassDate = gatePass.validFrom 
      ? new Date(gatePass.validFrom).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
    
    const validUntilDate = gatePass.validUntil
      ? new Date(gatePass.validUntil).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : '';
    
    const issuedToName = gatePass.issuedTo?.name || customer.name || customer.customerName || 'N/A';
    const issuedToContact = gatePass.issuedTo?.contact || customer.contact?.phone || customer.phone || 'N/A';
    const warehouseName = warehouse.name || warehouse.warehouseName || 'N/A';
    
    // Use gatepass items if available, otherwise fall back to sale items
    const itemsToShow = gatePass.items && gatePass.items.length > 0 ? gatePass.items : saleItems;
    
    const gatePassRows = itemsToShow.map((item, index) => {
      const itemName = item.description || item.name || item.productName || 'N/A';
      const itemQuantity = item.quantity || 0;
      const itemUnit = item.unit || 'units';
      const itemValue = item.value || item.totalPrice || 0;
      
      return `
        <tr>
          <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${itemName}</td>
          <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${itemQuantity.toLocaleString()}</td>
          <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">${itemUnit}</td>
          <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Rs. ${itemValue.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gate Pass - ${gatePass.gatePassNumber || 'N/A'}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #000; line-height: 1.4; }
            .gatepass-container { max-width: 100%; padding: 20px; }
            .gatepass-header { border-bottom: 3px solid #9333ea; padding-bottom: 20px; margin-bottom: 25px; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
            .company-info h1 { font-size: 28px; color: #7c3aed; margin-bottom: 5px; font-weight: 700; }
            .company-info .subtitle { font-size: 13px; color: #6b7280; }
            .gatepass-info { text-align: right; }
            .gatepass-info h2 { font-size: 24px; color: #9333ea; margin-bottom: 5px; font-weight: 700; }
            .gatepass-info .gatepass-number { font-size: 14px; color: #111827; font-weight: 600; }
            .gatepass-info .gatepass-date { font-size: 11px; color: #6b7280; margin-top: 5px; }
            .details-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px; }
            .detail-box { background: #f9fafb; padding: 15px; border-left: 4px solid #9333ea; border-radius: 3px; }
            .detail-box h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; font-weight: 600; }
            .detail-box p { font-size: 11px; color: #111827; margin: 3px 0; }
            .detail-box .name { font-weight: 600; font-size: 13px; color: #111827; }
            .items-section { margin-bottom: 25px; }
            .items-section h3 { font-size: 14px; color: #111827; margin-bottom: 10px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; page-break-inside: auto; }
            thead { background: #7c3aed; color: white; }
            thead th { padding: 12px 8px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            thead th:nth-child(1) { text-align: center; width: 50px; }
            thead th:nth-child(3),
            thead th:nth-child(5) { text-align: right; }
            thead th:nth-child(4) { text-align: center; }
            tbody tr { border-bottom: 1px solid #e5e7eb; page-break-inside: avoid; }
            tbody tr:nth-child(even) { background: #f9fafb; }
            tbody td { padding: 10px 8px; font-size: 11px; color: #111827; }
            .info-section { background: #f3f4f6; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
            .info-row:last-child { border-bottom: none; }
            .info-row .label { color: #6b7280; font-weight: 600; }
            .info-row .value { color: #111827; }
            .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
            .signature-box { text-align: center; }
            .signature-box h3 { font-size: 12px; color: #6b7280; margin-bottom: 40px; font-weight: 600; }
            .signature-line { border-top: 2px solid #111827; width: 200px; margin: 0 auto 5px; }
            .signature-label { font-size: 10px; color: #6b7280; }
            .gatepass-footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; }
            .gatepass-footer p { font-size: 10px; color: #6b7280; margin: 3px 0; }
            @media print { 
              .no-print { display: none !important; } 
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .gatepass-container { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="gatepass-container">
            <div class="gatepass-header">
              <div class="header-top">
                <div class="company-info">
                  <h1>FLOUR MILL</h1>
                  <div class="subtitle">Gate Pass</div>
                </div>
                <div class="gatepass-info">
                  <h2>GATE PASS</h2>
                  <div class="gatepass-number">Gate Pass #: ${gatePass.gatePassNumber || 'N/A'}</div>
                  <div class="gatepass-date">Date: ${gatePassDate}</div>
                </div>
              </div>
            </div>
            
            <div class="details-section">
              <div class="detail-box">
                <h3>Issued To</h3>
                <p class="name">${issuedToName}</p>
                ${issuedToContact !== 'N/A' ? `<p>Contact: ${issuedToContact}</p>` : ''}
              </div>
              <div class="detail-box">
                <h3>Gate Pass Details</h3>
                <p><strong>Type:</strong> ${gatePass.type || 'Material'}</p>
                <p><strong>Purpose:</strong> ${gatePass.purpose || 'Stock Dispatch for Sale'}</p>
                <p><strong>Status:</strong> ${gatePass.status || 'Active'}</p>
                ${validUntilDate ? `<p><strong>Valid Until:</strong> ${validUntilDate}</p>` : ''}
              </div>
            </div>
            
            <div class="items-section">
              <h3>Items to Dispatch</h3>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${gatePassRows}
                </tbody>
              </table>
            </div>
            
            <div class="info-section">
              <div class="info-row">
                <span class="label">Warehouse:</span>
                <span class="value">${warehouseName}</span>
              </div>
              ${gatePass.notes ? `
              <div class="info-row">
                <span class="label">Notes:</span>
                <span class="value">${gatePass.notes}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <h3>Authorized By</h3>
                <div class="signature-line"></div>
                <div class="signature-label">Signature</div>
              </div>
              <div class="signature-box">
                <h3>Received By</h3>
                <div class="signature-line"></div>
                <div class="signature-label">Signature</div>
              </div>
            </div>
            
            <div class="gatepass-footer">
              <p><strong>This gate pass is valid for stock dispatch only.</strong></p>
              <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p>This is a computer-generated gate pass</p>
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

  // Print Both
  const printBoth = () => {
    printInvoice();
    setTimeout(() => {
      printGatepass();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaFileInvoice className="text-blue-600 mr-2" />
              Sale Details
            </h1>
            <p className="text-sm text-gray-500">Invoice #{sale.invoiceNumber || sale.reference || 'N/A'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
              sale.status === 'Completed' ? 'bg-green-100 text-green-800' :
              sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              <FaShoppingCart className="mr-2" />
              {sale.status || 'Pending'}
            </span>
            <button
              onClick={printInvoice}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700"
              title="Print Invoice"
            >
              <FaPrint className="mr-2" />
              Print Invoice
            </button>
            {gatePass && (
              <button
                onClick={printGatepass}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md shadow hover:bg-purple-700"
                title="Print Gatepass"
              >
                <FaPassport className="mr-2" />
                Print Gatepass
              </button>
            )}
            {gatePass && (
              <button
                onClick={printBoth}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700"
                title="Print Invoice and Gatepass"
              >
                <FaPrint className="mr-2" />
                Print Both
              </button>
            )}
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
            >
              <FaArrowLeft className="mr-2" />
              Back to Sales
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <FaFileInvoice className="mr-2" /> Invoice Number
            </div>
            <div className="text-lg font-semibold text-gray-900">{sale.invoiceNumber || 'N/A'}</div>
            <div className="text-xs text-gray-500 mt-1">Created {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'Unknown date'}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <FaUserTie className="mr-2" /> Customer
            </div>
            <div className="text-lg font-semibold text-gray-900">{customer.name || customer.customerName || 'N/A'}</div>
            <div className="text-xs text-gray-500 mt-1">{formatValue(customer.contact || customer.phone || customer.email || customer.address)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <FaWarehouse className="mr-2" /> Warehouse
            </div>
            <div className="text-lg font-semibold text-gray-900">{warehouse.name || warehouse.warehouseName || 'N/A'}</div>
            <div className="text-xs text-gray-500 mt-1">{formatValue(warehouse.location || warehouse.address)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <FaMoneyBillWave className="mr-2" /> Payment
            </div>
            <div className="text-lg font-semibold text-gray-900">{sale.paymentMethod || payment.method || 'N/A'}</div>
            <div className="text-xs text-gray-500 mt-1">Paid {formatCurrency(paidAmount)} · Due {formatCurrency(dueAmount)}</div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaMoneyBillWave className="mr-2 text-green-600" />
            Financial Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Subtotal</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(subtotal)}</p>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Discount</p>
              <p className="text-lg font-semibold text-red-600">- {formatCurrency(discount)}</p>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Tax</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(tax)}</p>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaClipboardList className="mr-2 text-indigo-600" />
              Items ({saleItems.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {saleItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No line items recorded for this sale.
                    </td>
                  </tr>
                ) : (
                  saleItems.map((item) => (
                    <tr key={item.key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity} {item.unit}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Details */}
        {(sale.notes || sale.remarks || sale.reference || sale.createdBy || sale.updatedAt) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-3 text-sm text-gray-600">
              {sale.notes && (
                <p><span className="font-medium text-gray-900">Notes:</span> {formatValue(sale.notes)}</p>
              )}
              {sale.remarks && (
                <p><span className="font-medium text-gray-900">Remarks:</span> {formatValue(sale.remarks)}</p>
              )}
              {sale.reference && (
                <p><span className="font-medium text-gray-900">Reference:</span> {formatValue(sale.reference)}</p>
              )}
              {sale.createdBy && (
                <p><span className="font-medium text-gray-900">Created By:</span> {formatValue(sale.createdBy?.name || sale.createdBy?.fullName || sale.createdBy)}</p>
              )}
              {sale.updatedAt && (
                <p><span className="font-medium text-gray-900">Last Updated:</span> {new Date(sale.updatedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
