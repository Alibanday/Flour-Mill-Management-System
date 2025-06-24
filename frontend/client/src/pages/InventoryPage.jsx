import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaBoxes, FaPallet, FaClipboardList, FaTruckLoading,
  FaChartLine, FaWarehouse, FaPlus, FaSearch, FaHome, FaSeedling, FaShoppingBag
} from "react-icons/fa";

export default function InventoryPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Inventory");
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedStockType, setSelectedStockType] = useState(null); // 'wheat' or 'bags'
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [totalStock, setTotalStock] = useState(0);
  const [categorizedBags, setCategorizedBags] = useState({});

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:8000/api/warehouse/all`, {
        params: {
          page: 1,
          limit: 50
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWarehouses(res.data.warehouses);
    } catch (error) {
      console.error("Failed to fetch warehouses:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockData = async (warehouseId, stockType) => {
    if (!warehouseId || !stockType) return;
    
    try {
      setStockLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:8000/api/stock`, {
        params: {
          warehouse: warehouseId,
          itemType: stockType,
          page: 1,
          limit: 100
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const stocks = res.data.stocks || [];
      
      // Filter stocks by the correct category
      const filteredStocks = stocks.filter(item => item.itemType === stockType);
      setStockData(filteredStocks);
      
      // Calculate totals and categorize
      if (stockType === 'wheat') {
        const totalWheat = filteredStocks.reduce((sum, item) => sum + (item.quantity?.value || 0), 0);
        setTotalStock(totalWheat);
        setCategorizedBags({});
      } else if (stockType === 'bags') {
        const totalBags = filteredStocks.reduce((sum, item) => sum + (item.quantity?.value || 0), 0);
        setTotalStock(totalBags);
        
        // Categorize bags by name and weight
        const categorized = {};
        filteredStocks.forEach(item => {
          const key = `${item.itemName}_${item.subType || 'default'}`;
          if (!categorized[key]) {
            categorized[key] = {
              name: item.itemName,
              weight: item.subType || 'N/A',
              quantity: 0,
              items: []
            };
          }
          categorized[key].quantity += (item.quantity?.value || 0);
          categorized[key].items.push(item);
        });
        setCategorizedBags(categorized);
      }
    } catch (error) {
      console.error("Failed to fetch stock data:", error.message);
      setStockData([]);
      setTotalStock(0);
      setCategorizedBags({});
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse && selectedStockType) {
      fetchStockData(selectedWarehouse._id, selectedStockType);
    }
  }, [selectedWarehouse, selectedStockType]);

  const handleWarehouseClick = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setSelectedStockType(null); // Reset stock type when warehouse changes
    setStockData([]); // Clear stock data
  };

  const handleStockTypeClick = (stockType) => {
    setSelectedStockType(stockType);
  };

  const inventoryMenu = [
    { name: "Inventory", icon: <FaBoxes className="mr-3" /> },
    { name: "Stock Items", icon: <FaPallet className="mr-3" /> },
    { name: "Categories", icon: <FaClipboardList className="mr-3" /> },
    { name: "Suppliers", icon: <FaTruckLoading className="mr-3" /> },
    { name: "Transactions", icon: <FaChartLine className="mr-3" /> }
  ];

  const inventoryActions = [
    { name: "Add Stock", icon: <FaPlus />, action: () => console.log("Add Stock") },
    { name: "Stock Check", icon: <FaSearch />, action: () => console.log("Stock Check") },
    { name: "Transfer", icon: <FaTruckLoading />, action: () => console.log("Transfer") }
  ];

  const stockTypes = [
    { name: "Wheat Stock", icon: <FaSeedling className="text-green-600" />, type: "wheat" },
    { name: "Bags Stock", icon: <FaShoppingBag className="text-blue-600" />, type: "bags" }
  ];

  return (
    <div className="min-h-screen w-full bg-white bg-opacity-30 backdrop-blur-sm bg-cover bg-no-repeat bg-center"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}>
      
      {/* Top Navigation */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className="px-4 py-2 font-medium rounded-md transition duration-150 text-gray-600 hover:text-blue-600 !bg-gray-200 hover:shadow-sm flex items-center"
                onClick={() => navigate("/Dashboard")}
              >
                <FaHome className="inline mr-2" />
                Back to Dashboard
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full !bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaBoxes className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">INVENTORY MENU</h3>
            <ul className="space-y-1">
              {inventoryMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => setActiveMenu(item.name)}
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

        {/* Main Content Area */}
        <main className="flex-1 p-6 w-full">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full">
            {inventoryActions.map((button, index) => (
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

          {/* Main Content and Warehouse List */}
          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory Overview</h2>
              
              {selectedWarehouse ? (
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-4">
                    Selected: {selectedWarehouse.name} ({selectedWarehouse.warehouseNumber})
                  </h3>
                  
                  {!selectedStockType ? (
                    <div>
                      <p className="text-gray-600 mb-4">Select a stock type to view inventory:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stockTypes.map((option) => (
                          <button
                            key={option.type}
                            onClick={() => handleStockTypeClick(option.type)}
                            className="p-6 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200 hover:border-blue-300"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="text-blue-600">
                                {option.icon}
                              </div>
                              <div className="text-left">
                                <h4 className="font-medium text-gray-800">{option.name}</h4>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-800">
                          {selectedStockType === 'wheat' ? 'Wheat Stock' : 'Bags Stock'}
                        </h4>
                        <button
                          onClick={() => setSelectedStockType(null)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          ← Back to Stock Types
                        </button>
                      </div>
                      
                      {/* Total Stock Summary */}
                      <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-blue-800">
                              Total {selectedStockType === 'wheat' ? 'Wheat' : 'Bags'} Stock
                            </h5>
                            <p className="text-sm text-blue-600">
                              {selectedStockType === 'wheat' ? 'Total wheat quantity in warehouse' : 'Total bags in warehouse'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-800">
                              {totalStock.toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600">
                              {selectedStockType === 'wheat' ? 'kg' : 'bags'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {stockLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading stock data...</p>
                        </div>
                      ) : stockData.length > 0 ? (
                        <div>
                          {selectedStockType === 'wheat' ? (
                            // Wheat Stock Display
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {stockData.map((item, index) => (
                                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-gray-800">{item.itemName}</h5>
                                    <span className="text-sm text-gray-500">{item.itemType}</span>
                                  </div>
                                  <div className="text-sm text-gray-600 mb-1">
                                    <strong>Quantity:</strong> {item.quantity.value.toLocaleString()} {item.quantity.unit}
                                  </div>
                                  {item.sellerName && (
                                    <div className="text-sm text-gray-600 mb-1">
                                      <strong>Seller:</strong> {item.sellerName}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 mt-2">
                                    Last updated: {new Date(item.date).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Bags Stock Display - Categorized
                            <div>
                              <h5 className="font-medium text-gray-800 mb-4">Bags by Category</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.values(categorizedBags).map((category, index) => (
                                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <h5 className="font-medium text-gray-800">{category.name}</h5>
                                      <span className="text-sm text-gray-500">{category.weight}</span>
                                    </div>
                                    <div className="text-lg font-bold text-blue-600 mb-2">
                                      {category.quantity.toLocaleString()} bags
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {category.items.length} stock entry{category.items.length !== 1 ? 'ies' : 'y'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Detailed Bags List */}
                              <div className="mt-8">
                                <h5 className="font-medium text-gray-800 mb-4">Detailed Stock Entries</h5>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bag Type
                                          </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Weight
                                          </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                          </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Seller
                                          </th>
                                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {stockData.map((item, index) => (
                                          <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                              {item.itemName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                              {item.subType || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                              {item.quantity.value.toLocaleString()} {item.quantity.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                              {item.sellerName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                              {new Date(item.date).toLocaleDateString()}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 mb-2">
                            {selectedStockType === 'wheat' ? <FaSeedling className="mx-auto h-12 w-12" /> : <FaShoppingBag className="mx-auto h-12 w-12" />}
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No {selectedStockType === 'wheat' ? 'wheat' : 'bags'} stock found</h4>
                          <p className="text-gray-500">
                            No {selectedStockType === 'wheat' ? 'wheat' : 'bags'} inventory available in this warehouse.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaBoxes className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Warehouse</h3>
                  <p className="text-gray-500">
                    Choose a warehouse from the list on the right to view its inventory.
                  </p>
                </div>
              )}
            </div>

            {/* Warehouse List Sidebar */}
            <div className="w-80 bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Warehouses</h3>
                <FaWarehouse className="text-gray-400" />
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading warehouses...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {warehouses.map((warehouse) => (
                    <div
                      key={warehouse._id}
                      onClick={() => handleWarehouseClick(warehouse)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedWarehouse?._id === warehouse._id
                          ? 'bg-blue-100 border-l-4 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium text-gray-800">
                        {warehouse.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {warehouse.warehouseNumber}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {warehouses.length === 0 && !loading && (
                <div className="text-center py-8">
                  <FaWarehouse className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">No warehouses found</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 