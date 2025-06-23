import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  FaHome, FaPlus, FaList, FaMoneyCheckAlt,
  FaChartLine, FaSearch, FaFileExport, FaEdit, FaTrash,
  FaShoppingBag, FaReceipt, FaBoxes, FaWarehouse
} from "react-icons/fa";
import BagPurchaseInvoice from "../components/bagsaleandpurchase/BagPurchaseInvoice";
import BagSalesInvoice from "../components/bagsaleandpurchase/BagSalesInvoice";
import BagStock from "../components/BagStock";


export default function BagsScreen() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("AllBags");
  const [searchQuery, setSearchQuery] = useState("");
  const [bagData, setBagData] = useState([]);
  const [loading, setLoading] = useState(true);

  const bagsMenu = [
    
    { name: "Sales Invoice", icon: <FaReceipt className="mr-3" /> },
    { name: "Purchase Invoice", icon: <FaMoneyCheckAlt className="mr-3" /> },
    { name: "Stock", icon: <FaBoxes className="mr-3" /> },
    { name: "Warehouse", icon: <FaWarehouse className="mr-3" /> },
    
  ];

  const handleClick = (id) => {
    navigate(`/bag/${id}`);
  };

  useEffect(() => {
    const fetchBags = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8000/api/bags", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch bags");
        }

        const data = await response.json();
        setBagData(data);
      } catch (error) {
        console.error("Error fetching bags:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBags();
  }, []);

  const filteredBags = bagData.filter(bag => {
    const name = bag.bagName || "";
    const type = bag.bagType || "";
    const description = bag.description || "";
    return (
      name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      type?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      description?.toLowerCase().includes(searchQuery?.toLowerCase())
    );
  });

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
              <FaShoppingBag className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Bags Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">BAGS MENU</h3>
            <ul className="space-y-1">
              {bagsMenu.map((item, index) => (
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
          {activeMenu === "Purchase Invoice" ? (
            <BagPurchaseInvoice onCancel={() => setActiveMenu("AllBags")} />
          ) : activeMenu === "Sales Invoice" ? (
            <BagSalesInvoice onCancel={() => setActiveMenu("AllBags")} />
          ) : activeMenu === "Stock" ? (
            <BagStock onCancel={() => setActiveMenu("AllBags")} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 w-full">
              <div className="text-center py-12">
                <FaShoppingBag className="mx-auto text-4xl mb-4 text-gray-300" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">Welcome to Bags Management</h2>
                <p className="text-gray-500">Select an option from the sidebar to get started.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}