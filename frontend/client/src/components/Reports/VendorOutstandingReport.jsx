import React, { useState } from 'react';
import { FaTruck, FaExclamationTriangle, FaFilePdf, FaFileExcel, FaPrint } from 'react-icons/fa';
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
    
    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, 40);
    
    const summaryData = [
      ['Total Vendors', reportData.summary.totalVendors.toString()],
      ['Total Outstanding', `Rs. ${(reportData.summary.totalOutstanding || 0).toLocaleString()}`],
      ['Average Outstanding', `Rs. ${(reportData.summary.averageOutstanding || 0).toLocaleString()}`],
      ['Overdue Vendors', reportData.summary.overdueVendors.toString()]
    ];
    
    doc.autoTable({
      startY: 50,
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
        vendor.supplier.name,
        vendor.supplier.contact || 'N/A',
        `Rs. ${(vendor.totalOutstanding || 0).toLocaleString()}`,
        new Date(vendor.lastPurchaseDate).toLocaleDateString()
      ]);
      
      doc.autoTable({
        startY: 30,
        head: [['Vendor', 'Contact', 'Outstanding Amount', 'Last Purchase']],
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
      ['Generated Date', new Date().toLocaleDateString()],
      [''],
      ['Metric', 'Value'],
      ['Total Vendors', reportData.summary.totalVendors],
      ['Total Outstanding', reportData.summary.totalOutstanding],
      ['Average Outstanding', reportData.summary.averageOutstanding],
      ['Overdue Vendors', reportData.summary.overdueVendors]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Vendor details sheet
    if (reportData.data && reportData.data.length > 0) {
      const vendorData = [
        ['Vendor Outstanding Details'],
        [''],
        ['Vendor Name', 'Contact', 'Address', 'Outstanding Amount', 'Last Purchase Date', 'Bag Purchases', 'Food Purchases']
      ];
      
      reportData.data.forEach(vendor => {
        const bagPurchases = vendor.bagPurchases?.length || 0;
        const foodPurchases = vendor.foodPurchases?.length || 0;
        
        vendorData.push([
          vendor.supplier.name,
          vendor.supplier.contact || 'N/A',
          vendor.supplier.address || 'N/A',
          vendor.totalOutstanding,
          new Date(vendor.lastPurchaseDate).toLocaleDateString(),
          bagPurchases,
          foodPurchases
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
          <FaTruck className="mr-2" />
          Generate Vendor Outstanding Report
        </h3>
        
        <p className="text-gray-600 mb-4">
          This report shows all vendors with outstanding payments from bag and food purchases.
        </p>
        
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
              <FaTruck className="mr-2" />
              Generate Report
            </>
          )}
        </button>
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
              <p className="text-2xl font-bold text-orange-600">Rs. {(reportData.summary.averageOutstanding || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Overdue Vendors</h4>
              <p className="text-2xl font-bold text-yellow-600">{reportData.summary.overdueVendors}</p>
            </div>
          </div>

          {/* Vendor Details */}
          {reportData.data && reportData.data.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">Vendor Outstanding Details</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.data.map((vendor, index) => {
                      const isOverdue = vendor.lastPurchaseDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{vendor.supplier.name}</div>
                              <div className="text-sm text-gray-500">{vendor.supplier.email || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vendor.supplier.contact || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {vendor.supplier.address || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-semibold text-red-600">
                              Rs. {(vendor.totalOutstanding || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(vendor.lastPurchaseDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isOverdue ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {isOverdue ? 'Overdue' : 'Current'}
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

          {/* Purchase Breakdown */}
          {reportData.data && reportData.data.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Purchase Breakdown by Vendor</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.data.map((vendor, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">{vendor.supplier.name}</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bag Purchases:</span>
                        <span className="font-medium">{vendor.bagPurchases?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Food Purchases:</span>
                        <span className="font-medium">{vendor.foodPurchases?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Outstanding:</span>
                        <span className="font-medium text-red-600">Rs. {(vendor.totalOutstanding || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Purchase:</span>
                        <span className="font-medium">{new Date(vendor.lastPurchaseDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Report State */}
      {!reportData && !loading && (
        <div className="text-center py-12">
          <FaTruck className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Vendor Outstanding Report</h3>
          <p className="text-gray-500">Click the button above to generate a comprehensive report of outstanding payments to vendors.</p>
        </div>
      )}
    </div>
  );
};

export default VendorOutstandingReport;
