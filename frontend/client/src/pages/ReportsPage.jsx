import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBook, FaCashRegister, FaChartBar, FaFileInvoiceDollar, FaFileAlt, 
  FaFolderOpen, FaWarehouse, FaSignOutAlt, FaUserCog, FaDownload, 
  FaPrint, FaFilter, FaCalendarAlt, FaSearch
} from "react-icons/fa";
import { useAuth } from '../hooks/useAuth';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState("Reports");
  const [selectedReport, setSelectedReport] = useState("Sales Report");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const reportsMenu = [
    { 
      name: "Sales Report", 
      icon: <FaFileInvoiceDollar className="mr-3" />,
      description: "Sales analysis by date range with customer details"
    },
    { 
      name: "Purchase Report", 
      icon: <FaCashRegister className="mr-3" />,
      description: "Purchase transactions and supplier analysis"
    },
    { 
      name: "Inventory Report", 
      icon: <FaWarehouse className="mr-3" />,
      description: "Stock levels across warehouses"
    },
    { 
      name: "Financial Report", 
      icon: <FaFolderOpen className="mr-3" />,
      description: "Profit & loss, expense analysis"
    },
    { 
      name: "Production Report", 
      icon: <FaChartBar className="mr-3" />,
      description: "Daily production and cost analysis"
    },
    { 
      name: "Supplier Report", 
      icon: <FaBook className="mr-3" />,
      description: "Vendor outstanding balances and performance"
    },
    { 
      name: "Salary Report", 
      icon: <FaFileAlt className="mr-3" />,
      description: "Employee payroll and attendance"
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleReportSelect = (reportName) => {
    setSelectedReport(reportName);
    setReportData(null);
  };

  const generateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      alert("Please select both start and end dates");
      return;
    }

    setLoading(true);
    try {
      // Simulate API call - replace with actual API endpoints
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API response
      const mockData = {
        "Sales Report": {
          totalSales: 1250000,
          totalOrders: 156,
          averageOrderValue: 8012.82,
          topProducts: ["ATA Bags", "MAIDA Bags", "SUJI Bags"],
          salesByDate: [
            { date: "2024-01-01", sales: 45000 },
            { date: "2024-01-02", sales: 52000 },
            { date: "2024-01-03", sales: 48000 }
          ]
        },
        "Purchase Report": {
          totalPurchases: 890000,
          totalOrders: 89,
          averageOrderValue: 10000,
          topSuppliers: ["ABC Suppliers", "XYZ Traders", "Quality Bags Ltd"],
          purchasesByDate: [
            { date: "2024-01-01", purchases: 35000 },
            { date: "2024-01-02", purchases: 42000 },
            { date: "2024-01-03", purchases: 38000 }
          ]
        },
        "Inventory Report": {
          totalItems: 45,
          lowStockItems: 8,
          totalValue: 1250000,
          warehouseSummary: [
            { name: "Main Warehouse", items: 25, value: 750000 },
            { name: "Secondary Warehouse", items: 20, value: 500000 }
          ]
        },
        "Financial Report": {
          totalRevenue: 1250000,
          totalExpenses: 890000,
          netProfit: 360000,
          profitMargin: 28.8,
          expensesByCategory: [
            { category: "Raw Materials", amount: 450000 },
            { category: "Labor", amount: 280000 },
            { category: "Utilities", amount: 160000 }
          ]
        },
        "Production Report": {
          totalProduction: 1250,
          totalCost: 890000,
          averageCostPerUnit: 712,
          productionByDate: [
            { date: "2024-01-01", quantity: 450, cost: 320000 },
            { date: "2024-01-02", quantity: 520, cost: 370000 },
            { date: "2024-01-03", quantity: 480, cost: 340000 }
          ]
        },
        "Supplier Report": {
          totalSuppliers: 25,
          activeSuppliers: 22,
          totalOutstanding: 125000,
          topOutstanding: [
            { name: "ABC Suppliers", amount: 45000 },
            { name: "XYZ Traders", amount: 38000 },
            { name: "Quality Bags Ltd", amount: 42000 }
          ]
        },
        "Salary Report": {
          totalEmployees: 45,
          totalSalary: 280000,
          averageSalary: 6222.22,
          salaryByDepartment: [
            { department: "Production", count: 25, total: 150000 },
            { department: "Sales", count: 12, total: 80000 },
            { department: "Admin", count: 8, total: 50000 }
          ]
        }
      };

      setReportData(mockData[selectedReport]);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error generating report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // Implement PDF export functionality
    alert("PDF export functionality will be implemented");
  };

  const exportToExcel = () => {
    // Implement Excel export functionality
    alert("Excel export functionality will be implemented");
  };

  const printReport = () => {
    window.print();
  };

  const renderReportContent = () => {
    if (!reportData) {
      return (
        <div className="text-center py-12">
          <FaChartBar className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report</h3>
          <p className="text-gray-500">Choose a report type from the left menu to view detailed analysis.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedReport}</h2>
            <p className="text-gray-600">
              {dateRange.startDate && dateRange.endDate 
                ? `Period: ${dateRange.startDate} to ${dateRange.endDate}`
                : "Select date range to generate report"
              }
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaDownload className="mr-2" />
              PDF
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload className="mr-2" />
              Excel
            </button>
            <button
              onClick={printReport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(reportData).map(([key, value]) => {
            if (typeof value === 'number' && key !== 'profitMargin') {
              return (
                <div key={key} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {key.includes('Amount') || key.includes('Sales') || key.includes('Purchases') || 
                     key.includes('Revenue') || key.includes('Expenses') || key.includes('Profit') || 
                     key.includes('Outstanding') || key.includes('Salary') || key.includes('Cost') || 
                     key.includes('Value')
                      ? `Rs. ${value.toLocaleString()}`
                      : value.toLocaleString()
                    }
                  </p>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Detailed Data */}
        {reportData.salesByDate && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
            <div className="space-y-3">
              {reportData.salesByDate.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{item.date}</span>
                  <span className="font-medium">Rs. {item.sales.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportData.topProducts && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            <div className="space-y-2">
              {reportData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{product}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportData.expensesByCategory && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
            <div className="space-y-3">
              {reportData.expensesByCategory.map((category, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{category.category}</span>
                  <span className="font-medium">Rs. {category.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-0"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}
    >
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Dashboard" ? "text-gray-600 hover:text-blue-600 !bg-white hover:shadow-sm" : "text-gray-600 hover:text-blue-600 !bg-gray-200 hover:shadow-sm"}`}
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>
              <button 
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Reports" ? "!bg-blue-100 text-blue-600 border-b-2 border-blue-600 shadow-sm" : "text-gray-600 hover:text-blue-600 !bg-white hover:shadow-sm"}`}
              >
                Reports
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full !bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaUserCog className="text-lg" />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 !bg-transparent"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Reports Menu</h3>
            <ul className="space-y-1">
              {reportsMenu.map((item, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleReportSelect(item.name)}
                    className={`w-full flex items-start px-4 py-3 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors !bg-transparent ${
                      selectedReport === item.name ? "bg-blue-50 text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {item.icon}
                    <div className="text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Reports Area */}
        <main className="flex-1 p-6 w-full">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Reports Dashboard</h1>
            
            {/* Date Range Selector */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-gray-400" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={generateReport}
                disabled={loading || !dateRange.startDate || !dateRange.endDate}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FaSearch className="mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Report Content */}
          {renderReportContent()}
        </main>
      </div>
    </div>
  );
}
