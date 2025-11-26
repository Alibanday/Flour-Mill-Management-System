import React, { useState } from 'react';
import { FaChartLine, FaCalendarAlt, FaPrint } from 'react-icons/fa';

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
      if (result.success && result.data) {
      setReportData(result.data);
      if (onReportGenerated && typeof onReportGenerated === 'function') {
        onReportGenerated(result.data);
      }
      } else {
        throw new Error(result.message || 'Failed to generate report');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    if (!reportData) {
      alert('Generate the report before printing.');
      return;
    }

    const start = new Date(filters.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const end = new Date(filters.endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const generatedAt = new Date().toLocaleString();

    const safeText = (text) => {
      if (!text) return '';
      return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    const formatCurrency = (value) =>
      `Rs. ${(Number(value) || 0).toLocaleString()}`;

    const revenueRows = (reportData.data.sales || [])
      .map(sale => `
        <tr>
          <td>${safeText(new Date(sale.saleDate).toLocaleDateString())}</td>
          <td>${safeText(sale.customer?.name || 'N/A')}</td>
          <td class="num">${formatCurrency(sale.totalAmount)}</td>
        </tr>
      `).join('') || `
        <tr><td colspan="3" class="empty">No revenue entries recorded</td></tr>
      `;

    const costRows = [
      ['Cost of Goods Sold', reportData.summary.costs.cogs],
      ['Operating Expenses', reportData.summary.costs.expenses],
      ['Salaries', reportData.summary.costs.salaries],
      ['Other Costs', (reportData.summary.costs.total || 0) - ((reportData.summary.costs.cogs || 0) + (reportData.summary.costs.expenses || 0) + (reportData.summary.costs.salaries || 0))]
    ].map(([label, value]) => `
      <tr>
        <td>${safeText(label)}</td>
        <td class="num">${formatCurrency(value)}</td>
      </tr>
    `).join('');

    const profitSummary = [
      ['Total Revenue', reportData.summary.revenue.total],
      ['Total Costs', reportData.summary.costs.total],
      ['Gross Profit', reportData.summary.profit.gross],
      ['Net Profit', reportData.summary.profit.net],
      ['Profit Margin', `${(reportData.summary.profit.margin || 0).toFixed(2)}%`]
    ].map(([label, value]) => `
      <div class="summary-card">
        <div class="label">${safeText(label)}</div>
        <div class="value">${typeof value === 'string' && value.includes('%') ? value : formatCurrency(value)}</div>
      </div>
    `).join('');

    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Profit & Loss Report - Flour Mill</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #111827; }
            .header { border-bottom: 4px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 24px; font-weight: 700; color: #1e3a8a; }
            .subtitle { color: #6b7280; margin-top: 4px; }
            .date-range { font-size: 12px; color: #6b7280; margin-top: 8px; }
            .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 20px 0; }
            .summary-card { background: #f8fafc; border-left: 4px solid #2563eb; padding: 10px; border-radius: 6px; }
            .summary-card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
            .summary-card .value { font-size: 18px; font-weight: 700; margin-top: 6px; color: #0f172a; }
            h2 { font-size: 16px; margin-top: 25px; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th, td { padding: 8px; font-size: 12px; }
            th { background: #1d4ed8; color: #fff; text-align: left; text-transform: uppercase; letter-spacing: 0.03em; }
            tr:nth-child(even) { background: #f8fafc; }
            .num { text-align: right; font-weight: 600; }
            .empty { text-align: center; font-style: italic; color: #9ca3af; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 25px; padding-top: 8px; font-size: 11px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Profit & Loss Report</div>
            <div class="subtitle">Flour Mill Financial Performance Overview</div>
            <div class="date-range">
              Reporting Period: ${safeText(start)} - ${safeText(end)} | Generated: ${safeText(generatedAt)}
            </div>
          </div>

          <section>
            <h2>Executive Summary</h2>
            <div class="summary-grid">
              ${profitSummary}
            </div>
          </section>

          <section>
            <h2>Revenue Details</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Date</th>
                  <th>Customer</th>
                  <th style="width: 20%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${revenueRows}
              </tbody>
            </table>
          </section>

          <section>
            <h2>Cost Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th style="width: 25%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${costRows}
              </tbody>
            </table>
          </section>

          <section>
            <h2>Net Profit Analysis</h2>
            <table>
              <tbody>
                <tr>
                  <td>Total Revenue</td>
                  <td class="num">${formatCurrency(reportData.summary.revenue.total)}</td>
                </tr>
                <tr>
                  <td>Total Costs</td>
                  <td class="num">${formatCurrency(reportData.summary.costs.total)}</td>
                </tr>
                <tr>
                  <td>Gross Profit</td>
                  <td class="num">${formatCurrency(reportData.summary.profit.gross)}</td>
                </tr>
                <tr>
                  <td>Net Profit</td>
                  <td class="num">${formatCurrency(reportData.summary.profit.net)}</td>
                </tr>
                <tr>
                  <td>Profit Margin</td>
                  <td class="num">${(reportData.summary.profit.margin || 0).toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div class="footer">
            FlourMill Management System · This report is confidential and intended for internal financial review
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
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
            <button
              onClick={printReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
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
