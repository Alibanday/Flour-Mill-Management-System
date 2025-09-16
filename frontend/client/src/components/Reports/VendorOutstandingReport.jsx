import React, { useState } from 'react';
import { FaExclamationTriangle, FaFilePdf, FaFileExcel, FaPrint } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
    doc.text('Vendor Outstanding Report', 105, 20, { align: 'center' });
    
    // Generated date
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
    
    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, 50);
    
    const summaryData = [
      ['Total Vendors with Outstanding', reportData.summary.totalVendors.toString()],
      ['Total Outstanding Amount', `Rs. ${(reportData.summary.totalOutstanding || 0).toLocaleString()}`],
      ['Average Outstanding per Vendor', `Rs. ${(reportData.summary.averageOutstanding || 0).toLocaleString()}`],
      ['Overdue Vendors', reportData.summary.overdueVendors.toString()]
    ];
    
    doc.autoTable({
      startY: 60,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid'
    });

    // Vendor details
    if (reportData.data && reportData.data.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Vendor Outstanding Details', 20, 20);
      
      const vendorData = reportData.data.map(vendor => [
        vendor.supplier.name || 'N/A',
        vendor.supplier.contactPerson || 'N/A',
        vendor.supplier.phone || 'N/A',
        `Rs. ${(vendor.totalOutstanding || 0).toLocaleString()}`,
        new Date(vendor.lastPurchaseDate).toLocaleDateString()
      ]);
      
      doc.autoTable({
        startY: 30,
        head: [['Vendor', 'Contact Person', 'Phone', 'Outstanding Amount', 'Last Purchase']],
        body: vendorData,
        theme: 'grid'
      });
    }

    doc.save('vendor-outstanding-report.pdf');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Vendor Outstanding Report Summary'],
      [''],
      ['Generated', new Date().toLocaleDateString()],
      [''],
      ['Metric', 'Value'],
      ['Total Vendors with Outstanding', reportData.summary.totalVendors],
      ['Total Outstanding Amount', reportData.summary.totalOutstanding],
      ['Average Outstanding per Vendor', reportData.summary.averageOutstanding],
      ['Overdue Vendors', reportData.summary.overdueVendors]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Vendor details sheet
    if (reportData.data && reportData.data.length > 0) {
      const vendorData = [
        ['Vendor Outstanding Details'],
        [''],
        ['Vendor', 'Contact Person', 'Phone', 'Email', 'Outstanding Amount', 'Last Purchase', 'Bag Purchases', 'Food Purchases']
      ];
      
      reportData.data.forEach(vendor => {
        vendorData.push([
          vendor.supplier.name || 'N/A',
          vendor.supplier.contactPerson || 'N/A',
          vendor.supplier.phone || 'N/A',
          vendor.supplier.email || 'N/A',
          vendor.totalOutstanding,
          new Date(vendor.lastPurchaseDate).toLocaleDateString(),
          vendor.bagPurchases?.length || 0,
          vendor.foodPurchases?.length || 0
        ]);
      });
      
      const vendorSheet = XLSX.utils.aoa_to_sheet(vendorData);
      XLSX.utils.book_append_sheet(workbook, vendorSheet, 'Vendor Details');
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'vendor-outstanding-report.xlsx');
  };

  const printReport = () => {
    window.print();
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
          {/* Export Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Vendor Outstanding Report Results</h3>
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