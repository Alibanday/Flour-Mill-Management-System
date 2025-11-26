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
  FaBuilding,
  FaEdit
} from 'react-icons/fa';
import CustomerForm from '../components/CustomerManagement/CustomerForm';

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

const formatAddress = (address) => {
  if (!address) return 'N/A';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    if (address.country) parts.push(address.country);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }
  return 'N/A';
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
  const [showEditForm, setShowEditForm] = useState(false);

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
      const customerInfo = customerData.data || customerData.customer || customerData;
      
      // Ensure customer data is properly extracted
      if (customerInfo) {
        console.log('Customer data loaded:', customerInfo);
        setCustomer(customerInfo);
      } else {
        throw new Error('Customer data not found in response');
      }

      let salesData = [];
      try {
        // Try fetching sales by customerId with high limit to get all sales
        const salesRes = await fetch(`http://localhost:7000/api/sales?customerId=${id}&limit=1000`, {
          headers
        });

        if (salesRes.ok) {
          const salesJson = await salesRes.json();
          salesData = salesJson.data || salesJson.sales || [];
          console.log(`📊 Found ${salesData.length} sales for customer ${id}`, salesData);
        } else {
          throw new Error('Sales endpoint without filter unavailable');
        }
      } catch (salesErr) {
        console.warn('⚠️ Customer-specific sales fetch failed, falling back to all sales:', salesErr);
        try {
          const fallbackRes = await fetch(`http://localhost:7000/api/sales?limit=1000`, {
            headers
          });
          if (fallbackRes.ok) {
            const fallbackJson = await fallbackRes.json();
            const allSales = fallbackJson.data || fallbackJson.sales || fallbackJson;
            salesData = Array.isArray(allSales)
              ? allSales.filter((sale) => {
                  if (!sale) return false;
                  // Check multiple ways the customer ID might be stored
                  const saleCustomerId = sale.customer?.customerId || sale.customer?._id || sale.customer;
                  const customerIdStr = id.toString();
                  const saleCustomerIdStr = saleCustomerId?.toString();
                  
                  return saleCustomerIdStr === customerIdStr || 
                         saleCustomerIdStr === customerData?.data?._id?.toString() ||
                         saleCustomerIdStr === customerData?.data?.customerId?.toString();
                })
              : [];
            console.log(`📊 Filtered ${salesData.length} sales from all sales`, salesData);
          }
        } catch (fallbackErr) {
          console.error('❌ Fallback sales fetch also failed:', fallbackErr);
        }
      }

      // Process sales data to ensure payment fields are calculated
      const processedSales = Array.isArray(salesData) ? salesData.map(sale => {
        // Ensure paidAmount, dueAmount, and remainingAmount are properly set
        const totalAmount = parseFloat(sale.totalAmount) || 0;
        const paidAmount = parseFloat(sale.paidAmount) || 0;
        const remainingAmount = parseFloat(sale.remainingAmount) || (totalAmount - paidAmount);
        const dueAmount = parseFloat(sale.dueAmount) || remainingAmount;
        
        return {
          ...sale,
          totalAmount,
          paidAmount,
          remainingAmount: Math.max(0, remainingAmount),
          dueAmount: Math.max(0, dueAmount)
        };
      }) : [];

      console.log(`✅ Processed ${processedSales.length} sales with payment data:`, processedSales);
      setSales(processedSales);
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

  const totalPurchases = useMemo(() => {
    const total = sales.reduce((sum, sale) => sum + (parseFloat(sale.totalAmount) || 0), 0);
    console.log('💰 Total purchases calculated:', total, 'from', sales.length, 'sales');
    return total;
  }, [sales]);
  
  const totalPaid = useMemo(() => {
    const paid = sales.reduce((sum, sale) => {
      const paidAmt = parseFloat(sale.paidAmount) || 0;
      return sum + paidAmt;
    }, 0);
    console.log('💰 Total paid calculated:', paid, 'from sales:', sales.map(s => ({ invoice: s.invoiceNumber, paid: s.paidAmount })));
    return paid;
  }, [sales]);
  
  const totalDue = useMemo(() => {
    const due = sales.reduce((sum, sale) => {
      // Use dueAmount, remainingAmount, or calculate from totalAmount - paidAmount
      const dueAmt = parseFloat(sale.dueAmount) || 
                     parseFloat(sale.remainingAmount) || 
                     Math.max(0, (parseFloat(sale.totalAmount) || 0) - (parseFloat(sale.paidAmount) || 0));
      return sum + dueAmt;
    }, 0);
    console.log('💰 Total due calculated:', due, 'from sales:', sales.map(s => ({ invoice: s.invoiceNumber, due: s.dueAmount || s.remainingAmount, total: s.totalAmount, paid: s.paidAmount })));
    return due;
  }, [sales]);

  // Outstanding balance should be from customer.creditUsed (which is updated by backend)
  // But also show calculated from sales for verification
  const calculatedOutstanding = totalDue;
  const outstandingBalance = customer?.creditUsed !== undefined && customer.creditUsed !== null 
    ? Number(customer.creditUsed) 
    : calculatedOutstanding;

  // Print payment receipt
  const printPaymentReceipt = (paymentAmount, outstandingBefore, outstandingAfter) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const receiptNumber = `RCP-${Date.now()}`;
    
    const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.customerName || 'N/A';
    const customerPhone = customer.phone || 'N/A';
    const customerEmail = customer.email || 'N/A';
    const customerAddress = formatAddress(customer.address);
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${receiptNumber}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #000; line-height: 1.4; }
            .invoice-container { max-width: 100%; padding: 20px; }
            .invoice-header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 25px; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
            .company-info h1 { font-size: 28px; color: #059669; margin-bottom: 5px; font-weight: 700; }
            .company-info .subtitle { font-size: 13px; color: #6b7280; }
            .invoice-info { text-align: right; }
            .invoice-info h2 { font-size: 24px; color: #10b981; margin-bottom: 5px; font-weight: 700; }
            .invoice-info .invoice-number { font-size: 14px; color: #111827; font-weight: 600; }
            .invoice-info .invoice-date { font-size: 11px; color: #6b7280; margin-top: 5px; }
            .parties-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px; }
            .party-box { background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; border-radius: 3px; }
            .party-box h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; font-weight: 600; }
            .party-box p { font-size: 11px; color: #111827; margin: 3px 0; }
            .party-box .name { font-weight: 600; font-size: 13px; color: #111827; }
            .payment-section { margin-bottom: 25px; }
            .payment-section h3 { font-size: 14px; color: #111827; margin-bottom: 15px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
            .payment-details { background: #ecfdf5; padding: 20px; border-radius: 5px; border: 2px solid #10b981; }
            .payment-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #d1fae5; }
            .payment-row:last-child { border-bottom: none; }
            .payment-row .label { color: #6b7280; font-weight: 500; }
            .payment-row .value { color: #111827; font-weight: 600; font-size: 13px; }
            .payment-row .amount { color: #059669; font-weight: 700; font-size: 16px; }
            .payment-row .outstanding-before { color: #dc2626; font-weight: 600; }
            .payment-row .outstanding-after { color: #059669; font-weight: 600; }
            .totals-section { margin-top: 25px; }
            .totals-box { background: #f3f4f6; padding: 20px; border-radius: 5px; border-left: 4px solid #10b981; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .total-row:last-child { border-bottom: none; font-weight: 700; font-size: 15px; color: #059669; border-top: 2px solid #10b981; padding-top: 15px; margin-top: 10px; }
            .total-row .label { color: #6b7280; font-size: 13px; }
            .total-row .value { color: #111827; font-weight: 600; font-size: 14px; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #d1fae5; color: #059669; }
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
                  <div class="subtitle">Payment Receipt</div>
                </div>
                <div class="invoice-info">
                  <h2>RECEIPT</h2>
                  <div class="invoice-number">Receipt #: ${receiptNumber}</div>
                  <div class="invoice-date">Date: ${currentDate} | Time: ${currentTime}</div>
                </div>
              </div>
            </div>
            
            <div class="parties-section">
              <div class="party-box">
                <h3>Customer Information</h3>
                <p class="name">${customerName}</p>
                ${customerPhone !== 'N/A' ? `<p>Phone: ${customerPhone}</p>` : ''}
                ${customerEmail !== 'N/A' ? `<p>Email: ${customerEmail}</p>` : ''}
                ${customerAddress !== 'N/A' ? `<p>${customerAddress}</p>` : ''}
              </div>
              <div class="party-box">
                <h3>Payment Information</h3>
                <p><strong>Receipt Number:</strong></p>
                <p>${receiptNumber}</p>
                <p style="margin-top: 10px;"><strong>Payment Date:</strong></p>
                <p>${currentDate} at ${currentTime}</p>
                <p style="margin-top: 10px;"><span class="status-badge">PAID</span></p>
              </div>
            </div>
            
            <div class="payment-section">
              <h3>Payment Details</h3>
              <div class="payment-details">
                <div class="payment-row">
                  <span class="label">Payment Amount:</span>
                  <span class="amount">Rs. ${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="payment-row">
                  <span class="label">Outstanding Balance (Before):</span>
                  <span class="outstanding-before">Rs. ${outstandingBefore.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="payment-row">
                  <span class="label">Outstanding Balance (After):</span>
                  <span class="outstanding-after">Rs. ${outstandingAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            
            <div class="totals-section">
              <div class="totals-box">
                <div class="total-row">
                  <span class="label">Amount Paid:</span>
                  <span class="value">Rs. ${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="total-row">
                  <span class="label">Previous Outstanding:</span>
                  <span class="value">Rs. ${outstandingBefore.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="total-row">
                  <span class="label">Remaining Outstanding:</span>
                  <span class="value">Rs. ${outstandingAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            
            <div class="notes-section">
              <h3>Important Notes</h3>
              <p>• This receipt confirms the payment has been received and recorded in our system.</p>
              <p>• Please keep this receipt for your records.</p>
              <p>• For any queries, please contact us with the receipt number: <strong>${receiptNumber}</strong></p>
            </div>
            
            <div class="invoice-footer">
              <p><strong>Thank you for your payment!</strong></p>
              <p>Generated on ${currentDate} at ${currentTime}</p>
              <p>This is a computer-generated receipt</p>
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

    const outstandingBefore = outstandingBalance;

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
      let updatedCustomer = result.data;
      if (updatedCustomer) {
        setCustomer(updatedCustomer);
      }

      // Calculate outstanding balance after payment
      const outstandingAfter = updatedCustomer?.creditUsed !== undefined && updatedCustomer.creditUsed !== null
        ? Number(updatedCustomer.creditUsed)
        : Math.max(0, outstandingBefore - amountValue);

      setPaymentAmount('');
      setPaymentSuccess('Payment recorded successfully.');
      
      // Print payment receipt immediately
      setTimeout(() => {
        printPaymentReceipt(amountValue, outstandingBefore, outstandingAfter);
      }, 300);
      
      // Reload customer data to refresh the page after printing
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
              onClick={() => setShowEditForm(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700"
            >
              <FaEdit className="mr-2" />
              Edit Customer
            </button>
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
                <p className="text-sm text-gray-600">{formatAddress(customer.address)}</p>
              </div>
            </div>
            {customer.alternatePhone && (
              <div className="flex items-start space-x-3">
                <FaPhone className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Alternate Phone</p>
                  <p className="text-sm text-gray-600">{formatValue(customer.alternatePhone)}</p>
                </div>
              </div>
            )}
            {customer.customerNumber && (
              <div className="flex items-start space-x-3">
                <FaUserTie className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Customer Number</p>
                  <p className="text-sm text-gray-600">{formatValue(customer.customerNumber)}</p>
                </div>
              </div>
            )}
            {customer.paymentTerms && (
              <div className="flex items-start space-x-3">
                <FaMoneyBillWave className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Payment Terms</p>
                  <p className="text-sm text-gray-600">{formatValue(customer.paymentTerms)}</p>
                </div>
              </div>
            )}
            {customer.preferredPaymentMethod && (
              <div className="flex items-start space-x-3">
                <FaMoneyBillWave className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Preferred Payment Method</p>
                  <p className="text-sm text-gray-600">{formatValue(customer.preferredPaymentMethod)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        {(customer.businessRegistrationNumber || customer.notes || customer.tags?.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.businessRegistrationNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Business Registration Number</p>
                  <p className="text-sm text-gray-600">{formatValue(customer.businessRegistrationNumber)}</p>
                </div>
              )}
              {customer.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Notes</p>
                  <p className="text-sm text-gray-600">{formatValue(customer.notes)}</p>
                </div>
              )}
              {customer.tags && customer.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Tags</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {customer.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financial Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Total Purchases</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalPurchases)}</p>
            </div>
            <div className="bg-green-50 rounded-md p-4 border border-green-200">
              <p className="text-xs uppercase text-gray-500">Total Paid</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-gray-500 mt-1">From all sales</p>
            </div>
            <div className="bg-red-50 rounded-md p-4 border border-red-200">
              <p className="text-xs uppercase text-gray-500">Total Due/Remaining</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(outstandingBalance)}</p>
              <p className="text-xs text-gray-500 mt-1">From customer record</p>
            </div>
            <div className="bg-yellow-50 rounded-md p-4 border border-yellow-200">
              <p className="text-xs uppercase text-gray-500">Outstanding Balance</p>
              <p className="text-lg font-semibold text-yellow-700">{formatCurrency(outstandingBalance)}</p>
              <p className="text-xs text-gray-500 mt-1">From customer record</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
              <p className="text-xs uppercase text-gray-500">Credit Limit</p>
              <p className="text-lg font-semibold text-blue-600">{formatCurrency(customer.creditLimit || 0)}</p>
            </div>
            <div className="bg-purple-50 rounded-md p-4 border border-purple-200">
              <p className="text-xs uppercase text-gray-500">Credit Used</p>
              <p className="text-lg font-semibold text-purple-600">{formatCurrency(customer.creditUsed || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {customer.creditLimit > 0 
                  ? `${((customer.creditUsed || 0) / customer.creditLimit * 100).toFixed(1)}% used`
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Available Credit</p>
              <p className={`text-lg font-semibold ${
                (customer.creditLimit || 0) - (customer.creditUsed || 0) < 0 
                  ? 'text-red-600' 
                  : 'text-gray-900'
              }`}>
                {formatCurrency(Math.max(0, (customer.creditLimit || 0) - (customer.creditUsed || 0)))}
              </p>
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-xs uppercase text-gray-500">Total Orders</p>
              <p className="text-lg font-semibold text-gray-900">{customer.totalOrders || 0}</p>
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
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                        {formatCurrency(sale.totalAmount || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600 text-right font-semibold">
                        {formatCurrency(sale.paidAmount || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 text-right font-semibold">
                        {formatCurrency(sale.dueAmount || sale.remainingAmount || Math.max(0, (parseFloat(sale.totalAmount) || 0) - (parseFloat(sale.paidAmount) || 0)))}
                      </td>
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

      {/* Edit Customer Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CustomerForm
              customer={customer}
              onClose={() => setShowEditForm(false)}
              onSuccess={() => {
                setShowEditForm(false);
                loadCustomerData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

