import React from 'react';
import { 
  FaSearch, FaFilter, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, 
  FaClock, FaPrint, FaWhatsapp, FaEye, FaUser, FaTruck, FaBoxes, 
  FaTools, FaUserTie, FaExclamationTriangle
} from 'react-icons/fa';

export default function GatePassList({
  gatePasses,
  loading,
  error,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  warehouseFilter,
  setWarehouseFilter,
  warehouses,
  onEdit,
  onStatusChange,
  onConfirmDispatch,
  onWhatsAppShare,
  canApprove,
  user
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Person': return <FaUser className="h-4 w-4" />;
      case 'Vehicle': return <FaTruck className="h-4 w-4" />;
      case 'Material': return <FaBoxes className="h-4 w-4" />;
      case 'Equipment': return <FaTools className="h-4 w-4" />;
      case 'Visitor': return <FaUserTie className="h-4 w-4" />;
      default: return <FaUser className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Person': return 'bg-blue-100 text-blue-800';
      case 'Vehicle': return 'bg-green-100 text-green-800';
      case 'Material': return 'bg-purple-100 text-purple-800';
      case 'Equipment': return 'bg-orange-100 text-orange-800';
      case 'Visitor': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  const handleConfirmDispatch = (gatePassId) => {
    const notes = prompt('Enter dispatch confirmation notes:');
    if (notes !== null) {
      onConfirmDispatch(gatePassId, notes);
    }
  };

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

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search gate passes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Person">Person</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Material">Material</option>
              <option value="Equipment">Equipment</option>
              <option value="Visitor">Visitor</option>
            </select>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(warehouse => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gate Passes Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Pass</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {gatePasses.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No gate passes found
                </td>
              </tr>
            ) : (
              gatePasses.map((gatePass) => (
                <tr key={gatePass._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(gatePass.type)}`}>
                        {getTypeIcon(gatePass.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{gatePass.gatePassNumber}</div>
                        <div className="text-sm text-gray-500">{gatePass.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{gatePass.issuedTo?.name}</div>
                      <div className="text-gray-500">{gatePass.issuedTo?.contact}</div>
                      {gatePass.issuedTo?.company && (
                        <div className="text-xs text-gray-400">{gatePass.issuedTo.company}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={gatePass.purpose}>
                      {gatePass.purpose}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{gatePass.warehouse?.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(gatePass.status)}`}>
                      {gatePass.status}
                    </span>
                    {gatePass.status === 'Active' && isExpired(gatePass.validUntil) && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          <FaExclamationTriangle className="mr-1" />
                          Expired
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div>From: {new Date(gatePass.validFrom).toLocaleDateString()}</div>
                      <div>Until: {new Date(gatePass.validUntil).toLocaleDateString()}</div>
                      {gatePass.status === 'Active' && (
                        <div className={`text-xs ${isExpired(gatePass.validUntil) ? 'text-red-600' : 'text-green-600'}`}>
                          {isExpired(gatePass.validUntil) ? 'Expired' : 'Valid'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {/* View/Edit */}
                      <button
                        onClick={() => onEdit(gatePass)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>

                      {/* Status Change Actions */}
                      {gatePass.status === 'Pending' && canApprove && (
                        <button
                          onClick={() => onStatusChange(gatePass._id, 'Approved')}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <FaCheckCircle />
                        </button>
                      )}

                      {gatePass.status === 'Approved' && canApprove && (
                        <button
                          onClick={() => onStatusChange(gatePass._id, 'Active')}
                          className="text-green-600 hover:text-green-900"
                          title="Activate"
                        >
                          <FaCheckCircle />
                        </button>
                      )}

                      {gatePass.status === 'Active' && (
                        <>
                          <button
                            onClick={() => onStatusChange(gatePass._id, 'Completed')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Complete"
                          >
                            <FaCheckCircle />
                          </button>
                          {!gatePass.stockDispatch?.confirmed && (
                            <button
                              onClick={() => handleConfirmDispatch(gatePass._id)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Confirm Dispatch"
                            >
                              <FaCheckCircle />
                            </button>
                          )}
                        </>
                      )}

                      {/* Print */}
                      <button
                        onClick={() => window.print()}
                        className="text-gray-600 hover:text-gray-900"
                        title="Print"
                      >
                        <FaPrint />
                      </button>

                      {/* WhatsApp Share */}
                      {!gatePass.whatsappShared && (
                        <button
                          onClick={() => onWhatsAppShare(gatePass._id)}
                          className="text-green-600 hover:text-green-900"
                          title="Share via WhatsApp"
                        >
                          <FaWhatsapp />
                        </button>
                      )}

                      {/* Stock Dispatch Status */}
                      {gatePass.stockDispatch?.confirmed && (
                        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          <FaCheckCircle className="inline mr-1" />
                          Dispatched
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 text-sm text-gray-600">
        Showing {gatePasses.length} gate pass{gatePasses.length !== 1 ? 'es' : ''}
      </div>
    </div>
  );
} 