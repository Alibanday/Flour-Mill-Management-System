import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaHome, FaBoxes, FaClipboardList,
  FaWarehouse, FaExchangeAlt, FaSeedling, FaShoppingBag, FaChartBar
} from "react-icons/fa";

export default function StockPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Total Stock");
  const [totalStockData, setTotalStockData] = useState({
    wheat: { total: 0, items: [] },
    bags: { total: 0, items: [] }
  });
  const [loading, setLoading] = useState(false);

  const stockMenu = [
    { name: "Total Stock", icon: <FaBoxes className="mr-3" /> },
    { name: "Stock Detail", icon: <FaClipboardList className="mr-3" /> },
    { name: "Stock Transfer", icon: <FaExchangeAlt className="mr-3" /> }
  ];

  const fetchTotalStock = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:8000/api/stock`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1,
          limit: 1000 // Get all stock items
        }
      });

      const stocks = response.data.stocks || [];
      
      // Separate wheat and bags
      const wheatStocks = stocks.filter(item => item.itemType === 'wheat');
      const bagStocks = stocks.filter(item => item.itemType === 'bags');
      
      // Calculate totals
      const wheatTotal = wheatStocks.reduce((sum, item) => sum + (item.quantity?.value || 0), 0);
      const bagsTotal = bagStocks.reduce((sum, item) => sum + (item.quantity?.value || 0), 0);
      
      // Group bags by name and weight
      const groupedBags = {};
      bagStocks.forEach(item => {
        const key = `${item.itemName}_${item.subType || 'default'}`;
        if (!groupedBags[key]) {
          groupedBags[key] = {
            name: item.itemName,
            weight: item.subType || 'N/A',
            quantity: 0,
            items: []
          };
        }
        groupedBags[key].quantity += (item.quantity?.value || 0);
        groupedBags[key].items.push(item);
      });

      setTotalStockData({
        wheat: { total: wheatTotal, items: wheatStocks },
        bags: { total: bagsTotal, items: Object.values(groupedBags) }
      });
    } catch (error) {
      console.error("Error fetching total stock:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenu === "Total Stock") {
      fetchTotalStock();
    }
  }, [activeMenu]);

  return (
    <div
      className="h-screen w-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
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
                <FaWarehouse className="text-lg" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white shadow-sm h-full hidden md:block">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">STOCK MENU</h3>
              <ul className="space-y-1">
                {stockMenu.map((item, index) => (
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
          <main className="flex-1 overflow-y-auto p-6">
            {activeMenu === "Total Stock" ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Total Stock Overview</h1>
                      <p className="text-gray-600 mt-1">Complete inventory across all warehouses</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <FaChartBar className="text-blue-600 text-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Cards - Moved to top */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 rounded-full mr-4">
                        <FaSeedling className="text-green-600 text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Wheat</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalStockData.wheat.total.toLocaleString()} kg
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 rounded-full mr-4">
                        <FaShoppingBag className="text-blue-600 text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Bags</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalStockData.bags.total.toLocaleString()} bags
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 rounded-full mr-4">
                        <FaWarehouse className="text-purple-600 text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Items</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {(totalStockData.wheat.items.length + totalStockData.bags.items.length).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="bg-white rounded-xl shadow-sm p-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-500 mt-4">Loading total stock data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Wheat Stock Section */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-3 bg-white bg-opacity-20 rounded-full mr-4">
                              <FaSeedling className="text-white text-2xl" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-white">Wheat Stock</h2>
                              <p className="text-green-100">Total wheat inventory</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">
                              {totalStockData.wheat.total.toLocaleString()}
                            </div>
                            <div className="text-green-100 text-sm">kg</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {totalStockData.wheat.items.length > 0 ? (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 mb-4">Wheat Stock Details</h3>
                            <div className="space-y-3">
                              {totalStockData.wheat.items.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                    <div>
                                      <div className="font-medium text-gray-800">{item.itemName}</div>
                                      <div className="text-sm text-gray-500">
                                        {item.sellerName ? `Seller: ${item.sellerName}` : 'No seller info'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-green-600">
                                      {item.quantity.value.toLocaleString()} {item.quantity.unit}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(item.date).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FaSeedling className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">No wheat stock available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bags Stock Section */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-3 bg-white bg-opacity-20 rounded-full mr-4">
                              <FaShoppingBag className="text-white text-2xl" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-white">Bags Stock</h2>
                              <p className="text-blue-100">Total bags inventory</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">
                              {totalStockData.bags.total.toLocaleString()}
                            </div>
                            <div className="text-blue-100 text-sm">bags</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {totalStockData.bags.items.length > 0 ? (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 mb-4">Bags by Category</h3>
                            <div className="space-y-3">
                              {totalStockData.bags.items.map((category, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                      <div>
                                        <div className="font-medium text-gray-800">{category.name}</div>
                                        <div className="text-sm text-gray-500">Weight: {category.weight}</div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-blue-600">
                                        {category.quantity.toLocaleString()} bags
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {category.items.length} entries
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <FaShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">No bags stock available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Default empty state for other menu items
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <FaBoxes className="mx-auto h-16 w-16" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Stock Management</h2>
                  <p className="text-gray-500">
                    Stock management functionality is available through the sidebar menu.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
