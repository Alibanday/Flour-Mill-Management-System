import React, { useState, useEffect } from 'react';
import { FaChartLine, FaDownload, FaPrint, FaFilePdf, FaFileExcel, FaCalendarAlt, FaFilter, FaEye } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import SalesReport from '../components/Reports/SalesReport';
import InventoryReport from '../components/Reports/InventoryReport';
import ProfitLossReport from '../components/Reports/ProfitLossReport';
import ExpenseReport from '../components/Reports/ExpenseReport';
import SalaryReport from '../components/Reports/SalaryReport';
import VendorOutstandingReport from '../components/Reports/VendorOutstandingReport';
import ReportHistory from '../components/Reports/ReportHistory';

const ReportsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const reportTabs = [
    {
      id: 'sales',
      name: 'Sales Report',
      icon: <FaChartLine />,
      description: 'Generate sales reports by date range with customer and product filters'
    },
    {
      id: 'inventory',
      name: 'Inventory Report',
      icon: <FaChartLine />,
      description: 'View inventory status across all warehouses with stock levels'
    },
    {
      id: 'profit-loss',
      name: 'Profit & Loss',
      icon: <FaChartLine />,
      description: 'Analyze revenue, costs, and profitability over time periods'
    },
    {
      id: 'expense',
      name: 'Expense Report',
      icon: <FaChartLine />,
      description: 'Track expenses by category and date range'
    },
    {
      id: 'salary',
      name: 'Employee Salary',
      icon: <FaChartLine />,
      description: 'Generate salary reports by department and time period'
    },
    {
      id: 'vendor-outstanding',
      name: 'Vendor Outstanding',
      icon: <FaChartLine />,
      description: 'View outstanding payments to suppliers and vendors'
    }
  ];

  const renderReportComponent = () => {
    switch (activeTab) {
      case 'sales':
        return <SalesReport onReportGenerated={setReportData} />;
      case 'inventory':
        return <InventoryReport onReportGenerated={setReportData} />;
      case 'profit-loss':
        return <ProfitLossReport onReportGenerated={setReportData} />;
      case 'expense':
        return <ExpenseReport onReportGenerated={setReportData} />;
      case 'salary':
        return <SalaryReport onReportGenerated={setReportData} />;
      case 'vendor-outstanding':
        return <VendorOutstandingReport onReportGenerated={setReportData} />;
      default:
        return <SalesReport onReportGenerated={setReportData} />;
    }
  };

  const handlePrint = () => {
    if (reportData) {
      window.print();
    }
  };

  const handleExportPDF = () => {
    if (reportData) {
      // PDF export functionality will be implemented in individual report components
      console.log('Exporting to PDF:', reportData);
    }
  };

  const handleExportExcel = () => {
    if (reportData) {
      // Excel export functionality will be implemented in individual report components
      console.log('Exporting to Excel:', reportData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports Module</h1>
              <p className="mt-2 text-sm text-gray-600">
                Generate comprehensive reports for business analysis and decision making
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaEye className="mr-2" />
                Report History
              </button>
              {reportData && (
                <>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaPrint className="mr-2" />
                    Print
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaFilePdf className="mr-2" />
                    Export PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FaFileExcel className="mr-2" />
                    Export Excel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {reportTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    {tab.icon}
                    <span className="ml-2">{tab.name}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Description */}
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaChartLine className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  {reportTabs.find(tab => tab.id === activeTab)?.name}
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>{reportTabs.find(tab => tab.id === activeTab)?.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow">
          {renderReportComponent()}
        </div>

        {/* Report History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Report History</h3>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <ReportHistory />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
