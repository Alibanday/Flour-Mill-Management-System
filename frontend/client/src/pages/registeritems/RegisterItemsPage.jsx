import React, { useState } from 'react';
import { FaTimes, FaSearch } from 'react-icons/fa';

export default function ItemUpdateForm({ onCancel }) {
  const [searchId, setSearchId] = useState('');
  const [formData, setFormData] = useState({
    itemId: '',
    itemName: '',
    category: '',
    price: '',
    quantity: '',
    supplier: '',
    description: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [itemFound, setItemFound] = useState(false);

  const categories = ['Electronics', 'Clothing', 'Food', 'Furniture', 'Other'];

  const handleSearch = () => {
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      if (searchId === '123') {
        // Sample data
        setFormData({
          itemId: '123',
          itemName: 'Sample Product',
          category: 'Electronics',
          price: '99.99',
          quantity: '50',
          supplier: 'Tech Supplies Inc.',
          description: 'High-quality sample product for demonstration purposes.'
        });
        setItemFound(true);
      } else {
        setItemFound(false);
      }
      setIsSearching(false);
    }, 1000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Reset form
    setSearchId('');
    setFormData({
      itemId: '',
      itemName: '',
      category: '',
      price: '',
      quantity: '',
      supplier: '',
      description: ''
    });
    setItemFound(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Update Item</h2>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes className="text-lg" />
        </button>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Search Item ID</label>
        <div className="flex">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Item ID to update"
          />
          <button
            onClick={handleSearch}
            disabled={!searchId || isSearching}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
          >
            <FaSearch className="mr-2" />
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      {isSearching && (
        <div className="text-center py-4 text-gray-500">Searching for item...</div>
      )}
      
      {!isSearching && !itemFound && searchId && (
        <div className="text-center py-4 text-red-500">Item not found. Please check the ID and try again.</div>
      )}
      
      {itemFound && (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item ID</label>
              <input
                type="text"
                name="itemId"
                value={formData.itemId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setSearchId('');
                setItemFound(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              New Search
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Update Item
            </button>
          </div>
        </form>
      )}
    </div>
  );
}