import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EditItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    weight: "",
    price: "",
    description: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/api/items`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        const item = data.items.find(i => i._id === id);
        if (!item) throw new Error("Item not found");
        setFormData({
          name: item.name,
          category: item.category,
          weight: item.weight || "",
          price: item.price,
          description: item.description || ""
        });
      } catch (err) {
        setError("Failed to fetch item");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("token");
      const updateData = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        description: formData.description
      };
      if (formData.category === "bags") {
        updateData.weight = parseInt(formData.weight);
      }
      await fetch(`http://localhost:8000/api/items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      setSuccess("Item updated successfully!");
      setTimeout(() => navigate("/register-items"), 1200);
    } catch (err) {
      setError("Failed to update item");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">Edit Item</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {success && <div className="mb-4 text-green-600">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled
            >
              <option value="">Select category</option>
              <option value="wheat">Wheat</option>
              <option value="bags">Bags</option>
            </select>
          </div>
          {formData.category === "bags" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight *</label>
              <select
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select weight</option>
                <option value="10">10 kg</option>
                <option value="15">15 kg</option>
                <option value="20">20 kg</option>
                <option value="40">40 kg</option>
                <option value="80">80 kg</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{formData.category === "wheat" ? "Price per kg *" : "Price per bag *"}</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-6 py-2 !bg-gray-200 text-gray-800 rounded-md hover:!bg-gray-300"
              onClick={() => navigate("/register-items")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 !bg-blue-600 text-white rounded-md hover:!bg-blue-700"
            >
              Update Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 