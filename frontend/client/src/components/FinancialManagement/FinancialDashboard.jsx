import React, { useState, useEffect } from 'react';
import { FaCalculator, FaMoneyBillWave, FaUsers, FaChartLine, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

export default function FinancialDashboard({ onEdit }) {
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:7000/api/financial/summary`);
      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const value = Number(amount) || 0;
    return `Rs. ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No financial data available</p>
      </div>
    );
  }

  const { summary, recentTransactions, pendingSalaries } = financialData;

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Assets */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <FaCalculator className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Assets</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary.totalAssets)}
              </p>
            </div>
          </div>
        </div>

        {/* Net Worth */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <FaChartLine className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Worth</p>
              <p className={`text-2xl font-semibold ${
                summary.netWorth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summary.netWorth)}
              </p>
            </div>
          </div>
        </div>

        {/* Net Income */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <FaMoneyBillWave className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Income</p>
              <p className={`text-2xl font-semibold ${
                summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summary.netIncome)}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Salaries */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                <FaUsers className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Salaries</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingSalaries.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Balances */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Balances</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Revenue:</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(summary.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Expenses:</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Liabilities:</span>
              <span className="text-sm font-medium text-orange-600">
                {formatCurrency(summary.totalLiabilities)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Equity:</span>
              <span className="text-sm font-medium text-blue-600">
                {formatCurrency(summary.totalEquity)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => onEdit(null, 'transaction')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center">
                <FaMoneyBillWave className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Record Transaction</p>
                  <p className="text-sm text-gray-500">Add new financial transaction</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => onEdit(null, 'account')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center">
                <FaCalculator className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Create Account</p>
                  <p className="text-sm text-gray-500">Set up new financial account</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => onEdit(null, 'salary')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center">
                <FaUsers className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Process Salary</p>
                  <p className="text-sm text-gray-500">Calculate and process employee salary</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.debitAccount?.accountName} → {transaction.creditAccount?.accountName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent transactions</p>
          )}
        </div>

        {/* Pending Salaries */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Salaries</h3>
          {pendingSalaries.length > 0 ? (
            <div className="space-y-3">
              {pendingSalaries.map((salary) => (
                <div key={salary._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {salary.employee?.firstName} {salary.employee?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {salary.month}/{salary.year} - {salary.workingDays} days
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(salary.netSalary)}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <FaCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">All salaries are processed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
