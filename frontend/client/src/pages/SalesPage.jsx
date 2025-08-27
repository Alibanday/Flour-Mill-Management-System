import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import {
  FaHome, FaFileInvoiceDollar, FaExchangeAlt, FaClipboardList,
  FaChartLine, FaPlus, FaSearch, FaMoneyCheckAlt
} from "react-icons/fa";
import AddSalesForm from "../components/AddSalesForm";

export default function SalesPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("SalesInvoice");
  const [showAddForm, setShowAddForm] = useState(false);

  // Sample sales data
  const salesData = [
    { id: 1, invoice: "INV-001", customer: "ABC Traders", date: "2024-03-20", amount: "Rs. 50,000", status: "Paid" },
    { id: 2, invoice: "INV-002", customer: "XYZ Corp", date: "2024-03-19", amount: "Rs. 1,20,000", status: "Pending" },
    { id: 3, invoice: "INV-003", customer: "City Mart", date: "2024-03-18", amount: "Rs. 75,000", status: "Partial" },
  ];

  const salesMenu = [
    { name: "Sales Invoice", icon: <FaFileInvoiceDollar className="mr-3" /> },
    { name: "Sales Return", icon: <FaExchangeAlt className="mr-3" /> },
    { name: "Sales Details", icon: <FaClipboardList className="mr-3" /> },
    { name: "Sales Reports", icon: <FaChartLine className="mr-3" /> }
  ];

  const salesActions = [
    { name: "New Invoice", icon: <FaPlus />, action: () => setShowAddForm(true) },
    { name: "Process Return", icon: <FaExchangeAlt />, action: () => console.log("Return") },
    { name: "Daily Summary", icon: <FaMoneyCheckAlt />, action: () => console.log("Summary") }
  ];

  return (
    <div className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-0"
         style={{ backgroundImage: "url('/dashboard.jpg')" }}>
      
      {/* Top Navigation */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 !bg-gray-200 hover:shadow-sm flex items-center"
                onClick={() => navigate("/dashboard")}
              >
                <FaHome className="mr-2" />
                Back to Dashboard
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full !bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaFileInvoiceDollar className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Sales Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">SALES MENU</h3>
            <ul className="space-y-1">
              {salesMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => {
                      setActiveMenu(item.name);
                      setShowAddForm(item.name === "Sales Invoice");
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors !bg-transparent"
                  >
                    {item.icon}
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">
          {/* Quick Actions */}
          {!showAddForm && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full">
              {salesActions.map((button, index) => (
                <button
                  key={index}
                  onClick={button.action}
                  className="flex flex-col items-center justify-center p-4 !bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow hover:bg-blue-50 group border border-gray-100"
                >
                  <div className="p-3 mb-2 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                    {button.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{button.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Content Area */}
          {showAddForm ? (
            <AddSalesForm
              onClose={() => setShowAddForm(false)}
              onSuccess={(newSale) => {
                console.log('New sale created:', newSale);
                setShowAddForm(false);
                // You can add logic to refresh the sales list here
              }}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recent Sales</h2>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search sales..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Sales List */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {salesData.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{sale.invoice}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale.customer}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            sale.status === 'Paid' ? 'bg-green-100 text-green-800' :
                            sale.status === 'Pending' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}