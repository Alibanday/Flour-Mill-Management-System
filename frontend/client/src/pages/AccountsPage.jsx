import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import {
  FaHome, FaPlus, FaList, FaMoneyCheckAlt,
  FaChartLine, FaSearch, FaFileExport
} from "react-icons/fa";

export default function AccountsPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("AllAccounts");
  const [showAddForm, setShowAddForm] = useState(false);

  const accountsMenu = [
    { name: "Add Account", icon: <FaPlus className="mr-3" /> },
    { name: "All Accounts", icon: <FaList className="mr-3" /> },
    { name: "Transactions", icon: <FaMoneyCheckAlt className="mr-3" /> },
    { name: "Reports", icon: <FaChartLine className="mr-3" /> }
  ];

  const accountActions = [
    { name: "New Account", icon: <FaPlus />, action: () => setShowAddForm(true) },
    { name: "Search Accounts", icon: <FaSearch />, action: () => console.log("Search Accounts") },
    { name: "Export Data", icon: <FaFileExport />, action: () => console.log("Export Data") }
  ];

  // Sample account data
  const accountData = [
    { id: 1, name: "Cash Account", type: "Cash", balance: "Rs. 50,000", description: "Primary cash account" },
    { id: 2, name: "Bank Account", type: "Bank", balance: "Rs. 1,50,000", description: "HBL Main Account" },
    { id: 3, name: "Credit Account", type: "Credit", balance: "Rs. -25,000", description: "Supplier credit" },
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
                    onClick={() => {
                      setActiveMenu(item.name);
                      setShowAddForm(item.name === "Add Account");
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
          )}

          {/* Content Area */}
          {showAddForm ? (
            <AddAccountForm onCancel={() => setShowAddForm(false)} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Account List</h2>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Accounts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountData.map((account) => (
                  <div key={account.id} className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800">{account.name}</h3>
                      <span className={`text-sm ${
                        account.balance.includes('-') ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {account.balance}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-500">{account.type}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {account.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Add Account Form Component
function AddAccountForm({ onCancel }) {
  const [formData, setFormData] = useState({
    accountName: '',
    accountType: 'Cash',
    openingBalance: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add account submission logic
    console.log('Account Data:', formData);
    onCancel();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Create New Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Name *</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={formData.accountName}
              onChange={(e) => setFormData({...formData, accountName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Type *</label>
            <select
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={formData.accountType}
              onChange={(e) => setFormData({...formData, accountType: e.target.value})}
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Credit">Credit</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Opening Balance *</label>
            <input
              type="number"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={formData.openingBalance}
              onChange={(e) => setFormData({...formData, openingBalance: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}