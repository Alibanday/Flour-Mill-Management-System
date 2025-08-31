import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, FaUsers, FaExclamationTriangle, FaChartBar, FaSearch, 
  FaFilter, FaDownload, FaPrint, FaEye, FaEdit, FaTrash, FaSignOutAlt, 
  FaUserCog, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCreditCard, FaBuilding,
  FaSave, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

export default function SupplierManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    supplierCode: '',
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan',
    },
    businessType: 'Raw Materials',
    taxNumber: '',
    creditLimit: 0,
    paymentTerms: '30 Days',
    status: 'Active',
    rating: 3,
    notes: '',
    warehouse: '',
  });

  const canManageSuppliers = user?.role === 'Admin' || user?.role === 'Manager';

  useEffect(() => {
    fetchSuppliers();
    fetchWarehouses();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }

      const data = await response.json();
      setSuppliers(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleAddNew = () => {
    setEditingSupplier(null);
    setFormData({
      supplierCode: '',
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Pakistan',
      },
      businessType: 'Raw Materials',
      taxNumber: '',
      creditLimit: 0,
      paymentTerms: '30 Days',
      status: 'Active',
      rating: 3,
      notes: '',
      warehouse: '',
    });
    setShowForm(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      supplierCode: supplier.supplierCode || '',
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: {
        street: supplier.address?.street || '',
        city: supplier.address?.city || '',
        state: supplier.address?.state || '',
        postalCode: supplier.address?.postalCode || '',
        country: supplier.address?.country || 'Pakistan',
      },
      businessType: supplier.businessType || 'Raw Materials',
      taxNumber: supplier.taxNumber || '',
      creditLimit: supplier.creditLimit || 0,
      paymentTerms: supplier.paymentTerms || '30 Days',
      status: supplier.status || 'Active',
      rating: supplier.rating || 3,
      notes: supplier.notes || '',
      warehouse: supplier.warehouse?._id || supplier.warehouse || '',
    });
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingSupplier 
        ? `/api/suppliers/${editingSupplier._id}`
        : '/api/suppliers';
      
      const method = editingSupplier ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save supplier');
      }

      const data = await response.json();
      
      if (editingSupplier) {
        setSuppliers(prev => prev.map(s => 
          s._id === editingSupplier._id ? data.data : s
        ));
      } else {
        setSuppliers(prev => [data.data, ...prev]);
      }

      setShowForm(false);
      setEditingSupplier(null);
      setFormData({
        supplierCode: '',
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Pakistan',
        },
        businessType: 'Raw Materials',
        taxNumber: '',
        creditLimit: 0,
        paymentTerms: '30 Days',
        status: 'Active',
        rating: 3,
        notes: '',
        warehouse: '',
      });
    } catch (err) {
      alert('Error saving supplier: ' + err.message);
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setSuppliers(prev => prev.filter(s => s._id !== supplierId));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete supplier');
      }
    } catch (err) {
      alert('Error deleting supplier: ' + err.message);
    }
  };

  const handleStatusChange = async (supplierId, newStatus) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSuppliers(prev => prev.map(supplier =>
          supplier._id === supplierId ? { ...supplier, status: newStatus } : supplier
        ));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    const matchesBusinessType = businessTypeFilter === 'all' || supplier.businessType === businessTypeFilter;
    
    return matchesSearch && matchesStatus && matchesBusinessType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBusinessTypeColor = (type) => {
    switch (type) {
      case 'Raw Materials': return 'bg-blue-100 text-blue-800';
      case 'Packaging': return 'bg-purple-100 text-purple-800';
      case 'Equipment': return 'bg-yellow-100 text-yellow-800';
      case 'Services': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutstandingColor = (amount, limit) => {
    if (limit > 0 && amount > limit) {
      return 'text-red-600 font-semibold';
    } else if (amount > 0) {
      return 'text-orange-600 font-semibold';
    }
    return 'text-green-600';
  };

  const totalOutstanding = suppliers.reduce((sum, supplier) => sum + (supplier.outstandingBalance || 0), 0);
  const activeSuppliers = suppliers.filter(s => s.status === 'Active').length;
  const suppliersWithOutstanding = suppliers.filter(s => (s.outstandingBalance || 0) > 0).length;

  return (
    <div 
      className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-0"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}
    >
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 !bg-gray-200 hover:shadow-sm"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
              <button className="px-4 py-2 font-medium rounded-md transition duration-150 !bg-blue-100 text-blue-600 border-b-2 border-blue-600 shadow-sm">
                Supplier Management
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full !bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaUserCog className="text-lg" />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 !bg-transparent"
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Supplier Management</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${
                    activeTab === 'list' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaUsers className="mr-3" />
                  Suppliers List
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('outstanding')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${
                    activeTab === 'outstanding' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaExclamationTriangle className="mr-3" />
                  Outstanding Balances
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors !bg-transparent ${
                    activeTab === 'analytics' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaChartBar className="mr-3" />
                  Analytics
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Supplier & Vendor Management</h1>
                <p className="text-gray-600">Manage vendor records, contact information, addresses, and track outstanding balances</p>
              </div>
              {canManageSuppliers && (
                <button
                  onClick={handleAddNew}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Add New Supplier
                </button>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <FaUsers className="text-blue-600 text-2xl mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-blue-900">{suppliers.length}</div>
                    <div className="text-sm text-blue-600">Total Suppliers</div>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center">
                  <FaUsers className="text-green-600 text-2xl mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-green-900">{activeSuppliers}</div>
                    <div className="text-sm text-green-600">Active Suppliers</div>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-orange-600 text-2xl mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-orange-900">{suppliersWithOutstanding}</div>
                    <div className="text-sm text-orange-600">With Outstanding</div>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center">
                  <FaCreditCard className="text-red-600 text-2xl mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-red-900">Rs. {totalOutstanding.toLocaleString()}</div>
                    <div className="text-sm text-red-600">Total Outstanding</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'list' && (
              <div>
                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search suppliers by name, code, contact person, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                    <select
                      value={businessTypeFilter}
                      onChange={(e) => setBusinessTypeFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Business Types</option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Services">Services</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Suppliers Table */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading suppliers...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-red-600">Error: {error}</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Details</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Information</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredSuppliers.map((supplier) => (
                          <tr key={supplier._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                                <div className="text-sm text-gray-500">Code: {supplier.supplierCode}</div>
                                <div className="text-sm text-gray-500">{supplier.businessType}</div>
                                <div className="text-sm text-gray-500">{supplier.warehouse?.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{supplier.contactPerson}</div>
                                <div className="text-gray-500">{supplier.email}</div>
                                <div className="text-gray-500">{supplier.phone}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">
                                <div>{supplier.address?.street}</div>
                                <div>{supplier.address?.city}, {supplier.address?.state}</div>
                                <div>{supplier.address?.postalCode}, {supplier.address?.country}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  Credit Limit: Rs. {supplier.creditLimit?.toLocaleString()}
                                </div>
                                <div className={`font-medium ${getOutstandingColor(supplier.outstandingBalance, supplier.creditLimit)}`}>
                                  Outstanding: Rs. {supplier.outstandingBalance?.toLocaleString() || '0'}
                                </div>
                                <div className="text-gray-500">{supplier.paymentTerms}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col space-y-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                                  {supplier.status}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBusinessTypeColor(supplier.businessType)}`}>
                                  {supplier.businessType}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(supplier)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit Supplier"
                                >
                                  <FaEdit />
                                </button>
                                {canManageSuppliers && (
                                  <select
                                    value={supplier.status}
                                    onChange={(e) => handleStatusChange(supplier._id, e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1"
                                  >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Suspended">Suspended</option>
                                  </select>
                                )}
                                {user?.role === 'Admin' && (
                                  <button
                                    onClick={() => handleDelete(supplier._id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete Supplier"
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredSuppliers.length === 0 && (
                  <div className="text-center py-12">
                    <FaUsers className="mx-auto text-6xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
                    <p className="text-gray-500">
                      {searchTerm || statusFilter !== 'all' || businessTypeFilter !== 'all'
                        ? "Try adjusting your search or filters"
                        : "Get started by adding your first supplier"
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'outstanding' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Outstanding Balances</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-900">Rs. {totalOutstanding.toLocaleString()}</div>
                    <div className="text-sm text-red-600">Total Outstanding</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="text-2xl font-bold text-orange-900">{suppliersWithOutstanding}</div>
                    <div className="text-sm text-orange-600">Suppliers with Outstanding</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-900">
                      {suppliers.filter(s => s.creditLimit > 0 && s.outstandingBalance > s.creditLimit).length}
                    </div>
                    <div className="text-sm text-yellow-600">Over Credit Limit</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {suppliers
                        .filter(s => (s.outstandingBalance || 0) > 0)
                        .sort((a, b) => (b.outstandingBalance || 0) - (a.outstandingBalance || 0))
                        .map((supplier) => (
                          <tr key={supplier._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                                <div className="text-sm text-gray-500">{supplier.contactPerson}</div>
                                <div className="text-sm text-gray-500">{supplier.phone}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                Rs. {supplier.creditLimit?.toLocaleString() || '0'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`text-sm font-medium ${getOutstandingColor(supplier.outstandingBalance, supplier.creditLimit)}`}>
                                Rs. {supplier.outstandingBalance?.toLocaleString() || '0'}
                              </div>
                              {supplier.creditLimit > 0 && (
                                <div className="text-xs text-gray-500">
                                  {((supplier.outstandingBalance / supplier.creditLimit) * 100).toFixed(1)}% of limit
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                                {supplier.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(supplier)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit Supplier"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => navigate(`/financial?supplier=${supplier._id}`)}
                                  className="text-green-600 hover:text-green-900"
                                  title="View Financial Details"
                                >
                                  <FaEye />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Supplier Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-medium mb-4">Business Type Distribution</h3>
                    <div className="space-y-3">
                      {['Raw Materials', 'Packaging', 'Equipment', 'Services', 'Other'].map(type => {
                        const count = suppliers.filter(s => s.businessType === type).length;
                        const percentage = suppliers.length > 0 ? ((count / suppliers.length) * 100).toFixed(1) : 0;
                        return (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{type}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-medium mb-4">Status Distribution</h3>
                    <div className="space-y-3">
                      {['Active', 'Inactive', 'Suspended'].map(status => {
                        const count = suppliers.filter(s => s.status === status).length;
                        const percentage = suppliers.length > 0 ? ((count / suppliers.length) * 100).toFixed(1) : 0;
                        return (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{status}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${status === 'Active' ? 'bg-green-600' : status === 'Inactive' ? 'bg-gray-600' : 'bg-red-600'}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Code *</label>
                  <input
                    type="text"
                    name="supplierCode"
                    value={formData.supplierCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter supplier code"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter supplier name"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter contact person name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                  <select 
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Services">Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter street address"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter state"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter postal code"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                  <input
                    type="number"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter credit limit"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <select 
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                    <option value="60 Days">60 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <FaSave className="mr-2" />
                  {editingSupplier ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
