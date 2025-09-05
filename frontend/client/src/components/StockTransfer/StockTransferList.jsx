import React, { useState } from 'react';
import { format } from 'date-fns';

const StockTransferList = ({
  transfers,
  loading,
  filters,
  pagination,
  warehouses,
  onApprove,
  onDispatch,
  onReceive,
  onComplete,
  onCancel,
  onFilterChange,
  onPageChange,
  hasPermission
}) => {
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [actionType, setActionType] = useState('');
  const [actionData, setActionData] = useState({});

  const handleAction = (transfer, type) => {
    setSelectedTransfer(transfer);
    setActionType(type);
    setActionData({});
    setShowActionModal(true);
  };

  const handleActionSubmit = () => {
    switch (actionType) {
      case 'approve':
        onApprove(selectedTransfer._id, actionData);
        break;
      case 'dispatch':
        onDispatch(selectedTransfer._id, actionData);
        break;
      case 'receive':
        onReceive(selectedTransfer._id, actionData);
        break;
      case 'complete':
        onComplete(selectedTransfer._id);
        break;
      case 'cancel':
        onCancel(selectedTransfer._id, actionData.reason);
        break;
      default:
        break;
    }
    setShowActionModal(false);
    setSelectedTransfer(null);
    setActionType('');
    setActionData({});
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-blue-100 text-blue-800',
      Dispatched: 'bg-purple-100 text-purple-800',
      Received: 'bg-green-100 text-green-800',
      Completed: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      Low: 'bg-gray-100 text-gray-800',
      Normal: 'bg-blue-100 text-blue-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityClasses[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w._id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown';
  };

  const getAvailableActions = (transfer) => {
    const actions = [];
    
    if (transfer.status === 'Pending' && hasPermission(['Admin', 'Manager'])) {
      actions.push({ type: 'approve', label: 'Approve', color: 'text-green-600 hover:text-green-900' });
    }
    
    if (transfer.status === 'Approved' && hasPermission(['Admin', 'Manager', 'Employee'])) {
      actions.push({ type: 'dispatch', label: 'Dispatch', color: 'text-blue-600 hover:text-blue-900' });
    }
    
    if (transfer.status === 'Dispatched' && hasPermission(['Admin', 'Manager', 'Employee'])) {
      actions.push({ type: 'receive', label: 'Receive', color: 'text-purple-600 hover:text-purple-900' });
    }
    
    if (transfer.status === 'Received' && hasPermission(['Admin', 'Manager'])) {
      actions.push({ type: 'complete', label: 'Complete', color: 'text-green-600 hover:text-green-900' });
    }
    
    if (['Pending', 'Approved', 'Dispatched'].includes(transfer.status) && hasPermission(['Admin', 'Manager'])) {
      actions.push({ type: 'cancel', label: 'Cancel', color: 'text-red-600 hover:text-red-900' });
    }
    
    return actions;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Search transfers..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Received">Received</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse</label>
            <select
              value={filters.fromWarehouse}
              onChange={(e) => onFilterChange({ fromWarehouse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map(warehouse => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse</label>
            <select
              value={filters.toWarehouse}
              onChange={(e) => onFilterChange({ toWarehouse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map(warehouse => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => onFilterChange({ search: '', status: '', fromWarehouse: '', toWarehouse: '', transferType: '' })}
              className="w-full px-3 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transfer Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From/To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <tr key={transfer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transfer.transferNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transfer.transferType}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        From: {getWarehouseName(transfer.fromWarehouse)}
                      </div>
                      <div className="text-sm text-gray-500">
                        To: {getWarehouseName(transfer.toWarehouse)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transfer.items.length} items
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Qty: {transfer.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPriorityBadge(transfer.priority)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(transfer.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transfer.expectedDate ? format(new Date(transfer.expectedDate), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {getAvailableActions(transfer).map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleAction(transfer, action.type)}
                          className={action.color}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => onPageChange(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === i + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'approve' && 'Approve Transfer'}
              {actionType === 'dispatch' && 'Dispatch Transfer'}
              {actionType === 'receive' && 'Receive Transfer'}
              {actionType === 'complete' && 'Complete Transfer'}
              {actionType === 'cancel' && 'Cancel Transfer'}
            </h3>
            
            {actionType === 'approve' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approval Notes
                  </label>
                  <textarea
                    value={actionData.notes || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Optional approval notes"
                  />
                </div>
              </div>
            )}

            {actionType === 'dispatch' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispatch Notes
                  </label>
                  <textarea
                    value={actionData.notes || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Dispatch notes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={actionData.vehicleNumber || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Vehicle number"
                  />
                </div>
              </div>
            )}

            {actionType === 'receive' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receive Notes
                  </label>
                  <textarea
                    value={actionData.notes || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Receive notes"
                  />
                </div>
              </div>
            )}

            {actionType === 'cancel' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cancellation Reason
                  </label>
                  <textarea
                    value={actionData.reason || ''}
                    onChange={(e) => setActionData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Reason for cancellation"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {actionType === 'approve' && 'Approve'}
                {actionType === 'dispatch' && 'Dispatch'}
                {actionType === 'receive' && 'Receive'}
                {actionType === 'complete' && 'Complete'}
                {actionType === 'cancel' && 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransferList;

