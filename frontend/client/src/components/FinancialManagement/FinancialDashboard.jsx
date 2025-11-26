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
      const response = await fetch(`http://localhost:7000/api/financial/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFinancialData(result.data);
        } else {
          setFinancialData(null);
        }
      } else {
        // Fallback to old endpoint
        const fallbackResponse = await fetch(`http://localhost:7000/api/financial/summary`);
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setFinancialData(data);
        }
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

  const { summary, recentTransactions, pendingSalaries, unpaidSales, unpaidPurchases, accountBreakdown } = financialData || {};

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cash in Hand */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <FaCalculator className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Cash in Hand</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary?.cashInHand || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Bank Balance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <FaChartLine className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bank Balance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary?.bankBalance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Net Profit/Loss */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <FaMoneyBillWave className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Net Profit/Loss</p>
              <p className={`text-2xl font-semibold ${
                (summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summary?.netProfit || 0)}
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
                {pendingSalaries?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-100 rounded-md flex items-center justify-center">
                <FaChartLine className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-emerald-600">
                {formatCurrency(summary?.totalRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                <FaExclamationTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-semibold text-red-600">
                {formatCurrency(summary?.totalExpenses || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Accounts Receivable */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <FaMoneyBillWave className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Accounts Receivable</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary?.totalReceivables || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Accounts Payable */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                <FaExclamationTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Accounts Payable</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(summary?.totalPayables || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Balances */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Assets:</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(summary?.totalAssets || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Liabilities:</span>
              <span className="text-sm font-medium text-red-600">
                {formatCurrency(summary?.totalLiabilities || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Equity:</span>
              <span className="text-sm font-medium text-blue-600">
                {formatCurrency(summary?.totalEquity || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Net Worth:</span>
              <span className={`text-sm font-medium ${
                (summary?.netWorth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summary?.netWorth || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          {recentTransactions && recentTransactions.length > 0 ? (
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
          {pendingSalaries && pendingSalaries.length > 0 ? (
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

      {/* Unpaid Sales and Purchases */}
      {(unpaidSales && unpaidSales.length > 0) || (unpaidPurchases && unpaidPurchases.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unpaid Sales (Accounts Receivable) */}
          {unpaidSales && unpaidSales.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Unpaid Sales (Accounts Receivable)</h3>
              <div className="space-y-3">
                {unpaidSales.slice(0, 5).map((sale) => (
                  <div key={sale._id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {sale.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sale.customer?.name || 'Customer'} - {new Date(sale.saleDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(sale.remainingAmount || sale.dueAmount || 0)}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {sale.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unpaid Purchases (Accounts Payable) */}
          {unpaidPurchases && unpaidPurchases.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Unpaid Purchases (Accounts Payable)</h3>
              <div className="space-y-3">
                {unpaidPurchases.slice(0, 5).map((purchase) => (
                  <div key={purchase._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {purchase.purchaseNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {purchase.supplier?.name || 'Supplier'} - {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(purchase.remainingAmount || 0)}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {purchase.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
