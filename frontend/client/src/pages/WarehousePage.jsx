import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaBoxes, FaPallet, FaClipboardList, FaTruckLoading,
  FaChartLine, FaWarehouse, FaPlus, FaSearch, FaHome, FaEdit, FaTrash
} from "react-icons/fa";
import AddWarehouse from "../components/AddWarehouse";

export default function WarehousePage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("Inventory");
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleClick = (id) => {
    navigate(`/warehouse/${id}`);
  };

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:8000/api/warehouse/all`, {
        params: {
          search: searchTerm,
          page: page,
          limit: 6
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWarehouses(res.data.warehouses);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch warehouses:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [searchTerm, page, showAddWarehouse]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to page 1 on new search
  };

  const handleEdit = (id) => {
    navigate(`/warehouse/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this warehouse?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:8000/api/warehouse/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        alert("Warehouse deleted successfully!");
        fetchWarehouses(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete warehouse:", error);
        alert(error.response?.data?.message || "Failed to delete warehouse");
      }
    }
  };

  const warehouseMenu = [
    { name: "Warehouses", icon: <FaWarehouse className="mr-3" /> },
    { name: "Inventory", icon: <FaBoxes className="mr-3" /> },
    { name: "Categories", icon: <FaPallet className="mr-3" /> },
    { name: "Suppliers", icon: <FaTruckLoading className="mr-3" /> },
    { name: "Transactions", icon: <FaClipboardList className="mr-3" /> }
  ];

  const warehouseActions = [
    { name: "New Entry", icon: <FaPlus />, action: () => setShowAddWarehouse(true) },
    { name: "Stock Check", icon: <FaSearch />, action: () => console.log("Stock Check") },
    { name: "Dispatch", icon: <FaTruckLoading />, action: () => console.log("Dispatch") }
  ];

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
                onClick={() => navigate("/Dashboard")}
              >
                <FaHome className="inline mr-2" />
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

      <div className="flex w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">WAREHOUSE MENU</h3>
            <ul className="space-y-1">
              {warehouseMenu.map((item, index) => (
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

        {/* Main Content */}
        <main className="flex-1 p-6 w-full">

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 w-full">
            {warehouseActions.map((button, index) => (
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

          {/* Add Warehouse Form */}
          {showAddWarehouse && (
            <AddWarehouse onCancel={() => setShowAddWarehouse(false)} />
          )}

          {/* Warehouse List */}
          {!showAddWarehouse && (
            <div className="bg-white rounded-xl shadow-sm p-6 w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">All Warehouses</h2>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search warehouses..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {loading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {warehouses.map((wh, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 hover:bg-blue-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-800">{wh.name}</h3>
                        <span className="text-sm text-gray-500">{wh.warehouseNumber}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Location:</strong> {wh.location}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Status:</strong> {wh.status}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Manager:</strong> {wh.manager ? `${wh.manager.firstName} ${wh.manager.lastName}` : 'Not Assigned'}
                      </div>
                      <div className="text-xs text-gray-500 italic mb-3">{wh.description}</div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(wh._id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title="Edit Warehouse"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(wh._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Delete Warehouse"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Prev
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 rounded ${page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}