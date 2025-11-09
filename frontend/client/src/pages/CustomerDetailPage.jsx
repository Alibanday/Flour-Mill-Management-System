import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaUserTie,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaClipboardList,
  FaSpinner,
  FaShoppingCart,
  FaBuilding
} from 'react-icons/fa';

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return `Rs. ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatValue = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return value || fallback;
  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).join(', ');
    return joined || fallback;
  }
  if (typeof value === 'object') {
    const joined = Object.values(value).filter(Boolean).join(', ');
    return joined || fallback;
  }
  return fallback;
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  const loadCustomerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        : { 'Content-Type': 'application/json' };

      const customerRes = await fetch(`http://localhost:7000/api/customers/${id}`, {
        headers
      });

      if (!customerRes.ok) {
        throw new Error('Failed to load customer details');
      }

      const customerData = await customerRes.json();
      setCustomer(customerData.data || customerData.customer || customerData);

      let salesData = [];
      try {
        const salesRes = await fetch(`http://localhost:7000/api/sales?customerId=${id}`, {
          headers
        });

        if (salesRes.ok) {
          const salesJson = await salesRes.json();
          salesData = salesJson.data || salesJson.sales || [];
        } else {
          throw new Error('Sales endpoint without filter unavailable');
        }
      } catch (salesErr) {
        console.warn('⚠️ Customer-specific sales fetch failed, falling back to all sales:', salesErr);
        const fallbackRes = await fetch('http://localhost:7000/api/sales', {
          headers
        });
        if (fallbackRes.ok) {
          const fallbackJson = await fallbackRes.json();
          const allSales = fallbackJson.data || fallbackJson.sales || fallbackJson;
          salesData = Array.isArray(allSales)
            ? allSales.filter((sale) => {
                if (!sale) return false;
                if (sale.customer?._id) return sale.customer._id === id;
                if (sale.customer?.customerId && customerData?.data?.customerId) {
                  return sale.customer.customerId === customerData.data.customerId;
                }
                if (sale.customer === id) return true;
                return false;
              })
            : [];
        }
      }

      setSales(Array.isArray(salesData) ? salesData : []);
    } catch (err) {
      console.error('❌ Error fetching customer detail:', err);
      setError(err.message || 'Unable to load customer details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id, loadCustomerData]);

  const totalPurchases = useMemo(() => sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0), [sales]);
  const totalPaid = useMemo(() => sales.reduce((sum, sale) => sum + (sale.paidAmount || 0), 0), [sales]);
  const totalDue = useMemo(() => sales.reduce((sum, sale) => sum + (sale.dueAmount || Math.max(0, (sale.totalAmount || 0) - (sale.paidAmount || 0))), 0), [sales]);

  const outstandingBalance = Number(customer?.creditUsed ?? totalDue ?? 0);

  const handleRecordPayment = async (event) => {
    event.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(null);

    const amountValue = parseFloat(paymentAmount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setPaymentError('Enter a valid amount greater than zero.');
      return;
    }

    if (amountValue > outstandingBalance) {
      setPaymentError('Payment amount cannot exceed outstanding balance.');
      return;
    }

    try {
      setPaymentProcessing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:7000/api/customers/${id}/credit-balance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount: amountValue, type: 'credit' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to record payment');
      }

      const result = await response.json();
      if (result?.data) {
        setCustomer(result.data);
      }

      setPaymentAmount('');
      setPaymentSuccess('Payment recorded successfully.');
      await loadCustomerData();
    } catch (paymentErr) {
      console.error('❌ Error recording payment:', paymentErr);
      setPaymentError(paymentErr.message || 'Failed to record payment');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-600">
        <FaSpinner className="animate-spin text-3xl mb-4" />
        <p>Loading customer details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-600">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
        >
          <FaArrowLeft className="mr-2" />
          Back to Customers
        </button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-600">
        <p className="text-gray-700 mb-4">Customer not found.</p>
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
        >
          <FaArrowLeft className="mr-2" />
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaUserTie className="text-blue-600 mr-2" />
              Customer Details
            </h1>
            <p className="text-sm text-gray-500">Customer ID: {customer.customerId || customer._id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
              Status: {customer.status || 'Active'}
            </span>
            <button
              onClick={() => navigate('/customers')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
            >
              <FaArrowLeft className="mr-2" />
              Back to Customers
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Customer Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <FaUserTie className="mr-2" /> Customer Name
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {`${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.customerName || 'N/A'}
            </div>
            <div className="text-xs text-gray-500 mt-1">{customer.customerType || 'Regular'} Customer</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <FaBuilding className="mr-2" /> Business
            </div>
            <div className="text-lg font-semibold text-gray-900">{formatValue(customer.businessName)}</div>
            <div className="text-xs text-gray-500 mt-1">{formatValue(customer.businessType, 'Business type not set')}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <FaMoneyBillWave className="mr-2" /> Outstanding Balance
            </div>
            <div className="text-lg font-semibold text-red-600">{formatCurrency(outstandingBalance)}</div>
            <div className="text-xs text-gray-500 mt-1">Credit Limit: {formatCurrency(customer.creditLimit)}</div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <FaPhone className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-sm text-gray-600">{formatValue(customer.phone)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FaEnvelope className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{formatValue(customer.email)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FaMapMarkerAlt className="text-gray-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-900">Address</p>
                <p className="text-sm text-gray-600">{formatValue(customer.address)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Total Purchases</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalPurchases)}</p>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Total Paid</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Total Due</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(totalDue)}</p>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Credit Used</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(customer.creditUsed)}</p>
            </div>
          </div>
        </div>

        {/* Record Payment */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h2>
          <p className="text-sm text-gray-600 mb-4">
            Outstanding Balance: <span className="font-semibold text-red-600">{formatCurrency(outstandingBalance)}</span>
          </p>
          {outstandingBalance <= 0 && (
            <p className="text-sm text-green-600 mb-4">This customer has no outstanding balance.</p>
          )}
          <form onSubmit={handleRecordPayment} className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount customer paid"
              />
            </div>
            <button
              type="submit"
              disabled={paymentProcessing || outstandingBalance <= 0}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {paymentProcessing ? 'Recording...' : 'Record Payment'}
            </button>
          </form>
          {paymentError && (
            <p className="mt-3 text-sm text-red-600">{paymentError}</p>
          )}
          {paymentSuccess && (
            <p className="mt-3 text-sm text-green-600">{paymentSuccess}</p>
          )}
        </div>

        {/* Purchase History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaClipboardList className="mr-2 text-indigo-600" />
              Purchase History ({sales.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      No purchases recorded for this customer yet.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-blue-600 flex items-center space-x-2">
                        <FaShoppingCart />
                        <span>{sale.invoiceNumber || sale.reference || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sale.items?.length || 0} item(s)
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(sale.totalAmount)}</td>
                      <td className="px-6 py-4 text-sm text-green-600 text-right">{formatCurrency(sale.paidAmount)}</td>
                      <td className="px-6 py-4 text-sm text-red-600 text-right">{formatCurrency(sale.dueAmount || Math.max(0, (sale.totalAmount || 0) - (sale.paidAmount || 0)))}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sale.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {sale.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
