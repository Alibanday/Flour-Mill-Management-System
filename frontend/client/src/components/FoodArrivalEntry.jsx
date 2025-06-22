import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaClock } from "react-icons/fa";

const formatDate = (d)=>new Date(d).toLocaleDateString();

const FoodArrivalEntry = () => {
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(false);
  const [search,setSearch]=useState("");
  const [filterToday,setFilterToday]=useState(false);
  const [rangeFrom,setRangeFrom]=useState("");
  const [rangeTo,setRangeTo]=useState("");
  const navigate = useNavigate();

  const fetchData=async()=>{
    try{
      setLoading(true);
      const token = localStorage.getItem("token");
      const params={type:"government",status:"pending"};
      if(filterToday){
        const today=new Date().toISOString().slice(0,10);
        params.startDate=today;
        params.endDate=today;
      } else if(rangeFrom && rangeTo){
        params.startDate=rangeFrom;
        params.endDate=rangeTo;
      }
      const res=await axios.get("http://localhost:8000/api/invoice",{headers:{Authorization:`Bearer ${token}`},params});
      setInvoices(res.data?.invoices||[]);
    }catch(e){console.error(e);}finally{setLoading(false);}
  };
  useEffect(()=>{fetchData();},[filterToday,rangeFrom,rangeTo]);

  const filteredInvoices=useMemo(()=>{
    if(!search) return invoices;
    const term=search.toLowerCase();
    return invoices.filter(inv=>inv._id.toLowerCase().includes(term) || (inv.prCenter?.name||"").toLowerCase().includes(term));
  },[search,invoices]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full">
      <h2 className="text-lg font-semibold mb-4">Pending Food Arrival Entries</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={()=>{setFilterToday(!filterToday);setRangeFrom("");setRangeTo("");}}
            className={`px-3 py-2 text-sm rounded ${filterToday ? '!bg-blue-600 text-white' : '!bg-gray-200 hover:!bg-gray-300'}`}
          >
            Today
          </button>
          <input type="date" value={rangeFrom} onChange={e=>{setRangeFrom(e.target.value);setFilterToday(false);}} className="border px-2 py-1 text-sm" />
          <span className="text-gray-500">to</span>
          <input type="date" value={rangeTo} onChange={e=>{setRangeTo(e.target.value);setFilterToday(false);}} className="border px-2 py-1 text-sm" />
        </div>
        <div className="relative w-full max-w-xs">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-2 py-2 border rounded w-full"
          />
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
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
              {filteredInvoices.length ? (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv._id}
                    onClick={() => navigate(`/govpurchasedetail/${inv._id}`)}
                    className="hover:bg-blue-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">#{inv._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{inv.paymentMethod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{inv.wheatQuantity} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">Rs. {inv.totalAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatDate(inv.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        pending
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No matching invoices
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FoodArrivalEntry;