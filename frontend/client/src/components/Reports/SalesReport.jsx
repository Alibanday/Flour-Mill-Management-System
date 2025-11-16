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
      const response = await fetch('http://localhost:7000/api/reports/sales', {
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
      if (result.success && result.data) {
        setReportData(result.data);
        onReportGenerated(result.data);
      } else {
        throw new Error(result.message || 'Failed to generate report');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    try {
      if (!reportData) {
        setError('No report data available to export');
        return;
      }

      if (typeof jsPDF === 'undefined') {
        setError('PDF export library not available. Please use Print or Excel export instead.');
        return;
      }

      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Sales Report', 105, 20, { align: 'center' });
      
      // Date range
      doc.setFontSize(12);
      const dateRange = filters.startDate && filters.endDate 
        ? `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`
        : 'All Time';
      doc.text(`Period: ${dateRange}`, 20, 35);
      
      // Summary
      doc.setFontSize(14);
      doc.text('Summary', 20, 50);
      
      const summaryData = [
        ['Total Sales', (reportData.summary?.totalSales || 0).toString()],
        ['Total Amount', `Rs. ${(reportData.summary?.totalAmount || 0).toLocaleString()}`],
        ['Total Quantity', (reportData.summary?.totalQuantity || 0).toString()],
        ['Average Order Value', `Rs. ${(reportData.summary?.averageOrderValue || 0).toLocaleString()}`]
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
          sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A',
          sale.customer?.name || sale.customer?.customerName || 'N/A',
          (sale.totalAmount || 0).toLocaleString(),
          (sale.paidAmount || 0).toLocaleString(),
          (sale.remainingAmount || sale.dueAmount || 0).toLocaleString(),
          sale.paymentStatus || 'N/A'
        ]);
        
        doc.autoTable({
          startY: 30,
          head: [['Date', 'Customer', 'Total Amount (Rs.)', 'Paid Amount (Rs.)', 'Debit/Outstanding (Rs.)', 'Payment Status']],
          body: salesData,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fontSize: 9 }
        });
      }

      doc.save('sales-report.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export PDF. Please use Print or Excel export instead.');
    }
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
        ['Date', 'Customer', 'Total Amount (Rs.)', 'Paid Amount (Rs.)', 'Debit/Outstanding (Rs.)', 'Payment Status', 'Items']
      ];
      
      reportData.data.forEach(sale => {
        const items = sale.items?.map(item => `${item.product?.name || 'N/A'} (${item.quantity})`).join(', ') || 'N/A';
        salesData.push([
          new Date(sale.saleDate).toLocaleDateString(),
          sale.customer?.name || 'N/A',
          sale.totalAmount || 0,
          sale.paidAmount || 0,
          sale.remainingAmount || sale.dueAmount || 0,
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
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow || !reportData) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            @page {
              size: A4;
              margin: 1cm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 28px;
              color: #1e40af;
              margin-bottom: 10px;
              font-weight: bold;
            }
            .header .company-info {
              font-size: 14px;
              color: #666;
              margin-top: 10px;
            }
            .report-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
              padding: 15px;
              background-color: #f8f9fa;
              border-left: 4px solid #2563eb;
            }
            .report-info div {
              flex: 1;
            }
            .report-info strong {
              color: #1e40af;
              display: block;
              margin-bottom: 5px;
              font-size: 11px;
              text-transform: uppercase;
            }
            .summary-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .summary-section h2 {
              font-size: 18px;
              color: #1e40af;
              margin-bottom: 15px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 8px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .summary-card {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #2563eb;
            }
            .summary-card .label {
              font-size: 10px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .summary-card .value {
              font-size: 20px;
              font-weight: bold;
              color: #1e40af;
            }
            .payment-breakdown {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-top: 15px;
            }
            .payment-item {
              text-align: center;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 5px;
            }
            .payment-item .count {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .payment-item.paid .count { color: #10b981; }
            .payment-item.pending .count { color: #f59e0b; }
            .payment-item.partial .count { color: #3b82f6; }
            .payment-item .label {
              font-size: 11px;
              color: #666;
              text-transform: uppercase;
            }
            .sales-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              page-break-inside: avoid;
            }
            .sales-table thead {
              background-color: #1e40af;
              color: white;
            }
            .sales-table th {
              padding: 12px 8px;
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
              font-weight: bold;
              border: 1px solid #1e3a8a;
            }
            .sales-table td {
              padding: 10px 8px;
              border: 1px solid #e5e7eb;
              font-size: 11px;
            }
            .sales-table th:nth-child(3),
            .sales-table td:nth-child(3) {
              max-width: 200px;
              word-wrap: break-word;
            }
            .sales-table tbody tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .sales-table tbody tr:hover {
              background-color: #e0e7ff;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-paid {
              background-color: #d1fae5;
              color: #065f46;
            }
            .status-pending {
              background-color: #fef3c7;
              color: #92400e;
            }
            .status-partial {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            .items-list {
              font-size: 10px;
              color: #666;
            }
            .items-list span {
              display: inline-block;
              margin-right: 8px;
              margin-bottom: 3px;
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SALES REPORT</h1>
            <div class="company-info">
              <div>Floor Mill Management System</div>
              <div>Generated on: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
          </div>

          <div class="report-info">
            <div>
              <strong>Report Period</strong>
              ${new Date(reportData.dateRange.startDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} - ${new Date(reportData.dateRange.endDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div>
              <strong>Report Type</strong>
              Sales Report
            </div>
            <div>
              <strong>Total Records</strong>
              ${reportData.summary.totalSales} Sales
            </div>
          </div>

          <div class="summary-section">
            <h2>Summary</h2>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="label">Total Sales</div>
                <div class="value">${reportData.summary.totalSales}</div>
              </div>
              <div class="summary-card">
                <div class="label">Total Amount</div>
                <div class="value">Rs. ${(reportData.summary.totalAmount || 0).toLocaleString()}</div>
              </div>
              <div class="summary-card">
                <div class="label">Total Quantity</div>
                <div class="value">${reportData.summary.totalQuantity}</div>
              </div>
              <div class="summary-card">
                <div class="label">Average Order Value</div>
                <div class="value">Rs. ${(reportData.summary.averageOrderValue || 0).toLocaleString()}</div>
              </div>
            </div>

            <div class="payment-breakdown">
              <div class="payment-item paid">
                <div class="count">${reportData.summary.paymentBreakdown.paid}</div>
                <div class="label">Paid Orders</div>
              </div>
              <div class="payment-item pending">
                <div class="count">${reportData.summary.paymentBreakdown.pending}</div>
                <div class="label">Pending Orders</div>
              </div>
              <div class="payment-item partial">
                <div class="count">${reportData.summary.paymentBreakdown.partial}</div>
                <div class="label">Partial Orders</div>
              </div>
            </div>
          </div>

          <div class="summary-section">
            <h2>Sales Details</h2>
            <table class="sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Quantity</th>
                  <th>Total Amount (Rs.)</th>
                  <th>Paid Amount (Rs.)</th>
                  <th>Debit/Outstanding (Rs.)</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.data && reportData.data.length > 0 ? reportData.data.map((sale, index) => {
                  const saleDate = new Date(sale.saleDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  const customerName = sale.customer?.name || sale.customer?.customerName || 'N/A';
                  const items = sale.items || [];
                  const itemsList = items.map(item => 
                    `${item.product?.name || item.productName || 'N/A'} (${item.quantity || 0})`
                  ).join(', ') || 'N/A';
                  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                  const totalAmount = (sale.totalAmount || 0).toLocaleString();
                  const paidAmount = (sale.paidAmount || 0).toLocaleString();
                  const debitAmount = (sale.remainingAmount || sale.dueAmount || 0).toLocaleString();
                  const paymentStatus = (sale.paymentStatus || 'pending').toLowerCase();
                  const statusClass = paymentStatus === 'paid' ? 'status-paid' : 
                                     paymentStatus === 'pending' ? 'status-pending' : 'status-partial';
                  
                  return `
                    <tr>
                      <td>${saleDate}</td>
                      <td><strong>${customerName}</strong></td>
                      <td class="items-list">${itemsList}</td>
                      <td>${totalQuantity}</td>
                      <td><strong>Rs. ${totalAmount}</strong></td>
                      <td style="color: #10b981; font-weight: 600;">Rs. ${paidAmount}</td>
                      <td style="color: #ef4444; font-weight: 600;">Rs. ${debitAmount}</td>
                      <td><span class="status-badge ${statusClass}">${paymentStatus}</span></td>
                    </tr>
                  `;
                }).join('') : '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #666;">No sales data available</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>This report was generated automatically by the Floor Mill Management System</p>
            <p>Report ID: ${reportData.reportType.toUpperCase()}-${Date.now()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Close the window after printing (optional)
      // printWindow.close();
    }, 250);
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                min={filters.startDate || undefined}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
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
              <p className="text-2xl font-bold text-gray-900">Rs. {(reportData.summary.totalAmount || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Quantity</h4>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalQuantity}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Average Order Value</h4>
              <p className="text-2xl font-bold text-gray-900">Rs. {(reportData.summary.averageOrderValue || 0).toLocaleString()}</p>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          Rs. {(sale.totalAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          Rs. {(sale.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                          Rs. {(sale.remainingAmount || sale.dueAmount || 0).toLocaleString()}
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