import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaFileAlt, FaCalendarAlt } from 'react-icons/fa';

export default function AccountLedger({ account, accounts, onBack, onViewLedger }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [runningBalance, setRunningBalance] = useState(account.currentBalance || 0);

  useEffect(() => {
    fetchLedger();
  }, [account._id, currentPage, startDate, endDate]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 50
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:7000/api/financial/accounts/${account._id}/ledger?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.totalPages || 1);
        
        // Calculate running balance
        if (data.transactions && data.transactions.length > 0) {
          let balance = account.openingBalance || 0;
          const calculatedTransactions = data.transactions.map(txn => {
            const isDebit = txn.debitAccount._id === account._id;
            const isCredit = txn.creditAccount._id === account._id;
            
            if (isDebit) {
              balance += txn.amount;
            } else if (isCredit) {
              balance -= txn.amount;
            }
            
            return {
              ...txn,
              balance: balance,
              entryType: isDebit ? 'debit' : 'credit'
            };
          });
          
          setRunningBalance(balance);
          setTransactions(calculatedTransactions.reverse());
        }
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Transaction List"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{account.accountName}</h2>
              <p className="text-sm text-gray-600">
                {account.accountNumber} • {account.accountType} • {account.category}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Current Balance</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(account.currentBalance)}</div>
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Opening Balance</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(account.openingBalance || 0)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Current Balance</div>
          <div className="text-xl font-bold text-blue-600">{formatCurrency(account.currentBalance || 0)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Transactions</div>
          <div className="text-xl font-bold text-gray-900">{transactions.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Status</div>
          <div className={`text-lg font-bold ${account.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
            {account.status}
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                min={startDate || undefined}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Account Ledger</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">No transactions found for this account</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Opening Balance Row */}
                  <tr className="bg-gray-50">
                    <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Opening Balance
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(account.openingBalance || 0)}
                    </td>
                  </tr>

                  {/* Transaction Rows */}
                  {transactions.map((transaction, index) => {
                    const isDebit = transaction.entryType === 'debit';
                    const otherAccount = isDebit 
                      ? transaction.creditAccount 
                      : transaction.debitAccount;

                    return (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.transactionNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {transaction.transactionType}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {transaction.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isDebit ? 'To: ' : 'From: '}
                            <button
                              onClick={() => otherAccount && onViewLedger(otherAccount)}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {otherAccount?.accountName || 'N/A'}
                            </button>
                          </div>
                          {transaction.reference && (
                            <div className="text-xs text-gray-400 mt-1">
                              Ref: {transaction.reference}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                          {isDebit ? formatCurrency(transaction.amount) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                          {!isDebit ? formatCurrency(transaction.amount) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.balance || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Closing Balance
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {formatCurrency(
                        transactions
                          .filter(t => t.entryType === 'debit')
                          .reduce((sum, t) => sum + (t.amount || 0), 0)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {formatCurrency(
                        transactions
                          .filter(t => t.entryType === 'credit')
                          .reduce((sum, t) => sum + (t.amount || 0), 0)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                      {formatCurrency(runningBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
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
          </>
        )}
      </div>
    </div>
  );
}

