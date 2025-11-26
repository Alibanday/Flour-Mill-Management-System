import React, { useState, useEffect } from 'react';
import { FaCalculator, FaChartLine, FaPlus, FaSearch, FaFilter, FaExchangeAlt } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import AccountForm from '../components/FinancialManagement/AccountForm';
import AccountList from '../components/FinancialManagement/AccountList';
import FinancialDashboard from '../components/FinancialManagement/FinancialDashboard';
import TransactionLedger from '../components/FinancialManagement/TransactionLedger';
import AccountLedger from '../components/FinancialManagement/AccountLedger';

export default function FinancialManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('tabs'); // 'tabs' or 'ledger'
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:7000/api/financial/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
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

  const handleEdit = (data, type) => {
    setEditData(data);
    switch (type) {
      case 'account':
        setShowAccountForm(true);
        break;
      default:
        break;
    }
  };

  const handleFormClose = () => {
    setShowAccountForm(false);
    setEditData(null);
  };

  const handleFormSubmit = async () => {
    await fetchAccounts();
    handleFormClose();
  };

  const [initializing, setInitializing] = useState(false);

  const handleInitializeDefaultAccounts = async () => {
    if (!window.confirm('This will create default accounts (Cash, Bank, Sales Revenue, etc.) if they don\'t exist. Continue?')) {
      return;
    }

    setInitializing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:7000/api/financial/accounts/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert('Default accounts initialized successfully!');
        await fetchAccounts();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to initialize accounts'}`);
      }
    } catch (error) {
      console.error('Error initializing accounts:', error);
      alert('Error initializing accounts. Please try again.');
    } finally {
      setInitializing(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
    { id: 'accounts', label: 'Accounts', icon: FaCalculator },
    { id: 'transactions', label: 'Transaction Ledger', icon: FaExchangeAlt }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage accounts and financial overview
              </p>
            </div>
            <div className="flex space-x-3">
              {activeTab === 'accounts' && (
                <>
                  <button
                    onClick={handleInitializeDefaultAccounts}
                    disabled={initializing}
                    className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md shadow-sm text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {initializing ? 'Initializing...' : 'Initialize Default Accounts'}
                  </button>
                  <button
                    onClick={() => setShowAccountForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaPlus className="mr-2" />
                    New Account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <FinancialDashboard 
            onEdit={handleEdit}
          />
        )}
        
        {activeTab === 'accounts' && viewMode === 'tabs' && (
          <AccountList 
            onEdit={(data) => handleEdit(data, 'account')}
            onRefresh={fetchAccounts}
            onViewLedger={(account) => {
              setSelectedAccount(account);
              setViewMode('ledger');
            }}
          />
        )}

        {activeTab === 'accounts' && viewMode === 'ledger' && selectedAccount && (
          <AccountLedger
            account={selectedAccount}
            accounts={accounts}
            onBack={() => {
              setViewMode('tabs');
              setSelectedAccount(null);
            }}
            onViewLedger={(account) => {
              setSelectedAccount(account);
            }}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionLedger />
        )}
      </div>

      {/* Forms */}
      {showAccountForm && (
        <AccountForm
          editData={editData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      )}
    </div>
  );
}
