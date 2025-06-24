import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaWallet, FaTimes, FaSave } from "react-icons/fa";

export default function PrivatePurchaseForm({ onPurchaseAdded, onCancel }) {
  const [form, setForm] = useState({
    buyer: "",
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

  const [buyerAccounts, setBuyerAccounts] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Receivable Buyer Accounts from API
  useEffect(() => {
    const fetchBuyerAccounts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/api/accounts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            type: "receivable" 
          }
        });
        setBuyerAccounts(response.data);
      } catch (err) {
        console.error("Failed to fetch Buyer Accounts:", err);
        setError("Failed to load Buyer Accounts");
      } finally {
        setLoading(false);
      }
    };

    fetchBuyerAccounts();
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
    if (!form.buyer) {
      setError("Buyer Account is required");
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
        buyer: form.buyer,
        paymentMethod: form.paymentMethod,
        initialPayment: parseFloat(form.initialPayment) || 0,
        description: form.description,
        wheatQuantity: parseFloat(form.wheatQuantity),
        ratePerKg: parseFloat(form.ratePerKg),
        totalAmount: parseFloat(form.totalAmount),
        remainingAmount: parseFloat(form.remainingAmount),
        date: form.date,
        status: form.status,
        type: 'private', 
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

      setSuccess("Private purchase recorded successfully!");
      onPurchaseAdded && onPurchaseAdded(response.data);
      
      // Reset form but keep the date
      setForm({
        buyer: "",
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaWallet className="mr-2" />
          Private Wheat Purchase
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

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

          {/* Buyer Account Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buyer Account <span className="text-red-500">*</span>
            </label>
            <select
              name="buyer"
              value={form.buyer}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
              required
            >
              <option value="">Select Buyer Account</option>
              {loading ? (
                <option disabled>Loading Buyer Accounts...</option>
              ) : (
                buyerAccounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.accountName} ({account.accountId})
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

        {/* Status Dropdown */}
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
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <FaSave className="mr-2" />
            Record Purchase
          </button>
        </div>
      </form>
    </div>
  );
}