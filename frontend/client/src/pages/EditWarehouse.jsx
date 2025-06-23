// pages/EditWarehouse.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FaWarehouse, FaSave, FaTimes, FaUser } from "react-icons/fa";

export default function EditWarehouse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    warehouseNumber: "",
    name: "",
    location: "",
    status: "Active",
    description: "",
    manager: ""
  });
  
  const [warehouseManagers, setWarehouseManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/warehouse/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData({
          warehouseNumber: res.data.warehouseNumber || "",
          name: res.data.name || "",
          location: res.data.location || "",
          status: res.data.status || "Active",
          description: res.data.description || "",
          manager: res.data.manager?._id || ""
        });
      } catch (err) {
        console.error("Error fetching warehouse:", err);
        setError("Failed to fetch warehouse details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWarehouse();
  }, [id]);

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
      await axios.put(`http://localhost:8000/api/warehouse/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Warehouse updated successfully!");
      setTimeout(() => {
        navigate("/warehouse");
      }, 1500);
    } catch (error) {
      console.error("Update error:", error);
      setError(error.response?.data?.message || "Failed to update warehouse.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaWarehouse className="mr-2" />
          Edit Warehouse
        </h2>
        <button
          onClick={() => navigate("/warehouse")}
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
            onClick={() => navigate("/warehouse")}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 !bg-blackte hover:bg-gray-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white !bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <FaSave className="mr-2" />
            {loading ? "Updating..." : "Update Warehouse"}
          </button>
        </div>
      </form>
    </div>
  );
}