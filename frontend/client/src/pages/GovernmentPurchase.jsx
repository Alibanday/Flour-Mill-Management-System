import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaHome, FaClipboardList, FaTruck, FaChartLine,
  FaPlus, FaSearch, FaFileInvoiceDollar, FaBoxes,
  FaBuilding
} from "react-icons/fa";
import AddPrCenter from "../components/Addprcenter";
import GovPurchaseForm from "../components/GovPurchaseForm";
import FoodArrivalEntry from "../components/FoodArrivalEntry";

export default function GovernmentPurchase() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("");
  const [showPrCenters, setShowPrCenters] = useState(false);
  const [showAddPrCenter, setShowAddPrCenter] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showArrival, setShowArrival] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [prCenters, setPrCenters] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterToday, setFilterToday] = useState(false);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleClick = (id) => {
    navigate(`/prcenter/${id}`);
  };

  const handleClickInvoice = (id) => {
    navigate(`/govpurchasedetail/${id}`);
  };

  const fetchPrCenters = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/prcenter/all", {
        params: { search: searchTerm }
      });
      setPrCenters(res.data);
    } catch (error) {
      console.error("Failed to fetch PR Centers:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = { search: searchTerm, type:'government', limit:10, page };
      if(filterToday){
        const today = new Date().toISOString().slice(0,10);
        params.startDate=today;
        params.endDate=today;
      } else if(rangeFrom && rangeTo){
        params.startDate=rangeFrom;
        params.endDate=rangeTo;
      }
      const res = await axios.get("http://localhost:8000/api/invoice", { params });
      setInvoices(res?.data?.invoices);
      setTotalPages(res?.data?.totalPages||1);
    } catch (error) {
      console.error("Failed to fetch invoices:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showPrCenters) {
      fetchPrCenters();
    } else {
      fetchInvoices();
    }
  }, [searchTerm, showPrCenters, showAddPrCenter, filterToday, rangeFrom, rangeTo, page]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const purchaseMenu = [
    { name: "Purchase Invoice", icon: <FaClipboardList className="mr-3" /> },
    { name: "Food Arrival Entry", icon: <FaTruck className="mr-3" /> },
    
    { name: "PR Centers", icon: <FaBuilding className="mr-3" /> }
  ];

  const purchaseActions = [
    { name: "New Invoice", icon: <FaPlus />, action: () => setShowPurchaseForm(true) },
    { name: "Search Records", icon: <FaSearch />, action: () => console.log("Search Records") },
    { name: "Stock Update", icon: <FaBoxes />, action: () => console.log("Stock Update") }
  ];

  const prCenterActions = [
    { name: "Add PR Center", icon: <FaPlus />, action: () => setShowAddPrCenter(true) },
    { name: "Search PR Centers", icon: <FaSearch />, action: () => {} }
  ];

  const handleMenuClick = (menuName) => {
    setActiveMenu(menuName);
    setShowPrCenters(menuName === "PR Centers");
    setShowAddPrCenter(false);
    setShowPurchaseForm(false);
    setShowArrival(menuName === "Food Arrival Entry");
  };

  const handleCancelPurchaseForm = () => {
    setShowPurchaseForm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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
        {/* Sidebar */}
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
          {showPurchaseForm ? (
            <GovPurchaseForm onCancel={handleCancelPurchaseForm} />
          ) : showArrival ? (
            <FoodArrivalEntry />
          ) : showPrCenters ? (
            <>
              {/* PR Center Actions */}
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
                            <tr onClick={() => handleClick(center._id)}  key={center._id} className="hover:bg-blue-50 cursor-pointer">
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
              {/* Default Purchase Actions */}
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

              {/* Invoices Table */}
              <div className="bg-white rounded-xl shadow-sm p-6 w-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                  <h2 className="text-xl font-bold text-gray-800">Recent Government Purchases</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setFilterToday(!filterToday);
                          setRangeFrom("");
                          setRangeTo("");
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          filterToday 
                            ? '!bg-blue-600 text-white shadow-md' 
                            : '!bg-gray-100 text-gray-700 hover:!bg-gray-200 border border-gray-200'
                        }`}
                      >
                        Today
                      </button>
                      <div className="flex items-center gap-2">
                        <input 
                          type="date" 
                          value={rangeFrom} 
                          onChange={e=>{setRangeFrom(e.target.value);setFilterToday(false);}} 
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                        <span className="text-gray-500 font-medium">to</span>
                        <input 
                          type="date" 
                          value={rangeTo} 
                          onChange={e=>{setRangeTo(e.target.value);setFilterToday(false);}} 
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search purchases..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-full sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice #</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Method</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Wheat Details</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              <span className="ml-2 text-sm text-gray-500">Loading purchases...</span>
                            </div>
                          </td>
                        </tr>
                      ) : invoices.length > 0 ? (
                        invoices.map((invoice) => (
                          <tr 
                            onClick={() => handleClickInvoice(invoice?._id)}  
                            key={invoice._id} 
                            className="hover:bg-blue-50 cursor-pointer transition-colors duration-150 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                #{invoice._id.slice(-8)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  invoice.paymentMethod === 'cash' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {invoice.paymentMethod.charAt(0).toUpperCase() + invoice.paymentMethod.slice(1)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div className="font-medium">{invoice.wheatQuantity?.toLocaleString()} kg</div>
                                <div className="text-gray-500">@ Rs. {invoice.ratePerKg?.toLocaleString()}/kg</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                Rs. {invoice.totalAmount?.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(invoice.date)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                invoice.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 ring-1 ring-green-200' 
                                  : 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200'
                              }`}>
                                <span className={`w-2 h-2 rounded-full mr-2 ${
                                  invoice.status === 'completed' ? 'bg-green-400' : 'bg-yellow-400'
                                }`}></span>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FaFileInvoiceDollar className="text-2xl text-gray-400" />
                              </div>
                              <p className="text-gray-500 font-medium">No purchases found</p>
                              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or date filters</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Enhanced Pagination */}
                {invoices.length > 0 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {page} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={()=>setPage(p=>Math.max(1,p-1))} 
                        disabled={page===1} 
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 !bg-white text-gray-700 hover:!bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                page === pageNum
                                  ? '!bg-blue-600 text-white'
                                  : '!bg-gray-100 text-gray-700 hover:!bg-gray-200'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button 
                        onClick={()=>setPage(p=>Math.min(totalPages,p+1))} 
                        disabled={page===totalPages} 
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 !bg-white text-gray-700 hover:!bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}