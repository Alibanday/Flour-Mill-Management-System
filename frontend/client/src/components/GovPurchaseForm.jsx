import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function GovPurchaseForm({ onPurchaseAdded }) {
  const [form, setForm] = useState({
    prCenter: "",
    paymentMethod: "cash",
    amountPaid: "",
    description: "",
    wheatQuantity: "",
    ratePerKg: "",
    totalAmount: "",
    date: new Date(),
  });

  const [prCenters, setPrCenters] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch PR Centers from API
  useEffect(() => {
    const fetchPrCenters = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/api/pr-centers", {
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

  // Calculate total amount when wheat quantity or rate changes
  useEffect(() => {
    if (form.wheatQuantity && form.ratePerKg) {
      const total = parseFloat(form.wheatQuantity) * parseFloat(form.ratePerKg);
      setForm(prev => ({ ...prev, totalAmount: total.toFixed(2) }));
    } else {
      setForm(prev => ({ ...prev, totalAmount: "" }));
    }
  }, [form.wheatQuantity, form.ratePerKg]);

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
      setError("PR Center is important");
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

      const payload = {
        prCenter: form.prCenter,
        paymentMethod: form.paymentMethod,
        amountPaid: parseFloat(form.amountPaid) || 0,
        description: form.description,
        wheatQuantity: parseFloat(form.wheatQuantity),
        ratePerKg: parseFloat(form.ratePerKg),
        totalAmount: parseFloat(form.totalAmount),
        date: form.date,
      };

      const response = await axios.post(
        "http://localhost:8000/api/gov-purchases",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Government purchase recorded successfully!");
      onPurchaseAdded && onPurchaseAdded(response.data);
      
      // Reset form but keep the date
      setForm({
        prCenter: "",
        paymentMethod: "cash",
        amountPaid: "",
        description: "",
        wheatQuantity: "",
        ratePerKg: "",
        totalAmount: "",
        date: new Date(),
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to record purchase.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-white py-10 px-4">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Government Wheat Purchase
        </h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black"
        >
          {/* PR Center Dropdown */}
          <div>
            <label className="block font-semibold mb-1">PR Center</label>
            <select
              name="prCenter"
              value={form.prCenter}
              onChange={handleChange}
              className="w-full p-3 border border-black rounded"
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

          {/* Amount Paid and Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Amount Paid (Rs.)</label>
              <input
                type="number"
                name="amountPaid"
                placeholder="Enter amount paid"
                value={form.amountPaid}
                onChange={handleChange}
                className="w-full p-3 border border-black rounded placeholder-gray-400"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Payment Method</label>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                className="w-full p-3 border border-black rounded"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Account</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              name="description"
              placeholder="Enter purchase description"
              value={form.description}
              onChange={handleChange}
              className="w-full p-3 border border-black rounded placeholder-gray-400"
              rows={3}
            />
          </div>

          {/* Wheat Quantity and Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Wheat Quantity (kg)</label>
              <input
                type="number"
                name="wheatQuantity"
                placeholder="Enter quantity in kg"
                value={form.wheatQuantity}
                onChange={handleChange}
                className="w-full p-3 border border-black rounded placeholder-gray-400"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Rate Per Kg (Rs.)</label>
              <input
                type="number"
                name="ratePerKg"
                placeholder="Enter rate per kg"
                value={form.ratePerKg}
                onChange={handleChange}
                className="w-full p-3 border border-black rounded placeholder-gray-400"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {/* Total Amount (auto-calculated) */}
          <div>
            <label className="block font-semibold mb-1">Total Amount (Rs.)</label>
            <input
              type="text"
              name="totalAmount"
              value={form.totalAmount || "0.00"}
              readOnly
              className="w-full p-3 border border-black rounded bg-gray-100"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block font-semibold mb-1">Purchase Date</label>
            <DatePicker
              selected={form.date}
              onChange={(date) => setForm((prev) => ({ ...prev, date }))}
              className="w-full p-3 border border-black rounded"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700"
            >
              Record Purchase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}