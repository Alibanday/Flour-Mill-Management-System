import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

export default function EditPrCenter({ onCancel }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contact: ""
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchPrCenter = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/prcenter/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const { name, location, contact } = res.data;
        setFormData({ name, location, contact });
      } catch (err) {
        console.error("Error fetching PR Center:", err);
        alert("Failed to load PR Center data.");
      } finally {
        setFetching(false);
      }
    };

    fetchPrCenter();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.location || !formData.contact) {
      alert("All fields are required.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:8000/api/prcenter/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      alert("PR Center updated successfully!");
      // Navigate back to PR Center detail page
      navigate(`/prcenter/${id}`);
    } catch (error) {
      console.error("Error updating PR Center:", error);
      const message = error.response?.data?.message || "Failed to update PR Center";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to PR Center detail page
    navigate(`/prcenter/${id}`);
  };

  if (fetching) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading PR Center data...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaEdit className="mr-2" />
          Edit PR Center
        </h2>
        <button
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PR Center Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contact"
              required
              value={formData.contact}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 !bg-white hover:bg-gray-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white ${
              loading ? "!bg-gray-400 cursor-not-allowed" : "!bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <FaSave className="mr-2" />
            {loading ? "Updating..." : "Update PR Center"}
          </button>
        </div>
      </form>
    </div>
  );
}
