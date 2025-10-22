import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaDownload, FaRedo } from 'react-icons/fa';
import { toast } from 'react-toastify';
import UserForm from './UserForm';
import { useAuth } from '../../hooks/useAuth';
import api, { API_ENDPOINTS } from '../../services/api';

export default function UserList() {
  const { user: currentUser, role, isAdmin, isManager } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRole !== 'all') params.role = filterRole;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await api.get(API_ENDPOINTS.USERS.GET_ALL, { params });
      const data = response.data?.data || response.data?.users || [];
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, filterStatus]);

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(API_ENDPOINTS.USERS.DELETE(id));
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.put(API_ENDPOINTS.USERS.UPDATE(user._id), { isActive: !user.isActive });
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    fetchUsers();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Users</h2>
        <div className="space-x-2">
          <button onClick={fetchUsers} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
            <FaRedo className="inline mr-1" /> Refresh
          </button>
          {(isAdmin() || isManager()) && (
            <button onClick={handleAddUser} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <FaPlus className="inline mr-1" /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Filters and search would be here (omitted for brevity) */}

      <div className="bg-white rounded shadow">
        {filteredUsers.map(u => (
          <div key={u._id} className="flex justify-between items-center px-4 py-3 border-b">
            <div>
              <div className="font-medium">{u.firstName} {u.lastName}</div>
              <div className="text-sm text-gray-600">{u.email} · {u.role}</div>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEditUser(u)} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                <FaEdit />
              </button>
              <button onClick={() => handleToggleStatus(u)} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                {u.isActive ? <FaEye /> : <FaEyeSlash />}
              </button>
              <button onClick={() => handleDeleteUser(u._id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <UserForm
          user={editingUser}
          onCancel={() => setShowForm(false)}
          onSave={handleSaved}
        />
      )}
    </div>
  );
}
