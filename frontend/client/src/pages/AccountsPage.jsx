import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import {
  FaHome, FaPlus, FaList, FaMoneyCheckAlt,
  FaChartLine, FaSearch, FaFileExport, FaEdit, FaTrash
} from "react-icons/fa";
import AccountCreationForm from "../components/AccountCreationForm";

export default function AccountsPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("AllAccounts");
  const [searchQuery, setSearchQuery] = useState("");

  const accountsMenu = [
    { name: "Add Account", icon: <FaPlus className="mr-3" /> },
    { name: "All Accounts", icon: <FaList className="mr-3" /> },
    { name: "Transactions", icon: <FaMoneyCheckAlt className="mr-3" /> },
    { name: "Reports", icon: <FaChartLine className="mr-3" /> }
  ];

  const accountActions = [
    { name: "New Account", icon: <FaPlus />, action: () => setActiveMenu("Add Account") },
    { name: "Search Accounts", icon: <FaSearch />, action: () => console.log("Search Accounts") },
    { name: "Export Data", icon: <FaFileExport />, action: () => console.log("Export Data") }
  ];

  // Sample account data
  const accountData = [
    { id: 1, name: "Cash Account", type: "Cash", balance: "Rs. 50,000", description: "Primary cash account" },
    { id: 2, name: "Bank Account", type: "Bank", balance: "Rs. 1,50,000", description: "HBL Main Account" },
    { id: 3, name: "Credit Account", type: "Credit", balance: "Rs. -25,000", description: "Supplier credit" },
  ];

  // Filter accounts based on search query
  const filteredAccounts = accountData.filter(account =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
        className="min-h-screen w-full bg-white bg-opacity-30 backdrop-blur-sm bg-cover bg-no-repeat bg-center"
        style={{ backgroundImage: "url('/dashboard.jpg')" }}
      >
      
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
              <FaMoneyCheckAlt className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Accounts Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ACCOUNTS MENU</h3>
            <ul className="space-y-1">
              {accountsMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => setActiveMenu(item.name)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg !bg-white hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                      activeMenu === item.name ? "bg-blue-50 text-blue-600" : "text-gray-700"
                    }`}
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
          {activeMenu === "Add Account" ? (
            <AccountCreationForm onCancel={() => setActiveMenu("AllAccounts")} />
          ) : (
            <>
              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full">
                {accountActions.map((button, index) => (
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

              {/* Accounts Table */}
              <div className="bg-white rounded-xl shadow-sm p-6 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Account List</h2>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search accounts..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Accounts Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAccounts.map((account) => (
                        <tr key={account.id} className="hover:bg-blue-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.type}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                            account.balance.includes('-') ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {account.balance}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{account.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button className="text-blue-600 hover:text-blue-800 mr-3">
                              <FaEdit />
                            </button>
                            <button className="text-red-600 hover:text-red-800">
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}