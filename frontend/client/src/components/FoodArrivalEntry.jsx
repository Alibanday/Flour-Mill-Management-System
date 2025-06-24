import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FaSearch, FaTruck, FaCalendarAlt, FaFileInvoiceDollar, FaClock, FaCheckCircle, FaWeightHanging, FaMoneyBillWave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const formatDate = (d) => new Date(d).toLocaleDateString();

const FoodArrivalEntry = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterToday, setFilterToday] = useState(false);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = { type: "government", status: "pending" };
      if (filterToday) {
        const today = new Date().toISOString().slice(0, 10);
        params.startDate = today;
        params.endDate = today;
      } else if (rangeFrom && rangeTo) {
        params.startDate = rangeFrom;
        params.endDate = rangeTo;
      }
      const res = await axios.get("http://localhost:8000/api/invoice", { headers: { Authorization: `Bearer ${token}` }, params });
      setInvoices(res.data?.invoices || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterToday, rangeFrom, rangeTo]);

  const filteredInvoices = useMemo(() => {
    if (!search) return invoices;
    const term = search.toLowerCase();
    return invoices.filter(inv => 
      inv._id.toLowerCase().includes(term) || 
      (inv.prCenter?.name || "").toLowerCase().includes(term) ||
      (inv.warehouse?.name || "").toLowerCase().includes(term)
    );
  }, [search, invoices]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <div className="p-3 bg-orange-100 rounded-full mr-4">
            <FaTruck className="text-2xl text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Pending Food Arrival Entries</h2>
            <p className="text-gray-600 mt-1">Manage government wheat purchases awaiting arrival</p>
          </div>
        </div>
        
        {/* Filter Controls */}
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
                  ? '!bg-orange-600 text-white shadow-md' 
                  : '!bg-gray-100 text-gray-700 hover:!bg-gray-200 border border-gray-200'
              }`}
            >
              <FaCalendarAlt className="mr-2 inline" />
              Today
            </button>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={rangeFrom} 
                onChange={e => { setRangeFrom(e.target.value); setFilterToday(false); }} 
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
              <span className="text-gray-500 font-medium">to</span>
              <input 
                type="date" 
                value={rangeTo} 
                onChange={e => { setRangeTo(e.target.value); setFilterToday(false); }} 
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
            </div>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-orange-50 to-red-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Invoice #</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">PR Center</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Warehouse</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Wheat Details</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Method</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading pending arrivals...</span>
                  </div>
                </td>
              </tr>
            ) : filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => (
                <tr
                  key={inv._id}
                  onClick={() => navigate(`/govpurchasedetail/${inv._id}`)}
                  className="hover:bg-orange-50 cursor-pointer transition-colors duration-150 group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      #{inv._id.slice(-8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {inv.prCenter?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {inv.warehouse?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">{inv.wheatQuantity?.toLocaleString()} kg</div>
                      <div className="text-gray-500">@ Rs. {inv.ratePerKg?.toLocaleString()}/kg</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.paymentMethod === 'cash' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {inv.paymentMethod.charAt(0).toUpperCase() + inv.paymentMethod.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      Rs. {inv.totalAmount?.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(inv.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200">
                      <FaClock className="w-2 h-2 mr-2" />
                      Pending
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FaFileInvoiceDollar className="text-2xl text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No pending arrivals found</p>
                    <p className="text-gray-400 text-sm mt-1">All government purchases have been completed</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      {filteredInvoices.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <FaFileInvoiceDollar className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Total Pending</p>
                <p className="text-2xl font-bold text-blue-800">{filteredInvoices.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <FaWeightHanging className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Total Wheat</p>
                <p className="text-2xl font-bold text-green-800">
                  {filteredInvoices.reduce((sum, inv) => sum + (inv.wheatQuantity || 0), 0).toLocaleString()} kg
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-full mr-3">
                <FaMoneyBillWave className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-800">
                  Rs. {filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodArrivalEntry;