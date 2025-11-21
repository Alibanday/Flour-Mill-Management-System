import React, { useState, useEffect, useCallback } from 'react';
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
  const [activeTab, setActiveTab] = useState('government');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState('all');
  const [warehouses, setWarehouses] = useState([]);
  const [supplierOutstandingBalances, setSupplierOutstandingBalances] = useState({});
  const [loadingOutstanding, setLoadingOutstanding] = useState(false);
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
    supplierType: 'Private',
    taxNumber: '',
    status: 'Active',
    rating: 3,
    notes: '',
  });

  const canManageSuppliers = user?.role === 'Admin' || user?.role === 'Manager';

  useEffect(() => {
    fetchSuppliers();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const calculateOutstandingBalances = async () => {
      if (suppliers.length === 0 || activeTab !== 'outstanding') return;
      
      try {
        setLoadingOutstanding(true);
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const balances = {};

        // Fetch all purchases, bag purchases, and food purchases
        const [purchasesRes, bagPurchasesRes, foodPurchasesRes] = await Promise.all([
          fetch('http://localhost:7000/api/purchases?limit=10000', { headers }),
          fetch('http://localhost:7000/api/bag-purchases?limit=10000', { headers }),
          fetch('http://localhost:7000/api/food-purchases?limit=10000', { headers })
        ]);

        let allPurchases = [];
        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json();
          allPurchases = purchasesData.data || purchasesData.purchases || [];
        }

        let allBagPurchases = [];
        if (bagPurchasesRes.ok) {
          const bagPurchasesData = await bagPurchasesRes.json();
          allBagPurchases = bagPurchasesData.data || bagPurchasesData.bagPurchases || [];
        }

        let allFoodPurchases = [];
        if (foodPurchasesRes.ok) {
          const foodPurchasesData = await foodPurchasesRes.json();
          allFoodPurchases = foodPurchasesData.data || foodPurchasesData.foodPurchases || [];
        }

        // Calculate outstanding balance for each supplier
        suppliers.forEach(supplier => {
          // Regular purchases
          const regularDue = allPurchases
            .filter(p => p.supplier?.name === supplier.name || p.supplier?._id?.toString() === supplier._id?.toString())
            .reduce((sum, p) => {
              const total = parseFloat(p.totalAmount) || 0;
              const paid = parseFloat(p.paidAmount) || 0;
              return sum + Math.max(0, total - paid);
            }, 0);

          // Bag purchases
          const bagDue = allBagPurchases
            .filter(p => p.supplier?._id?.toString() === supplier._id?.toString() || p.supplier?.toString() === supplier._id?.toString())
            .reduce((sum, p) => {
              const total = parseFloat(p.totalAmount) || 0;
              const paid = parseFloat(p.paidAmount) || 0;
              return sum + Math.max(0, total - paid);
            }, 0);

          // Food purchases
          const foodDue = allFoodPurchases
            .filter(p => p.supplier?._id?.toString() === supplier._id?.toString() || p.supplier?.toString() === supplier._id?.toString())
            .reduce((sum, p) => {
              const total = parseFloat(p.totalAmount) || 0;
              const paid = parseFloat(p.paidAmount) || 0;
              return sum + Math.max(0, total - paid);
            }, 0);

          balances[supplier._id] = regularDue + bagDue + foodDue;
        });

        setSupplierOutstandingBalances(balances);
      } catch (err) {
        console.error('Failed to calculate outstanding balances:', err);
      } finally {
        setLoadingOutstanding(false);
      }
    };

    if (activeTab === 'outstanding') {
      calculateOutstandingBalances();
    }
  }, [activeTab, suppliers]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:7000/api/suppliers', {
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
      const response = await fetch('http://localhost:7000/api/warehouses', {
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
      supplierType: 'Private',
      taxNumber: '',
      status: 'Active',
      rating: 3,
      notes: '',
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
      supplierType: supplier.supplierType || 'Private',
      taxNumber: supplier.taxNumber || '',
      status: supplier.status || 'Active',
      rating: supplier.rating || 3,
      notes: supplier.notes || '',
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
        ? `http://localhost:7000/api/suppliers/${editingSupplier._id}`
        : 'http://localhost:7000/api/suppliers';
      
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
        supplierType: 'Private',
        taxNumber: '',
        status: 'Active',
        rating: 3,
        notes: '',
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
      const response = await fetch(`http://localhost:7000/api/suppliers/${supplierId}`, {
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
      const response = await fetch(`http://localhost:7000/api/suppliers/${supplierId}/status`, {
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
    
    // Filter by supplier type based on active tab
    let matchesSupplierType = true;
    if (activeTab === 'government') {
      matchesSupplierType = supplier.supplierType === 'Government';
    } else if (activeTab === 'private') {
      matchesSupplierType = supplier.supplierType === 'Private';
    } else {
      // For other tabs (outstanding, analytics), use the dropdown filter
      matchesSupplierType = supplierTypeFilter === 'all' || supplier.supplierType === supplierTypeFilter;
    }
    
    return matchesSearch && matchesStatus && matchesSupplierType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSupplierTypeColor = (type) => {
    switch (type) {
      case 'Government': return 'bg-blue-100 text-blue-800';
      case 'Private': return 'bg-purple-100 text-purple-800';
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

  // Calculate total outstanding using calculated balances if available, otherwise use database field
  const totalOutstanding = suppliers.reduce((sum, supplier) => {
    const calculatedBalance = supplierOutstandingBalances[supplier._id];
    const balance = calculatedBalance !== undefined ? calculatedBalance : (supplier.outstandingBalance || 0);
    return sum + balance;
  }, 0);
  const activeSuppliers = suppliers.filter(s => s.status === 'Active').length;
  const suppliersWithOutstanding = suppliers.filter(s => {
    const calculatedBalance = supplierOutstandingBalances[s._id];
    const balance = calculatedBalance !== undefined ? calculatedBalance : (s.outstandingBalance || 0);
    return balance > 0;
  }).length;
  const governmentSuppliers = suppliers.filter(s => s.supplierType === 'Government').length;
  const privateSuppliers = suppliers.filter(s => s.supplierType === 'Private').length;

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
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 bg-gray-200 hover:shadow-sm"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
              <button className="px-4 py-2 font-medium rounded-md transition duration-150 bg-blue-100 text-blue-600 border-b-2 border-blue-600 shadow-sm">
                Supplier Management
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Supplier Management</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('government');
                    setSupplierTypeFilter('Government');
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-transparent ${
                    activeTab === 'government' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaBuilding className="mr-3" />
                  Government Suppliers
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('private');
                    setSupplierTypeFilter('Private');
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-transparent ${
                    activeTab === 'private' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaUsers className="mr-3" />
                  Private Suppliers
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('outstanding');
                    setSupplierTypeFilter('all');
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-transparent ${
                    activeTab === 'outstanding' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaExclamationTriangle className="mr-3" />
                  Outstanding Balances
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('analytics');
                    setSupplierTypeFilter('all');
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-transparent ${
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
                  <FaBuilding className="text-blue-600 text-2xl mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-blue-900">{governmentSuppliers}</div>
                    <div className="text-sm text-blue-600">Government Suppliers</div>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center">
                  <FaUsers className="text-purple-600 text-2xl mr-3" />
                  <div>
                    <div className="text-2xl font-bold text-purple-900">{privateSuppliers}</div>
                    <div className="text-sm text-purple-600">Private Suppliers</div>
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
                    <div className="text-2xl font-bold text-red-900">Rs. {(totalOutstanding || 0).toLocaleString()}</div>
                    <div className="text-sm text-red-600">Total Outstanding</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            {(activeTab === 'government' || activeTab === 'private') && (
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
                      value={supplierTypeFilter}
                      onChange={(e) => {
                        setSupplierTypeFilter(e.target.value);
                        // If user manually changes filter, update the active tab
                        if (e.target.value === 'Government') {
                          setActiveTab('government');
                        } else if (e.target.value === 'Private') {
                          setActiveTab('private');
                        } else {
                          setActiveTab('list');
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="Government">Government</option>
                      <option value="Private">Private</option>
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
                                {supplier.taxNumber && (
                                  <div className="text-sm text-gray-500">Tax: {supplier.taxNumber}</div>
                                )}
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
                              <div className="flex flex-col space-y-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSupplierTypeColor(supplier.supplierType)}`}>
                                  {supplier.supplierType}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                                  {supplier.status}
                                </span>
                                {supplier.rating && (
                                  <div className="text-xs text-gray-500">
                                    Rating: {supplier.rating}/5
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => navigate(`/suppliers/${supplier._id}`)}
                                  className="text-green-600 hover:text-green-900"
                                  title="View Supplier Details"
                                >
                                  <FaEye />
                                </button>
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {activeTab === 'government' ? 'Government' : 'Private'} suppliers found
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || statusFilter !== 'all' || supplierTypeFilter !== 'all'
                        ? "Try adjusting your search or filters"
                        : `Get started by adding your first ${activeTab === 'government' ? 'Government' : 'Private'} supplier`
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'outstanding' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Outstanding Balances</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-900">Rs. {(totalOutstanding || 0).toLocaleString()}</div>
                    <div className="text-sm text-red-600">Total Outstanding</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="text-2xl font-bold text-orange-900">{suppliersWithOutstanding}</div>
                    <div className="text-sm text-orange-600">Suppliers with Outstanding</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loadingOutstanding ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                              <span className="text-gray-600">Calculating outstanding balances...</span>
                            </div>
                          </td>
                        </tr>
                      ) : suppliers
                        .map(supplier => {
                          const calculatedBalance = supplierOutstandingBalances[supplier._id];
                          const balance = calculatedBalance !== undefined ? calculatedBalance : (supplier.outstandingBalance || 0);
                          return { ...supplier, calculatedOutstanding: balance };
                        })
                        .filter(s => s.calculatedOutstanding > 0)
                        .sort((a, b) => b.calculatedOutstanding - a.calculatedOutstanding)
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
                              <div className={`text-sm font-medium ${getOutstandingColor(supplier.calculatedOutstanding, 0)}`}>
                                Rs. {(supplier.calculatedOutstanding || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}>
                                {supplier.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => navigate(`/suppliers/${supplier._id}`)}
                                  className="text-green-600 hover:text-green-900"
                                  title="View Supplier Details"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  onClick={() => handleEdit(supplier)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit Supplier"
                                >
                                  <FaEdit />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!loadingOutstanding && suppliers.filter(s => {
                  const calculatedBalance = supplierOutstandingBalances[s._id];
                  const balance = calculatedBalance !== undefined ? calculatedBalance : (s.outstandingBalance || 0);
                  return balance > 0;
                }).length === 0 && (
                  <div className="text-center py-12">
                    <FaExclamationTriangle className="mx-auto text-6xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Outstanding Balances
                    </h3>
                    <p className="text-gray-500">
                      All suppliers are up to date with their payments.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Supplier Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-medium mb-4">Supplier Type Distribution</h3>
                    <div className="space-y-3">
                      {['Government', 'Private'].map(type => {
                        const count = suppliers.filter(s => s.supplierType === type).length;
                        const percentage = suppliers.length > 0 ? ((count / suppliers.length) * 100).toFixed(1) : 0;
                        return (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{type}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${type === 'Government' ? 'bg-blue-600' : 'bg-purple-600'}`}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Code</label>
                  <input
                    type="text"
                    name="supplierCode"
                    value={formData.supplierCode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    placeholder="Auto-generated"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Code will be generated automatically</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Type *</label>
                  <select 
                    name="supplierType"
                    value={formData.supplierType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label>
                <input
                  type="text"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tax number"
                />
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
