import React, { useState } from 'react';
import { FaExclamationTriangle, FaPrint } from 'react-icons/fa';

const VendorOutstandingReport = ({ onReportGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:7000/api/reports/vendor-outstanding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
      alert('Please generate the report before printing.');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format currency helper
    const formatCurrency = (amount) => {
      return `Rs. ${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Safe text helper
    const safeText = (text) => {
      if (!text) return 'N/A';
      return String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    // Generate vendor rows
    const vendorRows = reportData.data.map((vendor) => {
      const isOverdue = new Date(vendor.lastPurchaseDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const statusText = isOverdue ? 'Overdue' : 'Pending';
      const statusClass = isOverdue ? 'status-overdue' : 'status-pending';
      
      return `
        <tr>
          <td>${safeText(vendor.supplier.name)}</td>
          <td>${safeText(vendor.supplier.contactPerson)}</td>
          <td>${safeText(vendor.supplier.phone)}</td>
          <td class="text-right">${formatCurrency(vendor.totalOutstanding)}</td>
          <td>${new Date(vendor.lastPurchaseDate).toLocaleDateString('en-US')}</td>
          <td class="${statusClass}">${statusText}</td>
        </tr>
      `;
    }).join('');

    // Generate summary cards HTML
    const summaryCards = `
      <div class="summary-card">
        <div class="summary-label">Total Vendors</div>
        <div class="summary-value">${reportData.summary.totalVendors || 0}</div>
      </div>
      <div class="summary-card highlight">
        <div class="summary-label">Total Outstanding</div>
        <div class="summary-value highlight-value">${formatCurrency(reportData.summary.totalOutstanding)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Average Outstanding</div>
        <div class="summary-value">${formatCurrency(reportData.summary.averageOutstanding)}</div>
      </div>
      <div class="summary-card warning">
        <div class="summary-label">Overdue Vendors</div>
        <div class="summary-value warning-value">${reportData.summary.overdueVendors || 0}</div>
      </div>
    `;

    // Create print window with professional layout
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vendor Outstanding Report - ${currentDate}</title>
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
              padding: 10px;
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
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 15px;
            }
            .summary-card {
              background: white;
              padding: 12px;
              border-left: 4px solid #2563eb;
              border-radius: 3px;
            }
            .summary-card.highlight {
              border-left-color: #dc2626;
            }
            .summary-card.warning {
              border-left-color: #f59e0b;
            }
            .summary-label {
              font-size: 10px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
              font-weight: 600;
            }
            .summary-value {
              font-size: 18px;
              font-weight: 700;
              color: #111827;
            }
            .summary-value.highlight-value {
              color: #dc2626;
            }
            .summary-value.warning-value {
              color: #f59e0b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 11px;
            }
            th {
              background-color: #1e40af;
              color: white;
              padding: 10px 8px;
              text-align: left;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: 1px solid #1e3a8a;
            }
            td {
              padding: 8px;
              border: 1px solid #e5e7eb;
              color: #111827;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            tr:hover {
              background-color: #f3f4f6;
            }
            .text-right {
              text-align: right;
              font-weight: 600;
            }
            .status-pending {
              color: #f59e0b;
              font-weight: 600;
            }
            .status-overdue {
              color: #dc2626;
              font-weight: 700;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 10px;
              color: #6b7280;
            }
            .no-data {
              text-align: center;
              padding: 40px;
              color: #6b7280;
              font-style: italic;
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead {
                display: table-header-group;
              }
              tfoot {
                display: table-footer-group;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Vendor Outstanding Report</h1>
            <div class="subtitle">Flour Mill Management System</div>
            <div class="date">Generated on ${currentDate} at ${currentTime}</div>
          </div>

          <div class="summary-section">
            <h2 style="font-size: 14px; font-weight: 600; margin-bottom: 15px; color: #111827;">Summary</h2>
            <div class="summary-grid">
              ${summaryCards}
            </div>
          </div>

          <div style="margin-top: 25px;">
            <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 15px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
              Vendor Outstanding Details
            </h2>
            ${reportData.data && reportData.data.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Outstanding Amount</th>
                    <th>Last Purchase</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${vendorRows}
                </tbody>
                <tfoot>
                  <tr style="background-color: #1e40af; color: white; font-weight: 700;">
                    <td colspan="3" style="text-align: right; padding: 12px 8px;">TOTAL OUTSTANDING:</td>
                    <td class="text-right" style="color: white;">${formatCurrency(reportData.summary.totalOutstanding)}</td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            ` : `
              <div class="no-data">
                <p>No outstanding payments found. All vendors are up to date with their payments.</p>
              </div>
            `}
          </div>

          <div class="footer">
            Flour Mill Management System · This report contains confidential financial information
          </div>
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
      {/* Generate Button */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FaExclamationTriangle className="mr-2" />
          Vendor Outstanding Report
        </h3>
        
        <p className="text-gray-600 mb-4">
          Generate a report showing all vendors with outstanding payments. This report includes both bag and food purchase outstanding amounts.
        </p>
        
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
                <FaExclamationTriangle className="mr-2" />
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
          {/* Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Vendor Outstanding Report Results</h3>
            <button
              onClick={printReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Vendors</h4>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalVendors}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Total Outstanding</h4>
              <p className="text-2xl font-bold text-red-600">Rs. {(reportData.summary.totalOutstanding || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Average Outstanding</h4>
              <p className="text-2xl font-bold text-gray-900">Rs. {(reportData.summary.averageOutstanding || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Overdue Vendors</h4>
              <p className="text-2xl font-bold text-orange-600">{reportData.summary.overdueVendors}</p>
            </div>
          </div>

          {/* Vendor Data Table */}
          {reportData.data && reportData.data.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Vendor Outstanding Details</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.data.map((vendor, index) => {
                      const isOverdue = new Date(vendor.lastPurchaseDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vendor.supplier.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vendor.supplier.contactPerson || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vendor.supplier.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rs. {(vendor.totalOutstanding || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(vendor.lastPurchaseDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
              <FaExclamationTriangle className="mx-auto text-4xl text-green-500 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Outstanding Payments</h4>
              <p className="text-gray-500">All vendors are up to date with their payments.</p>
            </div>
          )}
        </div>
      )}

      {/* No Report State */}
      {!reportData && !loading && (
        <div className="text-center py-12">
          <FaExclamationTriangle className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Vendor Outstanding Report</h3>
          <p className="text-gray-500">Click the button above to generate a report of all vendors with outstanding payments.</p>
        </div>
      )}
    </div>
  );
};

export default VendorOutstandingReport;