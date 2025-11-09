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
  FaSpinner
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

  useEffect(() => {
    const fetchSaleDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:7000/api/sales/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load sale details');
        }

        const data = await response.json();
        setSale(data.data || data.sale || data);
      } catch (err) {
        console.error('❌ Error fetching sale detail:', err);
        setError(err.message || 'Unable to load sale details');
      } finally {
        setLoading(false);
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
  const discount = sale.discount || payment.discount || 0;
  const tax = sale.tax || payment.tax || 0;
  const totalAmount = sale.totalAmount || sale.total || payment.total || subtotal - discount + tax;
  const paidAmount = sale.paidAmount || payment.paidAmount || 0;
  const dueAmount = sale.dueAmount || payment.dueAmount || Math.max(0, totalAmount - paidAmount);

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
