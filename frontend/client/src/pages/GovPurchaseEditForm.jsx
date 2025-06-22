import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaWallet, FaTimes, FaSave } from "react-icons/fa";

export default function GovPurchaseEditForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    prCenter: "",
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        // Fetch PR Centers
        const centersResponse = await axios.get("http://localhost:8000/api/prcenter", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPrCenters(centersResponse.data);

        // Fetch Purchase Data if editing
        if (id) {
          const purchaseResponse = await axios.get(`http://localhost:8000/api/invoice/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const purchaseData = purchaseResponse.data;
          setForm({
            prCenter: purchaseData.prCenter._id,
            paymentMethod: purchaseData.paymentMethod,
            initialPayment: purchaseData.initialPayment.toString(),
            description: purchaseData.description,
            wheatQuantity: purchaseData.wheatQuantity.toString(),
            ratePerKg: purchaseData.ratePerKg.toString(),
            totalAmount: purchaseData.totalAmount.toString(),
            remainingAmount: purchaseData.remainingAmount.toString(),
            date: new Date(purchaseData.date),
            status: purchaseData.status,
          });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (form.wheatQuantity && form.ratePerKg) {
      const total = parseFloat(form.wheatQuantity) * parseFloat(form.ratePerKg);
      const remaining = total - (parseFloat(form.initialPayment) || 0);
      
      setForm(prev => ({ 
        ...prev, 
        totalAmount: total.toFixed(2),
        remainingAmount: remaining > 0 ? remaining.toFixed(2) : "0.00"
      }));
    }
  }, [form.wheatQuantity, form.ratePerKg, form.initialPayment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
    if (!form.wheatQuantity || isNaN(form.wheatQuantity)) {
      setError("Please enter a valid wheat quantity");
      return;
    }
    if (!form.ratePerKg || isNaN(form.ratePerKg)) {
      setError("Please enter a valid rate per kg");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const payload = {
        prCenter: form.prCenter,
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

      const endpoint = id 
        ? `http://localhost:8000/api/invoice/${id}`
        : "http://localhost:8000/api/invoice";
      
      const method = id ? 'put' : 'post';
      
      await axios[method](endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess(id 
        ? "Purchase updated successfully!" 
        : "Purchase recorded successfully!");
      
      setTimeout(() => {
        navigate(id ? `/government-purchases/${id}` : "/government-purchases");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 
        (id ? "Failed to update purchase" : "Failed to record purchase"));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !form.prCenter) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaWallet className="mr-2" />
          {id ? "Edit Government Purchase" : "New Government Purchase"}
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              selected={form.date}
              onChange={(date) => setForm(prev => ({ ...prev, date }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
              disabled={loading}
            >
              <option value="">Select PR Center</option>
              {prCenters.map((center) => (
                <option key={center._id} value={center._id}>
                  {center.name}
                </option>
              ))}
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
              value={form.wheatQuantity}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              step="0.01"
              min="0"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate Per Kg (Rs.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="ratePerKg"
              value={form.ratePerKg}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              step="0.01"
              min="0"
              required
              disabled={loading}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              disabled={loading}
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
              value={form.initialPayment}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              step="0.01"
              min="0"
              disabled={loading}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
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
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            disabled={loading}
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                {id ? "Update Purchase" : "Record Purchase"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}