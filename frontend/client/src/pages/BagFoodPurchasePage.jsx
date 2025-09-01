import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingBag, FaIndustry, FaWarehouse, FaPlus, FaEdit, FaTrash,
  FaEye, FaDownload, FaPrint, FaSearch, FaFilter, FaSignOutAlt, FaUserCog,
  FaCalculator, FaChartBar, FaFileInvoice
} from "react-icons/fa";
import { useAuth } from '../hooks/useAuth';
import BagPurchaseForm from '../components/BagFoodPurchase/BagPurchaseForm';
import FoodPurchaseForm from '../components/BagFoodPurchase/FoodPurchaseForm';
import BagPurchaseList from '../components/BagFoodPurchase/BagPurchaseList';
import FoodPurchaseList from '../components/BagFoodPurchase/FoodPurchaseList';
import PurchaseSummary from '../components/BagFoodPurchase/PurchaseSummary';

export default function BagFoodPurchasePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMenu] = useState("Bag & Food Purchase");
  const [activeTab, setActiveTab] = useState("bags");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [bagPurchases, setBagPurchases] = useState([]);
  const [foodPurchases, setFoodPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalBagPurchases: 0,
    totalFoodPurchases: 0,
    totalBagValue: 0,
    totalFoodValue: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    fetchSuppliers();
    fetchBagPurchases();
    fetchFoodPurchases();
    fetchStats();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchBagPurchases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bag-purchases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBagPurchases(data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch bag purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodPurchases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/food-purchases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFoodPurchases(data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch food purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [bagResponse, foodResponse] = await Promise.all([
        fetch('/api/bag-purchases/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/food-purchases/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (bagResponse.ok && foodResponse.ok) {
        const bagStats = await bagResponse.json();
        const foodStats = await foodResponse.json();
        
        setStats({
          totalBagPurchases: bagStats.data?.total || 0,
          totalFoodPurchases: foodStats.data?.total || 0,
          totalBagValue: bagStats.data?.totalValue || 0,
          totalFoodValue: foodStats.data?.totalValue || 0,
          pendingPayments: (bagStats.data?.pendingPayments || 0) + (foodStats.data?.pendingPayments || 0)
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSaveBagPurchase = async (purchaseData) => {
    try {
      const url = editingItem 
        ? `/api/bag-purchases/${editingItem._id}`
        : '/api/bag-purchases';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(purchaseData)
      });

      if (response.ok) {
        await fetchBagPurchases();
        await fetchStats();
        setShowForm(false);
        setEditingItem(null);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save purchase');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleSaveFoodPurchase = async (purchaseData) => {
    try {
      const url = editingItem 
        ? `/api/food-purchases/${editingItem._id}`
        : '/api/food-purchases';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(purchaseData)
      });

      if (response.ok) {
        await fetchFoodPurchases();
        await fetchStats();
        setShowForm(false);
        setEditingItem(null);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save purchase');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item, type) => {
    if (!window.confirm('Are you sure you want to delete this purchase?')) return;

    try {
      const url = type === 'bag' 
        ? `/api/bag-purchases/${item._id}`
        : `/api/food-purchases/${item._id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        if (type === 'bag') {
          await fetchBagPurchases();
        } else {
          await fetchFoodPurchases();
        }
        await fetchStats();
      }
    } catch (err) {
      setError('Failed to delete purchase');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-0"
         style={{ backgroundImage: "url('/dashboard.jpg')" }}>
      {/* Header */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 bg-gray-200 hover:shadow-sm"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
              <button className="px-4 py-2 font-medium rounded-md transition duration-150 bg-blue-100 text-blue-600 border-b-2 border-blue-600 shadow-sm">
                Bag & Food Purchase
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaUserCog className="text-lg" />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 bg-transparent"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Purchase Management</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab("bags")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-transparent ${
                    activeTab === "bags" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaShoppingBag className="mr-3" />
                  Bag Purchases
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("food")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-transparent ${
                    activeTab === "food" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaIndustry className="mr-3" />
                  Food Purchases
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("summary")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-transparent ${
                    activeTab === "summary" ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaChartBar className="mr-3" />
                  Summary & Reports
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaShoppingBag className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bag Purchases</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBagPurchases}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaIndustry className="text-green-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Food Purchases</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFoodPurchases}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FaCalculator className="text-yellow-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bag Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalBagValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaFileInvoice className="text-purple-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Food Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalFoodValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FaWarehouse className="text-red-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.pendingPayments.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab === "bags" ? "Bag Purchase Management" : 
                   activeTab === "food" ? "Food Purchase Management" : 
                   "Purchase Summary & Reports"}
                </h1>
                <p className="text-gray-600">
                  {activeTab === "bags" 
                    ? "Manage ATA, MAIDA, SUJI, and FINE bag purchases" 
                    : activeTab === "food"
                    ? "Manage wheat and other food item purchases"
                    : "View comprehensive purchase analytics and reports"
                  }
                </p>
              </div>
              {activeTab !== "summary" && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Add New {activeTab === "bags" ? "Bag Purchase" : "Food Purchase"}
                </button>
              )}
            </div>

            {/* Content based on active tab */}
            {activeTab === "bags" && (
              <BagPurchaseList
                purchases={bagPurchases}
                loading={loading}
                error={error}
                onEdit={handleEdit}
                onDelete={(item) => handleDelete(item, 'bag')}
              />
            )}
            
            {activeTab === "food" && (
              <FoodPurchaseList
                purchases={foodPurchases}
                loading={loading}
                error={error}
                onEdit={handleEdit}
                onDelete={(item) => handleDelete(item, 'food')}
              />
            )}
            
            {activeTab === "summary" && (
              <PurchaseSummary
                bagPurchases={bagPurchases}
                foodPurchases={foodPurchases}
                stats={stats}
              />
            )}
          </div>
        </main>
      </div>

      {/* Forms */}
      {showForm && activeTab === "bags" && (
        <BagPurchaseForm
          purchase={editingItem}
          suppliers={suppliers}
          onClose={handleFormClose}
          onSave={handleSaveBagPurchase}
        />
      )}
      
      {showForm && activeTab === "food" && (
        <FoodPurchaseForm
          purchase={editingItem}
          suppliers={suppliers}
          onClose={handleFormClose}
          onSave={handleSaveFoodPurchase}
        />
      )}
    </div>
  );
} 