import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaUsers, FaExclamationTriangle, FaChartBar, FaSearch, FaFilter, FaEdit, FaTrash, FaEye, FaSignOutAlt, FaUserCog, FaCreditCard, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

export default function SupplierManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list');

  const canManageSuppliers = user?.role === 'Admin' || user?.role === 'Manager';

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/suppliers', {
        headers: {
          'Authorization': Bearer ,
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const totalOutstanding = suppliers.reduce((sum, supplier) => sum + (supplier.outstandingBalance || 0), 0);
  const activeSuppliers = suppliers.filter(s => s.status === 'Active').length;
  const suppliersWithOutstanding = suppliers.filter(s => (s.outstandingBalance || 0) > 0).length;

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Supplier Management</h1>
              <p className='text-gray-600 mt-2'>Manage suppliers, track outstanding balances, and maintain vendor relationships</p>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='text-right'>
                <div className='text-2xl font-bold text-blue-600'>{suppliers.length}</div>
                <div className='text-sm text-gray-500'>Total Suppliers</div>
              </div>
            </div>
          </div>

        <div className='text-center py-12'>
          <FaUsers className='mx-auto text-6xl text-gray-300 mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Supplier Management</h3>
          <p className='text-gray-500'>Manage vendor records, contact information, addresses, and track outstanding balances</p>
        </div>
      </div>
    </div>
  );
}
