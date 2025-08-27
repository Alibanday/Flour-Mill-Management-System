import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaDownload, FaRedo } from 'react-icons/fa';
import { toast } from 'react-toastify';
import UserForm from './UserForm';
import { useAuth } from '../../hooks/useAuth';

export default function UserList() {
  const { user: currentUser, role, isAdmin, isManager } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data for demonstration
  const mockUsers = [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@flourmill.com',
      phone: '+92-300-1234567',
      cnic: '12345-1234567-1',
      role: 'Admin',
      isActive: true,
      createdAt: '2024-01-15',
      lastLogin: '2024-01-20'
    },
    {
      _id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@flourmill.com',
      phone: '+92-300-1234568',
      cnic: '12345-1234567-2',
      role: 'Manager',
      isActive: true,
      createdAt: '2024-01-16',
      lastLogin: '2024-01-19'
    },
    {
      _id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@flourmill.com',
      phone: '+92-300-1234569',
      cnic: '12345-1234567-3',
      role: 'Employee',
      isActive: false,
      createdAt: '2024-01-17',
      lastLogin: '2024-01-18'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddUser = () => {
    // Only Admin and Manager can add users
    if (!isAdmin() && !isManager()) {
      toast.error('You do not have permission to create users');
      return;
    }
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    // Only Admin and Manager can edit users
    if (!isAdmin() && !isManager()) {
      toast.error('You do not have permission to edit users');
      return;
    }
    
    // Managers can only edit non-admin users
    if (isManager() && user.role === 'Admin') {
      toast.error('Managers cannot edit Admin users');
      return;
    }
    
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = (user) => {
    // Only Admin can delete users
    if (!isAdmin()) {
      toast.error('Only Administrators can delete users');
      return;
    }
    
    // Cannot delete yourself
    if (user._id === currentUser._id) {
      toast.error('You cannot delete your own account');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      const updatedUsers = users.filter(u => u._id !== user._id);
      setUsers(updatedUsers);
      toast.success('User deleted successfully');
    }
  };

  const handleSaveUser = (userData) => {
    if (editingUser) {
      // Update existing user
      const updatedUsers = users.map(u => 
        u._id === editingUser._id ? { ...u, ...userData } : u
      );
      setUsers(updatedUsers);
      toast.success('User updated successfully');
    } else {
      // Add new user
      const newUser = {
        ...userData,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: null
      };
      setUsers([...users, newUser]);
      toast.success('User created successfully');
    }
    setShowForm(false);
    setEditingUser(null);
  };

  const toggleUserStatus = (user) => {
    // Only Admin and Manager can change user status
    if (!isAdmin() && !isManager()) {
      toast.error('You do not have permission to change user status');
      return;
    }
    
    // Managers cannot change Admin status
    if (isManager() && user.role === 'Admin') {
      toast.error('Managers cannot change Admin user status');
      return;
    }
    
    // Cannot change your own status
    if (user._id === currentUser._id) {
      toast.error('You cannot change your own status');
      return;
    }
    
    const updatedUsers = users.map(u => 
      u._id === user._id ? { ...u, isActive: !u.isActive } : u
    );
    setUsers(updatedUsers);
    toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
  };

  const handleExport = () => {
    // Only Admin and Manager can export
    if (!isAdmin() && !isManager()) {
      toast.error('You do not have permission to export user data');
      return;
    }
    
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Created Date'],
      ...users.map(user => [
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.role,
        user.isActive ? 'Active' : 'Inactive',
        user.createdAt
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Users exported successfully');
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('User list refreshed');
    }, 500);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Add User Button - Only show if user has permission */}
          {(isAdmin() || isManager()) && (
            <button 
              onClick={handleAddUser}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaPlus className="h-5 w-5 mr-2" />
              Add New User
            </button>
          )}
          
          {/* Export Button - Only show if user has permission */}
          {(isAdmin() || isManager()) && (
            <button 
              onClick={handleExport}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaDownload className="h-5 w-5 mr-2" />
              Export Users
            </button>
          )}
          
          {/* Refresh Button */}
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FaRedo className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
              <option value="Cashier">Cashier</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-800">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">ID: {user._id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'Employee' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition-colors duration-200`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* Edit Button - Only show if user has permission */}
                      {(isAdmin() || isManager()) && (
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          title="Edit user"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Delete Button - Only show if user has permission */}
                      {isAdmin() && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          title="Delete user"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <UserForm
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
