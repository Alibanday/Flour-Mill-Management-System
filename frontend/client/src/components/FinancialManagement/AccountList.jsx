import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFilter, FaEye, FaFileAlt } from 'react-icons/fa';

export default function AccountList({ onEdit, onRefresh, onViewLedger }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAccounts();
  }, [currentPage, searchTerm, selectedAccountType, selectedCategory]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedAccountType) params.append('accountType', selectedAccountType);
      if (selectedCategory) params.append('category', selectedCategory);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:7000/api/financial/accounts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        setTotalPages(data.totalPages || 1);
      } else if (response.status === 401) {
        console.error('Unauthorized: Please log in again');
        // Optionally redirect to login
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;

    try {
      const response = await fetch(`http://localhost:7000/api/financial/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        onRefresh();
      } else {
        alert('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account');
    }
  };

  const formatCurrency = (amount) => {
    const value = Number(amount) || 0;
    return `Rs. ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getAccountTypeColor = (accountType) => {
    const colors = {
      'Asset': 'bg-green-100 text-green-800',
      'Liability': 'bg-red-100 text-red-800',
      'Equity': 'bg-blue-100 text-blue-800',
      'Revenue': 'bg-purple-100 text-purple-800',
      'Expense': 'bg-orange-100 text-orange-800'
    };
    return colors[accountType] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Cash': 'bg-green-100 text-green-800',
      'Bank': 'bg-blue-100 text-blue-800',
      'Accounts Receivable': 'bg-purple-100 text-purple-800',
      'Accounts Payable': 'bg-red-100 text-red-800',
      'Inventory': 'bg-yellow-100 text-yellow-800',
      'Equipment': 'bg-indigo-100 text-indigo-800',
      'Salary Expense': 'bg-pink-100 text-pink-800',
      'Purchase Expense': 'bg-orange-100 text-orange-800',
      'Sales Revenue': 'bg-emerald-100 text-emerald-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              value={selectedAccountType}
              onChange={(e) => setSelectedAccountType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Asset">Asset</option>
              <option value="Liability">Liability</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Accounts Receivable">Accounts Receivable</option>
              <option value="Accounts Payable">Accounts Payable</option>
              <option value="Inventory">Inventory</option>
              <option value="Equipment">Equipment</option>
              <option value="Salary Expense">Salary Expense</option>
              <option value="Purchase Expense">Purchase Expense</option>
              <option value="Sales Revenue">Sales Revenue</option>
              <option value="Other">Other</option>
            </select>
          </div>

        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Financial Accounts</h3>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No accounts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balances
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {account.accountName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {account.accountNumber}
                        </div>
                        {account.accountCode && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            Code: {account.accountCode}
                          </div>
                        )}
                        {account.description && (
                          <div className="text-xs text-gray-400 mt-1">
                            {account.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccountTypeColor(account.accountType)}`}>
                          {account.accountType}
                        </span>
                        <br />
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(account.category)}`}>
                          {account.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Opening: {formatCurrency(account.openingBalance)}</div>
                        <div className="font-medium">Current: {formatCurrency(account.currentBalance)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {onViewLedger && (
                          <button
                            onClick={() => onViewLedger(account)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="View Account Ledger"
                          >
                            <FaFileAlt />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(account)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Account"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(account._id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Account"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
