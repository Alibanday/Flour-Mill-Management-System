import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaHome, FaPlus, FaClipboardList, FaArrowLeft,
  FaTrash, FaEdit, FaEye
} from "react-icons/fa";

export default function AddItemPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    weight: "",
    price: "",
    description: ""
  });
  const [itemsToAdd, setItemsToAdd] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.category || !formData.price) {
      setError("Name, category, and price are required");
      return;
    }

    // Validate weight for bags
    if (formData.category === "bags" && !formData.weight) {
      setError("Weight is required for bags");
      return;
    }

    // Add the item to the list
    const newItem = {
      id: Date.now(), // Temporary ID for list management
      ...formData
    };
    
    setItemsToAdd([...itemsToAdd, newItem]);
    
    // Reset form
    setFormData({
      name: "",
      category: "",
      weight: "",
      price: "",
      description: ""
    });

    setError(null);
  };

  const handleRemoveItem = (id) => {
    setItemsToAdd(itemsToAdd.filter(item => id !== item.id));
  };

  const handleSaveAll = async () => {
    if (itemsToAdd.length === 0) {
      setError("No items to save");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      
      // Save each item to the database
      const savePromises = itemsToAdd.map(async (item) => {
        const itemData = {
          name: item.name,
          category: item.category,
          price: parseFloat(item.price),
          description: item.description
        };

        // Add weight only for bags
        if (item.category === "bags") {
          itemData.weight = parseInt(item.weight);
        }

        const response = await axios.post(
          "http://localhost:8000/api/items",
          itemData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        return response.data;
      });

      await Promise.all(savePromises);
      
      setSuccess(`${itemsToAdd.length} items saved successfully!`);
      setItemsToAdd([]);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (error) {
      console.error("Error saving items:", error);
      setError(
        error.response?.data?.message || 
        "Failed to save items. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/register-items")}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FaArrowLeft />
                <span>Back to Items</span>
              </button>
              <span className="text-gray-400">/</span>
              <h1 className="text-2xl font-bold text-gray-800">Add Item</h1>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={itemsToAdd.length === 0 || loading}
              className="!bg-blue-600 text-white px-6 py-2 rounded-lg hover:!bg-blue-700 transition-colors flex items-center space-x-2 disabled:!bg-gray-400 disabled:cursor-not-allowed"
            >
              <FaPlus />
              <span>{loading ? "Saving..." : "Add Item"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="flex">
        {/* Form Section */}
        <div className="w-1/2 p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Item Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter item name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="wheat">Wheat</option>
                    <option value="bags">Bags</option>
                  </select>
                </div>

                {/* Weight field - only show for bags */}
                {formData.category === "bags" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight *
                    </label>
                    <select
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {/* Price field - different labels based on category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.category === "wheat" ? "Price per kg *" : "Price per bag *"}
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={formData.category === "wheat" ? "Enter price per kg" : "Enter price per bag"}
                  />
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter item description (optional)"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 !bg-green-600 text-white rounded-md text-sm font-medium hover:!bg-green-700"
                >
                  Add to List
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Items List Section */}
        <div className="w-1/2 p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Items to Add</h2>
              <span className="text-sm text-gray-500">
                {itemsToAdd.length} item{itemsToAdd.length !== 1 ? 's' : ''} in list
              </span>
            </div>

            {itemsToAdd.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaClipboardList className="mx-auto text-4xl mb-4 text-gray-300" />
                <p>No items added yet</p>
                <p className="text-sm">Fill the form and click "Add to List" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {itemsToAdd.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {item.category}
                          </span>
                          {item.weight && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              {item.weight} kg
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Category:</span> {item.category}
                          </div>
                          {item.weight && (
                            <div>
                              <span className="font-medium">Weight:</span> {item.weight} kg
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Price:</span> Rs. {item.price} {item.category === "wheat" ? "/kg" : "/bag"}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-2">{item.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="text-blue-600 hover:text-blue-800">
                          <FaEye />
                        </button>
                        <button className="text-green-600 hover:text-green-800">
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 