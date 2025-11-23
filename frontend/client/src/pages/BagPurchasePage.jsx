import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaShoppingBag, FaPlus, FaSignOutAlt, FaUserCog,
    FaCalculator, FaWarehouse
} from "react-icons/fa";
import { useAuth } from '../hooks/useAuth';
import BagPurchaseForm from '../components/BagFoodPurchase/BagPurchaseForm';
import BagPurchaseList from '../components/BagFoodPurchase/BagPurchaseList';
import BagPurchaseDetail from '../components/BagFoodPurchase/BagPurchaseDetail';

export default function BagPurchasePage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);
    const [bagPurchases, setBagPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalBagPurchases: 0,
        totalBagValue: 0,
        pendingPayments: 0
    });

    useEffect(() => {
        fetchSuppliers();
        fetchBagPurchases();
        fetchStats();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch('http://localhost:7000/api/suppliers', {
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
            const response = await fetch('http://localhost:7000/api/bag-purchases', {
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

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:7000/api/bag-purchases/stats', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const bagStats = await response.json();
                setStats({
                    totalBagPurchases: bagStats.data?.total || 0,
                    totalBagValue: bagStats.data?.totalValue || 0,
                    pendingPayments: bagStats.data?.pendingPayments || 0
                });
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleSaveBagPurchase = async (purchaseData) => {
        try {
            const url = editingItem
                ? `http://localhost:7000/api/bag-purchases/${editingItem._id}`
                : 'http://localhost:7000/api/bag-purchases';

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
                const result = await response.json();
                await fetchBagPurchases();
                await fetchStats();
                setShowForm(false);
                setEditingItem(null);
                return result.data || result;
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save purchase');
            }
        } catch (err) {
            console.error('Error saving bag purchase:', err);
            throw err;
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowForm(true);
    };

    const handleDelete = async (item) => {
        if (!window.confirm('Are you sure you want to delete this purchase?')) return;

        try {
            const response = await fetch(`http://localhost:7000/api/bag-purchases/${item._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                setBagPurchases(prev => prev.filter(p => p._id !== item._id));
                await fetchStats();
            } else {
                const errJson = await response.json().catch(() => null);
                const msg = errJson?.message || 'Failed to delete purchase';
                setError(msg);
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
                                Bag Purchase
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
                {/* Main Content */}
                <main className="flex-1 p-6 w-full">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FaShoppingBag className="text-blue-600 text-xl" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Bag Purchases</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalBagPurchases}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 overflow-hidden">
                            <div className="flex items-start">
                                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                                    <FaCalculator className="text-yellow-600 text-xl" />
                                </div>
                                <div className="ml-4 flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                                    <p className="text-2xl font-bold text-gray-900 break-words leading-tight">Rs. {(stats.totalBagValue || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 overflow-hidden">
                            <div className="flex items-start">
                                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                                    <FaWarehouse className="text-red-600 text-xl" />
                                </div>
                                <div className="ml-4 flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Pending Payments</p>
                                    <p className="text-2xl font-bold text-gray-900 break-words leading-tight">Rs. {(stats.pendingPayments || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Bag Purchase Management</h1>
                                <p className="text-gray-600">Manage ATA, MAIDA, SUJI, and FINE bag purchases</p>
                            </div>
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                                <FaPlus className="mr-2" />
                                Add New Bag Purchase
                            </button>
                        </div>

                        <BagPurchaseList
                            purchases={bagPurchases}
                            loading={loading}
                            error={error}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onView={(item) => setViewingItem(item)}
                            suppliers={suppliers}
                        />
                    </div>
                </main>
            </div>

            {/* Detail View */}
            {viewingItem && (
                <BagPurchaseDetail
                    purchase={viewingItem}
                    onClose={() => setViewingItem(null)}
                    onEdit={(purchase) => {
                        setViewingItem(null);
                        setEditingItem(purchase);
                        setShowForm(true);
                    }}
                    onDelete={(purchase) => {
                        if (window.confirm('Are you sure you want to delete this purchase?')) {
                            handleDelete(purchase);
                            setViewingItem(null);
                        }
                    }}
                />
            )}

            {/* Form */}
            {showForm && (
                <BagPurchaseForm
                    purchase={editingItem}
                    suppliers={suppliers}
                    onClose={handleFormClose}
                    onSave={handleSaveBagPurchase}
                />
            )}
        </div>
    );
}
