import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPrint, FaEdit, FaWallet, FaMoneyBillWave, FaCalendarAlt, FaInfoCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function GovPurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prCenterName, setPrCenterName] = useState("");

  useEffect(() => {
    const fetchPurchaseDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:8000/api/invoice/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setPurchase(response.data);
        
        // Fetch PR Center name if not populated
        if (response.data.prCenter && typeof response.data.prCenter === 'string') {
          const prCenterResponse = await axios.get(`http://localhost:8000/api/prcenter/${response.data.prCenter}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setPrCenterName(prCenterResponse.data.name);
        } else if (response.data.prCenter && response.data.prCenter.name) {
          setPrCenterName(response.data.prCenter.name);
        }
        
      } catch (err) {
        console.error("Failed to fetch purchase details:", err);
        setError("Failed to load purchase details");
        toast.error("Failed to load purchase details");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseDetails();
  }, [id]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Government Purchase Invoice</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: white;
            }
            .invoice-header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .invoice-subtitle {
              font-size: 16px;
              color: #666;
            }
            .invoice-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .detail-group {
              margin-bottom: 15px;
            }
            .detail-label {
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .detail-value {
              color: #666;
              padding: 8px;
              background-color: #f9f9f9;
              border-radius: 4px;
            }
            .amount-section {
              border-top: 1px solid #ddd;
              padding-top: 20px;
              margin-top: 20px;
            }
            .total-amount {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              text-align: right;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div class="invoice-title">GOVERNMENT PURCHASE INVOICE</div>
            <div class="invoice-subtitle">FlourMill Pro Management System</div>
          </div>
          
          <div class="invoice-details">
            <div>
              <div class="detail-group">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${formatDate(purchase.date)}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">PR Center:</div>
                <div class="detail-value">${prCenterName || 'N/A'}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Warehouse:</div>
                <div class="detail-value">${purchase.warehouse ? (typeof purchase.warehouse === 'string' ? purchase.warehouse : purchase.warehouse.name) : 'N/A'}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Wheat Quantity:</div>
                <div class="detail-value">${purchase.wheatQuantity.toLocaleString()} kg</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Rate Per Kg:</div>
                <div class="detail-value">Rs. ${purchase.ratePerKg.toLocaleString()}</div>
              </div>
            </div>
            <div>
              <div class="detail-group">
                <div class="detail-label">Payment Method:</div>
                <div class="detail-value">${purchase.paymentMethod.charAt(0).toUpperCase() + purchase.paymentMethod.slice(1)}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Initial Payment:</div>
                <div class="detail-value">Rs. ${purchase.initialPayment.toLocaleString()}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Credit Amount:</div>
                <div class="detail-value">Rs. ${purchase.remainingAmount.toLocaleString()}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Total Amount:</div>
                <div class="detail-value">Rs. ${purchase.totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          <div class="detail-group">
            <div class="detail-label">Description:</div>
            <div class="detail-value">${purchase.description || 'No description provided'}</div>
          </div>
          
          <div class="amount-section">
            <div class="total-amount">
              Total Amount: Rs. ${purchase.totalAmount.toLocaleString()}
            </div>
          </div>
          
          <div class="footer">
            <p>Invoice ID: ${purchase._id}</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>This is a computer generated invoice</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleEdit = () => {
    navigate(`/government-purchases/edit/${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          No purchase data found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md print:p-0 print:shadow-none">
      {/* Header with back button and actions */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" />
          Back to Purchases
        </button>
        <div className="flex space-x-3">
          <button
            onClick={handleEdit}
            className="flex items-center px-4 py-2 !bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          >
            <FaEdit className="mr-2" />
            Edit
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 !bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <FaPrint className="mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Purchase Details Card */}
      <div className="border border-gray-200 rounded-lg overflow-hidden print:border-0">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <FaWallet className="text-2xl mr-3" />
            <h2 className="text-xl font-bold">Government Wheat Purchase</h2>
          </div>
          <div className="bg-white text-black px-3 py-1 rounded-full text-sm font-semibold">
            {purchase.status === "completed" ? (
              <span>Completed</span>
            ) : (
              <span>Pending</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <FaInfoCircle className="mr-2 text-blue-500" />
                  Purchase Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">PR Center:</span>
                    <span className="font-medium text-black">{prCenterName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-black">{formatDate(purchase.date)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium text-black capitalize">{purchase.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                  <FaMoneyBillWave className="mr-2 text-green-500" />
                  Financial Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Wheat Quantity:</span>
                    <span className="font-medium text-black">{purchase.wheatQuantity} kg</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Rate Per Kg:</span>
                    <span className="font-medium text-black">Rs. {purchase.ratePerKg?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium text-black">Rs. {purchase.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Initial Payment:</span>
                  <span className="font-medium text-black">Rs. {purchase.initialPayment?.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Paid via {purchase.paymentMethod}
                </div>
              </div>
              <div className={`p-4 rounded-md ${purchase.remainingAmount > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Remaining Amount:</span>
                  <span className="font-medium text-black">
                    Rs. {purchase.remainingAmount?.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {purchase.remainingAmount > 0 ? "Payment pending" : "Fully paid"}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {purchase.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-black">{purchase.description}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-sm text-gray-600 border-t border-gray-200 pt-4">
            <div className="flex justify-between">
              <span>Purchase ID: {purchase._id}</span>
              <span>Last updated: {formatDate(purchase.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}