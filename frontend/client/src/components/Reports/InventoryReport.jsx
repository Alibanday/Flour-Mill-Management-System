import React, { useState } from 'react';
import { FaWarehouse, FaBoxes, FaExclamationTriangle, FaPrint } from 'react-icons/fa';

const InventoryReport = ({ onReportGenerated }) => {
  const [filters, setFilters] = useState({
    warehouseId: ''
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
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:7000/api/reports/inventory', {
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
        console.log('Inventory Report Data:', result.data); // Debug log
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
      alert('Please generate a report first before printing.');
      return;
    }

    // Generate HTML content
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Summary cards HTML
    const summaryCards = `
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Items</h3>
          <div class="value">${reportData.summary.totalItems}</div>
        </div>
        <div class="summary-card">
          <h3>Total Warehouses</h3>
          <div class="value">${reportData.summary.totalWarehouses}</div>
        </div>
        <div class="summary-card">
          <h3>Low Stock Items</h3>
          <div class="value" style="color: #d97706;">${reportData.summary.lowStockItems}</div>
        </div>
        <div class="summary-card">
          <h3>Out of Stock</h3>
          <div class="value" style="color: #dc2626;">${reportData.summary.outOfStockItems}</div>
        </div>
        <div class="summary-card">
          <h3>Total Value</h3>
          <div class="value">Rs. ${(reportData.summary.totalValue || 0).toLocaleString()}</div>
        </div>
      </div>
    `;

    // Warehouse breakdown HTML
    const warehouseBreakdown = Object.keys(reportData.summary.warehouseBreakdown || {}).length > 0 ? `
      <div class="warehouse-breakdown">
        <h2>Warehouse Breakdown</h2>
        <div class="warehouse-grid">
          ${Object.entries(reportData.summary.warehouseBreakdown).map(([name, data]) => `
            <div class="warehouse-item">
              <h3>${name}</h3>
              <div class="detail">
                <span class="detail-label">Items:</span>
                <span class="detail-value">${data.items || 0}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Value:</span>
                <span class="detail-value">Rs. ${(data.value || 0).toLocaleString()}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Low Stock:</span>
                <span class="detail-value" style="color: #d97706;">${data.lowStock || 0}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Table rows HTML
    const tableRows = reportData.data && reportData.data.length > 0 ? reportData.data.map((item) => {
      const totalValue = (item.quantity || 0) * (item.unitPrice || 0);
      const status = item.status || (
        item.quantity === 0 ? 'Out of Stock' : 
        item.quantity <= (item.reorderLevel || 0) ? 'Low Stock' : 'In Stock'
      );
      
      let statusClass = 'status-in';
      if (status === 'Out of Stock' || status === 'out of stock') {
        statusClass = 'status-out';
      } else if (status === 'Low Stock' || status === 'low stock') {
        statusClass = 'status-low';
      }

      const productName = (item.product?.name || 'N/A').replace(/"/g, '&quot;');
      const productCode = (item.product?.code || item.code || 'N/A').replace(/"/g, '&quot;');
      const warehouseName = (item.warehouse?.name || 'N/A').replace(/"/g, '&quot;');
      
      return `
        <tr>
          <td>${productName}</td>
          <td>${productCode}</td>
          <td>${warehouseName}</td>
          <td style="text-align: right;">${(item.quantity || 0).toLocaleString()}</td>
          <td>${(item.unit || 'N/A').replace(/"/g, '&quot;')}</td>
          <td style="text-align: right;">Rs. ${(item.unitPrice || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 600;">Rs. ${totalValue.toLocaleString()}</td>
          <td style="text-align: right;">${(item.reorderLevel || 0).toLocaleString()}</td>
          <td><span class="status-badge ${statusClass}">${status.replace(/"/g, '&quot;')}</span></td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="9" style="text-align: center; padding: 20px;">No inventory items found</td></tr>';

    const reportHTML = `
      <div class="print-header">
        <h1>Inventory Report</h1>
        <div class="subtitle">Comprehensive Inventory Analysis Across All Warehouses</div>
        <div class="date">Generated on ${currentDate} at ${currentTime}</div>
      </div>

      <div class="summary-section">
        <h2 style="font-size: 14px; margin-bottom: 10px; color: #111827; font-weight: 600;">Executive Summary</h2>
        ${summaryCards}
      </div>

      ${warehouseBreakdown}

      <div class="table-section">
        <h2>Detailed Inventory List</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Code</th>
              <th>Warehouse</th>
              <th style="text-align: right;">Quantity</th>
              <th>Unit</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total Value</th>
              <th style="text-align: right;">Reorder Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>

      <div class="print-footer">
        <p>This report was generated by FlourMill Management System</p>
        <p>For any queries, please contact the system administrator</p>
      </div>
    `;

    // Create a new window for printing with professional layout
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Report - ${currentDate}</title>
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
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 12px;
              color: #000;
              line-height: 1.4;
            }
            .print-header {
              border-bottom: 3px solid #2563eb;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .print-header h1 {
              font-size: 24px;
              color: #1e40af;
              margin-bottom: 5px;
              font-weight: 700;
            }
            .print-header .subtitle {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 10px;
            }
            .print-header .date {
              font-size: 11px;
              color: #9ca3af;
            }
            .summary-section {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 15px;
              margin-bottom: 15px;
            }
            .summary-card {
              background: white;
              padding: 12px;
              border-left: 4px solid #2563eb;
              border-radius: 3px;
            }
            .summary-card h3 {
              font-size: 10px;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 5px;
              font-weight: 600;
            }
            .summary-card .value {
              font-size: 18px;
              font-weight: 700;
              color: #111827;
            }
            .warehouse-breakdown {
              margin-bottom: 20px;
            }
            .warehouse-breakdown h2 {
              font-size: 16px;
              color: #111827;
              margin-bottom: 10px;
              font-weight: 600;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .warehouse-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin-bottom: 15px;
            }
            .warehouse-item {
              background: #f9fafb;
              padding: 10px;
              border: 1px solid #e5e7eb;
              border-radius: 3px;
            }
            .warehouse-item h3 {
              font-size: 12px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 8px;
            }
            .warehouse-item .detail {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              padding: 2px 0;
            }
            .warehouse-item .detail-label {
              color: #6b7280;
            }
            .warehouse-item .detail-value {
              color: #111827;
              font-weight: 600;
            }
            .table-section h2 {
              font-size: 16px;
              color: #111827;
              margin-bottom: 10px;
              font-weight: 600;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              page-break-inside: auto;
            }
            thead {
              background: #1e40af;
              color: white;
            }
            thead th {
              padding: 10px 8px;
              text-align: left;
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            tbody tr {
              border-bottom: 1px solid #e5e7eb;
              page-break-inside: avoid;
            }
            tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            tbody td {
              padding: 8px;
              font-size: 11px;
              color: #111827;
            }
            tbody td:first-child {
              font-weight: 600;
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: 600;
              display: inline-block;
            }
            .status-out {
              background: #fee2e2;
              color: #991b1b;
            }
            .status-low {
              background: #fef3c7;
              color: #92400e;
            }
            .status-in {
              background: #d1fae5;
              color: #065f46;
            }
            .print-footer {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 10px;
              color: #6b7280;
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
          ${reportHTML}
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.afterprint = () => printWindow.close();
      }, 250);
    };
  };

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FaWarehouse className="mr-2" />
          Report Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse (Optional)
            </label>
            <select
              name="warehouseId"
              value={filters.warehouseId}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Warehouses</option>
              {/* Warehouse options would be populated from API */}
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FaBoxes className="mr-2" />
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
            <h3 className="text-lg font-medium text-gray-900">Inventory Report Results</h3>
            <button
              onClick={printReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Items</h4>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Warehouses</h4>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalWarehouses}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Low Stock Items</h4>
              <p className="text-2xl font-bold text-yellow-600">{reportData.summary.lowStockItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Out of Stock</h4>
              <p className="text-2xl font-bold text-red-600">{reportData.summary.outOfStockItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Value</h4>
              <p className="text-2xl font-bold text-gray-900">Rs. {(reportData.summary.totalValue || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Warehouse Breakdown */}
          {Object.keys(reportData.summary.warehouseBreakdown).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Warehouse Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(reportData.summary.warehouseBreakdown).map(([name, data]) => (
                  <div key={name} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">{name}</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items:</span>
                        <span className="font-medium">{data.items}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-medium">Rs. {(data.value || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Low Stock:</span>
                        <span className="font-medium text-yellow-600">{data.lowStock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Data Table */}
          {reportData.data && reportData.data.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Inventory Details</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.data.map((item, index) => {
                      const totalValue = (item.quantity || 0) * (item.unitPrice || 0);
                      // Use status from backend if available, otherwise calculate
                      const status = item.status || (
                        item.quantity === 0 ? 'Out of Stock' : 
                        item.quantity <= (item.reorderLevel || 0) ? 'Low Stock' : 'In Stock'
                      );
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.product?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.product?.code || item.code || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.warehouse?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(item.quantity || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.unit || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rs. {(item.unitPrice || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            Rs. {totalValue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(item.reorderLevel || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              status === 'Out of Stock' || status === 'out of stock' ? 'bg-red-100 text-red-800' :
                              status === 'Low Stock' || status === 'low stock' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
          <FaBoxes className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Inventory Report</h3>
          <p className="text-gray-500">Click the button above to generate a comprehensive inventory report across all warehouses.</p>
        </div>
      )}
    </div>
  );
};

export default InventoryReport;
