import React, { useState, useEffect } from 'react';
import { FaCalculator, FaMoneyBillWave, FaUsers, FaChartLine, FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import AccountForm from '../components/FinancialManagement/AccountForm';
import TransactionForm from '../components/FinancialManagement/TransactionForm';
import SalaryForm from '../components/FinancialManagement/SalaryForm';
import AccountList from '../components/FinancialManagement/AccountList';
import TransactionList from '../components/FinancialManagement/TransactionList';
import SalaryList from '../components/FinancialManagement/SalaryList';
import FinancialDashboard from '../components/FinancialManagement/FinancialDashboard';

export default function FinancialManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouses();
    fetchAccounts();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/warehouses/active');
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:7000/api/financial/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
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
      case 'transaction':
        setShowTransactionForm(true);
        break;
      case 'salary':
        setShowSalaryForm(true);
        break;
      default:
        break;
    }
  };

  const handleFormClose = () => {
    setShowAccountForm(false);
    setShowTransactionForm(false);
    setShowSalaryForm(false);
    setEditData(null);
  };

  const handleFormSubmit = async () => {
    await fetchAccounts();
    handleFormClose();
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
    { id: 'accounts', label: 'Accounts', icon: FaCalculator },
    { id: 'transactions', label: 'Transactions', icon: FaMoneyBillWave },
    { id: 'salaries', label: 'Salaries', icon: FaUsers }
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
                Manage accounts, transactions, and employee salaries
              </p>
            </div>
            <div className="flex space-x-3">
              {activeTab === 'accounts' && (
                <button
                  onClick={() => setShowAccountForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaPlus className="mr-2" />
                  New Account
                </button>
              )}
              {activeTab === 'transactions' && (
                <button
                  onClick={() => setShowTransactionForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FaPlus className="mr-2" />
                  New Transaction
                </button>
              )}
              {activeTab === 'salaries' && (
                <button
                  onClick={() => setShowSalaryForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <FaPlus className="mr-2" />
                  Process Salary
                </button>
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
            warehouses={warehouses}
            onEdit={handleEdit}
          />
        )}
        
        {activeTab === 'accounts' && (
          <AccountList 
            warehouses={warehouses}
            onEdit={(data) => handleEdit(data, 'account')}
            onRefresh={fetchAccounts}
          />
        )}
        
        {activeTab === 'transactions' && (
          <TransactionList 
            warehouses={warehouses}
            accounts={accounts}
            onEdit={(data) => handleEdit(data, 'transaction')}
          />
        )}
        
        {activeTab === 'salaries' && (
          <SalaryList 
            warehouses={warehouses}
            accounts={accounts}
            onEdit={(data) => handleEdit(data, 'salary')}
          />
        )}
      </div>

      {/* Forms */}
      {showAccountForm && (
        <AccountForm
          warehouses={warehouses}
          editData={editData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      )}

      {showTransactionForm && (
        <TransactionForm
          warehouses={warehouses}
          accounts={accounts}
          editData={editData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      )}

      {showSalaryForm && (
        <SalaryForm
          warehouses={warehouses}
          accounts={accounts}
          editData={editData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      )}
    </div>
  );
}
