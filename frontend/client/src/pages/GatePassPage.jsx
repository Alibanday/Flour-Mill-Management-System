import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, FaPassport, FaExclamationTriangle, FaChartBar, FaSearch, 
  FaFilter, FaDownload, FaPrint, FaEye, FaEdit, FaTrash, FaSignOutAlt, 
  FaUserCog, FaWhatsapp, FaCheckCircle, FaTimesCircle, FaClock,
  FaUser, FaTruck, FaBoxes, FaTools, FaUserTie
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import GatePassForm from '../components/GatePass/GatePassForm';
import GatePassList from '../components/GatePass/GatePassList';
import ActivePasses from '../components/GatePass/ActivePasses';

export default function GatePassPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGatePass, setEditingGatePass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [warehouses, setWarehouses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    expired: 0,
  });

  const canManageGatePasses = user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Employee';
  const canApproveGatePasses = user?.role === 'Admin' || user?.role === 'Manager';

  useEffect(() => {
    fetchGatePasses();
    fetchWarehouses();
    fetchStats();
  }, []);

  const fetchGatePasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:7000/api/gate-pass', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gate passes');
      }

      const data = await response.json();
      setGatePasses(data.data || []);
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

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/gate-pass/stats/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data || {});
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleAddNew = () => {
    setEditingGatePass(null);
    setShowForm(true);
  };

  const handleEdit = (gatePass) => {
    setEditingGatePass(gatePass);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGatePass(null);
    fetchGatePasses(); // Refresh the list
    fetchStats(); // Refresh stats
  };

  const handleStatusChange = async (gatePassId, newStatus) => {
    try {
      let endpoint = '';
      let method = 'PATCH';
      
      switch (newStatus) {
        case 'Approved':
          endpoint = `http://localhost:7000/api/gate-pass/${gatePassId}/approve`;
          break;
        case 'Active':
          endpoint = `http://localhost:7000/api/gate-pass/${gatePassId}/activate`;
          break;
        case 'Completed':
          endpoint = `http://localhost:7000/api/gate-pass/${gatePassId}/complete`;
          break;
        case 'Cancelled':
          endpoint = `http://localhost:7000/api/gate-pass/${gatePassId}/cancel`;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchGatePasses();
        fetchStats();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleConfirmDispatch = async (gatePassId, notes) => {
    try {
      const response = await fetch(`http://localhost:7000/api/gate-pass/${gatePassId}/confirm-dispatch`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        fetchGatePasses();
        fetchStats();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to confirm dispatch');
      }
    } catch (err) {
      alert('Error confirming dispatch: ' + err.message);
    }
  };

  const handleWhatsAppShare = async (gatePassId) => {
    try {
      const response = await fetch(`http://localhost:7000/api/gate-pass/${gatePassId}/whatsapp-shared`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        fetchGatePasses();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update WhatsApp status');
      }
    } catch (err) {
      alert('Error updating WhatsApp status: ' + err.message);
    }
  };

  const filteredGatePasses = gatePasses.filter(gatePass => {
    const matchesSearch = 
      gatePass.gatePassNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gatePass.issuedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gatePass.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || gatePass.status === statusFilter;
    const matchesType = typeFilter === 'all' || gatePass.type === typeFilter;
    const matchesWarehouse = warehouseFilter === 'all' || gatePass.warehouse?._id === warehouseFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesWarehouse;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Person': return <FaUser className="h-4 w-4" />;
      case 'Vehicle': return <FaTruck className="h-4 w-4" />;
      case 'Material': return <FaBoxes className="h-4 w-4" />;
      case 'Equipment': return <FaTools className="h-4 w-4" />;
      case 'Visitor': return <FaUserTie className="h-4 w-4" />;
      default: return <FaPassport className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Person': return 'bg-blue-100 text-blue-800';
      case 'Vehicle': return 'bg-green-100 text-green-800';
      case 'Material': return 'bg-purple-100 text-purple-800';
      case 'Equipment': return 'bg-orange-100 text-orange-800';
      case 'Visitor': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
                Gate Pass System
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Gate Pass Management</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-transparent ${
                    activeTab === 'list' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaPassport className="mr-3" />
                  All Gate Passes
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-transparent ${
                    activeTab === 'active' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaCheckCircle className="mr-3" />
                  Active Passes
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors bg-transparent ${
                    activeTab === 'pending' ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FaClock className="mr-3" />
                  Pending Approval
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('analytics')}
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
                <h1 className="text-2xl font-bold text-gray-900">Gate Pass System</h1>
                <p className="text-gray-600">Manage gate passes, track approvals, and monitor stock dispatch</p>
              </div>
              {/* Gate passes are now auto-generated from sales/purchases */}
              <div className="text-sm text-gray-600 italic">
                Gate passes are automatically generated when sales or purchases are created
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <FaPassport className="text-blue-600 text-xl mr-2" />
                  <div>
                    <div className="text-lg font-bold text-blue-900">{stats.total || 0}</div>
                    <div className="text-xs text-blue-600">Total</div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center">
                  <FaClock className="text-yellow-600 text-xl mr-2" />
                  <div>
                    <div className="text-lg font-bold text-yellow-900">{stats.pending || 0}</div>
                    <div className="text-xs text-yellow-600">Pending</div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <FaCheckCircle className="text-blue-600 text-xl mr-2" />
                  <div>
                    <div className="text-lg font-bold text-blue-900">{stats.approved || 0}</div>
                    <div className="text-xs text-blue-600">Approved</div>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-600 text-xl mr-2" />
                  <div>
                    <div className="text-lg font-bold text-green-900">{stats.active || 0}</div>
                    <div className="text-xs text-green-600">Active</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center">
                  <FaCheckCircle className="text-gray-600 text-xl mr-2" />
                  <div>
                    <div className="text-lg font-bold text-gray-900">{stats.completed || 0}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-600 text-xl mr-2" />
                  <div>
                    <div className="text-lg font-bold text-red-900">{stats.expired || 0}</div>
                    <div className="text-xs text-red-600">Expired</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'list' && (
              <GatePassList
                gatePasses={filteredGatePasses}
                loading={loading}
                error={error}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                warehouseFilter={warehouseFilter}
                setWarehouseFilter={setWarehouseFilter}
                warehouses={warehouses}
                onEdit={handleEdit}
                onStatusChange={handleStatusChange}
                onConfirmDispatch={handleConfirmDispatch}
                onWhatsAppShare={handleWhatsAppShare}
                canApprove={canApproveGatePasses}
                user={user}
              />
            )}

            {activeTab === 'active' && (
              <ActivePasses
                gatePasses={gatePasses.filter(gp => gp.status === 'Active')}
                onConfirmDispatch={handleConfirmDispatch}
                onWhatsAppShare={handleWhatsAppShare}
                user={user}
              />
            )}

            {activeTab === 'pending' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Approval</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Pass</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {gatePasses
                        .filter(gp => gp.status === 'Pending')
                        .map((gatePass) => (
                          <tr key={gatePass._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{gatePass.gatePassNumber}</div>
                                <div className="text-sm text-gray-500">{gatePass.type}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{gatePass.issuedTo?.name}</div>
                                <div className="text-gray-500">{gatePass.issuedTo?.contact}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{gatePass.purpose}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{gatePass.warehouse?.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{gatePass.issuedBy?.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              {canApproveGatePasses && (
                                <button
                                  onClick={() => handleStatusChange(gatePass._id, 'Approved')}
                                  className="text-green-600 hover:text-green-900 mr-2"
                                  title="Approve"
                                >
                                  <FaCheckCircle />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(gatePass)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
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
                <h2 className="text-xl font-semibold mb-4">Gate Pass Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-medium mb-4">Status Distribution</h3>
                    <div className="space-y-3">
                      {['Pending', 'Approved', 'Active', 'Completed', 'Expired', 'Cancelled'].map(status => {
                        const count = stats[status.toLowerCase()] || 0;
                        const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0;
                        return (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{status}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    status === 'Active' ? 'bg-green-600' : 
                                    status === 'Pending' ? 'bg-yellow-600' : 
                                    status === 'Approved' ? 'bg-blue-600' : 
                                    status === 'Completed' ? 'bg-gray-600' : 'bg-red-600'
                                  }`}
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
                    <h3 className="text-lg font-medium mb-4">Type Distribution</h3>
                    <div className="space-y-3">
                      {['Person', 'Vehicle', 'Material', 'Equipment', 'Visitor'].map(type => {
                        const count = gatePasses.filter(gp => gp.type === type).length;
                        const percentage = gatePasses.length > 0 ? ((count / gatePasses.length) * 100).toFixed(1) : 0;
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
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Form Modal */}
      {showForm && (
        <GatePassForm
          gatePass={editingGatePass}
          warehouses={warehouses}
          onClose={handleFormClose}
          user={user}
        />
      )}
    </div>
  );
}
