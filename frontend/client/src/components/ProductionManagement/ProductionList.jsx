import React, { useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaCheckCircle, FaTimesCircle, FaSearch, FaFilter } from 'react-icons/fa';

export default function ProductionList({ 
  productions, 
  loading, 
  onEdit, 
  onDelete, 
  onStatusUpdate,
  onSearch,
  searchTerm 
}) {
  const [sortField, setSortField] = useState('productionDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');

  // Sorting function
  const sortProductions = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle nested fields
      if (sortField === 'quantity.value') {
        aValue = a.quantity.value;
        bValue = b.quantity.value;
      } else if (sortField === 'productionCost.totalCost') {
        aValue = a.productionCost.totalCost;
        bValue = b.productionCost.totalCost;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Filtering function
  const filterProductions = (data) => {
    let filtered = data;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    if (filterProduct !== 'all') {
      filtered = filtered.filter(p => p.productName === filterProduct);
    }

    return filtered;
  };

  // Get unique product names for filter
  const productNames = [...new Set(productions.map(p => p.productName))];
  const statusOptions = ['all', 'In Progress', 'Completed', 'Quality Check', 'Approved', 'Rejected'];

  // Apply sorting and filtering
  const processedProductions = sortProductions(filterProductions(productions));

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Quality Check':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters and Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by batch number or product..."
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status}
                </option>
              ))}
            </select>
            
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Products</option>
              {productNames.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {processedProductions.length} of {productions.length} records
          </div>
        </div>
      </div>

      {/* Production Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('batchNumber')}
              >
                <div className="flex items-center">
                  Batch Number
                  {sortField === 'batchNumber' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('productName')}
              >
                <div className="flex items-center">
                  Product
                  {sortField === 'productName' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('quantity.value')}
              >
                <div className="flex items-center">
                  Quantity
                  {sortField === 'quantity.value' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('productionCost.totalCost')}
              >
                <div className="flex items-center">
                  Total Cost
                  {sortField === 'productionCost.totalCost' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wastage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('productionDate')}
              >
                <div className="flex items-center">
                  Date
                  {sortField === 'productionDate' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedProductions.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No production records found
                </td>
              </tr>
            ) : (
              processedProductions.map((production) => (
                <tr key={production._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {production.batchNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {production.productType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{production.productName}</div>
                    {production.repacking?.isRepacked && (
                      <div className="text-xs text-blue-600">
                        Repacked from {production.repacking.originalProduct}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {production.quantity.value} {production.quantity.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Cost/Unit: Rs. {(production.productionCost.totalCost / production.quantity.value).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Rs. {production.productionCost.totalCost.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Raw: {production.productionCost.rawMaterialCost} | 
                      Labor: {production.productionCost.laborCost} | 
                      Overhead: {production.productionCost.overheadCost}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {production.wastage.quantity} {production.wastage.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      {production.quantity.value > 0 
                        ? ((production.wastage.quantity / production.quantity.value) * 100).toFixed(2)
                        : '0.00'
                      }% | {production.wastage.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(production.status)}`}>
                      {production.status}
                    </span>
                    {production.quality.grade && (
                      <div className="text-xs text-gray-500 mt-1">
                        Grade: {production.quality.grade}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(production.productionDate).toLocaleDateString()}
                    {production.process.startTime && (
                      <div className="text-xs text-gray-400">
                        {new Date(production.process.startTime).toLocaleTimeString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(production)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Edit Production"
                      >
                        <FaEdit />
                      </button>
                      
                      <button
                        onClick={() => onStatusUpdate(production._id, 'Completed')}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Mark Complete"
                      >
                        <FaCheckCircle />
                      </button>
                      
                      <button
                        onClick={() => onDelete(production._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete Production"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
