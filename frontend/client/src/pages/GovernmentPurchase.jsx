import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaHome, FaClipboardList, FaTruck, FaChartLine,
  FaPlus, FaSearch, FaFileInvoiceDollar, FaBoxes,
  FaBuilding
} from "react-icons/fa";
import AddPrCenter from "../components/Addprcenter";

export default function GovernmentPurchase() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("FoodPurchaseInvoice");
  const [showPrCenters, setShowPrCenters] = useState(false);
  const [showAddPrCenter, setShowAddPrCenter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [prCenters, setPrCenters] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPrCenters = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8000/api/prcenter/all", {
        params: { search: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrCenters(res.data);
    } catch (error) {
      console.error("Failed to fetch PR Centers:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showPrCenters) {
      fetchPrCenters();
    }
  }, [searchTerm, showPrCenters, showAddPrCenter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const purchaseMenu = [
    { name: "Purchase Invoice", icon: <FaClipboardList className="mr-3" /> },
    { name: "Food Arrival Entry", icon: <FaTruck className="mr-3" /> },
    { name: "Reports", icon: <FaChartLine className="mr-3" /> },
    { name: "PR Centers", icon: <FaBuilding className="mr-3" /> }
  ];

  const purchaseActions = [
    { name: "New Invoice", icon: <FaPlus />, action: () => console.log("New Invoice") },
    { name: "Search Records", icon: <FaSearch />, action: () => console.log("Search Records") },
    { name: "Stock Update", icon: <FaBoxes />, action: () => console.log("Stock Update") }
  ];

  const prCenterActions = [
    { name: "Add PR Center", icon: <FaPlus />, action: () => setShowAddPrCenter(true) },
    { name: "Search PR Centers", icon: <FaSearch />, action: () => console.log("Search PR Centers") }
  ];

  const handleMenuClick = (menuName) => {
    setActiveMenu(menuName);
    setShowPrCenters(menuName === "PR Centers");
    setShowAddPrCenter(false);
  };

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
        {/* Purchase Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">GOVERNMENT PURCHASE</h3>
            <ul className="space-y-1">
              {purchaseMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleMenuClick(item.name)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors !bg-transparent ${activeMenu === item.name ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
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
          {showPrCenters ? (
            <>
              {/* PR Centers Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full">
                {prCenterActions.map((button, index) => (
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

              {/* Add PR Center Form */}
              {showAddPrCenter && (
                <AddPrCenter onCancel={() => setShowAddPrCenter(false)} />
              )}

              {/* PR Centers List */}
              {!showAddPrCenter && (
                <div className="bg-white rounded-xl shadow-sm p-6 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Registered PR Centers</h2>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search PR Centers..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <p className="text-gray-500 text-sm">Loading...</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {prCenters.map((center) => (
                            <tr key={center._id} className="hover:bg-blue-50 cursor-pointer">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{center._id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{center.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{center.location}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{center.contact}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full">
                {purchaseActions.map((button, index) => (
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

              {/* Purchase Overview */}
              <div className="bg-white rounded-xl shadow-sm p-6 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Government Purchases</h2>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search purchases..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-blue-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#1</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Govt. Food Dept</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rs. 150,000</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-03-20</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-blue-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#2</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Wheat Board</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rs. 200,000</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-03-18</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
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