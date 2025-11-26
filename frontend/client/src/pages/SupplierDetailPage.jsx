import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaClipboardList,
  FaSpinner,
  FaShoppingCart,
  FaEdit,
  FaUserTie,
  FaCreditCard,
  FaFileInvoice,
  FaCalendarAlt,
  FaWarehouse,
  FaStar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPrint
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../hooks/useAuth';

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
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }
  return 'N/A';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [bagPurchases, setBagPurchases] = useState([]);
  const [foodPurchases, setFoodPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  const canManageSuppliers = user?.role === 'Admin' || user?.role === 'Manager';

  const loadSupplierData = useCallback(async () => {
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

      // Fetch supplier details
      const supplierRes = await fetch(`http://localhost:7000/api/suppliers/${id}`, {
        headers
      });

      if (!supplierRes.ok) {
        throw new Error('Failed to load supplier details');
      }

      const supplierData = await supplierRes.json();
      const supplierInfo = supplierData.data || supplierData.supplier || supplierData;
      
      if (supplierInfo) {
        console.log('Supplier data loaded:', supplierInfo);
        setSupplier(supplierInfo);
      } else {
        throw new Error('Supplier data not found in response');
      }

      // Fetch related purchases
      try {
        const purchasesRes = await fetch(`http://localhost:7000/api/purchases?limit=1000`, {
          headers
        });
        if (purchasesRes.ok) {
          const purchasesJson = await purchasesRes.json();
          const allPurchases = purchasesJson.data || purchasesJson.purchases || [];
          // Filter purchases by supplier name or ID
          const filteredPurchases = allPurchases.filter(p => {
            if (!p) return false;
            return p.supplier?.name === supplierInfo.name || 
                   p.supplier?._id?.toString() === id ||
                   p.supplier?.toString() === id;
          });
          setPurchases(filteredPurchases);
        }
      } catch (err) {
        console.warn('Failed to fetch purchases:', err);
      }

      // Fetch bag purchases
      try {
        const bagPurchasesRes = await fetch(`http://localhost:7000/api/bag-purchases?supplier=${id}&limit=1000`, {
          headers
        });
        if (bagPurchasesRes.ok) {
          const bagPurchasesJson = await bagPurchasesRes.json();
          const bagPurchasesData = bagPurchasesJson.data || bagPurchasesJson.bagPurchases || [];
          setBagPurchases(bagPurchasesData);
        }
      } catch (err) {
        console.warn('Failed to fetch bag purchases:', err);
      }

      // Fetch food purchases
      try {
        const foodPurchasesRes = await fetch(`http://localhost:7000/api/food-purchases?supplier=${id}&limit=1000`, {
          headers
        });
        if (foodPurchasesRes.ok) {
          const foodPurchasesJson = await foodPurchasesRes.json();
          const foodPurchasesData = foodPurchasesJson.data || foodPurchasesJson.foodPurchases || [];
          setFoodPurchases(foodPurchasesData);
        }
      } catch (err) {
        console.warn('Failed to fetch food purchases:', err);
      }
    } catch (err) {
      console.error('❌ Error fetching supplier detail:', err);
      setError(err.message || 'Unable to load supplier details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadSupplierData();
    }
  }, [id, loadSupplierData]);

  const totalPurchases = useMemo(() => {
    const regularTotal = purchases.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);
    const bagTotal = bagPurchases.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);
    const foodTotal = foodPurchases.reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);
    return regularTotal + bagTotal + foodTotal;
  }, [purchases, bagPurchases, foodPurchases]);

  const totalPaid = useMemo(() => {
    const regularPaid = purchases.reduce((sum, p) => sum + (parseFloat(p.paidAmount) || 0), 0);
    const bagPaid = bagPurchases.reduce((sum, p) => sum + (parseFloat(p.paidAmount) || 0), 0);
    const foodPaid = foodPurchases.reduce((sum, p) => sum + (parseFloat(p.paidAmount) || 0), 0);
    return regularPaid + bagPaid + foodPaid;
  }, [purchases, bagPurchases, foodPurchases]);

  const totalDue = useMemo(() => {
    // Regular purchases - only include Pending or Partial status, use remainingAmount if available
    const regularDue = purchases
      .filter(p => p.paymentStatus === 'Pending' || p.paymentStatus === 'Partial')
      .reduce((sum, p) => {
        // Use remainingAmount if available, otherwise calculate from totalAmount - paidAmount
        if (p.remainingAmount !== undefined && p.remainingAmount !== null) {
          return sum + Math.max(0, parseFloat(p.remainingAmount) || 0);
        }
        const total = parseFloat(p.totalAmount) || 0;
        const paid = parseFloat(p.paidAmount) || 0;
        return sum + Math.max(0, total - paid);
      }, 0);
    
    // Bag purchases - only include Pending or Partial status, use dueAmount directly
    const bagDue = bagPurchases
      .filter(p => p.paymentStatus === 'Pending' || p.paymentStatus === 'Partial')
      .reduce((sum, p) => {
        // Use dueAmount field directly (already calculated by backend)
        return sum + Math.max(0, parseFloat(p.dueAmount) || 0);
      }, 0);
    
    // Food purchases - only include Pending or Partial status, use dueAmount directly
    const foodDue = foodPurchases
      .filter(p => p.paymentStatus === 'Pending' || p.paymentStatus === 'Partial')
      .reduce((sum, p) => {
        // Use dueAmount field directly (already calculated by backend)
        return sum + Math.max(0, parseFloat(p.dueAmount) || 0);
      }, 0);
    
    return regularDue + bagDue + foodDue;
  }, [purchases, bagPurchases, foodPurchases]);

  // Outstanding balance should always reflect the total due amount
  // Use calculated totalDue as the source of truth
  const outstandingBalance = totalDue;

  const printPaymentReceipt = (paymentData) => {
    if (!supplier) return;

    try {
      const doc = new jsPDF();
      
      // Company Header
      doc.setFontSize(20);
      doc.text('FLOUR MILL MANAGEMENT SYSTEM', 105, 20, { align: 'center' });
      doc.setFontSize(16);
      doc.text('PAYMENT RECEIPT', 105, 30, { align: 'center' });
      
      // Receipt Details
      doc.setFontSize(10);
      const receiptNumber = `REC-${Date.now().toString().slice(-8)}`;
      doc.text(`Receipt #: ${receiptNumber}`, 20, 45);
      doc.text(`Date: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 20, 52);
      
      // Supplier Details
      doc.setFontSize(12);
      doc.text('Paid To:', 20, 65);
      doc.setFontSize(10);
      doc.text(`Supplier: ${formatValue(supplier.name)}`, 20, 72);
      doc.text(`Code: ${supplier.supplierCode || 'N/A'}`, 20, 79);
      if (supplier.contactPerson) {
        doc.text(`Contact Person: ${formatValue(supplier.contactPerson)}`, 20, 86);
      }
      if (supplier.phone) {
        doc.text(`Phone: ${formatValue(supplier.phone)}`, 20, 93);
      }
      if (supplier.email) {
        doc.text(`Email: ${formatValue(supplier.email)}`, 20, 100);
      }
      if (supplier.address) {
        const addressStr = formatAddress(supplier.address);
        const addressLines = doc.splitTextToSize(`Address: ${addressStr}`, 170);
        doc.text(addressLines, 20, 107);
      }
      
      // Payment Details
      let startY = supplier.address ? 120 : 107;
      doc.setFontSize(12);
      doc.text('Payment Details:', 20, startY);
      doc.setFontSize(10);
      
      // Outstanding balance before payment
      const balanceBefore = outstandingBalance;
      doc.text(`Outstanding Balance (Before): ${formatCurrency(balanceBefore)}`, 20, startY + 7);
      
      // Payment amount
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Payment Amount: ${formatCurrency(paymentData.amount)}`, 20, startY + 16);
      
      // Outstanding balance after payment
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const balanceAfter = Math.max(0, balanceBefore - paymentData.amount);
      doc.text(`Outstanding Balance (After): ${formatCurrency(balanceAfter)}`, 20, startY + 23);
      
      // Payment method
      if (paymentData.paymentMethod) {
        doc.text(`Payment Method: ${paymentData.paymentMethod}`, 20, startY + 30);
      }
      
      // Summary Table (manual creation to avoid autotable dependency issues)
      const tableStartY = startY + 40;
      const tableData = [
        { desc: 'Outstanding Balance (Before Payment)', amount: formatCurrency(balanceBefore) },
        { desc: 'Payment Amount', amount: formatCurrency(paymentData.amount) },
        { desc: 'Outstanding Balance (After Payment)', amount: formatCurrency(balanceAfter) }
      ];
      
      // Table header
      doc.setFillColor(66, 139, 202);
      doc.rect(20, tableStartY, 170, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text('Description', 25, tableStartY + 6);
      doc.text('Amount', 170, tableStartY + 6, { align: 'right' });
      
      // Table rows
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      let currentY = tableStartY + 8;
      tableData.forEach((row, index) => {
        // Draw row border
        doc.setDrawColor(200, 200, 200);
        doc.line(20, currentY, 190, currentY);
        
        // Alternate row color
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(20, currentY, 170, 8, 'F');
        }
        
        // Row text
        doc.text(row.desc, 25, currentY + 6);
        doc.setFont(undefined, index === 1 ? 'bold' : 'normal'); // Bold for payment amount
        doc.text(row.amount, 170, currentY + 6, { align: 'right' });
        doc.setFont(undefined, 'normal');
        currentY += 8;
      });
      
      // Bottom border
      doc.line(20, currentY, 190, currentY);
      
      const finalTableY = currentY;
      
      // Notes
      let footerY = finalTableY + 10;
      if (paymentData.notes) {
        doc.setFontSize(10);
        doc.text('Notes:', 20, footerY);
        const notesLines = doc.splitTextToSize(paymentData.notes, 170);
        doc.text(notesLines, 20, footerY + 7);
        footerY += 15;
      }
      
      // Footer
      doc.setFontSize(8);
      doc.text('This is a computer-generated receipt.', 105, footerY, { align: 'center' });
      doc.text('Thank you for your payment!', 105, footerY + 7, { align: 'center' });
      
      // Save and open
      const fileName = `Payment-Receipt-${supplier.supplierCode || supplier._id}-${Date.now()}.pdf`;
      doc.save(fileName);
      
      // Also open in new window for printing
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Error generating receipt PDF: ' + error.message);
    }
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

    // Use totalDue for validation, not outstandingBalance
    if (amountValue > totalDue) {
      setPaymentError(`Payment amount cannot exceed total due amount (${formatCurrency(totalDue)}).`);
      return;
    }

    try {
      setPaymentProcessing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:7000/api/suppliers/${id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ amount: amountValue })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to record payment');
      }

      const result = await response.json();
      if (result?.data) {
        setSupplier(result.data);
      }

      // Store payment data for receipt
      const paymentData = {
        amount: amountValue,
        paymentMethod: 'Cash', // Default, can be enhanced later
        notes: `Payment recorded on ${new Date().toLocaleString()}`
      };

      setPaymentAmount('');
      setPaymentSuccess('Payment recorded successfully. Outstanding balance updated.');
      
      // Generate and print receipt
      setTimeout(() => {
        printPaymentReceipt(paymentData);
      }, 500);
      
      await loadSupplierData();
    } catch (paymentErr) {
      console.error('❌ Error recording payment:', paymentErr);
      setPaymentError(paymentErr.message || 'Failed to record payment');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSupplierTypeColor = (type) => {
    switch (type) {
      case 'Government': return 'bg-blue-100 text-blue-800';
      case 'Private': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Pending': return 'bg-red-100 text-red-800';
      case 'Overdue': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400 fill-current" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStar key={i} className="text-yellow-400 fill-current opacity-50" />);
      } else {
        stars.push(<FaStar key={i} className="text-gray-300" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-600">
        <FaSpinner className="animate-spin text-3xl mb-4" />
        <p>Loading supplier details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-600">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button
          onClick={() => navigate('/suppliers')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
        >
          <FaArrowLeft className="mr-2" />
          Back to Suppliers
        </button>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-600">
        <p className="text-gray-700 mb-4">Supplier not found.</p>
        <button
          onClick={() => navigate('/suppliers')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
        >
          <FaArrowLeft className="mr-2" />
          Back to Suppliers
        </button>
      </div>
    );
  }

  const allPurchases = [
    ...purchases.map(p => ({ ...p, type: 'Regular Purchase' })),
    ...bagPurchases.map(p => ({ ...p, type: 'Bag Purchase' })),
    ...foodPurchases.map(p => ({ ...p, type: 'Food Purchase' }))
  ].sort((a, b) => new Date(b.purchaseDate || b.createdAt || 0) - new Date(a.purchaseDate || a.createdAt || 0));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaBuilding className="text-blue-600 mr-2" />
              Supplier Details
            </h1>
            <p className="text-sm text-gray-500">Supplier Code: {supplier.supplierCode || supplier._id}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(supplier.status)}`}>
              {supplier.status || 'Active'}
            </span>
            <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getSupplierTypeColor(supplier.supplierType)}`}>
              {supplier.supplierType || 'Private'}
            </span>
            {canManageSuppliers && (
              <button
                onClick={() => navigate('/suppliers')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700"
              >
                <FaEdit className="mr-2" />
                Edit Supplier
              </button>
            )}
            <button
              onClick={() => navigate('/suppliers')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700"
            >
              <FaArrowLeft className="mr-2" />
              Back to Suppliers
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Supplier Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <FaBuilding className="mr-2" /> Supplier Name
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatValue(supplier.name)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Code: {supplier.supplierCode}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center text-gray-500 text-sm mb-1">
              <FaUserTie className="mr-2" /> Contact Person
            </div>
            <div className="text-lg font-semibold text-gray-900">{formatValue(supplier.contactPerson)}</div>
            <div className="text-xs text-gray-500 mt-1">{formatValue(supplier.businessType, 'Business type not set')}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'financial'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Financial
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'purchases'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Purchase History ({allPurchases.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <FaPhone className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">{formatValue(supplier.phone)}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <FaEnvelope className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">{formatValue(supplier.email)}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <FaMapMarkerAlt className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Address</p>
                        <p className="text-sm text-gray-600">{formatAddress(supplier.address)}</p>
                      </div>
                    </div>
                    {supplier.taxNumber && (
                      <div className="flex items-start space-x-3">
                        <FaFileInvoice className="text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Tax Number</p>
                          <p className="text-sm text-gray-600">{formatValue(supplier.taxNumber)}</p>
                        </div>
                      </div>
                    )}
                    {supplier.warehouse && (
                      <div className="flex items-start space-x-3">
                        <FaWarehouse className="text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Warehouse</p>
                          <p className="text-sm text-gray-600">
                            {typeof supplier.warehouse === 'object' 
                              ? supplier.warehouse.name || 'N/A'
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                    {supplier.paymentTerms && (
                      <div className="flex items-start space-x-3">
                        <FaCalendarAlt className="text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Payment Terms</p>
                          <p className="text-sm text-gray-600">{formatValue(supplier.paymentTerms)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                {(supplier.businessType || supplier.notes) && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {supplier.businessType && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">Business Type</p>
                          <p className="text-sm text-gray-600">{formatValue(supplier.businessType)}</p>
                        </div>
                      )}
                      {supplier.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">Notes</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{formatValue(supplier.notes)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* System Information */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supplier.createdAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Created At</p>
                        <p className="text-sm text-gray-600">{formatDateTime(supplier.createdAt)}</p>
                      </div>
                    )}
                    {supplier.updatedAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Updated</p>
                        <p className="text-sm text-gray-600">{formatDateTime(supplier.updatedAt)}</p>
                      </div>
                    )}
                    {supplier.createdBy && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Created By</p>
                        <p className="text-sm text-gray-600">
                          {typeof supplier.createdBy === 'object'
                            ? `${supplier.createdBy.firstName || ''} ${supplier.createdBy.lastName || ''}`.trim() || supplier.createdBy.name || 'N/A'
                            : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                {/* Financial Overview */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-md p-4">
                      <p className="text-xs uppercase text-gray-500">Total Purchases</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalPurchases)}</p>
                    </div>
                    <div className="bg-green-50 rounded-md p-4 border border-green-200">
                      <p className="text-xs uppercase text-gray-500">Total Paid</p>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
                    </div>
                    <div className="bg-red-50 rounded-md p-4 border border-red-200">
                      <p className="text-xs uppercase text-gray-500">Total Due</p>
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(totalDue)}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-md p-4 border border-yellow-200">
                      <p className="text-xs uppercase text-gray-500">Outstanding Balance</p>
                      <p className="text-lg font-semibold text-yellow-700">{formatCurrency(outstandingBalance)}</p>
                    </div>
                  </div>
                  {outstandingBalance > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center">
                        <FaExclamationTriangle className="text-yellow-600 mr-2" />
                        <p className="text-sm text-yellow-800 font-semibold">
                          You have an outstanding balance of {formatCurrency(outstandingBalance)} to pay to this supplier.
                        </p>
                      </div>
                    </div>
                  )}
                  {outstandingBalance === 0 && totalPurchases > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center">
                        <FaCheckCircle className="text-green-600 mr-2" />
                        <p className="text-sm text-green-800 font-semibold">
                          All payments are up to date. No outstanding balance.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Record Payment Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Payment to Supplier</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Outstanding Balance: <span className="font-semibold text-red-600">{formatCurrency(outstandingBalance)}</span>
                  </p>
                  {totalDue <= 0 && (
                    <p className="text-sm text-green-600 mb-4">This supplier has no outstanding balance. All payments are up to date.</p>
                  )}
                  <form onSubmit={handleRecordPayment} className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={totalDue}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount to pay"
                        disabled={totalDue <= 0}
                      />
                      {totalDue > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Maximum: {formatCurrency(totalDue)}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={paymentProcessing || totalDue <= 0}
                      className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {paymentProcessing ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaPrint className="mr-2" />
                          Record Payment & Print Receipt
                        </>
                      )}
                    </button>
                  </form>
                  {paymentError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{paymentError}</p>
                    </div>
                  )}
                  {paymentSuccess && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-600">{paymentSuccess}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'purchases' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h2>
                {allPurchases.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingCart className="mx-auto text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500">No purchases recorded for this supplier yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allPurchases.map((purchase) => {
                          const total = parseFloat(purchase.totalAmount) || 0;
                          const paid = parseFloat(purchase.paidAmount) || 0;
                          const due = Math.max(0, total - paid);
                          return (
                            <tr key={purchase._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {purchase.type || 'Purchase'}
                              </td>
                              <td className="px-6 py-4 text-sm text-blue-600">
                                {purchase.purchaseNumber || purchase._id?.slice(-8) || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatDate(purchase.purchaseDate || purchase.createdAt)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                                {formatCurrency(total)}
                              </td>
                              <td className="px-6 py-4 text-sm text-green-600 text-right font-semibold">
                                {formatCurrency(paid)}
                              </td>
                              <td className="px-6 py-4 text-sm text-red-600 text-right font-semibold">
                                {formatCurrency(due)}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(purchase.paymentStatus || purchase.status)}`}>
                                  {purchase.paymentStatus || purchase.status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

