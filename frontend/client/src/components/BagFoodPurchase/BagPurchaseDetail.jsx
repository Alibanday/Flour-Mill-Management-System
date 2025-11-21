import React, { useState, useEffect } from 'react';
import { FaTimes, FaPrint, FaEdit, FaTrash, FaWarehouse, FaUser, FaCalendar, FaMoneyBillWave, FaFileInvoice } from 'react-icons/fa';

export default function BagPurchaseDetail({ purchaseId, purchase, onClose, onEdit, onDelete }) {
  const [purchaseData, setPurchaseData] = useState(purchase || null);
  const [loading, setLoading] = useState(!purchase);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (purchaseId && !purchase) {
      fetchPurchase();
    }
  }, [purchaseId]);

  const fetchPurchase = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:7000/api/bag-purchases/${purchaseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPurchaseData(data.data || data);
      } else {
        setError('Failed to fetch purchase details');
      }
    } catch (err) {
      console.error('Error fetching purchase:', err);
      setError('Failed to fetch purchase details');
    } finally {
      setLoading(false);
    }
  };

  // Helper: get all products from bags Map/object
  const getAllProducts = (purchase) => {
    if (!purchase) return [];
    const bags = purchase.bags || {};
    const products = [];
    
    // Handle Map structure (Mongoose Map)
    if (bags instanceof Map || bags.constructor?.name === 'Map') {
      bags.forEach((bagData, productName) => {
        if (bagData && (bagData.quantity || 0) > 0) {
          products.push({
            name: productName,
            quantity: bagData.quantity || 0,
            unit: bagData.unit || 'bags',
            unitPrice: bagData.unitPrice || 0,
            totalPrice: bagData.totalPrice || 0
          });
        }
      });
    } 
    // Handle plain object structure
    else if (bags && typeof bags === 'object') {
      Object.entries(bags).forEach(([productName, bagData]) => {
        if (bagData && (bagData.quantity || 0) > 0) {
          products.push({
            name: productName,
            quantity: bagData.quantity || 0,
            unit: bagData.unit || 'bags',
            unitPrice: bagData.unitPrice || 0,
            totalPrice: bagData.totalPrice || 0
          });
        }
      });
    }
    
    return products;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Received': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-red-100 text-red-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  if (error || !purchaseData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-red-600 mb-4">{error || 'Purchase not found'}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const products = getAllProducts(purchaseData);
  const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const totalAmount = purchaseData.totalPrice || purchaseData.totalAmount || 
                      products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const paidAmount = purchaseData.paidAmount || 0;
  const dueAmount = purchaseData.dueAmount || purchaseData.remainingAmount || (totalAmount - paidAmount);
  const supplier = purchaseData.supplier;
  const supplierName = supplier && typeof supplier === 'object' ? supplier.name : supplier || 'Unknown Supplier';
  const warehouse = purchaseData.warehouse;
  const warehouseName = warehouse && typeof warehouse === 'object' ? warehouse.name : warehouse || 'Unknown Warehouse';
  const createdBy = purchaseData.createdBy;
  const createdByName = createdBy && typeof createdBy === 'object' 
    ? `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim() 
    : 'Unknown User';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bag Purchase Details</h2>
            <p className="text-sm text-gray-500 mt-1">Purchase Number: {purchaseData.purchaseNumber}</p>
          </div>
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(purchaseData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <FaEdit className="mr-2" />
                Edit
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Purchase Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FaUser className="mr-2" />
              Supplier Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium text-gray-900">{supplierName}</span>
              </div>
              {supplier && typeof supplier === 'object' && (
                <>
                  {supplier.contactPerson && (
                    <div>
                      <span className="text-gray-600">Contact Person:</span>
                      <span className="ml-2 text-gray-900">{supplier.contactPerson}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 text-gray-900">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 text-gray-900">{supplier.email}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FaWarehouse className="mr-2" />
              Warehouse Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Warehouse:</span>
                <span className="ml-2 font-medium text-gray-900">{warehouseName}</span>
              </div>
              {warehouse && typeof warehouse === 'object' && warehouse.location && (
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 text-gray-900">{warehouse.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FaCalendar className="mr-2" />
              Date Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Purchase Date:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {new Date(purchaseData.purchaseDate).toLocaleDateString()}
                </span>
              </div>
              {purchaseData.deliveryDate && (
                <div>
                  <span className="text-gray-600">Delivery Date:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(purchaseData.deliveryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {purchaseData.receivedDate && (
                <div>
                  <span className="text-gray-600">Received Date:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(purchaseData.receivedDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <FaFileInvoice className="mr-2" />
              Status Information
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(purchaseData.status)}`}>
                  {purchaseData.status || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Payment Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(purchaseData.paymentStatus)}`}>
                  {purchaseData.paymentStatus || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Created By:</span>
                <span className="ml-2 text-gray-900">{createdByName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price (Rs.)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Price (Rs.)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Rs. {product.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        Rs. {product.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan="2" className="px-4 py-3 text-sm text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {totalQuantity.toLocaleString()} bags
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    -
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    Rs. {totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaMoneyBillWave className="mr-2" />
            Financial Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold text-gray-900">Rs. {totalAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Paid Amount</div>
              <div className="text-2xl font-bold text-green-600">Rs. {paidAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Due Amount</div>
              <div className="text-2xl font-bold text-red-600">Rs. {dueAmount.toLocaleString()}</div>
            </div>
          </div>
          {purchaseData.paymentMethod && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="text-sm text-gray-600">Payment Method</div>
              <div className="text-lg font-medium text-gray-900">{purchaseData.paymentMethod}</div>
            </div>
          )}
        </div>

        {/* Notes */}
        {purchaseData.notes && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{purchaseData.notes}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this purchase?')) {
                  onDelete(purchaseData);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
            >
              <FaTrash className="mr-2" />
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

