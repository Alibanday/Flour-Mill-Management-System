import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  FaArrowLeft,
  FaWarehouse,
  FaExchangeAlt,
  FaTruck,
  FaClipboardList,
  FaUserShield,
  FaInfoCircle,
  FaBox
} from 'react-icons/fa';
import api, { API_ENDPOINTS } from '../services/api';
import { formatCurrency } from '../utils/currency';

const formatDateTime = (value, fallback = 'Pending') => {
  if (!value) return fallback;
  try {
    return format(new Date(value), 'MMM dd, yyyy • hh:mm a');
  } catch {
    return fallback;
  }
};

const formatDate = (value, fallback = 'Not scheduled') => {
  if (!value) return fallback;
  try {
    return format(new Date(value), 'MMM dd, yyyy');
  } catch {
    return fallback;
  }
};

export default function StockTransferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        setLoading(true);
        const response = await api.get(`${API_ENDPOINTS.STOCK_TRANSFERS}/${id}`);
        const data = response.data?.data || response.data?.transfer || response.data;
        setTransfer(data);
        setError('');
      } catch (err) {
        console.error('Error loading stock transfer:', err);
        setError(err.response?.data?.message || 'Failed to load stock transfer details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransfer();
  }, [id]);

  const metrics = useMemo(() => {
    const items = transfer?.items || [];
    const totalRequested = items.reduce(
      (sum, item) => sum + (item.requestedQuantity ?? item.quantity ?? 0),
      0
    );
    const totalActual = items.reduce(
      (sum, item) => sum + (item.actualQuantity ?? 0),
      0
    );
    const totalValue = items.reduce(
      (sum, item) =>
        sum +
        (item.totalValue ??
          (item.unitPrice || 0) * (item.requestedQuantity ?? item.quantity ?? 0)),
      0
    );

    return {
      totalItems: items.length,
      totalRequested,
      totalActual,
      totalValue
    };
  }, [transfer]);

  const timeline = useMemo(() => {
    if (!transfer) return [];

    return [
      {
        title: 'Created',
        description: `Created by ${transfer.createdBy?.firstName || 'System'}`,
        date: transfer.createdAt,
        completed: true
      },
      {
        title: 'Approved',
        description: transfer.approval?.approvedBy
          ? `Approved by ${transfer.approval.approvedBy.firstName}`
          : 'Awaiting approval',
        date: transfer.approval?.approvedAt,
        completed: Boolean(transfer.approval?.approvedAt)
      },
      {
        title: 'Dispatched',
        description: transfer.dispatch?.dispatchedBy
          ? `Dispatched by ${transfer.dispatch.dispatchedBy.firstName}`
          : 'Awaiting dispatch',
        date: transfer.dispatch?.dispatchedAt,
        completed: Boolean(transfer.dispatch?.dispatchedAt)
      },
      {
        title: 'Received',
        description: transfer.receipt?.receivedBy
          ? `Received by ${transfer.receipt.receivedBy.firstName}`
          : 'Awaiting receipt',
        date: transfer.receipt?.receivedAt,
        completed: Boolean(transfer.receipt?.receivedAt)
      },
      {
        title: 'Completed',
        description: transfer.status === 'Completed'
          ? 'Transfer is fully completed'
          : 'Pending completion',
        date: transfer.transferDetails?.actualDeliveryDate,
        completed: transfer.status === 'Completed'
      }
    ];
  }, [transfer]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stock transfer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-6 text-center">
          <FaInfoCircle className="text-red-500 text-3xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load details</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!transfer) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <FaArrowLeft className="mr-2" />
            Back to Transfers
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-500">Transfer Number</p>
            <p className="text-xl font-bold text-gray-900">{transfer.transferNumber}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="text-lg font-semibold">{transfer.status}</p>
            <p className="text-xs text-gray-400">{formatDateTime(transfer.updatedAt, 'No updates yet')}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Priority</p>
            <p className="text-lg font-semibold">{transfer.transferDetails?.priority || 'Medium'}</p>
            <p className="text-xs text-gray-400">Set by requestor</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Expected Delivery</p>
            <p className="text-lg font-semibold">
              {formatDate(transfer.transferDetails?.expectedDeliveryDate)}
            </p>
            <p className="text-xs text-gray-400">Requested arrival</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total Value</p>
            <p className="text-lg font-semibold">{formatCurrency(metrics.totalValue)}</p>
            <p className="text-xs text-gray-400">Estimated transfer worth</p>
          </div>
        </div>

        {/* Transfer Overview */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaExchangeAlt className="text-blue-600 mr-2" />
            Transfer Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-center mb-3">
                <FaWarehouse className="text-blue-600 mr-2" />
                <p className="text-sm text-blue-600 font-medium">Source Warehouse</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {transfer.fromWarehouse?.name || transfer.fromWarehouse?.label || 'Warehouse'}
              </p>
              <p className="text-sm text-gray-600">
                {transfer.fromWarehouse?.location || 'Inventory will be deducted from this warehouse'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="flex items-center mb-3">
                <FaWarehouse className="text-green-600 mr-2" />
                <p className="text-sm text-green-600 font-medium">Destination Warehouse</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {transfer.toWarehouse?.name || transfer.toWarehouse?.label || 'Warehouse'}
              </p>
              <p className="text-sm text-gray-600">
                {transfer.toWarehouse?.location || 'Inventory will be received here'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalItems}</p>
              <p className="text-xs text-gray-400">Unique inventory lines</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Requested Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalRequested}</p>
              <p className="text-xs text-gray-400">Units planned to move</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Received Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalActual}</p>
              <p className="text-xs text-gray-400">Units confirmed at destination</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-6">
            <FaTruck className="text-blue-600 mr-2" />
            Transfer Timeline
          </h2>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={index} className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      event.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <FaClipboardList />
                  </div>
                  {index !== timeline.length - 1 && (
                    <div className={`w-px flex-1 ${event.completed ? 'bg-green-200' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(event.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
            <FaBox className="text-blue-600 mr-2" />
            Transfer Items
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch / Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfer.items.map((item, index) => (
                  <tr key={item._id || index}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{item.productName || 'Inventory Item'}</p>
                      <p className="text-xs text-gray-500">Code: {item.productCode || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.requestedQuantity ?? item.quantity ?? 0} {item.unit || 'units'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.actualQuantity ?? 0} {item.unit || 'units'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(item.unitPrice || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                      {formatCurrency(item.totalValue ?? (item.unitPrice || 0) * (item.requestedQuantity ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <p>Batch: {item.batchNumber || 'N/A'}</p>
                      {item.expiryDate && (
                        <p>Expiry: {formatDate(item.expiryDate, 'No expiry')}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
            <FaUserShield className="text-blue-600 mr-2" />
            Audit & Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Reason</p>
              <p className="text-gray-800">
                {transfer.transferDetails?.reason || 'No reason provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Notes</p>
              <p className="text-gray-800">
                {transfer.notes || transfer.dispatch?.dispatchNotes || 'No additional notes'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Created By</p>
              <p className="text-gray-800">
                {transfer.createdBy?.firstName
                  ? `${transfer.createdBy.firstName} ${transfer.createdBy.lastName || ''}`
                  : 'System'}
              </p>
              <p className="text-xs text-gray-400">
                {formatDateTime(transfer.createdAt, 'Creation time unavailable')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Vehicle / Transport</p>
              <p className="text-gray-800">
                {transfer.transferDetails?.transportMethod || transfer.dispatch?.vehicleNumber || 'Not specified'}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Link
              to="/stock-transfers"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              View All Transfers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


