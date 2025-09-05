import React, { useState } from 'react';
import { FaChartLine, FaCalendarAlt, FaFilePdf, FaFileExcel, FaPrint } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ProfitLossReport = ({ onReportGenerated }) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
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
      const response = await fetch('http://localhost:7000/api/reports/profit-loss', {
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
    doc.text('Profit & Loss Report', 105, 20, { align: 'center' });
    
    // Date range
    doc.setFontSize(12);
    doc.text(`Period: ${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`, 20, 35);
    
    // Summary
    doc.setFontSize(14);
    doc.text('Financial Summary', 20, 50);
    
    const summaryData = [
      ['Revenue', `Rs. ${(reportData.summary.revenue.total || 0).toLocaleString()}`],
      ['Cost of Goods Sold', `Rs. ${(reportData.summary.costs.cogs || 0).toLocaleString()}`],
      ['Gross Profit', `Rs. ${(reportData.summary.profit.gross || 0).toLocaleString()}`],
      ['Operating Expenses', `Rs. ${(reportData.summary.costs.expenses || 0).toLocaleString()}`],
      ['Salaries', `Rs. ${(reportData.summary.costs.salaries || 0).toLocaleString()}`],
      ['Total Costs', `Rs. ${(reportData.summary.costs.total || 0).toLocaleString()}`],
      ['Net Profit', `Rs. ${(reportData.summary.profit.net || 0).toLocaleString()}`],
      ['Profit Margin', `${reportData.summary.profit.margin.toFixed(2)}%`]
    ];
    
    doc.autoTable({
      startY: 60,
      head: [['Item', 'Amount']],
      body: summaryData,
      theme: 'grid'
    });

    // Revenue breakdown
    if (reportData.data.sales && reportData.data.sales.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Revenue Details', 20, 20);
      
      const revenueData = reportData.data.sales.map(sale => [
        new Date(sale.saleDate).toLocaleDateString(),
        sale.customer?.name || 'N/A',
        (sale.totalAmount || 0).toLocaleString()
      ]);
      
      doc.autoTable({
        startY: 30,
        head: [['Date', 'Customer', 'Amount (Rs.)']],
        body: revenueData,
        theme: 'grid'
      });
    }

    // Cost breakdown
    if (reportData.data.bagPurchases && reportData.data.bagPurchases.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Bag Purchase Costs', 20, 20);
      
      const bagData = reportData.data.bagPurchases.map(purchase => [
        new Date(purchase.purchaseDate).toLocaleDateString(),
        purchase.supplier?.name || 'N/A',
        (purchase.totalAmount || 0).toLocaleString()
      ]);
      
      doc.autoTable({
        startY: 30,
        head: [['Date', 'Supplier', 'Amount (Rs.)']],
        body: bagData,
        theme: 'grid'
      });
    }

    doc.save('profit-loss-report.pdf');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Profit & Loss Summary'],
      [''],
      ['Period', `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`],
      [''],
      ['Item', 'Amount (Rs.)'],
      ['Revenue', reportData.summary.revenue.total],
      ['Cost of Goods Sold', reportData.summary.costs.cogs],
      ['Gross Profit', reportData.summary.profit.gross],
      ['Operating Expenses', reportData.summary.costs.expenses],
      ['Salaries', reportData.summary.costs.salaries],
      ['Total Costs', reportData.summary.costs.total],
      ['Net Profit', reportData.summary.profit.net],
      ['Profit Margin (%)', reportData.summary.profit.margin]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Revenue sheet
    if (reportData.data.sales && reportData.data.sales.length > 0) {
      const revenueData = [
        ['Revenue Details'],
        [''],
        ['Date', 'Customer', 'Amount (Rs.)']
      ];
      
      reportData.data.sales.forEach(sale => {
        revenueData.push([
          new Date(sale.saleDate).toLocaleDateString(),
          sale.customer?.name || 'N/A',
          sale.totalAmount
        ]);
      });
      
      const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue');
    }

    // Costs sheet
    const costsData = [
      ['Cost Breakdown'],
      [''],
      ['Category', 'Amount (Rs.)'],
      ['Bag Purchases', reportData.summary.costs.cogs - (reportData.data.foodPurchases?.reduce((sum, p) => sum + p.totalAmount, 0) || 0)],
      ['Food Purchases', reportData.data.foodPurchases?.reduce((sum, p) => sum + p.totalAmount, 0) || 0],
      ['Operating Expenses', reportData.summary.costs.expenses],
      ['Salaries', reportData.summary.costs.salaries],
      ['Total Costs', reportData.summary.costs.total]
    ];
    
    const costsSheet = XLSX.utils.aoa_to_sheet(costsData);
    XLSX.utils.book_append_sheet(workbook, costsSheet, 'Costs');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'profit-loss-report.xlsx');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FaChartLine className="mr-2" />
          Report Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FaChartLine className="mr-2" />
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
            <h3 className="text-lg font-medium text-gray-900">Profit & Loss Report Results</h3>
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

          {/* Financial Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Rs. {(reportData.summary.revenue.total || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">Rs. {(reportData.summary.costs.total || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Costs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Rs. {(reportData.summary.profit.gross || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">Gross Profit</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${reportData.summary.profit.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rs. {(reportData.summary.profit.net || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Net Profit</div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sales Revenue</span>
                  <span className="font-medium">Rs. {(reportData.summary.revenue.sales || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Revenue</span>
                    <span>Rs. {(reportData.summary.revenue.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cost of Goods Sold</span>
                  <span className="font-medium">Rs. {(reportData.summary.costs.cogs || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Operating Expenses</span>
                  <span className="font-medium">Rs. {(reportData.summary.costs.expenses || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Salaries</span>
                  <span className="font-medium">Rs. {(reportData.summary.costs.salaries || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Costs</span>
                    <span>Rs. {(reportData.summary.costs.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profit Analysis */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Profit Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Rs. {(reportData.summary.profit.gross || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">Gross Profit</div>
                <div className="text-xs text-gray-400">
                  {reportData.summary.revenue.total > 0 ? 
                    `${((reportData.summary.profit.gross / reportData.summary.revenue.total) * 100).toFixed(2)}% of Revenue` : 
                    'N/A'
                  }
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${reportData.summary.profit.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Rs. {(reportData.summary.profit.net || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Net Profit</div>
                <div className="text-xs text-gray-400">
                  {reportData.summary.revenue.total > 0 ? 
                    `${reportData.summary.profit.margin.toFixed(2)}% of Revenue` : 
                    'N/A'
                  }
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${reportData.summary.profit.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.summary.profit.margin.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500">Profit Margin</div>
                <div className="text-xs text-gray-400">
                  {reportData.summary.profit.net >= 0 ? 'Profitable' : 'Loss Making'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Report State */}
      {!reportData && !loading && (
        <div className="text-center py-12">
          <FaChartLine className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Profit & Loss Report</h3>
          <p className="text-gray-500">Select date range to generate a comprehensive profit and loss analysis.</p>
        </div>
      )}
    </div>
  );
};

export default ProfitLossReport;
