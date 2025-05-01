import React, { useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddStockForm({ onStockAdded }) {
  const [form, setForm] = useState({
    sellerName: "",
    sellerDescription: "",
    itemName: "",
    itemType: "wheat",
    quantity: "",
    subType: "",
    itemDescription: "",
    date: new Date(),
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const subTypes = ["floue", "mada", "choker", "suji", "fine"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = await localStorage.getItem("token");
      const response = await axios.post("http://localhost:8000/api/stock/add", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess("Stock added successfully!");
      onStockAdded && onStockAdded(response.data);
      setForm({
        sellerName: "",
        sellerDescription: "",
        itemName: "",
        itemType: "wheat",
        quantity: "",
        subType: "",
        itemDescription: "",
        date: new Date(),
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to add stock.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Stock</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {/* Seller Name */}
        <div>
          <label className="block font-semibold text-black mb-1">Seller Name</label>
          <input
            type="text"
            name="sellerName"
            placeholder="Enter seller name"
            value={form.sellerName}
            onChange={handleChange}
            required
            className="w-full p-2 border border-black rounded placeholder-gray-400 text-black"
          />
        </div>

        {/* Seller Description */}
        <div>
          <label className="block font-semibold text-black mb-1">Seller Description</label>
          <input
            type="text"
            name="sellerDescription"
            placeholder="Enter seller description"
            value={form.sellerDescription}
            onChange={handleChange}
            className="w-full p-2 border border-black rounded placeholder-gray-400 text-black"
          />
        </div>

        {/* Item Name */}
        <div>
          <label className="block font-semibold text-black mb-1">Item Name</label>
          <input
            type="text"
            name="itemName"
            placeholder="Enter item name"
            value={form.itemName}
            onChange={handleChange}
            required
            className="w-full p-2 border border-black rounded placeholder-gray-400 text-black"
          />
        </div>

        {/* Item Type */}
        <div>
          <label className="block font-semibold text-black mb-1">Item Type</label>
          <select
            name="itemType"
            value={form.itemType}
            onChange={handleChange}
            className="w-full p-2 border border-black rounded text-black"
          >
            <option value="wheat">Wheat</option>
            <option value="bags">Bags</option>
          </select>
        </div>

        {/* Bag Subtype */}
        {form.itemType === "bags" && (
          <div>
            <label className="block font-semibold text-black mb-1">Bag Subtype</label>
            <select
              name="subType"
              value={form.subType}
              onChange={handleChange}
              required
              className="w-full p-2 border border-black rounded text-black"
            >
              <option value="">Select Sub Type</option>
              {subTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block font-semibold text-black mb-1">Quantity</label>
          <input
            type="number"
            name="quantity"
            placeholder={
              form.itemType === "wheat" ? "Enter quantity in kg" : "Enter number of bags"
            }
            value={form.quantity}
            onChange={handleChange}
            required
            className="w-full p-2 border border-black rounded placeholder-gray-400 text-black"
          />
        </div>

        {/* Item Description */}
        <div>
          <label className="block font-semibold text-black mb-1">Item Description</label>
          <textarea
            name="itemDescription"
            placeholder="Enter item description"
            value={form.itemDescription}
            onChange={handleChange}
            className="w-full p-2 border border-black rounded placeholder-gray-400 text-black"
          />
        </div>

        {/* Date Picker */}
        <div>
          <label className="block font-semibold text-black mb-1">Date</label>
          <DatePicker
            selected={form.date}
            onChange={(date) => setForm((prev) => ({ ...prev, date }))}
            minDate={new Date()}
            className="w-full p-2 border border-black rounded text-black"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Stock
        </button>
      </form>
    </div>
  );
}
