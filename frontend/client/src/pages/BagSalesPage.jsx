import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaPlus, FaEdit, FaTrash, FaEye, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SalesFormEnhanced from '../components/SalesManagement/SalesFormEnhanced';

export default function BagSalesPage() {
    const { user, rolePermissions } = useAuth();
    const navigate = useNavigate();
    const [showSalesForm, setShowSalesForm] = useState(false);
    const [editData, setEditData] = useState(null);
    const [sales, setSales] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            console.log('🔄 Fetching data for Bag Sales...');
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [salesRes, warehousesRes, productsRes] = await Promise.all([
                fetch('http://localhost:7000/api/sales', { headers }),
                fetch('http://localhost:7000/api/warehouses', { headers }),
                fetch('http://localhost:7000/api/products?status=Active&limit=1000', { headers })
            ]);

            if (salesRes.ok) {
                const salesData = await salesRes.json();
                // In a real scenario, we might want to filter sales by type if the backend supports it
                setSales(salesData.data || []);
            }
            if (warehousesRes.ok) {
                const warehousesData = await warehousesRes.json();
                setWarehouses(warehousesData.data || []);
            }
            if (productsRes.ok) {
                const productsData = await productsRes.json();
                // Filter for Bag/Packaging related products only
                const allProducts = productsData.data || [];
                const bagProducts = allProducts.filter(p =>
                    p.name.toLowerCase().includes('bag') ||
                    p.name.toLowerCase().includes('flour') ||
                    p.name.toLowerCase().includes('maida') ||
                    p.name.toLowerCase().includes('suji') ||
                    p.name.toLowerCase().includes('fine') ||
                    p.name.toLowerCase().includes('chakki') ||
                    p.category === 'Packaging Materials' ||
                    p.category === 'Finished Goods'
                );
                console.log(`✅ Filtered ${bagProducts.length} bag products from ${allProducts.length} total products`);
                setProducts(bagProducts.length > 0 ? bagProducts : allProducts);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSalesSubmit = async (formData, printAction = null) => {
        try {
            const token = localStorage.getItem('token');
            const isEditing = !!editData;
            const url = isEditing
                ? `http://localhost:7000/api/sales/${editData._id}`
                : 'http://localhost:7000/api/sales';
            const method = isEditing ? 'PUT' : 'POST';

            // Add printAction to request if provided
            const requestData = printAction ? { ...formData, printAction } : formData;

            console.log(`📤 ${isEditing ? 'Updating' : 'Creating'} sale:`, requestData);

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                await fetchData();
                setShowSalesForm(false);
                setEditData(null);

                // Return result for print handling
                if (printAction) {
                    return result;
                }

                alert(isEditing ? 'Sale updated successfully!' : 'Sale created successfully!');
                return result;
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || `Failed to ${isEditing ? 'update' : 'create'} sale`}`);
                throw new Error(errorData.message || 'Failed to create sale');
            }
        } catch (error) {
            console.error(`Error ${editData ? 'updating' : 'creating'} sale:`, error);
            alert(`Error ${editData ? 'updating' : 'creating'} sale. Please try again.`);
            throw error;
        }
    };

    const handleEdit = (item) => {
        setEditData(item);
        setShowSalesForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this sale?')) return;

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
                alert('Sale deleted successfully!');
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Bag Sales Management...</p>
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
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
                            >
                                <FaArrowLeft className="mr-2" />
                                Back
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">Bag Sales Management</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => {
                                    setEditData(null);
                                    setShowSalesForm(true);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <FaPlus className="mr-2" />
                                New Bag Sale
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Sales Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">Bag Sales Records ({sales.length})</h3>
                            <button
                                onClick={() => {
                                    setEditData(null);
                                    setShowSalesForm(true);
                                }}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <FaPlus className="mr-2" />
                                New Bag Sale
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {sales.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No bag sales records found. Create your first sale above.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sales.map((sale) => (
                                            <tr key={sale._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {sale.invoiceNumber || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {sale.customer?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {sale.warehouse?.name || sale.warehouse || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {sale.items?.length || 0} items
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    Rs. {sale.totalAmount?.toFixed(2) || '0.00'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${sale.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {sale.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(sale.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => navigate(`/sales/${sale._id}`)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="View Details"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(sale)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="Edit"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(sale._id)}
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
                </div>
            </div>

            {/* Sales Form Modal */}
            {showSalesForm && (
                <SalesFormEnhanced
                    onSubmit={handleSalesSubmit}
                    onCancel={() => {
                        setShowSalesForm(false);
                        setEditData(null);
                    }}
                    editData={editData}
                    warehouses={warehouses}
                    products={products}
                />
            )}
        </div>
    );
}
