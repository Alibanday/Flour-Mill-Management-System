import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  FaHome, FaIndustry, FaExchangeAlt, FaClipboardList,
  FaChartLine, FaPlus, FaSearch, FaDolly, FaBoxes,
  FaEdit, FaTrash, FaEye, FaCheckCircle, FaTimesCircle, FaExclamationTriangle
} from "react-icons/fa";
import ProductionForm from "../components/ProductionManagement/ProductionForm";
import { useAuth } from '../hooks/useAuth';

export default function ProductionPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isManager, isEmployee } = useAuth();
  const [activeMenu, setActiveMenu] = useState("DailyProduction");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [productions, setProductions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const productionMenu = [
    { name: "Daily Production", icon: <FaIndustry className="mr-3" /> },
    { name: "Stock Transfer", icon: <FaExchangeAlt className="mr-3" /> },
    { name: "Production Details", icon: <FaClipboardList className="mr-3" /> },
    { name: "Raw Materials", icon: <FaBoxes className="mr-3" /> },
    { name: "Reports", icon: <FaChartLine className="mr-3" /> }
  ];

  const productionActions = [
    { 
      name: "New Batch", 
      icon: <FaPlus />, 
      action: () => setShowAddForm(true),
      roles: ['Admin', 'Manager'],
      color: "bg-blue-100 text-blue-600"
    },
    { 
      name: "Material Check", 
      icon: <FaSearch />, 
      action: () => console.log("Material Check"),
      roles: ['Admin', 'Manager', 'Employee'],
      color: "bg-green-100 text-green-600"
    },
    { 
      name: "Dispatch", 
      icon: <FaDolly />, 
      action: () => console.log("Dispatch"),
      roles: ['Admin', 'Manager', 'Employee'],
      color: "bg-purple-100 text-purple-600"
    }
  ];

  // API functions
  const fetchProductions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:7000/api/production', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProductions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching productions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/warehouses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleSubmitProduction = async (formData) => {
    try {
      const url = editData ? `http://localhost:7000/api/production/${editData._id}` : 'http://localhost:7000/api/production';
      const method = editData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Production saved:', data);
        
        // Reset form and refresh data
        setShowAddForm(false);
        setShowEditForm(false);
        setEditData(null);
        fetchProductions();
      } else {
        const errorData = await response.json();
        console.error('Error saving production:', errorData);
      }
    } catch (error) {
      console.error('Error submitting production:', error);
    }
  };

  const handleEdit = (production) => {
    setEditData(production);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this production record?')) {
      try {
        const response = await fetch(`http://localhost:7000/api/production/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchProductions();
        }
      } catch (error) {
        console.error('Error deleting production:', error);
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:7000/api/production/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchProductions();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchProductions();
    fetchWarehouses();
  }, []);

  // Filter productions based on search term
  const filteredProductions = productions.filter(production =>
    production.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    production.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-0"
         style={{ backgroundImage: "url('/dashboard.jpg')" }}>
      
      {/* Top Navigation */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 bg-gray-200 hover:shadow-sm flex items-center"
                onClick={() => navigate("/dashboard")}
              >
                <FaHome className="mr-2" />
                Back to Dashboard
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaIndustry className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Production Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">PRODUCTION MENU</h3>
            <ul className="space-y-1">
              {productionMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => setActiveMenu(item.name)}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors bg-transparent"
                  >
                    {item.icon}
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">
          {/* Show Production Form or Production List */}
          {showAddForm && (
            <ProductionForm
              onSubmit={handleSubmitProduction}
              onCancel={() => setShowAddForm(false)}
              warehouses={warehouses}
            />
          )}

          {showEditForm && editData && (
            <ProductionForm
              onSubmit={handleSubmitProduction}
              onCancel={() => {
                setShowEditForm(false);
                setEditData(null);
              }}
              editData={editData}
              warehouses={warehouses}
            />
          )}

          {!showAddForm && !showEditForm && (
            <>
              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full">
                {productionActions.map((button, index) => {
                  // Check if user has permission for this action
                  const hasPermission = button.roles.some(role => 
                    (role === 'Admin' && isAdmin()) ||
                    (role === 'Manager' && isManager()) ||
                    (role === 'Employee' && isEmployee())
                  );

                  if (!hasPermission) return null;

                  return (
                    <button
                      key={index}
                      onClick={button.action}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group border border-gray-100 ${button.color} hover:bg-opacity-80`}
                    >
                      <div className="p-3 mb-2 rounded-full bg-white bg-opacity-50 group-hover:bg-opacity-100">
                        {button.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{button.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Production Overview */}
              <div className="bg-white rounded-xl shadow-sm p-6 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Production Management</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search production..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Production Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <FaIndustry className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Total Batches</p>
                        <p className="text-2xl font-bold text-blue-900">{filteredProductions.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <FaCheckCircle className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Completed</p>
                        <p className="text-2xl font-bold text-green-900">
                          {filteredProductions.filter(p => p.status === 'Completed').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <FaExclamationTriangle className="h-8 w-8 text-yellow-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">In Progress</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {filteredProductions.filter(p => p.status === 'In Progress').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <FaTimesCircle className="h-8 w-8 text-red-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Pending</p>
                        <p className="text-2xl font-bold text-red-900">
                          {filteredProductions.filter(p => p.status === 'Quality Check').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          </td>
                        </tr>
                      ) : filteredProductions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                            No production records found
                          </td>
                        </tr>
                      ) : (
                        filteredProductions.map((production) => (
                          <tr key={production._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {production.batchNumber}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{production.productName}</div>
                              <div className="text-sm text-gray-500">{production.productType}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {production.quantity?.value || 0} {production.quantity?.unit || 'kg'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                Rs. {production.productionCost?.totalCost?.toFixed(2) || '0.00'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                production.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                production.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                production.status === 'Quality Check' ? 'bg-blue-100 text-blue-800' :
                                production.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {production.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {production.productionDate ? new Date(production.productionDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(production)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                {(isAdmin() || isManager()) && (
                                  <button
                                    onClick={() => handleDelete(production._id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStatusUpdate(production._id, 'Completed')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Mark Complete"
                                >
                                  <FaCheckCircle />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}