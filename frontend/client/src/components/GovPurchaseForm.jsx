import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaWallet, FaTimes, FaSave, FaPrint } from "react-icons/fa";

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
    status: "pending", // Added status field with default value
  });

  const [prCenters, setPrCenters] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Inventory state
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedStockType, setSelectedStockType] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [totalStock, setTotalStock] = useState(0);
  const [categorizedBags, setCategorizedBags] = useState({});
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
      const remaining = total - (parseFloat(form.initialPayment) || 0);
      
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
      console.log('token', token)
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
        status: form.status, // Added status to payload
        type:'government',
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
      
      // Show floating confirmation and close form
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
        type:'government',
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
      
      // Show floating confirmation and close form
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
                <div class="detail-label">Initial Payment:</div>
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
                <div class="detail-label">Initial Payment:</div>
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

      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaWallet className="mr-2" />
            Government Wheat Purchase
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={form.date}
                onChange={(date) => setForm((prev) => ({ ...prev, date }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
                required
              />
            </div>

            {/* PR Center Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PR Center <span className="text-red-500">*</span>
              </label>
              <select
                name="prCenter"
                value={form.prCenter}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
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

            {/* Warehouse Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                name="warehouse"
                value={form.warehouse}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
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

            {/* Wheat Quantity and Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wheat Quantity (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="wheatQuantity"
                placeholder="Enter quantity in kg"
                value={form.wheatQuantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rate Per Kg (Rs.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="ratePerKg"
                placeholder="Enter rate per kg"
                value={form.ratePerKg}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount (Rs.)
              </label>
              <input
                type="text"
                name="totalAmount"
                value={form.totalAmount || "0.00"}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-black"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Account</option>
              </select>
            </div>

            {/* Initial Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Payment (Rs.)
              </label>
              <input
                type="number"
                name="initialPayment"
                placeholder="Enter initial payment"
                value={form.initialPayment}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
                step="0.01"
                min="0"
              />
            </div>

            {/* Remaining Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remaining Amount (Rs.)
              </label>
              <input
                type="text"
                name="remainingAmount"
                value={form.remainingAmount || "0.00"}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-black"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Enter purchase description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>

          {/* Status Dropdown - Moved to the end of the form */}
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 !bg-gray-200 hover:bg-gray-50"
            >
              <FaTimes className="mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white !bg-blue-600 hover:bg-blue-700"
            >
              <FaSave className="mr-2" />
              Save
            </button>
            <button
              type="button"
              onClick={handlePrintAndSave}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white !bg-green-600 hover:bg-green-700"
            >
              <FaSave className="mr-2" />
              Print & Save
            </button>
            <button
              type="button"
              onClick={printCurrentForm}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white !bg-yellow-600 hover:bg-yellow-700"
            >
              <FaPrint className="mr-2" />
              Print Draft
            </button>
          </div>
        </form>
      </div>
    </>
  );
}