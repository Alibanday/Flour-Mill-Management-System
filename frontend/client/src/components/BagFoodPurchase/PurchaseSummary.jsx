import React, { useState } from 'react';
import { FaChartBar, FaDownload, FaPrint, FaCalendarAlt, FaCalculator, FaTruck } from 'react-icons/fa';

export default function PurchaseSummary({ bagPurchases, foodPurchases, stats }) {
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('overview');

  const getDateRangeData = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }
    
    return { startDate, endDate: now };
  };

  const getFilteredData = () => {
    const { startDate, endDate } = getDateRangeData();
    
    const filteredBagPurchases = bagPurchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchaseDate);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });
    
    const filteredFoodPurchases = foodPurchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchaseDate);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });
    
    return { filteredBagPurchases, filteredFoodPurchases };
  };

  const { filteredBagPurchases, filteredFoodPurchases } = getFilteredData();

  const calculateMetrics = () => {
    const bagTotal = filteredBagPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const foodTotal = filteredFoodPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalPurchases = filteredBagPurchases.length + filteredFoodPurchases.length;
    const pendingPayments = filteredBagPurchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0) +
                           filteredFoodPurchases.reduce((sum, p) => sum + (p.dueAmount || 0), 0);
    
    // Supplier analysis
    const supplierTotals = {};
    [...filteredBagPurchases, ...filteredFoodPurchases].forEach(purchase => {
      const supplierName = purchase.supplier?.name || 'Unknown';
      supplierTotals[supplierName] = (supplierTotals[supplierName] || 0) + (purchase.totalAmount || 0);
    });
    
    const topSuppliers = Object.entries(supplierTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Category analysis for food purchases
    const categoryTotals = {};
    filteredFoodPurchases.forEach(purchase => {
      purchase.foodItems?.forEach(item => {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + (item.totalPrice || 0);
      });
    });

    // Bag type analysis
    const bagTypeTotals = {};
    filteredBagPurchases.forEach(purchase => {
      Object.entries(purchase.bags).forEach(([type, bag]) => {
        if (bag.quantity > 0) {
          bagTypeTotals[type] = (bagTypeTotals[type] || 0) + bag.quantity;
        }
      });
    });

    return {
      bagTotal,
      foodTotal,
      totalPurchases,
      pendingPayments,
      topSuppliers,
      categoryTotals,
      bagTypeTotals
    };
  };

  const metrics = calculateMetrics();

  const handleExport = (format) => {
    // Implementation for export functionality
    console.log(`Exporting ${reportType} report in ${format} format`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="overview">Overview</option>
            <option value="supplier">Supplier Analysis</option>
            <option value="category">Category Analysis</option>
            <option value="trends">Trends</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <FaDownload className="mr-2" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <FaDownload className="mr-2" />
            Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <FaPrint className="mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {reportType === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaChartBar className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalPurchases}</p>
                <p className="text-xs text-gray-500">In selected period</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCalculator className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bag Purchases</p>
                <p className="text-2xl font-bold text-gray-900">₹{metrics.bagTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaTruck className="text-yellow-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Food Purchases</p>
                <p className="text-2xl font-bold text-gray-900">₹{metrics.foodTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FaCalendarAlt className="text-red-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">₹{metrics.pendingPayments.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Outstanding amount</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Analysis */}
      {reportType === 'supplier' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers by Purchase Value</h3>
          <div className="space-y-4">
            {metrics.topSuppliers.map(([supplier, total], index) => (
              <div key={supplier} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">#{index + 1}</span>
                  <span className="text-sm text-gray-700">{supplier}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">₹{total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Analysis */}
      {reportType === 'category' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Food Categories</h3>
            <div className="space-y-3">
              {Object.entries(metrics.categoryTotals).map(([category, total]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{category}</span>
                  <span className="text-sm font-semibold text-gray-900">₹{total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bag Types</h3>
            <div className="space-y-3">
              {Object.entries(metrics.bagTypeTotals).map(([type, quantity]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{type}</span>
                  <span className="text-sm font-semibold text-gray-900">{quantity} bags</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trends */}
      {reportType === 'trends' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Trends</h3>
          <div className="text-center py-8 text-gray-500">
            <FaChartBar className="mx-auto text-4xl mb-2" />
            <p>Trend analysis charts will be implemented here</p>
            <p className="text-sm">Showing data for {dateRange === 'all' ? 'all time' : `last ${dateRange}`}</p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Purchase Activity</h3>
        <div className="space-y-3">
          {[...filteredBagPurchases, ...filteredFoodPurchases]
            .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
            .slice(0, 10)
            .map((purchase) => (
              <div key={purchase._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    purchase.status === 'Completed' ? 'bg-green-500' :
                    purchase.status === 'Pending' ? 'bg-yellow-500' :
                    purchase.status === 'Cancelled' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {purchase.purchaseNumber} - {purchase.supplier?.name || 'Unknown Supplier'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(purchase.purchaseDate).toLocaleDateString()} • {purchase.status}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  ₹{purchase.totalAmount?.toLocaleString() || 0}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
} 