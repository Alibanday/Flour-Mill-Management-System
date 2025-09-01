import React, { useState } from 'react';
import { FaWarehouse, FaBoxes, FaExclamationTriangle, FaFilePdf, FaFileExcel, FaPrint } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
      const response = await fetch('/api/reports/inventory', {
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
    doc.text('Inventory Report', 105, 20, { align: 'center' });
    
    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, 40);
    
    const summaryData = [
      ['Total Items', reportData.summary.totalItems.toString()],
      ['Total Warehouses', reportData.summary.totalWarehouses.toString()],
      ['Low Stock Items', reportData.summary.lowStockItems.toString()],
      ['Out of Stock Items', reportData.summary.outOfStockItems.toString()],
      ['Total Value', `Rs. ${reportData.summary.totalValue.toLocaleString()}`]
    ];
    
    doc.autoTable({
      startY: 50,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid'
    });

    // Warehouse breakdown
    if (Object.keys(reportData.summary.warehouseBreakdown).length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Warehouse Breakdown', 20, 20);
      
      const warehouseData = Object.entries(reportData.summary.warehouseBreakdown).map(([name, data]) => [
        name,
        data.items.toString(),
        `Rs. ${data.value.toLocaleString()}`,
        data.lowStock.toString()
      ]);
      
      doc.autoTable({
        startY: 30,
        head: [['Warehouse', 'Items', 'Value', 'Low Stock']],
        body: warehouseData,
        theme: 'grid'
      });
    }

    // Inventory details
    if (reportData.data && reportData.data.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Inventory Details', 20, 20);
      
      const inventoryData = reportData.data.map(item => [
        item.product?.name || 'N/A',
        item.warehouse?.name || 'N/A',
        item.quantity.toString(),
        item.unit || 'N/A',
        `Rs. ${item.unitPrice?.toLocaleString() || '0'}`,
        `Rs. ${(item.quantity * (item.unitPrice || 0)).toLocaleString()}`
      ]);
      
      doc.autoTable({
        startY: 30,
        head: [['Product', 'Warehouse', 'Quantity', 'Unit', 'Unit Price', 'Total Value']],
        body: inventoryData,
        theme: 'grid'
      });
    }

    doc.save('inventory-report.pdf');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Items', reportData.summary.totalItems],
      ['Total Warehouses', reportData.summary.totalWarehouses],
      ['Low Stock Items', reportData.summary.lowStockItems],
      ['Out of Stock Items', reportData.summary.outOfStockItems],
      ['Total Value', reportData.summary.totalValue]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Warehouse breakdown sheet
    if (Object.keys(reportData.summary.warehouseBreakdown).length > 0) {
      const warehouseData = [
        ['Warehouse', 'Items', 'Value', 'Low Stock']
      ];
      
      Object.entries(reportData.summary.warehouseBreakdown).forEach(([name, data]) => {
        warehouseData.push([
          name,
          data.items,
          data.value,
          data.lowStock
        ]);
      });
      
      const warehouseSheet = XLSX.utils.aoa_to_sheet(warehouseData);
      XLSX.utils.book_append_sheet(workbook, warehouseSheet, 'Warehouse Breakdown');
    }

    // Inventory details sheet
    if (reportData.data && reportData.data.length > 0) {
      const inventoryData = [
        ['Product', 'Warehouse', 'Quantity', 'Unit', 'Unit Price', 'Total Value', 'Reorder Level', 'Status']
      ];
      
      reportData.data.forEach(item => {
        const totalValue = item.quantity * (item.unitPrice || 0);
        const status = item.quantity === 0 ? 'Out of Stock' : 
                      item.quantity <= (item.reorderLevel || 0) ? 'Low Stock' : 'In Stock';
        
        inventoryData.push([
          item.product?.name || 'N/A',
          item.warehouse?.name || 'N/A',
          item.quantity,
          item.unit || 'N/A',
          item.unitPrice || 0,
          totalValue,
          item.reorderLevel || 0,
          status
        ]);
      });
      
      const inventorySheet = XLSX.utils.aoa_to_sheet(inventoryData);
      XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Inventory Details');
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'inventory-report.xlsx');
  };

  const printReport = () => {
    window.print();
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
              <p className="text-2xl font-bold text-gray-900">Rs. {reportData.summary.totalValue.toLocaleString()}</p>
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
                        <span className="font-medium">Rs. {data.value.toLocaleString()}</span>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.data.map((item, index) => {
                      const totalValue = item.quantity * (item.unitPrice || 0);
                      const status = item.quantity === 0 ? 'Out of Stock' : 
                                    item.quantity <= (item.reorderLevel || 0) ? 'Low Stock' : 'In Stock';
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.product?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.warehouse?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.unit || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rs. {item.unitPrice?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rs. {totalValue.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              status === 'Out of Stock' ? 'bg-red-100 text-red-800' :
                              status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
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
