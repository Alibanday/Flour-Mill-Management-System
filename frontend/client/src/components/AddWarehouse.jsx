// pages/AddWarehouse.jsx

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AddWarehouse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    warehouseNumber: "",
    name: "",
    location: "",
    status: "Active",
    description: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/warehouse/create", formData);
      alert("Warehouse added successfully!");
      navigate("/warehouses"); // redirect to warehouse list or home
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to add warehouse");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Add New Warehouse</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Warehouse Number */}
          <div className="w-full">
            <label className="block mb-2 text-sm font-semibold text-black">Warehouse Number</label>
            <input
              type="text"
              name="warehouseNumber"
              required
              value={formData.warehouseNumber}
              onChange={handleChange}
              className="w-full border border-black rounded-md p-3 placeholder-gray-400 text-black"
              placeholder="Enter warehouse number"
            />
          </div>

          {/* Name */}
          <div className="w-full">
            <label className="block mb-2 text-sm font-semibold text-black">Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-black rounded-md p-3 placeholder-gray-400 text-black"
              placeholder="Enter warehouse name"
            />
          </div>

          {/* Location */}
          <div className="w-full">
            <label className="block mb-2 text-sm font-semibold text-black">Location</label>
            <input
              type="text"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-black rounded-md p-3 placeholder-gray-400 text-black"
              placeholder="Enter location"
            />
          </div>

          {/* Status */}
          <div className="w-full">
            <label className="block mb-2 text-sm font-semibold text-black">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-black rounded-md p-3 placeholder-gray-400 text-black"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Description */}
          <div className="w-full">
            <label className="block mb-2 text-sm font-semibold text-black">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-black rounded-md p-3 placeholder-gray-400 text-black"
              placeholder="Enter warehouse description"
              rows="3"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md mt-4 transition"
          >
            Add Warehouse
          </button>
        </form>
      </div>
    </div>
  );
}
