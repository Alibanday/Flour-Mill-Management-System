import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaTruck, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import SalesForm from '../components/SalesManagement/SalesForm';
import PurchaseForm from '../components/SalesManagement/PurchaseForm';

export default function SalesPurchasePage() {
  const { user, rolePermissions } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [showSalesForm, setShowSalesForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, purchasesRes, warehousesRes, inventoryRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/purchases'),
        fetch('/api/warehouses'),
        fetch('/api/inventory')
      ]);

      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData.data || []);
      }
      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json();
        setPurchases(purchasesData.data || []);
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
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchData();
        setShowSalesForm(false);
        setEditData(null);
      }
    } catch (error) {
      console.error('Error creating sale:', error);
    }
  };

  const handlePurchaseSubmit = async (formData) => {
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchData();
        setShowPurchaseForm(false);
        setEditData(null);
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
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

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      const response = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customerName}</td>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.purchaseType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Rs. {(() => {
                                const bagsTotal = purchase.bags ? Object.values(purchase.bags).reduce((sum, bag) => sum + (bag.totalPrice || 0), 0) : 0;
                                const foodTotal = purchase.food ? (purchase.food.wheat?.totalPrice || 0) : 0;
                                const total = bagsTotal + foodTotal + (purchase.tax || 0) + (purchase.shippingCost || 0);
                                return total.toFixed(2);
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                purchase.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                purchase.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {purchase.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(purchase.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(purchase, 'purchase')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDelete(purchase._id, 'purchases')}
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
            )}
          </div>
        </div>
      </div>

      {/* Forms */}
      {showSalesForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <SalesForm
              onSubmit={handleSalesSubmit}
              onCancel={() => {
                setShowSalesForm(false);
                setEditData(null);
              }}
              editData={editData}
              warehouses={warehouses}
              inventory={inventory}
            />
          </div>
        </div>
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
    </div>
  );
}
