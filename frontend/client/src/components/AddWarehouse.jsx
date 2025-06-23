import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaWarehouse, FaSave, FaTimes, FaUser } from "react-icons/fa";

export default function AddWarehouse({ onCancel }) {
  const [formData, setFormData] = useState({
    warehouseNumber: "",
    name: "",
    location: "",
    status: "Active",
    description: "",
    manager: ""
  });

  const [warehouseManagers, setWarehouseManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch warehouse managers
  useEffect(() => {
    const fetchWarehouseManagers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/api/users/role/warehouse manager", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setWarehouseManagers(response.data);
      } catch (err) {
        console.error("Failed to fetch warehouse managers:", err);
        setError("Failed to load warehouse managers");
      }
    };

    fetchWarehouseManagers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:8000/api/warehouse/create", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      
      setSuccess("Warehouse added successfully!");
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to add warehouse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaWarehouse className="mr-2" />
          Add New Warehouse
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="warehouseNumber"
              required
              value={formData.warehouseNumber}
              onChange={handleChange}
              placeholder="Enter warehouse number"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter warehouse name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse Manager
            </label>
            <select
              name="manager"
              value={formData.manager}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            >
              <option value="">Select Warehouse Manager</option>
              {warehouseManagers.map((manager) => (
                <option key={manager._id} value={manager._id}>
                  {manager.firstName} {manager.lastName} - {manager.email}
                </option>
              ))}
            </select>
            {warehouseManagers.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No warehouse managers found. Please add warehouse managers first.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Enter warehouse description"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
          />
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
            disabled={loading}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <FaSave className="mr-2" />
            {loading ? "Adding..." : "Add Warehouse"}
          </button>
        </div>
      </form>
    </div>
  );
}