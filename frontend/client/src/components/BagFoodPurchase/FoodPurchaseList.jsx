import React, { useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaPrint, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';

export default function FoodPurchaseList({ purchases, loading, error, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-red-100 text-red-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Transit': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.purchaseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.foodItems?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || purchase.supplier?._id === supplierFilter;
    const matchesCategory = categoryFilter === 'all' || 
                           purchase.foodItems?.some(item => item.category === categoryFilter);
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      matchesDate = new Date(purchase.purchaseDate).toDateString() === today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(purchase.purchaseDate) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(purchase.purchaseDate) >= monthAgo;
    }

    return matchesSearch && matchesStatus && matchesSupplier && matchesCategory && matchesDate;
  });

  const uniqueSuppliers = [...new Set(purchases.map(p => p.supplier?._id).filter(Boolean))];
  const uniqueCategories = [...new Set(purchases.flatMap(p => p.foodItems?.map(item => item.category) || []).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🌾</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Food Purchases Found</h3>
        <p className="text-gray-500">Start by creating your first food purchase.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search purchases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Suppliers</option>
          {uniqueSuppliers.map(supplierId => {
            const supplier = purchases.find(p => p.supplier?._id === supplierId)?.supplier;
            return (
              <option key={supplierId} value={supplierId}>
                {supplier?.name || 'Unknown Supplier'}
              </option>
            );
          })}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {uniqueCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Food Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Financial
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPurchases.map((purchase) => (
              <tr key={purchase._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {purchase.purchaseNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </div>
                    {purchase.deliveryDate && (
                      <div className="text-xs text-gray-400">
                        Delivery: {new Date(purchase.deliveryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {purchase.supplier?.name || 'Unknown Supplier'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {purchase.supplier?.contact || 'No contact'}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="space-y-1">
                      {purchase.foodItems?.slice(0, 3).map((item, index) => (
                        <div key={index} className="text-xs">
                          <span className="font-medium">{item.name}</span> - {item.quantity} {item.unit}
                          {item.quality !== 'Standard' && (
                            <span className={`ml-1 px-1 py-0.5 text-xs rounded ${
                              item.quality === 'Premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.quality}
                            </span>
                          )}
                        </div>
                      ))}
                      {purchase.foodItems?.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{purchase.foodItems.length - 3} more items
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total: {purchase.totalQuantity || 0} units
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="text-gray-900 font-medium">
                      ₹{purchase.totalAmount?.toLocaleString() || 0}
                    </div>
                    <div className="text-gray-500">
                      Paid: ₹{purchase.paidAmount?.toLocaleString() || 0}
                    </div>
                    {purchase.dueAmount > 0 && (
                      <div className="text-red-600 text-xs">
                        Due: ₹{purchase.dueAmount?.toLocaleString() || 0}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </span>
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(purchase.paymentStatus)}`}>
                        {purchase.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDeliveryStatusColor(purchase.deliveryStatus)}`}>
                        {purchase.deliveryStatus}
                      </span>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(purchase)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => onDelete(purchase)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="text-gray-600 hover:text-gray-900 p-1"
                      title="Print"
                    >
                      <FaPrint />
                    </button>
                    <button
                      className="text-green-600 hover:text-green-900 p-1"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredPurchases.length} of {purchases.length} purchases
          </div>
          <div className="flex space-x-4 text-sm">
            <span className="text-gray-600">
              Total Value: <span className="font-semibold text-gray-900">
                ₹{filteredPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString()}
              </span>
            </span>
            <span className="text-gray-600">
              Total Items: <span className="font-semibold text-gray-900">
                {filteredPurchases.reduce((sum, p) => sum + (p.totalQuantity || 0), 0)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 