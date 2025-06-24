import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaWallet, FaTimes, FaSave, FaPrint, FaCalendarAlt, FaBuilding, FaWarehouse, FaWeightHanging, FaMoneyBillWave, FaCreditCard } from "react-icons/fa";

export default function GovPurchaseForm({ onPurchaseAdded, onCancel }) {
  const [form, setForm] = useState({
    prCenter: "",
    warehouse: "",
    paymentMethod: "cash",
    initialPayment: "",
    description: "",
    wheatQuantity: "",
    ratePerKg: "",
    totalAmount: "",
    remainingAmount: "",
    date: new Date(),
    status: "pending",
  });

  const [prCenters, setPrCenters] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // Fetch PR Centers from API
  useEffect(() => {
    const fetchPrCenters = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/api/prcenter", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPrCenters(response.data);
      } catch (err) {
        console.error("Failed to fetch PR Centers:", err);
        setError("Failed to load PR Centers");
      } finally {
        setLoading(false);
      }
    };

    fetchPrCenters();
  }, []);

  // Fetch Warehouses from API
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/api/warehouse/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setWarehouses(response.data.warehouses || response.data);
      } catch (err) {
        console.error("Failed to fetch Warehouses:", err);
        setError("Failed to load Warehouses");
      }
    };

    fetchWarehouses();
  }, []);

  // Calculate total amount and remaining amount when values change
  useEffect(() => {
    if (form.wheatQuantity && form.ratePerKg) {
      const total = parseFloat(form.wheatQuantity) * parseFloat(form.ratePerKg);
      const paid = parseFloat(form.initialPayment) || 0;
      const remaining = total - paid;
      
      setForm(prev => ({ 
        ...prev, 
        totalAmount: total.toFixed(2),
        remainingAmount: remaining > 0 ? remaining.toFixed(2) : "0.00"
      }));
    } else {
      setForm(prev => ({ 
        ...prev, 
        totalAmount: "",
        remainingAmount: "" 
      }));
    }
  }, [form.wheatQuantity, form.ratePerKg, form.initialPayment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!form.prCenter) {
      setError("PR Center is required");
      return;
    }
    if (!form.warehouse) {
      setError("Warehouse is required");
      return;
    }
    if (!form.wheatQuantity || isNaN(form.wheatQuantity)) {
      setError("Please enter a valid wheat quantity");
      return;
    }
    if (!form.ratePerKg || isNaN(form.ratePerKg)) {
      setError("Please enter a valid rate per kg");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const payload = {
        prCenter: form.prCenter,
        warehouse: form.warehouse,
        paymentMethod: form.paymentMethod,
        initialPayment: parseFloat(form.initialPayment) || 0,
        description: form.description,
        wheatQuantity: parseFloat(form.wheatQuantity),
        ratePerKg: parseFloat(form.ratePerKg),
        totalAmount: parseFloat(form.totalAmount),
        remainingAmount: parseFloat(form.remainingAmount),
        date: form.date,
        status: form.status,
        type: 'government',
      };

      const response = await axios.post(
        "http://localhost:8000/api/invoice",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      setSuccess("Government purchase recorded successfully!");
      onPurchaseAdded && onPurchaseAdded(response.data);
      
      showFloatingConfirmation("Government purchase recorded successfully!");
      
      // Reset form but keep the date
      setForm({
        prCenter: "",
        warehouse: "",
        paymentMethod: "cash",
        initialPayment: "",
        description: "",
        wheatQuantity: "",
        ratePerKg: "",
        totalAmount: "",
        remainingAmount: "",
        date: new Date(),
        status: "pending",
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to record purchase.");
    }
  };

  const handlePrintAndSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!form.prCenter) {
      setError("PR Center is required");
      return;
    }
    if (!form.warehouse) {
      setError("Warehouse is required");
      return;
    }
    if (!form.wheatQuantity || isNaN(form.wheatQuantity)) {
      setError("Please enter a valid wheat quantity");
      return;
    }
    if (!form.ratePerKg || isNaN(form.ratePerKg)) {
      setError("Please enter a valid rate per kg");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const payload = {
        prCenter: form.prCenter,
        warehouse: form.warehouse,
        paymentMethod: form.paymentMethod,
        initialPayment: parseFloat(form.initialPayment) || 0,
        description: form.description,
        wheatQuantity: parseFloat(form.wheatQuantity),
        ratePerKg: parseFloat(form.ratePerKg),
        totalAmount: parseFloat(form.totalAmount),
        remainingAmount: parseFloat(form.remainingAmount),
        date: form.date,
        status: form.status,
        type: 'government',
      };

      const response = await axios.post(
        "http://localhost:8000/api/invoice",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      setSuccess("Government purchase recorded successfully!");
      onPurchaseAdded && onPurchaseAdded(response.data);
      
      // Print the invoice
      printInvoice(payload, response.data._id);
      
      showFloatingConfirmation("Government purchase recorded and invoice printed successfully!");
      
      // Reset form but keep the date
      setForm({
        prCenter: "",
        warehouse: "",
        paymentMethod: "cash",
        initialPayment: "",
        description: "",
        wheatQuantity: "",
        ratePerKg: "",
        totalAmount: "",
        remainingAmount: "",
        date: new Date(),
        status: "pending",
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to record purchase.");
    }
  };

  const printInvoice = (formData, invoiceId) => {
    // Get selected PR Center and Warehouse names
    const selectedPrCenter = prCenters.find(center => center._id === formData.prCenter);
    const selectedWarehouse = warehouses.find(warehouse => warehouse._id === formData.warehouse);
    
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
                <div class="detail-value">${new Date(formData.date).toLocaleDateString()}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">PR Center:</div>
                <div class="detail-value">${selectedPrCenter ? selectedPrCenter.name : 'N/A'}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Warehouse:</div>
                <div class="detail-value">${selectedWarehouse ? selectedWarehouse.name : 'N/A'}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Wheat Quantity:</div>
                <div class="detail-value">${formData.wheatQuantity.toLocaleString()} kg</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Rate Per Kg:</div>
                <div class="detail-value">Rs. ${formData.ratePerKg.toLocaleString()}</div>
              </div>
            </div>
            <div>
              <div class="detail-group">
                <div class="detail-label">Payment Method:</div>
                <div class="detail-value">${formData.paymentMethod.charAt(0).toUpperCase() + formData.paymentMethod.slice(1)}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Amount Paid:</div>
                <div class="detail-value">Rs. ${formData.initialPayment.toLocaleString()}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Credit Amount:</div>
                <div class="detail-value">Rs. ${formData.remainingAmount.toLocaleString()}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Total Amount:</div>
                <div class="detail-value">Rs. ${formData.totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          <div class="detail-group">
            <div class="detail-label">Description:</div>
            <div class="detail-value">${formData.description || 'No description provided'}</div>
          </div>
          
          <div class="amount-section">
            <div class="total-amount">
              Total Amount: Rs. ${formData.totalAmount.toLocaleString()}
            </div>
          </div>
          
          <div class="footer">
            <p>Invoice ID: ${invoiceId}</p>
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

  const printCurrentForm = () => {
    // Validation for printing
    if (!form.prCenter) {
      setError("PR Center is required for printing");
      return;
    }
    if (!form.warehouse) {
      setError("Warehouse is required for printing");
      return;
    }
    if (!form.wheatQuantity || isNaN(form.wheatQuantity)) {
      setError("Please enter a valid wheat quantity for printing");
      return;
    }
    if (!form.ratePerKg || isNaN(form.ratePerKg)) {
      setError("Please enter a valid rate per kg for printing");
      return;
    }

    // Get selected PR Center and Warehouse names
    const selectedPrCenter = prCenters.find(center => center._id === form.prCenter);
    const selectedWarehouse = warehouses.find(warehouse => warehouse._id === form.warehouse);
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Government Purchase Invoice - Draft</title>
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
            .draft-badge {
              background-color: #ff6b6b;
              color: white;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              display: inline-block;
              margin-bottom: 10px;
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
            <div class="draft-badge">DRAFT</div>
            <div class="invoice-title">GOVERNMENT PURCHASE INVOICE</div>
            <div class="invoice-subtitle">FlourMill Pro Management System</div>
          </div>
          
          <div class="invoice-details">
            <div>
              <div class="detail-group">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${new Date(form.date).toLocaleDateString()}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">PR Center:</div>
                <div class="detail-value">${selectedPrCenter ? selectedPrCenter.name : 'N/A'}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Warehouse:</div>
                <div class="detail-value">${selectedWarehouse ? selectedWarehouse.name : 'N/A'}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Wheat Quantity:</div>
                <div class="detail-value">${parseFloat(form.wheatQuantity).toLocaleString()} kg</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Rate Per Kg:</div>
                <div class="detail-value">Rs. ${parseFloat(form.ratePerKg).toLocaleString()}</div>
              </div>
            </div>
            <div>
              <div class="detail-group">
                <div class="detail-label">Payment Method:</div>
                <div class="detail-value">${form.paymentMethod.charAt(0).toUpperCase() + form.paymentMethod.slice(1)}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Amount Paid:</div>
                <div class="detail-value">Rs. ${(parseFloat(form.initialPayment) || 0).toLocaleString()}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Credit Amount:</div>
                <div class="detail-value">Rs. ${(parseFloat(form.remainingAmount) || 0).toLocaleString()}</div>
              </div>
              <div class="detail-group">
                <div class="detail-label">Total Amount:</div>
                <div class="detail-value">Rs. ${(parseFloat(form.totalAmount) || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          <div class="detail-group">
            <div class="detail-label">Description:</div>
            <div class="detail-value">${form.description || 'No description provided'}</div>
          </div>
          
          <div class="amount-section">
            <div class="total-amount">
              Total Amount: Rs. ${(parseFloat(form.totalAmount) || 0).toLocaleString()}
            </div>
          </div>
          
          <div class="footer">
            <p>Draft Invoice - Not Saved</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>This is a draft invoice for review</p>
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

  const showFloatingConfirmation = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    
    // Hide confirmation after 2 seconds
    setTimeout(() => {
      setShowConfirmation(false);
      onCancel(); // Close the form
    }, 2000);
  };

  const isFullyPaid = parseFloat(form.totalAmount) > 0 && parseFloat(form.initialPayment) >= parseFloat(form.totalAmount);

  return (
    <>
      {/* Floating Confirmation Message */}
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-50 absolute inset-0"></div>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4 relative z-10">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {confirmationMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <FaWallet className="text-2xl text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Government Wheat Purchase</h2>
              <p className="text-gray-600 mt-1">Record new government wheat purchase transaction</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Top Row - Date, PR Center, Warehouse */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Date */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-500" />
                Purchase Date <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <DatePicker
                  selected={form.date}
                  onChange={(date) => setForm((prev) => ({ ...prev, date }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  required
                />
              </div>
            </div>

            {/* PR Center */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FaBuilding className="mr-2 text-blue-500" />
                PR Center <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="prCenter"
                value={form.prCenter}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                required
              >
                <option value="">Select PR Center</option>
                {loading ? (
                  <option disabled>Loading PR Centers...</option>
                ) : (
                  prCenters.map((center) => (
                    <option key={center._id} value={center._id}>
                      {center.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Warehouse */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FaWarehouse className="mr-2 text-blue-500" />
                Warehouse <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="warehouse"
                value={form.warehouse}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                required
              >
                <option value="">Select Warehouse</option>
                {loading ? (
                  <option disabled>Loading Warehouses...</option>
                ) : (
                  warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Wheat Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wheat Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FaWeightHanging className="mr-2 text-blue-500" />
                Wheat Quantity (kg) <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                name="wheatQuantity"
                placeholder="Enter quantity in kg"
                value={form.wheatQuantity}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* Rate Per Kg */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FaMoneyBillWave className="mr-2 text-blue-500" />
                Rate Per Kg (Rs.) <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                name="ratePerKg"
                placeholder="Enter rate per kg"
                value={form.ratePerKg}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {/* Payment Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <FaCreditCard className="mr-2 text-blue-500" />
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Account</option>
              </select>
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Total Amount (Rs.)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="totalAmount"
                  value={form.totalAmount || "0.00"}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">₹</span>
                </div>
              </div>
            </div>

            {/* Amount Paid */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Amount Paid (Rs.)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="initialPayment"
                  placeholder="Enter amount paid"
                  value={form.initialPayment}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  step="0.01"
                  min="0"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 text-sm">₹</span>
                </div>
              </div>
            </div>
          </div>

          {/* Remaining Amount - Only show if not fully paid */}
          {!isFullyPaid && parseFloat(form.totalAmount) > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div></div> {/* Spacer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Remaining Amount (Rs.)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="remainingAmount"
                    value={form.remainingAmount || "0.00"}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-yellow-50 text-gray-900 font-semibold"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm">₹</span>
                  </div>
                </div>
              </div>
              <div></div> {/* Spacer */}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Enter purchase description (optional)"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white resize-none"
            />
          </div>

          {/* Status */}
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 !bg-white hover:!bg-gray-50 transition-all duration-200 font-medium"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
            <button
              type="button"
              onClick={printCurrentForm}
              className="flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-white !bg-yellow-600 hover:!bg-yellow-700 transition-all duration-200 font-medium"
            >
              <FaPrint className="mr-2" />
              Print Draft
            </button>
            <button
              type="submit"
              className="flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-white !bg-blue-600 hover:!bg-blue-700 transition-all duration-200 font-medium"
            >
              <FaSave className="mr-2" />
              Save Purchase
            </button>
            <button
              type="button"
              onClick={handlePrintAndSave}
              className="flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-white !bg-green-600 hover:!bg-green-700 transition-all duration-200 font-medium"
            >
              <FaSave className="mr-2" />
              Save & Print
            </button>
          </div>
        </form>
      </div>
    </>
  );
}