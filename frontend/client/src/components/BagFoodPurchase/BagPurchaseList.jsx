import React, { useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaPrint, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';

export default function BagPurchaseList({ purchases, loading, error, onEdit, onDelete, suppliers = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
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

  // Helper: extract supplier name safely (supports populated object or string)
  const getSupplierName = (purchase) => {
    if (!purchase) return '';
    if (purchase.supplier && typeof purchase.supplier === 'object') {
      return purchase.supplier.name || '';
    }
    return purchase.supplier || '';
  };

  // Helper: extract primary bag info from nested structure
  const getPrimaryBagInfo = (purchase) => {
    const bagTypes = ['ATA', 'MAIDA', 'SUJI', 'FINE'];
    const bags = purchase?.bags || {};
    for (const type of bagTypes) {
      const bag = bags[type];
      if (bag && (bag.quantity || 0) > 0) {
        return { type, quantity: bag.quantity || 0, unitPrice: bag.unitPrice || 0, totalPrice: bag.totalPrice || 0 };
      }
    }
    return { type: 'N/A', quantity: 0, unitPrice: 0, totalPrice: 0 };
  };

  const filteredPurchases = purchases.filter(purchase => {
    const supplierName = getSupplierName(purchase);
    const matchesSearch = purchase.purchaseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || supplierName === supplierFilter;
    
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

    return matchesSearch && matchesStatus && matchesSupplier && matchesDate;
  });

  const uniqueSuppliers = [...new Set(purchases.map(p => getSupplierName(p)).filter(Boolean))];
  // Also include supplier names from the provided suppliers list for filter dropdown
  suppliers.forEach(s => {
    if (s?.name) uniqueSuppliers.push(s.name);
  });
  const uniqueSupplierOptions = [...new Set(uniqueSuppliers)];

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
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Bag Purchases Found</h3>
        <p className="text-gray-500">Start by creating your first bag purchase.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
          {uniqueSupplierOptions.map(supplier => (
            <option key={supplier} value={supplier}>
              {supplier || 'Unknown Supplier'}
            </option>
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
                Bags Summary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
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
                    {getSupplierName(purchase) || 'Unknown Supplier'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getPrimaryBagInfo(purchase).type}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  {(() => { const b = getPrimaryBagInfo(purchase); return (
                  <div className="text-sm">
                    <div className="text-xs">
                      <span className="font-medium">Type:</span> {b.type}
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">Quantity:</span> {b.quantity} bags
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total: {b.quantity} bags
                    </div>
                  </div>
                  ); })()}
                </td>
                
                <td className="px-6 py-4 min-w-[180px]">
                  {(() => { const b = getPrimaryBagInfo(purchase); return (
                  <div className="text-sm">
                    <div className="text-gray-900 font-medium break-words">
                      Rs. {(b.totalPrice || 0).toLocaleString()}
                    </div>
                    <div className="text-gray-500 break-words">
                      Unit Price: Rs. {(b.unitPrice || 0).toLocaleString()}
                    </div>
                    <div className="text-gray-500">
                      Status: {purchase.paymentStatus || 'Unknown'}
                    </div>
                  </div>
                  ); })()}
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
                Rs. {filteredPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0).toLocaleString()}
              </span>
            </span>
            <span className="text-gray-600">
              Total Bags: <span className="font-semibold text-gray-900">
                {filteredPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 