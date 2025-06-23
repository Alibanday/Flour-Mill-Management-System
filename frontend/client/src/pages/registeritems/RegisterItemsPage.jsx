import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaPlus, FaList, FaClipboardList,
  FaChartLine, FaSearch, FaFileExport, FaEdit, FaTrash, FaEye
} from "react-icons/fa";
import ItemRegisterForm from "../../components/registeritems/ItemRegisterForm";

export default function RegisterItemsPage() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("AllItems");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemData, setItemData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const itemsMenu = [
    { name: "Add Item", icon: <FaPlus className="mr-3" /> }
  ];

  const itemActions = [
    { name: "New Item", icon: <FaPlus />, action: () => navigate("/register-items/add") },
    { name: "Search Items", icon: <FaSearch />, action: () => console.log("Search Items") },
    { name: "Export Data", icon: <FaFileExport />, action: () => console.log("Export Data") }
  ];

  const handleClick = (id) => {
    // TODO: Navigate to item detail page when created
    console.log("Item clicked:", id);
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8000/api/items", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }
        
        const data = await response.json();
        setItemData(data.items || []);
      } catch (error) {
        console.error("Error fetching items:", error.message);
        setItemData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const filteredItems = itemData.filter(item => {
    const name = item.name || "";
    const category = item.category || "";
    const description = item.description || "";
    return (
      name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      category?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      description?.toLowerCase().includes(searchQuery?.toLowerCase())
    );
  });

  // Delete item handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:8000/api/items/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setItemData((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      alert("Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  };

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
              <FaClipboardList className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Items Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">ITEMS MENU</h3>
            <ul className="space-y-1">
              {itemsMenu.map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => {
                      if (item.name === "Add Item") {
                        navigate("/register-items/add");
                      } else {
                        setActiveMenu(item.name);
                      }
                    }}
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
          {/* Items Table */}
          <div className="bg-white rounded-xl shadow-sm p-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Item List</h2>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (Rs.)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-gray-500">
                        Loading items...
                      </td>
                    </tr>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr onClick={() => handleClick(item._id)} key={item._id || item.id} className="hover:bg-blue-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category === "bags" && item.weight ? `${item.weight} kg` : "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{item.price ? `Rs. ${item.price}` : "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.stock || "0"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-800 mr-3">
                            <FaEye />
                          </button>
                          <button className="text-green-600 hover:text-green-800 mr-3" onClick={() => navigate(`/register-items/edit/${item._id}`)}>
                            <FaEdit />
                          </button>
                          <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(item._id)} disabled={deletingId === item._id}>
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-gray-500">
                        No items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 