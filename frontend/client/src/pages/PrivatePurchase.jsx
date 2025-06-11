import { useNavigate } from "react-router-dom";
import React, { useState ,useEffect} from "react";
import {
  FaHome, FaClipboardList, FaTruck, FaChartLine,
  FaPlus, FaSearch, FaFileInvoiceDollar, FaBoxes, FaStore
} from "react-icons/fa";
import PrivatePurchaseForm from "../components/PrivatePurchaseForm"; // You'll need to create this component
import axios from "axios";

// Add this formatDate function at the top of your file
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function PrivatePurchase() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("PrivatePurchaseInvoice");
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const purchaseMenu = [
    { name: "Private Purchase Invoice", icon: <FaClipboardList className="mr-3" /> },
    { name: "Private Arrival Entry", icon: <FaTruck className="mr-3" /> },
    { name: "Reports", icon: <FaChartLine className="mr-3" /> }
  ];

  const purchaseActions = [
    { name: "New Invoice", icon: <FaPlus />, action: () => setShowPurchaseForm(true) },
    { name: "Search Records", icon: <FaSearch />, action: () => console.log("Search Private Records") },
    { name: "Stock Update", icon: <FaBoxes />, action: () => console.log("Private Stock Update") }
  ];

  // Sample private purchase data
  const purchaseData = [
    { id: 1, supplier: "ABC Traders", amount: "Rs. 120,000", date: "2024-03-20", status: "Pending" },
    { id: 2, supplier: "XYZ Mills", amount: "Rs. 180,000", date: "2024-03-18", status: "Completed" },
    { id: 3, supplier: "Best Grains Co.", amount: "Rs. 95,000", date: "2024-03-15", status: "Completed" },
  ];

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:8000/api/invoice", {
          params: { search: searchTerm, type: 'private' }
        });
        setInvoices(res?.data?.invoices);
        console.log('invoice res.data)', res?.data?.invoices)
      } catch (error) {
        console.error("Failed to fetch invoices:", error.message);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchInvoices();
  }, [searchTerm]);

  const handleCancelPurchaseForm = () => {
    setShowPurchaseForm(false);
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
              <FaStore className="text-lg" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Purchase Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">PRIVATE PURCHASE</h3>
            <ul className="space-y-1">
              {purchaseMenu.map((item, index) => (
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

          {/* Show either the form or the purchase list */}
          {showPurchaseForm ? (
            <PrivatePurchaseForm onCancel={handleCancelPurchaseForm} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recent Private Purchases</h2>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search private purchases..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Purchase Items Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wheat Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                      </tr>
                    ) : invoices.length > 0 ? (
                      invoices.map((invoice) => (
                        <tr 
                            key={invoice._id} 
                            className="hover:bg-blue-50 cursor-pointer"
                            onClick={() => navigate(`/privatepurchasedetail/${invoice._id}`)}
                          >

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{invoice._id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.paymentMethod}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice.wheatQuantity} kg @ Rs. {invoice.ratePerKg}/kg
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rs. {invoice.totalAmount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${invoice.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {invoice.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No invoices found</td>
                      </tr>
                    )}
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