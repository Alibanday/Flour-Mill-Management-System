import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaPlus, FaEdit, FaTrash, FaEye, FaArrowLeft, FaSearch, FaFilter, FaChartLine, FaMoneyBillWave, FaReceipt, FaClock, FaSpinner, FaCog, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import WheatSalesForm from '../components/SalesManagement/WheatSalesForm';

export default function WheatSalesPage() {
    const { user, rolePermissions } = useAuth();
    const navigate = useNavigate();
    const [showSalesForm, setShowSalesForm] = useState(false);
    const [editData, setEditData] = useState(null);
    const [sales, setSales] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterWarehouse, setFilterWarehouse] = useState('all');
    const [filterDate, setFilterDate] = useState('');
    const [wheatProduct, setWheatProduct] = useState(null);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [catalogError, setCatalogError] = useState('');
    const [showCatalogModal, setShowCatalogModal] = useState(false);

    useEffect(() => {
        fetchData();
        fetchWheatProduct();
    }, []);

    const fetchData = async () => {
        try {
            console.log('🔄 Fetching data for Wheat Sales...');
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [salesRes, warehousesRes] = await Promise.all([
                fetch('http://localhost:7000/api/sales', { headers }),
                fetch('http://localhost:7000/api/warehouses', { headers })
            ]);

            if (salesRes.ok) {
                const salesData = await salesRes.json();
                // Filter for wheat sales only - sales where items contain wheat
                const allSales = salesData.data || [];
                const wheatSales = allSales.filter(sale => {
                    if (!sale.items || sale.items.length === 0) return false;
                    return sale.items.some(item => {
                        const productName = item.productName?.toLowerCase() || '';
                        return productName.includes('wheat') || productName.includes('grain');
                    });
                });
                console.log(`✅ Filtered ${wheatSales.length} wheat sales from ${allSales.length} total sales`);
                setSales(wheatSales);
            }
            if (warehousesRes.ok) {
                const warehousesData = await warehousesRes.json();
                setWarehouses(warehousesData.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWheatProduct = async () => {
        try {
            setCatalogLoading(true);
            setCatalogError('');
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                limit: 50,
                category: 'Raw Materials',
                search: 'wheat'
            });
            const response = await fetch(`http://localhost:7000/api/products?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const productsList = data.data || [];
                const wheatItem = productsList.find(product => {
                    const name = product.name?.toLowerCase() || '';
                    return name.includes('wheat') || name.includes('grain');
                });
                if (wheatItem) {
                    const normalizedPrice = wheatItem.price || wheatItem.weightVariants?.[0]?.price || 0;
                    setWheatProduct({
                        ...wheatItem,
                        price: normalizedPrice
                    });
                } else {
                    setWheatProduct(null);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                setCatalogError(errorData.message || 'Failed to fetch wheat catalog');
                setWheatProduct(null);
            }
        } catch (error) {
            console.error('Error fetching wheat catalog:', error);
            setCatalogError('Error fetching wheat catalog');
            setWheatProduct(null);
        } finally {
            setCatalogLoading(false);
        }
    };

    // Calculate statistics
    const calculateStats = () => {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = sales.filter(sale => {
            const saleDate = new Date(sale.createdAt || sale.saleDate).toISOString().split('T')[0];
            return saleDate === today;
        });
        
        const totalSales = sales.length;
        const todayCount = todaySales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        const pendingSales = sales.filter(sale => sale.status === 'Pending' || sale.status === 'pending' || sale.paymentStatus === 'Pending' || sale.paymentStatus === 'Unpaid').length;
        const completedSales = sales.filter(sale => sale.status === 'Completed' || sale.status === 'completed' || sale.paymentStatus === 'Paid').length;

        return {
            totalSales,
            todayCount,
            totalRevenue,
            todayRevenue,
            pendingSales,
            completedSales
        };
    };

    const stats = calculateStats();

    // Filter sales
    const filteredSales = sales.filter(sale => {
        const matchesSearch = !searchTerm || 
            sale.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || 
            (sale.status?.toLowerCase() === filterStatus.toLowerCase()) ||
            (sale.paymentStatus?.toLowerCase() === filterStatus.toLowerCase());

        const matchesWarehouse = filterWarehouse === 'all' || 
            (sale.warehouse?._id === filterWarehouse || sale.warehouse === filterWarehouse);

        const matchesDate = !filterDate || 
            new Date(sale.createdAt || sale.saleDate).toISOString().split('T')[0] === filterDate;

        return matchesSearch && matchesStatus && matchesWarehouse && matchesDate;
    });

    const formatCurrency = (amount) => {
        const value = Number(amount) || 0;
        return `Rs. ${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'completed' || statusLower === 'paid') {
            return 'bg-green-100 text-green-800 border border-green-200';
        } else if (statusLower === 'pending' || statusLower === 'unpaid') {
            return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        } else if (statusLower === 'cancelled' || statusLower === 'failed') {
            return 'bg-red-100 text-red-800 border border-red-200';
        }
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    };

    const wheatPriceDisplay = wheatProduct?.price ? formatCurrency(wheatProduct.price) : 'Not set';

    const handleSalesSubmit = async (formData) => {
        try {
            const token = localStorage.getItem('token');
            const isEditing = !!editData;
            const url = isEditing
                ? `http://localhost:7000/api/sales/${editData._id}`
                : 'http://localhost:7000/api/sales';
            const method = isEditing ? 'PUT' : 'POST';

            console.log(`📤 ${isEditing ? 'Updating' : 'Creating'} wheat sale:`, formData);

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                await fetchData();
                setShowSalesForm(false);
                setEditData(null);

                alert(isEditing ? 'Wheat sale updated successfully!' : 'Wheat sale created successfully!');
                return result;
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || `Failed to ${isEditing ? 'update' : 'create'} sale`}`);
                throw new Error(errorData.message || 'Failed to create sale');
            }
        } catch (error) {
            console.error(`Error ${editData ? 'updating' : 'creating'} wheat sale:`, error);
            alert(`Error ${editData ? 'updating' : 'creating'} sale. Please try again.`);
            throw error;
        }
    };

    const handleEdit = (item) => {
        setEditData(item);
        setShowSalesForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this wheat sale?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:7000/api/sales/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                await fetchData();
                alert('Wheat sale deleted successfully!');
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || 'Failed to delete sale'}`);
            }
        } catch (error) {
            console.error('Error deleting sale:', error);
            alert('Error deleting sale. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading Wheat Sales Management...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4 gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="inline-flex items-center px-4 py-2 h-10 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap flex-shrink-0"
                            >
                                <FaArrowLeft className="mr-2" />
                                Back to Dashboard
                            </button>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold text-gray-900 leading-none">Wheat Sales Management</h1>
                                <p className="text-sm text-gray-600 mt-1 leading-tight">Manage and track all wheat sales transactions</p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditData(null);
                                    setShowSalesForm(true);
                                }}
                                className="inline-flex items-center px-5 py-2.5 h-10 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all whitespace-nowrap flex-shrink-0"
                            >
                                <FaPlus className="mr-2" />
                                New Wheat Sale
                            </button>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                            <div className="bg-white border border-blue-100 rounded-lg shadow-sm p-3 w-[200px]">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 leading-none">Wheat Catalog</p>
                                        {catalogLoading ? (
                                            <div className="flex items-center text-blue-600">
                                                <FaSpinner className="animate-spin mr-1 text-xs" />
                                                <span className="text-xs leading-none">Loading...</span>
                                            </div>
                                        ) : wheatProduct ? (
                                            <p className="text-base font-bold text-gray-900 leading-none mt-0.5">
                                                {wheatPriceDisplay} <span className="text-xs text-gray-500 font-normal">/ kg</span>
                                            </p>
                                        ) : (
                                            <p className="text-xs text-red-600 font-medium leading-none mt-0.5">No wheat item</p>
                                        )}
                                    </div>
                                    <FaCog className="text-gray-400 text-sm ml-2 flex-shrink-0" />
                                </div>
                                {catalogError && (
                                    <p className="text-xs text-red-600 mb-1.5 line-clamp-1 leading-tight">{catalogError}</p>
                                )}
                                {!catalogError && !wheatProduct && (
                                    <p className="text-xs text-gray-500 mb-1.5 line-clamp-1 leading-tight">Add Wheat with price</p>
                                )}
                                <button
                                    onClick={() => setShowCatalogModal(true)}
                                    className="w-full px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors flex items-center justify-center leading-tight"
                                >
                                    <FaCog className="mr-1.5 text-xs" />
                                    Manage Catalog
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Total Sales</p>
                                <p className="text-3xl font-bold">{stats.totalSales}</p>
                                <p className="text-blue-100 text-xs mt-2">All time records</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <FaReceipt className="text-3xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium mb-1">Today's Sales</p>
                                <p className="text-3xl font-bold">{stats.todayCount}</p>
                                <p className="text-green-100 text-xs mt-2">{formatCurrency(stats.todayRevenue)}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <FaClock className="text-3xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium mb-1">Total Revenue</p>
                                <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                                <p className="text-purple-100 text-xs mt-2">All transactions</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <FaMoneyBillWave className="text-3xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm font-medium mb-1">Completed</p>
                                <p className="text-3xl font-bold">{stats.completedSales}</p>
                                <p className="text-orange-100 text-xs mt-2">{stats.pendingSales} pending</p>
                            </div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4">
                                <FaChartLine className="text-3xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <FaFilter className="mr-2 text-gray-500" />
                            Filters & Search
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by invoice, customer..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={filterWarehouse}
                                onChange={(e) => setFilterWarehouse(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="all">All Warehouses</option>
                                {warehouses.map(wh => (
                                    <option key={wh._id} value={wh._id}>{wh.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    {(searchTerm || filterStatus !== 'all' || filterWarehouse !== 'all' || filterDate) && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterStatus('all');
                                    setFilterWarehouse('all');
                                    setFilterDate('');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Sales Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Wheat Sales Records</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Showing {filteredSales.length} of {sales.length} sales
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {filteredSales.length === 0 ? (
                            <div className="text-center py-16">
                                <FaShoppingCart className="text-gray-300 text-6xl mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
                                <p className="text-gray-500 mb-6">
                                    {sales.length === 0 
                                        ? 'Get started by creating your first wheat sale'
                                        : 'Try adjusting your filters to see more results'
                                    }
                                </p>
                                {sales.length === 0 && (
                                    <button
                                        onClick={() => {
                                            setEditData(null);
                                            setShowSalesForm(true);
                                        }}
                                        className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <FaPlus className="mr-2" />
                                        Create First Sale
                                    </button>
                                )}
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Invoice #
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Warehouse
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Quantity (kg)
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSales.map((sale) => {
                                        const wheatItem = sale.items?.find(item => 
                                            item.productName?.toLowerCase().includes('wheat') || 
                                            item.productName?.toLowerCase().includes('grain')
                                        ) || sale.items?.[0];
                                        return (
                                            <tr key={sale._id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                            <FaReceipt className="text-blue-600" />
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {sale.invoiceNumber || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {sale.customer?.name || 
                                                         (sale.customer?.firstName && sale.customer?.lastName 
                                                            ? `${sale.customer.firstName} ${sale.customer.lastName}`
                                                            : 'Walk-in Customer')}
                                                    </div>
                                                    {sale.customer?.phone && (
                                                        <div className="text-sm text-gray-500">{sale.customer.phone}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {sale.warehouse?.name || sale.warehouse || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="flex items-center">
                                                        <FaShoppingCart className="text-gray-400 mr-2" />
                                                        {wheatItem ? `${wheatItem.quantity} ${wheatItem.unit || 'kg'}` : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {formatCurrency(sale.totalAmount || 0)}
                                                    </div>
                                                    {sale.paymentMethod && (
                                                        <div className="text-xs text-gray-500">
                                                            {sale.paymentMethod}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status || sale.paymentStatus)}`}>
                                                        {sale.status || sale.paymentStatus || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <div>
                                                        {new Date(sale.createdAt || sale.saleDate).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(sale.createdAt || sale.saleDate).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center space-x-3">
                                                        <button
                                                            onClick={() => navigate(`/sales/${sale._id}`)}
                                                            className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(sale)}
                                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                            title="Edit Sale"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(sale._id)}
                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                            title="Delete Sale"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Sales Form Modal */}
            {showSalesForm && (
                <WheatSalesForm
                    onSubmit={handleSalesSubmit}
                    onCancel={() => {
                        setShowSalesForm(false);
                        setEditData(null);
                    }}
                    editData={editData}
                    warehouses={warehouses}
                    wheatProduct={wheatProduct}
                />
            )}

            {showCatalogModal && (
                <WheatCatalogModal
                    product={wheatProduct}
                    onClose={() => setShowCatalogModal(false)}
                    onSuccess={async () => {
                        await fetchWheatProduct();
                    }}
                />
            )}
        </div>
    );
}

function WheatCatalogModal({ product, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: product?.name || 'Wheat Grain',
        subcategory: product?.subcategory || 'Wheat Grain',
        pricePerKg: product?.price || product?.weightVariants?.[0]?.price || '',
        minimumStock: product?.minimumStock || 100,
        description: product?.description || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.pricePerKg || parseFloat(formData.pricePerKg) <= 0) {
            setError('Price per kg must be greater than 0');
            return;
        }

        setIsSaving(true);
        setError('');

        const priceValue = parseFloat(formData.pricePerKg);
        const payload = {
            name: formData.name.trim() || 'Wheat Grain',
            category: 'Raw Materials',
            subcategory: formData.subcategory.trim() || 'Wheat Grain',
            description: formData.description,
            unit: 'kg',
            weightVariants: [{
                weight: 1,
                price: priceValue,
                unit: 'kg',
                isActive: true
            }],
            price: priceValue,
            weight: 1,
            minimumStock: parseFloat(formData.minimumStock) || 0,
            status: 'Active'
        };

        try {
            const token = localStorage.getItem('token');
            const url = product
                ? `http://localhost:7000/api/products/${product._id}`
                : 'http://localhost:7000/api/products';
            const method = product ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await onSuccess();
                onClose();
                alert(product ? 'Wheat catalog updated successfully!' : 'Wheat catalog item created!');
            } else {
                setError(data.message || 'Failed to save wheat catalog');
            }
        } catch (err) {
            console.error('Error saving wheat catalog:', err);
            setError(err.message || 'Error saving wheat catalog');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Wheat Catalog</h3>
                        <p className="text-sm text-gray-500">{product ? 'Update existing wheat item' : 'Create wheat catalog entry'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FaTimes className="text-xl" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                        <input
                            type="text"
                            name="subcategory"
                            value={formData.subcategory}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price per kg (Rs.)</label>
                            <input
                                type="number"
                                name="pricePerKg"
                                value={formData.pricePerKg}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Alert (kg)</label>
                            <input
                                type="number"
                                name="minimumStock"
                                value={formData.minimumStock}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Optional details about wheat quality, supplier, etc."
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                        >
                            {isSaving ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave className="mr-2" />
                                    {product ? 'Update Catalog' : 'Add Wheat'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
