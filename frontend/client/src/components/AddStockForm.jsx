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
    <div className="min-h-screen w-full bg-white py-10 px-4">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Stock</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">{success}</p>}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black"
        >
          <div>
            <label className="block font-semibold mb-1">Seller Name</label>
            <input
              type="text"
              name="sellerName"
              placeholder="Enter seller name"
              value={form.sellerName}
              onChange={handleChange}
              required
              className="w-full p-3 border border-black rounded placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Seller Description</label>
            <input
              type="text"
              name="sellerDescription"
              placeholder="Enter seller description"
              value={form.sellerDescription}
              onChange={handleChange}
              className="w-full p-3 border border-black rounded placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Item Name</label>
            <input
              type="text"
              name="itemName"
              placeholder="Enter item name"
              value={form.itemName}
              onChange={handleChange}
              required
              className="w-full p-3 border border-black rounded placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Item Type</label>
            <select
              name="itemType"
              value={form.itemType}
              onChange={handleChange}
              className="w-full p-3 border border-black rounded"
            >
              <option value="wheat">Wheat</option>
              <option value="bags">Bags</option>
            </select>
          </div>

          {form.itemType === "bags" && (
            <div>
              <label className="block font-semibold mb-1">Bag Subtype</label>
              <select
                name="subType"
                value={form.subType}
                onChange={handleChange}
                required
                className="w-full p-3 border border-black rounded"
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

          <div>
            <label className="block font-semibold mb-1">Quantity</label>
            <input
              type="number"
              name="quantity"
              placeholder={
                form.itemType === "wheat"
                  ? "Enter quantity in kg"
                  : "Enter number of bags"
              }
              value={form.quantity}
              onChange={handleChange}
              required
              className="w-full p-3 border border-black rounded placeholder-gray-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold mb-1">Item Description</label>
            <textarea
              name="itemDescription"
              placeholder="Enter item description"
              value={form.itemDescription}
              onChange={handleChange}
              className="w-full p-3 border border-black rounded placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Date</label>
            <DatePicker
              selected={form.date}
              onChange={(date) => setForm((prev) => ({ ...prev, date }))}
              minDate={new Date()}
              className="w-full p-3 border border-black rounded"
              required
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700"
            >
              Add Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
