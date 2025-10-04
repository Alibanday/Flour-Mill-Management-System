import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaTruck, FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import SalesForm from '../components/SalesManagement/SalesForm';
import SalesFormEnhanced from '../components/SalesManagement/SalesFormEnhanced';
import PurchaseForm from '../components/SalesManagement/PurchaseForm';

export default function SalesPurchasePage() {
  const { user, rolePermissions } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  // Debug: Log when purchases state changes
  useEffect(() => {
    console.log('📥 Purchases state updated:', purchases.length, 'purchases');
  }, [purchases]);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching data...');
      setLoading(true);
      const [salesRes, purchasesRes, warehousesRes, inventoryRes] = await Promise.all([
        fetch('http://localhost:7000/api/sales'),
        fetch('http://localhost:7000/api/purchases'),
        fetch('http://localhost:7000/api/warehouses'),
        fetch('http://localhost:7000/api/inventory')
      ]);

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData.data || []);
      }
      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json();
        console.log('📥 Purchases fetched:', purchasesData);
        console.log('📥 Number of purchases:', purchasesData.data?.length || 0);
        setPurchases(purchasesData.data || []);
      } else {
        console.error('❌ Failed to fetch purchases:', purchasesRes.status, purchasesRes.statusText);
      }
      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json();
        setWarehouses(warehousesData.data || []);
      }
      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        setInventory(inventoryData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalesSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:7000/api/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchData();
        setShowSalesForm(false);
        setEditData(null);
        alert('Sale created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to create sale'}`);
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error creating sale. Please try again.');
    }
  };

  const handlePurchaseSubmit = async (formData) => {
    try {
      console.log('📤 Sending to API:', formData);
      const response = await fetch('http://localhost:7000/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log('📥 API Response:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Purchase created:', result);
        console.log('🔄 Refreshing purchase list...');
        await fetchData();
        console.log('✅ Purchase list refreshed');
        setShowPurchaseForm(false);
        setEditData(null);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        console.error('❌ Error details:', errorData.details || errorData.errors);
        alert('Error creating purchase: ' + (errorData.message || 'Unknown error') + 
          (errorData.details ? '\nDetails: ' + JSON.stringify(errorData.details, null, 2) : ''));
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      alert('Network error: ' + error.message);
    }
  };

  const handleEdit = (item, type) => {
    setEditData(item);
    if (type === 'sale') {
      setShowSalesForm(true);
      setShowPurchaseForm(false);
    } else {
      setShowPurchaseForm(true);
      setShowSalesForm(false);
    }
  };

  const handleView = (item) => {
    setViewData(item);
  };

  const handleStatusUpdate = async (purchaseId, newStatus) => {
    try {
      console.log('🔄 Updating status:', purchaseId, 'to', newStatus);
      
      const response = await fetch(`http://localhost:7000/api/purchases/${purchaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('📥 Status update response:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Status updated successfully:', result);
        await fetchData(); // Refresh the list
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to update status:', errorData);
        alert('Failed to update status: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      alert('Error updating status: ' + error.message);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await fetch(`http://localhost:7000/api/${type}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Sales & Purchase Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Sales & Purchase Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setEditData(null);
                  setShowSalesForm(true);
                  setShowPurchaseForm(false);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <FaPlus className="mr-2" />
                New Sale
              </button>
              <button
                onClick={() => {
                  setEditData(null);
                  setShowPurchaseForm(true);
                  setShowSalesForm(false);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <FaPlus className="mr-2" />
                New Purchase
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('sales')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sales'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaShoppingCart className="inline mr-2" />
                Sales ({sales.length})
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'purchases'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaTruck className="inline mr-2" />
                Purchases ({purchases.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'sales' ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Sales Records</h3>
                  <button
                    onClick={() => {
                      setEditData(null);
                      setShowSalesForm(true);
                      setShowPurchaseForm(false);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FaPlus className="mr-2" />
                    New Sale
                  </button>
                </div>
                
                {sales.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sales records found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sales.map((sale) => (
                          <tr key={sale._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.invoiceNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customer?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs. {sale.totalAmount?.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                sale.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {sale.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(sale, 'sale')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDelete(sale._id, 'sales')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Purchase Records</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={fetchData}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FaTruck className="mr-2" />
                      Refresh
                    </button>
                    <button
                      onClick={() => {
                        setEditData(null);
                        setShowPurchaseForm(true);
                        setShowSalesForm(false);
                      }}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <FaPlus className="mr-2" />
                      New Purchase
                    </button>
                  </div>
                </div>
                
                {purchases.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No purchase records found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {purchases.map((purchase) => (
                          <tr key={purchase._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{purchase.purchaseNumber}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.supplier?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.originalPurchaseType || purchase.purchaseType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Rs. {(() => {
                                const bagsTotal = purchase.bags ? Object.values(purchase.bags).reduce((sum, bag) => sum + (bag.totalPrice || 0), 0) : 0;
                                const foodTotal = purchase.food ? (purchase.food.wheat?.totalPrice || 0) : 0;
                                const total = bagsTotal + foodTotal + (purchase.tax || 0) + (purchase.shippingCost || 0);
                                return total.toFixed(2);
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={purchase.status}
                                onChange={(e) => handleStatusUpdate(purchase._id, e.target.value)}
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${
                                  purchase.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  purchase.status === 'Received' ? 'bg-blue-100 text-blue-800' :
                                  purchase.status === 'In Transit' ? 'bg-purple-100 text-purple-800' :
                                  purchase.status === 'Delivered' ? 'bg-indigo-100 text-indigo-800' :
                                  purchase.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Received">Received</option>
                                <option value="In Transit">In Transit</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(purchase.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleView(purchase)}
                                  className="text-green-600 hover:text-green-900"
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  onClick={() => handleEdit(purchase, 'purchase')}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDelete(purchase._id, 'purchases')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forms */}
      {showSalesForm && (
        <SalesFormEnhanced
          onSubmit={handleSalesSubmit}
          onCancel={() => {
            setShowSalesForm(false);
            setEditData(null);
          }}
          editData={editData}
          warehouses={warehouses}
          inventory={inventory}
        />
      )}

      {showPurchaseForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <PurchaseForm
              onSubmit={handlePurchaseSubmit}
              onCancel={() => {
                setShowPurchaseForm(false);
                setEditData(null);
              }}
              editData={editData}
              warehouses={warehouses}
            />
          </div>
        </div>
      )}

      {viewData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Purchase Details</h2>
              <button
                onClick={() => setViewData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTrash className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Purchase Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Purchase Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Number</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.purchaseNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Type</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.originalPurchaseType || viewData.purchaseType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(viewData.purchaseDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.deliveryDate ? new Date(viewData.deliveryDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      viewData.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      viewData.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {viewData.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      viewData.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                      viewData.paymentStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {viewData.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Supplier Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.supplier?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier Type</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.supplier?.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.supplier?.contact?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.supplier?.contact?.email || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.supplier?.contact?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Warehouse Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Warehouse Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Warehouse Name</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.warehouse?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.warehouse?.location}</p>
                  </div>
                </div>
              </div>

              {/* Items Information */}
              {(viewData.bags || viewData.food) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Items</h3>
                  {viewData.bags && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-800 mb-2">Bags</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(viewData.bags).map(([bagType, bag]) => (
                          bag.quantity > 0 && (
                            <div key={bagType} className="bg-white p-3 rounded border">
                              <div className="font-medium text-gray-900 capitalize">{bagType}</div>
                              <div className="text-sm text-gray-600">Qty: {bag.quantity} {bag.unit}</div>
                              <div className="text-sm text-gray-600">Price: Rs. {bag.unitPrice}</div>
                              <div className="text-sm font-medium text-gray-900">Total: Rs. {bag.totalPrice}</div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  {viewData.food && viewData.food.wheat && viewData.food.wheat.quantity > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-2">Food Items</h4>
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium text-gray-900">Wheat</div>
                        <div className="text-sm text-gray-600">Qty: {viewData.food.wheat.quantity} {viewData.food.wheat.unit}</div>
                        <div className="text-sm text-gray-600">Price: Rs. {viewData.food.wheat.unitPrice}</div>
                        <div className="text-sm font-medium text-gray-900">Total: Rs. {viewData.food.wheat.totalPrice}</div>
                        <div className="text-sm text-gray-600">Source: {viewData.food.wheat.source}</div>
                        <div className="text-sm text-gray-600">Quality: {viewData.food.wheat.quality}</div>
                        <div className="text-sm text-gray-600">Grade: {viewData.food.wheat.grade}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subtotal</label>
                    <p className="mt-1 text-sm text-gray-900">Rs. {viewData.subtotal?.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tax</label>
                    <p className="mt-1 text-sm text-gray-900">Rs. {viewData.tax?.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Shipping Cost</label>
                    <p className="mt-1 text-sm text-gray-900">Rs. {viewData.shippingCost?.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="mt-1 text-sm font-bold text-gray-900">Rs. {viewData.totalAmount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Paid Amount</label>
                    <p className="mt-1 text-sm text-gray-900">Rs. {viewData.paidAmount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Remaining Amount</label>
                    <p className="mt-1 text-sm text-gray-900">Rs. {viewData.remainingAmount?.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="mt-1 text-sm text-gray-900">{viewData.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewData.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
                  <p className="text-sm text-gray-900">{viewData.notes}</p>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setViewData(null)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
