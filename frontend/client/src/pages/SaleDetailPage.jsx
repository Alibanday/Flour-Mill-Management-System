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
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    
    const doc = new jsPDF();
    
    // Company Header
    doc.setFontSize(20);
    doc.text('FLOUR MILL MANAGEMENT SYSTEM', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('SALES INVOICE', 105, 30, { align: 'center' });
    
    // Invoice Details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${sale.invoiceNumber || 'N/A'}`, 20, 45);
    doc.text(`Date: ${sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : new Date().toLocaleDateString()}`, 20, 52);
    
    // Customer Details
    doc.setFontSize(12);
    doc.text('Bill To:', 20, 65);
    doc.setFontSize(10);
    doc.text(customer.name || customer.customerName || 'N/A', 20, 72);
    if (customer.contact?.phone || customer.phone) {
      doc.text(`Phone: ${customer.contact?.phone || customer.phone}`, 20, 79);
    }
    if (customer.contact?.email || customer.email) {
      doc.text(`Email: ${customer.contact?.email || customer.email}`, 20, 86);
    }
    if (customer.contact?.address || customer.address) {
      const address = customer.contact?.address || customer.address;
      const addressStr = typeof address === 'string' ? address : formatValue(address);
      doc.text(`Address: ${addressStr}`, 20, 93);
    }
    
    // Items Table
    const itemsData = saleItems.map(item => [
      item.name || 'N/A',
      item.quantity.toString(),
      item.unit || 'units',
      `Rs. ${(item.unitPrice || 0).toFixed(2)}`,
      `Rs. ${(item.totalPrice || 0).toFixed(2)}`
    ]);
    
    doc.autoTable({
      startY: 100,
      head: [['Product', 'Qty', 'Unit', 'Unit Price', 'Total']],
      body: itemsData,
      theme: 'grid'
    });
    
    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: Rs. ${(subtotal || 0).toFixed(2)}`, 150, finalY, { align: 'right' });
    if (discount > 0) {
      doc.text(`Discount: Rs. ${(discount || 0).toFixed(2)}`, 150, finalY + 7, { align: 'right' });
    }
    if (tax > 0) {
      doc.text(`Tax: Rs. ${(tax || 0).toFixed(2)}`, 150, finalY + 14, { align: 'right' });
    }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: Rs. ${(totalAmount || 0).toFixed(2)}`, 150, finalY + 21, { align: 'right' });
    
    // Payment Info
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Payment Method: ${sale.paymentMethod || payment.method || 'N/A'}`, 20, finalY + 30);
    doc.text(`Payment Status: ${sale.paymentStatus || 'N/A'}`, 20, finalY + 37);
    if (paidAmount > 0) {
      doc.text(`Paid Amount: Rs. ${(paidAmount || 0).toFixed(2)}`, 20, finalY + 44);
    }
    if (dueAmount > 0) {
      doc.text(`Due Amount: Rs. ${(dueAmount || 0).toFixed(2)}`, 20, finalY + 51);
    }
    
    // Warehouse Info
    if (warehouse.name || warehouse.warehouseName) {
      doc.text(`Warehouse: ${warehouse.name || warehouse.warehouseName}`, 20, finalY + 58);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    
    doc.save(`Invoice-${sale.invoiceNumber || 'N/A'}.pdf`);
  };

  // Print Gatepass
  const printGatepass = () => {
    if (!sale || !gatePass) {
      alert('Gate pass not found for this sale. It may not have been generated yet.');
      return;
    }
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('FLOUR MILL MANAGEMENT SYSTEM', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('GATE PASS', 105, 30, { align: 'center' });
    
    // Gate Pass Details
    doc.setFontSize(10);
    doc.text(`Gate Pass #: ${gatePass.gatePassNumber || 'N/A'}`, 20, 45);
    doc.text(`Date: ${gatePass.validFrom ? new Date(gatePass.validFrom).toLocaleDateString() : new Date().toLocaleDateString()}`, 20, 52);
    doc.text(`Type: ${gatePass.type || 'Material'}`, 20, 59);
    doc.text(`Purpose: ${gatePass.purpose || 'Stock Dispatch for Sale'}`, 20, 66);
    
    // Issued To
    doc.setFontSize(12);
    doc.text('Issued To:', 20, 80);
    doc.setFontSize(10);
    doc.text(`Name: ${gatePass.issuedTo?.name || customer.name || customer.customerName || 'N/A'}`, 20, 87);
    if (gatePass.issuedTo?.contact || customer.contact?.phone || customer.phone) {
      doc.text(`Contact: ${gatePass.issuedTo?.contact || customer.contact?.phone || customer.phone}`, 20, 94);
    }
    
    // Items
    doc.setFontSize(12);
    doc.text('Items to Dispatch:', 20, 105);
    
    const itemsData = (gatePass.items || saleItems).map(item => [
      item.description || item.name || item.productName || 'N/A',
      (item.quantity || 0).toString(),
      item.unit || 'units',
      `Rs. ${(item.value || item.totalPrice || 0).toFixed(2)}`
    ]);
    
    doc.autoTable({
      startY: 112,
      head: [['Product', 'Quantity', 'Unit', 'Value']],
      body: itemsData,
      theme: 'grid'
    });
    
    // Warehouse Info
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    const warehouseName = warehouse.name || warehouse.warehouseName || 'N/A';
    doc.text(`Warehouse: ${warehouseName}`, 20, finalY);
    
    // Status
    doc.text(`Status: ${gatePass.status || 'Active'}`, 20, finalY + 7);
    
    // Valid Until
    if (gatePass.validUntil) {
      doc.text(`Valid Until: ${new Date(gatePass.validUntil).toLocaleDateString()}`, 20, finalY + 14);
    }
    
    // Authorization
    doc.setFontSize(10);
    doc.text('Authorized By:', 20, finalY + 25);
    doc.text('_________________', 20, finalY + 35);
    doc.text('Signature', 20, finalY + 42);
    
    doc.text('Received By:', 120, finalY + 25);
    doc.text('_________________', 120, finalY + 35);
    doc.text('Signature', 120, finalY + 42);
    
    // Footer
    doc.setFontSize(8);
    doc.text('This gate pass is valid for stock dispatch only.', 105, 280, { align: 'center' });
    
    doc.save(`GatePass-${gatePass.gatePassNumber || 'N/A'}.pdf`);
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
