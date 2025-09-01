import React, { useState } from 'react';
import { FaCalendarAlt, FaFilter, FaDownload, FaFilePdf, FaFileExcel, FaPrint, FaChartLine } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const SalesReport = ({ onReportGenerated }) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customer: '',
    productType: '',
    paymentStatus: ''
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      setReportData(result.data);
      onReportGenerated(result.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Sales Report', 105, 20, { align: 'center' });
    
    // Date range
    doc.setFontSize(12);
    doc.text(`Period: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`, 20, 35);
    
    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, 50);
    
    const summaryData = [
      ['Total Sales', reportData.summary.totalSales.toString()],
      ['Total Amount', `Rs. ${reportData.summary.totalAmount.toLocaleString()}`],
      ['Total Quantity', reportData.summary.totalQuantity.toString()],
      ['Average Order Value', `Rs. ${reportData.summary.averageOrderValue.toLocaleString()}`]
    ];
    
    doc.autoTable({
      startY: 60,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid'
    });

    // Sales data
    if (reportData.data && reportData.data.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Sales Details', 20, 20);
      
      const salesData = reportData.data.map(sale => [
        new Date(sale.saleDate).toLocaleDateString(),
        sale.customer?.name || 'N/A',
        sale.totalAmount.toLocaleString(),
        sale.paymentStatus
      ]);
      
      doc.autoTable({
        startY: 30,
        head: [['Date', 'Customer', 'Amount (Rs.)', 'Payment Status']],
        body: salesData,
        theme: 'grid'
      });
    }

    doc.save('sales-report.pdf');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Sales', reportData.summary.totalSales],
      ['Total Amount', reportData.summary.totalAmount],
      ['Total Quantity', reportData.summary.totalQuantity],
      ['Average Order Value', reportData.summary.averageOrderValue],
      ['Paid Orders', reportData.summary.paymentBreakdown.paid],
      ['Pending Orders', reportData.summary.paymentBreakdown.pending],
      ['Partial Orders', reportData.summary.paymentBreakdown.partial]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sales data sheet
    if (reportData.data && reportData.data.length > 0) {
      const salesData = [
        ['Date', 'Customer', 'Amount (Rs.)', 'Payment Status', 'Items']
      ];
      
      reportData.data.forEach(sale => {
        const items = sale.items?.map(item => `${item.product?.name || 'N/A'} (${item.quantity})`).join(', ') || 'N/A';
        salesData.push([
          new Date(sale.saleDate).toLocaleDateString(),
          sale.customer?.name || 'N/A',
          sale.totalAmount,
          sale.paymentStatus,
          items
        ]);
      });
      
      const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales Data');
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'sales-report.xlsx');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FaFilter className="mr-2" />
          Report Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              name="paymentStatus"
              value={filters.paymentStatus}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={generateReport}
            disabled={loading || !filters.startDate || !filters.endDate}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FaDownload className="mr-2" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Export Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Sales Report Results</h3>
            <div className="flex space-x-3">
              <button
                onClick={printReport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaPrint className="mr-2" />
                Print
              </button>
              <button
                onClick={exportToPDF}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaFilePdf className="mr-2" />
                Export PDF
              </button>
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaFileExcel className="mr-2" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Sales</h4>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalSales}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Amount</h4>
              <p className="text-2xl font-bold text-gray-900">Rs. {reportData.summary.totalAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Quantity</h4>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalQuantity}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Average Order Value</h4>
              <p className="text-2xl font-bold text-gray-900">Rs. {reportData.summary.averageOrderValue.toLocaleString()}</p>
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Status Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{reportData.summary.paymentBreakdown.paid}</div>
                <div className="text-sm text-gray-500">Paid Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{reportData.summary.paymentBreakdown.pending}</div>
                <div className="text-sm text-gray-500">Pending Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{reportData.summary.paymentBreakdown.partial}</div>
                <div className="text-sm text-gray-500">Partial Orders</div>
              </div>
            </div>
          </div>

          {/* Sales Data Table */}
          {reportData.data && reportData.data.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Sales Details</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.data.map((sale, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.customer?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {sale.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            sale.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {sale.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {sale.items?.map(item => `${item.product?.name || 'N/A'} (${item.quantity})`).join(', ') || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Report State */}
      {!reportData && !loading && (
        <div className="text-center py-12">
          <FaChartLine className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Sales Report</h3>
          <p className="text-gray-500">Select date range and filters to generate a comprehensive sales report.</p>
        </div>
      )}
    </div>
  );
};

export default SalesReport; 